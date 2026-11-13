/**
 * Currency and number formatting utilities for Euro with European locale
 * Uses comma (,) as decimal separator and period (.) as thousands separator
 */

/**
 * Safely convert any input to a number, handling both standard and European formats
 * @param value - The value to convert (number, US format string, or European format string)
 * @returns Parsed number or 0 if invalid
 */
function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // If string contains a comma, treat it as European format
  if (value.includes(',')) {
    return parseEuropeanNumber(value);
  }

  // Otherwise try standard parseFloat
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as Euro currency
 * @param amount - The amount to format (supports both US and European formatted strings)
 * @param showSymbol - Whether to show the € symbol (default: true)
 * @returns Formatted currency string (e.g., "€ 1.234,56" or "1.234,56")
 */
export function formatCurrency(amount: number | string | null | undefined, showSymbol = true): string {
  const numAmount = toNumber(amount);
  
  if (numAmount === 0 && (amount === null || amount === undefined || amount === '')) {
    return showSymbol ? '€\u00A00,00' : '0,00';
  }

  const formatted = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  if (!showSymbol) {
    return formatted.replace('€', '').trim();
  }

  return formatted;
}

/**
 * Format a number with European decimal separator (comma)
 * @param value - The number to format (supports both US and European formatted strings)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "1.234,56")
 */
export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  const numValue = toNumber(value);
  
  if (numValue === 0 && (value === null || value === undefined || value === '')) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
  }

  return new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Parse a European-formatted number string to a number
 * Handles strings with comma as decimal separator and period as thousands separator
 * @param value - The formatted string (e.g., "1.234,56")
 * @returns Parsed number or 0 if invalid
 */
export function parseEuropeanNumber(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  // Remove € symbol and whitespace
  let cleaned = value.replace(/€/g, '').trim();
  
  // Replace thousands separator (period) with nothing
  cleaned = cleaned.replace(/\./g, '');
  
  // Replace decimal separator (comma) with period
  cleaned = cleaned.replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 21 for 21%, supports both US and European formatted strings)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "21%" or "21,50%")
 */
export function formatPercentage(value: number | string | null | undefined, decimals = 0): string {
  const numValue = toNumber(value);
  
  if (numValue === 0 && (value === null || value === undefined || value === '')) {
    return '0%';
  }

  const formatted = formatNumber(numValue, decimals);
  return `${formatted}%`;
}
