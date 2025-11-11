// Storage & NVR Calculations

export type RecordingMode = 'continuous' | 'motion' | 'scheduled' | 'event';

export interface StorageSpecs {
  bitrate_kbps: number;
  recording_mode: RecordingMode;
  retention_days: number;
}

export interface StorageResult {
  daily_storage_gb: number;
  total_storage_gb: number;
  recording_mode: RecordingMode;
  duty_cycle: number; // Percentage of time recording
}

export interface SystemStorageAnalysis {
  cameras: StorageResult[];
  total_daily_gb: number;
  total_storage_gb: number;
  total_storage_tb: number;
  retention_days: number;
  usable_capacity_tb: number; // After RAID overhead
  recommended_raid: string;
  raid_overhead_percent: number;
  raw_capacity_needed_tb: number;
  drive_configuration: string;
}

export interface NVRRecommendation {
  cpu_cores: number;
  ram_gb: number;
  os_disk_type: string;
  os_disk_size_gb: number;
  storage_drives: string;
  raid_controller: string;
  estimated_cost_aud: number;
}

/**
 * Calculate storage for a single camera
 */
export function calculateCameraStorage(specs: StorageSpecs): StorageResult {
  // Recording duty cycle based on mode
  const duty_cycles: Record<RecordingMode, number> = {
    continuous: 1.0,   // 100% - always recording
    motion: 0.3,       // 30% - typical motion detection
    scheduled: 0.5,    // 50% - assume 12 hours per day
    event: 0.2,        // 20% - triggered events only
  };
  
  const duty_cycle = duty_cycles[specs.recording_mode];
  
  // Storage formula: (Bitrate_kbps × Seconds_per_day × Duty_cycle) / (8 × 1024 × 1024)
  // Convert kbps to GB per day
  const seconds_per_day = 86400;
  const daily_storage_gb = 
    (specs.bitrate_kbps * seconds_per_day * duty_cycle) / 
    (8 * 1024 * 1024);
  
  const total_storage_gb = daily_storage_gb * specs.retention_days;
  
  return {
    daily_storage_gb: Math.round(daily_storage_gb * 100) / 100,
    total_storage_gb: Math.round(total_storage_gb * 100) / 100,
    recording_mode: specs.recording_mode,
    duty_cycle,
  };
}

/**
 * Analyze system-wide storage requirements
 */
export function analyzeSystemStorage(
  cameras: StorageSpecs[],
  retention_days: number
): SystemStorageAnalysis {
  const camera_results = cameras.map(cam => 
    calculateCameraStorage({ ...cam, retention_days })
  );
  
  const total_daily_gb = camera_results.reduce((sum, cam) => sum + cam.daily_storage_gb, 0);
  const total_storage_gb = total_daily_gb * retention_days;
  const total_storage_tb = total_storage_gb / 1024;
  
  // Add 15% overhead for filesystem, indexing, database
  const total_with_overhead_tb = total_storage_tb * 1.15;
  
  // Recommend RAID configuration based on capacity
  let recommended_raid = '';
  let raid_overhead_percent = 0;
  let drive_config = '';
  
  if (total_with_overhead_tb < 4) {
    recommended_raid = 'RAID 1 (Mirroring)';
    raid_overhead_percent = 50; // 50% usable capacity
    drive_config = '2× 4TB drives';
  } else if (total_with_overhead_tb < 12) {
    recommended_raid = 'RAID 5';
    raid_overhead_percent = 25; // ~75% usable (4 drives)
    drive_config = '4× 6TB drives';
  } else if (total_with_overhead_tb < 30) {
    recommended_raid = 'RAID 6';
    raid_overhead_percent = 33; // ~67% usable (6 drives)
    drive_config = '6× 8TB drives';
  } else {
    recommended_raid = 'RAID 60';
    raid_overhead_percent = 50; // ~50% usable
    drive_config = '8-12× 10TB drives';
  }
  
  // Calculate raw capacity needed after RAID
  const raw_capacity_needed_tb = total_with_overhead_tb / (1 - raid_overhead_percent / 100);
  
  return {
    cameras: camera_results,
    total_daily_gb: Math.round(total_daily_gb * 100) / 100,
    total_storage_gb: Math.round(total_storage_gb * 100) / 100,
    total_storage_tb: Math.round(total_storage_tb * 100) / 100,
    retention_days,
    usable_capacity_tb: Math.round(total_with_overhead_tb * 100) / 100,
    recommended_raid,
    raid_overhead_percent,
    raw_capacity_needed_tb: Math.round(raw_capacity_needed_tb * 100) / 100,
    drive_configuration: drive_config,
  };
}

/**
 * Recommend NVR/Server specifications
 */
export function recommendNVR(camera_count: number, total_storage_tb: number): NVRRecommendation {
  // CPU cores based on camera count
  let cpu_cores = 4;
  if (camera_count > 32) cpu_cores = 12;
  else if (camera_count > 16) cpu_cores = 8;
  else if (camera_count > 8) cpu_cores = 6;
  
  // RAM: 4GB base + 0.5GB per camera
  const ram_gb = 4 + Math.ceil(camera_count * 0.5);
  
  // OS disk
  const os_disk_type = 'NVMe SSD';
  const os_disk_size_gb = 256;
  
  // Storage drives based on capacity
  let storage_drives = '';
  if (total_storage_tb < 8) {
    storage_drives = '2-4× Surveillance HDDs';
  } else if (total_storage_tb < 24) {
    storage_drives = '4-6× Surveillance HDDs';
  } else {
    storage_drives = '6-12× Surveillance HDDs';
  }
  
  // RAID controller
  const raid_controller = camera_count > 16 
    ? 'Hardware RAID controller with battery backup'
    : 'Software RAID (built-in)';
  
  // Estimated cost (very rough)
  const base_cost = 1500; // Base NVR
  const cpu_cost = cpu_cores * 150;
  const ram_cost = ram_gb * 50;
  const storage_cost = total_storage_tb * 150; // Per TB
  const raid_cost = camera_count > 16 ? 800 : 0;
  
  const estimated_cost = base_cost + cpu_cost + ram_cost + storage_cost + raid_cost;
  
  return {
    cpu_cores,
    ram_gb,
    os_disk_type,
    os_disk_size_gb,
    storage_drives,
    raid_controller,
    estimated_cost_aud: Math.round(estimated_cost),
  };
}

/**
 * Calculate storage growth projection
 */
export interface StorageGrowthProjection {
  days: number;
  storage_gb: number;
  storage_tb: number;
}

export function projectStorageGrowth(
  daily_storage_gb: number,
  max_days: number = 365
): StorageGrowthProjection[] {
  const projections: StorageGrowthProjection[] = [];
  
  // Generate projections for key intervals
  const intervals = [7, 14, 30, 60, 90, 180, 365];
  
  intervals.forEach(days => {
    if (days <= max_days) {
      const total_gb = daily_storage_gb * days;
      projections.push({
        days,
        storage_gb: Math.round(total_gb * 100) / 100,
        storage_tb: Math.round((total_gb / 1024) * 100) / 100,
      });
    }
  });
  
  return projections;
}
