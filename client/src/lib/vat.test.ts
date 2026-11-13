import { describe, it, expect } from 'vitest';
import { parseVatToDecimal, parseVatToPercentage } from './vat';

describe('vat utilities', () => {

  describe('parseVatToDecimal', () => {

    describe('percentage-style input (value > 1)', () => {
      it('converts Belgian standard rate 21 to 0.21', () => {
        expect(parseVatToDecimal(21)).toBeCloseTo(0.21, 10);
      });

      it('converts Belgian reduced rate 6 to 0.06', () => {
        expect(parseVatToDecimal(6)).toBeCloseTo(0.06, 10);
      });

      it('converts Belgian intermediate rate 12 to 0.12', () => {
        expect(parseVatToDecimal(12)).toBeCloseTo(0.12, 10);
      });

      it('converts 100 (full rate) to 1.00', () => {
        expect(parseVatToDecimal(100)).toBeCloseTo(1.0, 10);
      });

      it('converts European comma-formatted string "21,00" to 0.21', () => {
        expect(parseVatToDecimal('21,00')).toBeCloseTo(0.21, 10);
      });

      it('converts European comma-formatted string "6,00" to 0.06', () => {
        expect(parseVatToDecimal('6,00')).toBeCloseTo(0.06, 10);
      });

      it('converts European comma-formatted string "12,00" to 0.12', () => {
        expect(parseVatToDecimal('12,00')).toBeCloseTo(0.12, 10);
      });

      it('converts US-format string "21.00" to 0.21', () => {
        expect(parseVatToDecimal('21.00')).toBeCloseTo(0.21, 10);
      });

      it('converts integer string "6" to 0.06', () => {
        expect(parseVatToDecimal('6')).toBeCloseTo(0.06, 10);
      });

      it('converts integer string "12" to 0.12', () => {
        expect(parseVatToDecimal('12')).toBeCloseTo(0.12, 10);
      });

      it('converts large percentage 200 to 2.0', () => {
        expect(parseVatToDecimal(200)).toBeCloseTo(2.0, 10);
      });

      it('converts non-standard rate 1.5 (percentage) to 0.015', () => {
        expect(parseVatToDecimal(1.5)).toBeCloseTo(0.015, 10);
      });
    });

    describe('decimal-style input (0 < value <= 1)', () => {
      it('returns 0.21 unchanged when given as decimal number', () => {
        expect(parseVatToDecimal(0.21)).toBeCloseTo(0.21, 10);
      });

      it('returns 0.06 unchanged when given as decimal number', () => {
        expect(parseVatToDecimal(0.06)).toBeCloseTo(0.06, 10);
      });

      it('returns 0.12 unchanged when given as decimal number', () => {
        expect(parseVatToDecimal(0.12)).toBeCloseTo(0.12, 10);
      });

      it('returns 1 unchanged at the boundary (exactly 1)', () => {
        expect(parseVatToDecimal(1)).toBeCloseTo(1.0, 10);
      });

      it('returns 0.5 unchanged for a 50% rate stored as decimal', () => {
        expect(parseVatToDecimal(0.5)).toBeCloseTo(0.5, 10);
      });

      it('returns 0.99 unchanged for a value just below the boundary', () => {
        expect(parseVatToDecimal(0.99)).toBeCloseTo(0.99, 10);
      });

      it('converts US-format decimal string "0.21" to 0.21', () => {
        expect(parseVatToDecimal('0.21')).toBeCloseTo(0.21, 10);
      });

      it('converts European decimal string "0,06" to 0.06', () => {
        expect(parseVatToDecimal('0,06')).toBeCloseTo(0.06, 10);
      });

      it('converts European decimal string "0,12" to 0.12', () => {
        expect(parseVatToDecimal('0,12')).toBeCloseTo(0.12, 10);
      });

      it('converts decimal string "0.5" to 0.5', () => {
        expect(parseVatToDecimal('0.5')).toBeCloseTo(0.5, 10);
      });
    });

    describe('zero and negative values', () => {
      it('returns 0 for numeric 0', () => {
        expect(parseVatToDecimal(0)).toBe(0);
      });

      it('returns 0 for negative integer -21', () => {
        expect(parseVatToDecimal(-21)).toBe(0);
      });

      it('returns 0 for negative decimal -0.21', () => {
        expect(parseVatToDecimal(-0.21)).toBe(0);
      });

      it('returns 0 for negative string "-6"', () => {
        expect(parseVatToDecimal('-6')).toBe(0);
      });

      it('returns 0 for negative string "-0.06"', () => {
        expect(parseVatToDecimal('-0.06')).toBe(0);
      });

      it('returns 0 for string "0"', () => {
        expect(parseVatToDecimal('0')).toBe(0);
      });

      it('returns 0 for string "0,00" (European zero)', () => {
        expect(parseVatToDecimal('0,00')).toBe(0);
      });
    });

    describe('null, undefined, and empty inputs', () => {
      it('returns 0 for null', () => {
        expect(parseVatToDecimal(null)).toBe(0);
      });

      it('returns 0 for undefined', () => {
        expect(parseVatToDecimal(undefined)).toBe(0);
      });

      it('returns 0 for empty string', () => {
        expect(parseVatToDecimal('')).toBe(0);
      });

      it('returns 0 for whitespace-only string', () => {
        expect(parseVatToDecimal('   ')).toBe(0);
      });
    });

    describe('non-numeric and special float values', () => {
      it('returns 0 for NaN', () => {
        expect(parseVatToDecimal(NaN)).toBe(0);
      });

      it('returns 0 for Infinity', () => {
        expect(parseVatToDecimal(Infinity)).toBe(0);
      });

      it('returns 0 for -Infinity', () => {
        expect(parseVatToDecimal(-Infinity)).toBe(0);
      });

      it('returns 0 for fully alphabetic string "abc"', () => {
        expect(parseVatToDecimal('abc')).toBe(0);
      });

      it('returns 0 for string "invalid"', () => {
        expect(parseVatToDecimal('invalid')).toBe(0);
      });

      it('parses leading numeric portion of "21abc" as 21 → 0.21', () => {
        expect(parseVatToDecimal('21abc')).toBeCloseTo(0.21, 10);
      });
    });

    describe('whitespace handling', () => {
      it('trims leading and trailing whitespace from "  21  "', () => {
        expect(parseVatToDecimal('  21  ')).toBeCloseTo(0.21, 10);
      });

      it('trims whitespace from "  0.06  "', () => {
        expect(parseVatToDecimal('  0.06  ')).toBeCloseTo(0.06, 10);
      });

      it('trims whitespace from "  0,12  " (European format)', () => {
        expect(parseVatToDecimal('  0,12  ')).toBeCloseTo(0.12, 10);
      });
    });
  });

  describe('parseVatToPercentage', () => {

    describe('percentage-style input (value > 1)', () => {
      it('returns 21 for Belgian standard rate given as integer 21', () => {
        expect(parseVatToPercentage(21)).toBeCloseTo(21, 10);
      });

      it('returns 6 for Belgian reduced rate given as integer 6', () => {
        expect(parseVatToPercentage(6)).toBeCloseTo(6, 10);
      });

      it('returns 12 for Belgian intermediate rate given as integer 12', () => {
        expect(parseVatToPercentage(12)).toBeCloseTo(12, 10);
      });

      it('returns 100 for rate given as integer 100', () => {
        expect(parseVatToPercentage(100)).toBeCloseTo(100, 10);
      });

      it('returns 21 for European string "21,00"', () => {
        expect(parseVatToPercentage('21,00')).toBeCloseTo(21, 10);
      });

      it('returns 6 for European string "6,00"', () => {
        expect(parseVatToPercentage('6,00')).toBeCloseTo(6, 10);
      });

      it('returns 12 for European string "12,00"', () => {
        expect(parseVatToPercentage('12,00')).toBeCloseTo(12, 10);
      });

      it('returns 21 for US-format string "21.00"', () => {
        expect(parseVatToPercentage('21.00')).toBeCloseTo(21, 10);
      });

      it('returns 6 for US-format string "6.00"', () => {
        expect(parseVatToPercentage('6.00')).toBeCloseTo(6, 10);
      });
    });

    describe('decimal-style input (0 < value <= 1)', () => {
      it('converts decimal 0.21 to percentage 21', () => {
        expect(parseVatToPercentage(0.21)).toBeCloseTo(21, 10);
      });

      it('converts decimal 0.06 to percentage 6', () => {
        expect(parseVatToPercentage(0.06)).toBeCloseTo(6, 10);
      });

      it('converts decimal 0.12 to percentage 12', () => {
        expect(parseVatToPercentage(0.12)).toBeCloseTo(12, 10);
      });

      it('converts boundary decimal 1 to percentage 100', () => {
        expect(parseVatToPercentage(1)).toBeCloseTo(100, 10);
      });

      it('converts decimal 0.5 to percentage 50', () => {
        expect(parseVatToPercentage(0.5)).toBeCloseTo(50, 10);
      });

      it('converts US-format decimal string "0.21" to percentage 21', () => {
        expect(parseVatToPercentage('0.21')).toBeCloseTo(21, 10);
      });

      it('converts European decimal string "0,06" to percentage 6', () => {
        expect(parseVatToPercentage('0,06')).toBeCloseTo(6, 10);
      });

      it('converts European decimal string "0,12" to percentage 12', () => {
        expect(parseVatToPercentage('0,12')).toBeCloseTo(12, 10);
      });
    });

    describe('zero and negative values', () => {
      it('returns 0 for numeric 0', () => {
        expect(parseVatToPercentage(0)).toBe(0);
      });

      it('returns 0 for negative integer -21', () => {
        expect(parseVatToPercentage(-21)).toBe(0);
      });

      it('returns 0 for negative decimal -0.06', () => {
        expect(parseVatToPercentage(-0.06)).toBe(0);
      });

      it('returns 0 for negative string "-12"', () => {
        expect(parseVatToPercentage('-12')).toBe(0);
      });

      it('returns 0 for string "0"', () => {
        expect(parseVatToPercentage('0')).toBe(0);
      });
    });

    describe('null, undefined, and empty inputs', () => {
      it('returns 0 for null', () => {
        expect(parseVatToPercentage(null)).toBe(0);
      });

      it('returns 0 for undefined', () => {
        expect(parseVatToPercentage(undefined)).toBe(0);
      });

      it('returns 0 for empty string', () => {
        expect(parseVatToPercentage('')).toBe(0);
      });

      it('returns 0 for whitespace-only string', () => {
        expect(parseVatToPercentage('   ')).toBe(0);
      });
    });

    describe('non-numeric and special float values', () => {
      it('returns 0 for NaN', () => {
        expect(parseVatToPercentage(NaN)).toBe(0);
      });

      it('returns 0 for Infinity', () => {
        expect(parseVatToPercentage(Infinity)).toBe(0);
      });

      it('returns 0 for -Infinity', () => {
        expect(parseVatToPercentage(-Infinity)).toBe(0);
      });

      it('returns 0 for alphabetic string "abc"', () => {
        expect(parseVatToPercentage('abc')).toBe(0);
      });

      it('returns 0 for string "invalid"', () => {
        expect(parseVatToPercentage('invalid')).toBe(0);
      });
    });

    describe('whitespace handling', () => {
      it('trims whitespace from "  21  " and returns 21', () => {
        expect(parseVatToPercentage('  21  ')).toBeCloseTo(21, 10);
      });

      it('trims whitespace from "  0,12  " and returns 12', () => {
        expect(parseVatToPercentage('  0,12  ')).toBeCloseTo(12, 10);
      });

      it('trims whitespace from "  0.06  " and returns 6', () => {
        expect(parseVatToPercentage('  0.06  ')).toBeCloseTo(6, 10);
      });
    });
  });

  describe('parseVatToDecimal and parseVatToPercentage are inverses', () => {
    it('round-trips 21 (percentage) → decimal → percentage', () => {
      const decimal = parseVatToDecimal(21);
      expect(parseVatToPercentage(decimal)).toBeCloseTo(21, 10);
    });

    it('round-trips 6 (percentage) → decimal → percentage', () => {
      const decimal = parseVatToDecimal(6);
      expect(parseVatToPercentage(decimal)).toBeCloseTo(6, 10);
    });

    it('round-trips 12 (percentage) → decimal → percentage', () => {
      const decimal = parseVatToDecimal(12);
      expect(parseVatToPercentage(decimal)).toBeCloseTo(12, 10);
    });

    it('round-trips 0 (zero-rated) → decimal → percentage', () => {
      const decimal = parseVatToDecimal(0);
      expect(parseVatToPercentage(decimal)).toBe(0);
    });

    it('round-trips 0.21 (decimal) → percentage → decimal', () => {
      const percentage = parseVatToPercentage(0.21);
      expect(parseVatToDecimal(percentage)).toBeCloseTo(0.21, 10);
    });

    it('round-trips 0.06 (decimal) → percentage → decimal', () => {
      const percentage = parseVatToPercentage(0.06);
      expect(parseVatToDecimal(percentage)).toBeCloseTo(0.06, 10);
    });

    it('produces consistent results for "21" and 21 (string vs number)', () => {
      expect(parseVatToDecimal('21')).toBeCloseTo(parseVatToDecimal(21), 10);
      expect(parseVatToPercentage('21')).toBeCloseTo(parseVatToPercentage(21), 10);
    });
  });

  describe('real-world Belgian VAT scenarios', () => {
    it('computes price including 21% VAT from percentage-stored rate', () => {
      const priceExVat = 100;
      const vatDecimal = parseVatToDecimal(21);
      const priceIncVat = priceExVat * (1 + vatDecimal);
      expect(priceIncVat).toBeCloseTo(121, 2);
    });

    it('computes price including 6% VAT from decimal-stored rate 0.06', () => {
      const priceExVat = 100;
      const vatDecimal = parseVatToDecimal(0.06);
      const priceIncVat = priceExVat * (1 + vatDecimal);
      expect(priceIncVat).toBeCloseTo(106, 2);
    });

    it('computes price including 12% VAT from European string "12,00"', () => {
      const priceExVat = 50;
      const vatDecimal = parseVatToDecimal('12,00');
      const priceIncVat = priceExVat * (1 + vatDecimal);
      expect(priceIncVat).toBeCloseTo(56, 2);
    });

    it('extracts the VAT amount from a gross price at 21%', () => {
      const grossPrice = 121;
      const vatDecimal = parseVatToDecimal(21);
      const netPrice = grossPrice / (1 + vatDecimal);
      const vatAmount = grossPrice - netPrice;
      expect(vatAmount).toBeCloseTo(21, 2);
    });

    it('extracts the VAT amount from a gross price at 6%', () => {
      const grossPrice = 106;
      const vatDecimal = parseVatToDecimal(6);
      const netPrice = grossPrice / (1 + vatDecimal);
      const vatAmount = grossPrice - netPrice;
      expect(vatAmount).toBeCloseTo(6, 2);
    });

    it('handles a zero-rated product (0% VAT) without adding any tax', () => {
      const priceExVat = 80;
      const vatDecimal = parseVatToDecimal(0);
      expect(vatDecimal).toBe(0);
      expect(priceExVat * (1 + vatDecimal)).toBeCloseTo(80, 2);
    });

    it('produces the same decimal from 21 and 0.21 (dual storage format support)', () => {
      const fromPercentage = parseVatToDecimal(21);
      const fromDecimal = parseVatToDecimal(0.21);
      expect(fromPercentage).toBeCloseTo(fromDecimal, 10);
    });

    it('produces the same decimal from "6,00" and "0,06" (European format, dual storage)', () => {
      const fromPercentageStr = parseVatToDecimal('6,00');
      const fromDecimalStr = parseVatToDecimal('0,06');
      expect(fromPercentageStr).toBeCloseTo(fromDecimalStr, 10);
    });

    it('calculates correct VAT for a coffee bag priced at 12.50 with 6% VAT', () => {
      const priceExVat = 12.5;
      const vatDecimal = parseVatToDecimal(6);
      const vatAmount = priceExVat * vatDecimal;
      const priceIncVat = priceExVat + vatAmount;
      expect(vatAmount).toBeCloseTo(0.75, 2);
      expect(priceIncVat).toBeCloseTo(13.25, 2);
    });

    it('calculates correct VAT for equipment priced at 250 with 21% VAT', () => {
      const priceExVat = 250;
      const vatDecimal = parseVatToDecimal('21,00');
      const vatAmount = priceExVat * vatDecimal;
      const priceIncVat = priceExVat + vatAmount;
      expect(vatAmount).toBeCloseTo(52.5, 2);
      expect(priceIncVat).toBeCloseTo(302.5, 2);
    });
  });
});
