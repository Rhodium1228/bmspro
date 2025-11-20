-- Add hierarchical task structure columns to job_work_schedule_items
ALTER TABLE job_work_schedule_items
  ADD COLUMN parent_task_id UUID REFERENCES job_work_schedule_items(id) ON DELETE CASCADE,
  ADD COLUMN task_level INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN task_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN is_parent_task BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN completion_percentage NUMERIC DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  ADD COLUMN task_lead_id UUID REFERENCES employees(id),
  ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN job_work_schedule_items.parent_task_id IS 'Reference to parent task for sub-tasks, NULL for top-level tasks';
COMMENT ON COLUMN job_work_schedule_items.task_level IS 'Hierarchy level: 0 for parent tasks, 1+ for sub-tasks';
COMMENT ON COLUMN job_work_schedule_items.task_order IS 'Display order within same parent/level';
COMMENT ON COLUMN job_work_schedule_items.is_parent_task IS 'True if this task has sub-tasks';
COMMENT ON COLUMN job_work_schedule_items.completion_percentage IS 'Auto-calculated for parent tasks based on sub-tasks';
COMMENT ON COLUMN job_work_schedule_items.task_lead_id IS 'Lead employee for parent tasks';
COMMENT ON COLUMN job_work_schedule_items.dependencies IS 'Array of task IDs this task depends on';

-- Create indexes for hierarchy queries
CREATE INDEX idx_job_schedule_items_parent ON job_work_schedule_items(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_job_schedule_items_level ON job_work_schedule_items(task_level);
CREATE INDEX idx_job_schedule_items_order ON job_work_schedule_items(job_work_schedule_id, parent_task_id, task_order);

-- Function to update parent task completion percentage
CREATE OR REPLACE FUNCTION update_parent_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  parent_completion NUMERIC;
  has_subtasks BOOLEAN;
BEGIN
  -- If this is a sub-task, update parent completion
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Calculate average completion of all sub-tasks
    SELECT 
      AVG(CASE status
        WHEN 'completed' THEN 100
        WHEN 'in-progress' THEN 50
        ELSE 0
      END)::NUMERIC
    INTO parent_completion
    FROM job_work_schedule_items
    WHERE parent_task_id = NEW.parent_task_id;
    
    -- Update parent task
    UPDATE job_work_schedule_items
    SET 
      completion_percentage = COALESCE(parent_completion, 0),
      status = CASE 
        WHEN parent_completion = 100 THEN 'completed'
        WHEN parent_completion > 0 THEN 'in-progress'
        ELSE status
      END
    WHERE id = NEW.parent_task_id;
  END IF;
  
  -- Update is_parent_task flag
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if this task has any sub-tasks
    SELECT EXISTS(
      SELECT 1 FROM job_work_schedule_items 
      WHERE parent_task_id = NEW.id
    ) INTO has_subtasks;
    
    IF has_subtasks THEN
      UPDATE job_work_schedule_items
      SET is_parent_task = true
      WHERE id = NEW.id AND is_parent_task = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update parent completion on sub-task changes
CREATE TRIGGER trigger_update_parent_completion
  AFTER INSERT OR UPDATE OF status ON job_work_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_task_completion();

-- Function to handle parent task deletion cleanup
CREATE OR REPLACE FUNCTION cleanup_parent_task_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a sub-task is deleted, check if parent still has children
  IF OLD.parent_task_id IS NOT NULL THEN
    UPDATE job_work_schedule_items
    SET is_parent_task = EXISTS(
      SELECT 1 FROM job_work_schedule_items 
      WHERE parent_task_id = OLD.parent_task_id 
      AND id != OLD.id
    )
    WHERE id = OLD.parent_task_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_parent_flag
  AFTER DELETE ON job_work_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_parent_task_flag();