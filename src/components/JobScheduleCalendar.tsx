import { useState } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar as any);

interface CalendarEvent extends Event {
  id: string;
  status: string;
  priority: string;
  resource: any;
}

export function JobScheduleCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["jobScheduleItems"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_work_schedule_items")
        .select(`
          *,
          job_work_schedules!inner (
            id,
            user_id,
            order_number,
            supplier_name
          )
        `)
        .eq("job_work_schedules.user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const events: CalendarEvent[] = scheduleItems.map((item: any) => ({
    id: item.id,
    title: `${item.item_name} - ${item.assigned_employee_name || "Unassigned"}`,
    start: new Date(item.availability_date),
    end: item.due_date ? new Date(item.due_date) : new Date(item.availability_date),
    status: item.status,
    priority: item.priority || 'medium',
    resource: item,
  }));

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "hsl(var(--muted))";
    let borderLeft = "4px solid hsl(var(--muted-foreground))";
    
    // Status colors using semantic tokens
    if (event.status === "completed") backgroundColor = "#10b981";
    if (event.status === "in-progress") backgroundColor = "#3b82f6";
    if (event.status === "pending") backgroundColor = "#f59e0b";

    // Priority border (left side indicator)
    if (event.priority === "urgent") borderLeft = "4px solid #ef4444";
    else if (event.priority === "high") borderLeft = "4px solid #f97316";
    else if (event.priority === "medium") borderLeft = "4px solid #eab308";
    else if (event.priority === "low") borderLeft = "4px solid #84cc16";

    return { 
      style: { 
        backgroundColor, 
        color: "white", 
        borderRadius: "4px",
        borderLeft,
        fontWeight: 500,
        padding: "2px 5px"
      } 
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setIsDialogOpen(true);
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const newDueDate = moment(end).format("YYYY-MM-DD");
      const newAvailDate = moment(start).format("YYYY-MM-DD");
      
      const { error } = await supabase
        .from("job_work_schedule_items")
        .update({ 
          due_date: newDueDate,
          availability_date: newAvailDate 
        })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Task Rescheduled",
        description: `"${event.title}" moved to ${moment(start).format("MMM DD")} - ${moment(end).format("MMM DD, YYYY")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["jobScheduleItems"] });
      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    try {
      const newDueDate = moment(end).format("YYYY-MM-DD");
      
      const { error } = await supabase
        .from("job_work_schedule_items")
        .update({ due_date: newDueDate })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Task Duration Updated",
        description: `Due date changed to ${moment(end).format("MMM DD, YYYY")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["jobScheduleItems"] });
      queryClient.invalidateQueries({ queryKey: ["jobWorkSchedules"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div style={{ height: "600px" }}>
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          draggableAccessor={() => true}
          resizable
        />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex gap-4 flex-wrap">
          <span className="font-semibold">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#f59e0b] rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#3b82f6] rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#10b981] rounded"></div>
            <span>Completed</span>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <span className="font-semibold">Priority (left border):</span>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#ef4444]"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#f97316]"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#eab308]"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#84cc16]"></div>
            <span>Low</span>
          </div>
        </div>
        <p className="text-muted-foreground italic">
          💡 Drag events to reschedule • Drag edges to adjust duration
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Item Name</p>
                <p className="font-medium">{selectedEvent.item_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">
                  {selectedEvent.assigned_employee_name || "Unassigned"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {selectedEvent.quantity} {selectedEvent.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedEvent.status === "completed"
                        ? "default"
                        : selectedEvent.status === "in-progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>
              {selectedEvent.priority && (
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={selectedEvent.priority === 'urgent' || selectedEvent.priority === 'high' ? 'destructive' : 'outline'}>
                    {selectedEvent.priority}
                  </Badge>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Availability Date</p>
                  <p className="font-medium">
                    {new Date(selectedEvent.availability_date).toLocaleDateString()}
                  </p>
                </div>
                {selectedEvent.due_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {new Date(selectedEvent.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedEvent.estimated_hours && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                  <p className="font-medium">{selectedEvent.estimated_hours} hours</p>
                </div>
              )}
              {selectedEvent.skills_required && selectedEvent.skills_required.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Skills Required</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {selectedEvent.skills_required.map((skill: string) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
