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
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
  
  return formatter.format(amount);
};
