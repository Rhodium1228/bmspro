// Bandwidth & Network Infrastructure Calculations

export interface CameraSpecs {
  resolution_mp: number;
  resolution_width: number;
  resolution_height: number;
  fps: number;
  codec: 'H.264' | 'H.265';
  bitrate_kbps?: number; // If provided, use this instead of calculating
  scene_complexity: 'low' | 'medium' | 'high';
}

export interface BandwidthResult {
  per_camera_mbps: number;
  bitrate_kbps: number;
  codec: string;
  fps: number;
  scene_complexity: string;
}

export interface NetworkAnalysis {
  total_bandwidth_mbps: number;
  peak_bandwidth_mbps: number;
  average_bandwidth_mbps: number;
  camera_count: number;
  cameras: BandwidthResult[];
  recommended_switch: string;
  network_recommendation: string;
}

export interface PoEAnalysis {
  total_power_watts: number;
  power_with_overhead_watts: number;
  cameras_by_standard: {
    poe: number;
    poe_plus: number;
    poe_plus_plus: number;
  };
  recommended_switch: string;
  ups_recommendation: string;
}

/**
 * Calculate bitrate for a camera based on resolution and settings
 */
export function calculateBitrate(specs: CameraSpecs): number {
  // If bitrate is provided, use it
  if (specs.bitrate_kbps) {
    return specs.bitrate_kbps;
  }
  
  // Base bitrate formula: Resolution_MP × 1024 × Quality_Factor
  const quality_factor = 1.0; // Medium quality (1024 kbps per MP)
  const base_bitrate = specs.resolution_mp * 1024 * quality_factor;
  
  // Codec efficiency factor
  const codec_factor = specs.codec === 'H.265' ? 0.5 : 1.0;
  
  // FPS factor (normalized to 30 FPS)
  const fps_factor = specs.fps / 30;
  
  // Scene complexity factor
  const complexity_factors = {
    low: 0.7,    // Static areas (parking lots, hallways)
    medium: 1.0, // Normal activity (offices, retail)
    high: 1.3,   // High traffic (entrances, busy areas)
  };
  const complexity_factor = complexity_factors[specs.scene_complexity];
  
  // Final bitrate calculation
  const final_bitrate = base_bitrate * codec_factor * fps_factor * complexity_factor;
  
  return Math.round(final_bitrate);
}

/**
 * Calculate bandwidth for a single camera
 */
export function calculateCameraBandwidth(specs: CameraSpecs): BandwidthResult {
  const bitrate_kbps = calculateBitrate(specs);
  const mbps = bitrate_kbps / 1024;
  
  return {
    per_camera_mbps: Math.round(mbps * 100) / 100,
    bitrate_kbps,
    codec: specs.codec,
    fps: specs.fps,
    scene_complexity: specs.scene_complexity,
  };
}

/**
 * Analyze network requirements for all cameras
 */
export function analyzeNetworkRequirements(cameras: CameraSpecs[]): NetworkAnalysis {
  const camera_results = cameras.map(cam => calculateCameraBandwidth(cam));
  
  const total_mbps = camera_results.reduce((sum, cam) => sum + cam.per_camera_mbps, 0);
  
  // Peak bandwidth assumes 10% network overhead
  const peak_mbps = total_mbps * 1.1;
  
  // Average bandwidth (assuming some cameras may not be transmitting at peak)
  const average_mbps = total_mbps * 0.8;
  
  // Recommend network infrastructure
  let recommended_switch = '';
  let network_recommendation = '';
  
  if (peak_mbps < 100) {
    recommended_switch = 'Gigabit Switch (1 Gbps)';
    network_recommendation = 'Standard gigabit switch sufficient for this deployment';
  } else if (peak_mbps < 500) {
    recommended_switch = 'Managed Gigabit Switch with VLANs';
    network_recommendation = 'Recommend multiple VLANs for camera traffic segmentation';
  } else {
    recommended_switch = '10 Gigabit Backbone Switch';
    network_recommendation = 'High bandwidth deployment requires 10GbE backbone network';
  }
  
  return {
    total_bandwidth_mbps: Math.round(total_mbps * 100) / 100,
    peak_bandwidth_mbps: Math.round(peak_mbps * 100) / 100,
    average_bandwidth_mbps: Math.round(average_mbps * 100) / 100,
    camera_count: cameras.length,
    cameras: camera_results,
    recommended_switch,
    network_recommendation,
  };
}

/**
 * Calculate PoE power requirements
 */
export function calculatePoERequirements(
  cameras: Array<{ poe_standard: string; power_watts: number }>
): PoEAnalysis {
  let total_power = 0;
  const by_standard = {
    poe: 0,
    poe_plus: 0,
    poe_plus_plus: 0,
  };
  
  cameras.forEach(cam => {
    total_power += cam.power_watts;
    
    if (cam.poe_standard === 'PoE++') {
      by_standard.poe_plus_plus++;
    } else if (cam.poe_standard === 'PoE+') {
      by_standard.poe_plus++;
    } else {
      by_standard.poe++;
    }
  });
  
  // Add 20% overhead for efficiency losses
  const power_with_overhead = total_power * 1.2;
  
  // Recommend PoE switch
  let recommended_switch = '';
  if (cameras.length <= 8) {
    recommended_switch = '8-port PoE+ switch (120W budget)';
  } else if (cameras.length <= 16) {
    recommended_switch = '16-port PoE+ switch (240W budget)';
  } else if (cameras.length <= 24) {
    recommended_switch = '24-port PoE+ switch (370W budget)';
  } else {
    recommended_switch = `Multiple 24-port PoE+ switches (${Math.ceil(cameras.length / 24)} switches needed)`;
  }
  
  // UPS recommendation (runtime at 50% load)
  const ups_capacity_va = power_with_overhead * 1.4; // Convert watts to VA (power factor ~0.7)
  const ups_recommendation = `${Math.ceil(ups_capacity_va / 500) * 500}VA UPS for ~30 min runtime at 50% load`;
  
  return {
    total_power_watts: Math.round(total_power),
    power_with_overhead_watts: Math.round(power_with_overhead),
    cameras_by_standard: by_standard,
    recommended_switch,
    ups_recommendation,
  };
}

/**
 * Calculate cable requirements
 */
export interface CableRequirements {
  total_length_m: number;
  total_length_with_waste_m: number;
  cable_type_recommendation: string;
  connector_count: number;
  notes: string[];
}

export function calculateCableRequirements(
  camera_positions: Array<{ distance_to_switch_m: number }>,
  max_distance_m: number
): CableRequirements {
  const total_length = camera_positions.reduce((sum, pos) => sum + pos.distance_to_switch_m, 0);
  
  // Add 10% waste factor
  const total_with_waste = total_length * 1.1;
  
  // Recommend cable type based on max distance
  let cable_type = 'Cat6';
  let notes: string[] = [];
  
  if (max_distance_m > 100) {
    cable_type = 'Fiber Optic';
    notes.push('Distances exceed 100m Cat6 limit, fiber optic recommended');
  } else if (max_distance_m > 55) {
    cable_type = 'Cat6a';
    notes.push('Cat6a recommended for distances over 55m to support 10 Gbps');
  } else {
    cable_type = 'Cat6';
    notes.push('Cat6 suitable for all camera distances in this deployment');
  }
  
  // Connector count: 2 per camera (camera end + switch end)
  const connector_count = camera_positions.length * 2;
  
  notes.push(`Total cable runs: ${camera_positions.length}`);
  notes.push(`Longest run: ${Math.round(max_distance_m)}m`);
  
  return {
    total_length_m: Math.round(total_length),
    total_length_with_waste_m: Math.round(total_with_waste),
    cable_type_recommendation: cable_type,
    connector_count,
    notes,
  };
}
