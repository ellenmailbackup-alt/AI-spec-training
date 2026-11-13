const parseNumeric = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = value.trim().replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Converts VAT values to decimal format for calculations.
 * Supports both decimal storage (0.21) and percentage storage (21 or 21.00).
 */
export const parseVatToDecimal = (value: string | number | null | undefined): number => {
  const parsed = parseNumeric(value);
  if (parsed <= 0) return 0;
  return parsed > 1 ? parsed / 100 : parsed;
};

/**
 * Converts VAT values to a percentage number for UI display (e.g. 21).
 */
export const parseVatToPercentage = (value: string | number | null | undefined): number => {
  const decimal = parseVatToDecimal(value);
  return decimal * 100;
};

