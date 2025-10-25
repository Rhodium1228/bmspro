import { ProjectData } from "./securityTypes";
import { calculateWallLength } from "./wallCalculations";

export interface GeneratedQuotationItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  rate: number;
  gst: number;
  discount: number;
  amount: number;
  datasheetUrl?: string;
}

/**
 * Generates quotation items from a security layout
 */
export function generateItemsFromLayout(
  projectData: ProjectData,
  pixelsPerMeter: number = 10
): GeneratedQuotationItem[] {
  const items: GeneratedQuotationItem[] = [];

  // Count cameras by type
  const camerasByType = projectData.cameras.reduce((acc, camera) => {
    const type = camera.type || "bullet";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Add camera items
  Object.entries(camerasByType).forEach(([type, count]) => {
    const baseRate = type === "ptz" ? 350 : type === "dome" ? 250 : 200;
    const subtotal = count * baseRate;
    const gstAmount = (subtotal * 10) / 100;
    
    items.push({
      id: `cam-${type}-${Date.now()}`,
      itemName: `${type.toUpperCase()} Camera`,
      description: `High-quality ${type} security camera with night vision`,
      quantity: count,
      rate: baseRate,
      gst: 10,
      discount: 0,
      amount: subtotal + gstAmount,
    });
  });

  // Count PIR sensors
  if (projectData.pirs.length > 0) {
    const count = projectData.pirs.length;
    const baseRate = 80;
    const subtotal = count * baseRate;
    const gstAmount = (subtotal * 10) / 100;
    
    items.push({
      id: `pir-${Date.now()}`,
      itemName: "PIR Motion Sensor",
      description: "Passive infrared motion detection sensor",
      quantity: count,
      rate: baseRate,
      gst: 10,
      discount: 0,
      amount: subtotal + gstAmount,
    });
  }

  // Count fans
  if (projectData.fans.length > 0) {
    const count = projectData.fans.length;
    const baseRate = 150;
    const subtotal = count * baseRate;
    const gstAmount = (subtotal * 10) / 100;
    
    items.push({
      id: `fan-${Date.now()}`,
      itemName: "Cooling Fan",
      description: "Industrial cooling fan for equipment",
      quantity: count,
      rate: baseRate,
      gst: 10,
      discount: 0,
      amount: subtotal + gstAmount,
    });
  }

  // Calculate wall installation
  const walls = projectData.walls.filter(wall => wall.type === "wall");
  if (walls.length > 0) {
    const totalLength = walls.reduce((sum, wall) => {
      return sum + calculateWallLength(wall, pixelsPerMeter);
    }, 0);
    
    if (totalLength > 0) {
      const ratePerMeter = 50;
      const subtotal = totalLength * ratePerMeter;
      const gstAmount = (subtotal * 10) / 100;
      
      items.push({
        id: `wall-install-${Date.now()}`,
        itemName: "Wall Mounting Installation",
        description: "Professional installation service per meter of wall",
        quantity: parseFloat(totalLength.toFixed(2)),
        rate: ratePerMeter,
        gst: 10,
        discount: 0,
        amount: subtotal + gstAmount,
      });
    }
  }

  // Count pillars
  const pillars = projectData.walls.filter(wall => wall.type === "pillar");
  if (pillars.length > 0) {
    const count = pillars.length;
    const baseRate = 75;
    const subtotal = count * baseRate;
    const gstAmount = (subtotal * 10) / 100;
    
    items.push({
      id: `pillar-install-${Date.now()}`,
      itemName: "Pillar Mounting",
      description: "Equipment mounting on pillars and columns",
      quantity: count,
      rate: baseRate,
      gst: 10,
      discount: 0,
      amount: subtotal + gstAmount,
    });
  }

  // Add wiring and cabling if there are devices
  const totalDevices = projectData.cameras.length + projectData.pirs.length + projectData.fans.length;
  if (totalDevices > 0) {
    const baseRate = 25;
    const subtotal = totalDevices * baseRate;
    const gstAmount = (subtotal * 10) / 100;
    
    items.push({
      id: `wiring-${Date.now()}`,
      itemName: "Wiring & Cabling",
      description: "Electrical wiring and network cabling per device",
      quantity: totalDevices,
      rate: baseRate,
      gst: 10,
      discount: 0,
      amount: subtotal + gstAmount,
    });
  }

  return items;
}
