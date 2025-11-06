// Solar calculations engine

interface PanelSpec {
  wattage: number;
  efficiency: number;
  dimensions: { width: number; height: number };
}

export interface SystemCalculation {
  totalPanels: number;
  totalWattage: number;
  estimatedKwhPerYear: number;
  estimatedKwhPerDay: number;
  co2OffsetKg: number;
  equivalentTrees: number;
}

export interface FinancialAnalysis {
  yearlySavings: number; // AUD
  totalSavings25Years: number; // AUD
  netSavings: number; // AUD
  paybackPeriod: number;
  roi: number;
}

export const calculateSystemOutput = (
  activePanels: number,
  totalWattage: number,
  peakSunHours: number = 5,
  systemLosses: number = 0.15
): SystemCalculation => {
  const totalKw = totalWattage / 1000;
  const estimatedKwhPerDay = totalKw * peakSunHours * (1 - systemLosses);
  const estimatedKwhPerYear = estimatedKwhPerDay * 365;
  
  const co2OffsetKg = estimatedKwhPerYear * 0.7;
  const equivalentTrees = co2OffsetKg / 20;
  
  return {
    totalPanels: activePanels,
    totalWattage: totalKw,
    estimatedKwhPerYear,
    estimatedKwhPerDay,
    co2OffsetKg,
    equivalentTrees,
  };
};

export const calculateFinancials = (
  estimatedKwhPerYear: number,
  electricityRate: number = 0.25, // AUD per kWh (Australian average)
  installationCost: number = 0, // AUD
  maintenanceCostPerYear: number = 100, // AUD per year
  systemLifeYears: number = 25
): FinancialAnalysis => {
  const yearlySavings = estimatedKwhPerYear * electricityRate;
  const totalSavings25Years = yearlySavings * systemLifeYears;
  const netSavings = totalSavings25Years - installationCost - (maintenanceCostPerYear * systemLifeYears);
  const paybackPeriod = installationCost / yearlySavings;
  const roi = ((netSavings / installationCost) * 100);
  
  return {
    yearlySavings,
    totalSavings25Years,
    netSavings,
    paybackPeriod,
    roi,
  };
};
