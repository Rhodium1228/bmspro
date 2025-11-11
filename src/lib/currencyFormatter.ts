// AUD Currency Formatting Utility

export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats a number as Australian Dollar (AUD) currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "$123.45")
 */
export const formatCurrency = (
  amount: number,
  options?: CurrencyFormatOptions
): string => {
  // Ensure minimumFractionDigits <= maximumFractionDigits
  const maxFractionDigits = options?.maximumFractionDigits ?? 2;
  const minFractionDigits = options?.minimumFractionDigits ?? Math.min(2, maxFractionDigits);
  
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: Math.min(minFractionDigits, maxFractionDigits),
    maximumFractionDigits: maxFractionDigits,
  });
  
  return formatter.format(amount);
};
