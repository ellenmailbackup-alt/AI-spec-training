import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  parseEuropeanNumber,
  formatPercentage,
} from './currency';

// Helper to create properly formatted currency strings with non-breaking space
const EUR = (amount: string) => `€\u00A0${amount}`;

describe('currency utilities', () => {
  describe('formatCurrency', () => {
    describe('with currency symbol (default)', () => {
      it('formats positive integers correctly', () => {
        expect(formatCurrency(100)).toBe(EUR('100,00'));
        expect(formatCurrency(1000)).toBe(EUR('1.000,00'));
        expect(formatCurrency(1234567)).toBe(EUR('1.234.567,00'));
      });

      it('formats decimal numbers correctly', () => {
        expect(formatCurrency(10.5)).toBe(EUR('10,50'));
        expect(formatCurrency(1234.56)).toBe(EUR('1.234,56'));
        expect(formatCurrency(0.99)).toBe(EUR('0,99'));
      });

      it('formats negative numbers correctly', () => {
        expect(formatCurrency(-100)).toBe(EUR('-100,00'));
        expect(formatCurrency(-1234.56)).toBe(EUR('-1.234,56'));
      });

      it('handles zero correctly', () => {
        expect(formatCurrency(0)).toBe(EUR('0,00'));
      });

      it('handles null and undefined as zero', () => {
        expect(formatCurrency(null)).toBe(EUR('0,00'));
        expect(formatCurrency(undefined)).toBe(EUR('0,00'));
      });

      it('handles empty string as zero', () => {
        expect(formatCurrency('')).toBe(EUR('0,00'));
      });

      it('handles string input in US format', () => {
        expect(formatCurrency('1234.56')).toBe(EUR('1.234,56'));
        expect(formatCurrency('100')).toBe(EUR('100,00'));
      });

      it('handles string input in European format', () => {
        expect(formatCurrency('1.234,56')).toBe(EUR('1.234,56'));
        expect(formatCurrency('100,50')).toBe(EUR('100,50'));
      });

      it('handles very large numbers', () => {
        expect(formatCurrency(1000000)).toBe(EUR('1.000.000,00'));
        expect(formatCurrency(999999999.99)).toBe(EUR('999.999.999,99'));
      });

      it('handles very small decimal numbers', () => {
        expect(formatCurrency(0.01)).toBe(EUR('0,01'));
        expect(formatCurrency(0.001)).toBe(EUR('0,00'));
      });

      it('rounds to 2 decimal places', () => {
        expect(formatCurrency(10.555)).toBe(EUR('10,56'));
        expect(formatCurrency(10.554)).toBe(EUR('10,55'));
        expect(formatCurrency(10.999)).toBe(EUR('11,00'));
      });
    });

    describe('without currency symbol', () => {
      it('formats numbers without € symbol', () => {
        expect(formatCurrency(100, false)).toBe('100,00');
        expect(formatCurrency(1234.56, false)).toBe('1.234,56');
        expect(formatCurrency(0, false)).toBe('0,00');
      });

      it('handles null and undefined without symbol', () => {
        expect(formatCurrency(null, false)).toBe('0,00');
        expect(formatCurrency(undefined, false)).toBe('0,00');
      });

      it('handles negative numbers without symbol', () => {
        expect(formatCurrency(-100, false)).toBe('-100,00');
        expect(formatCurrency(-1234.56, false)).toBe('-1.234,56');
      });
    });

    describe('edge cases', () => {
      it('handles NaN input', () => {
        expect(formatCurrency(NaN)).toBe(EUR('0,00'));
      });

      it('handles invalid string input', () => {
        expect(formatCurrency('invalid')).toBe(EUR('0,00'));
        expect(formatCurrency('abc123')).toBe(EUR('0,00'));
      });

      it('handles infinity', () => {
        expect(formatCurrency(Infinity)).toContain('€');
        expect(formatCurrency(-Infinity)).toContain('€');
      });
    });
  });

  describe('formatNumber', () => {
    describe('with default 2 decimals', () => {
      it('formats positive integers correctly', () => {
        expect(formatNumber(100)).toBe('100,00');
        expect(formatNumber(1000)).toBe('1.000,00');
        expect(formatNumber(1234567)).toBe('1.234.567,00');
      });

      it('formats decimal numbers correctly', () => {
        expect(formatNumber(10.5)).toBe('10,50');
        expect(formatNumber(1234.56)).toBe('1.234,56');
        expect(formatNumber(0.99)).toBe('0,99');
      });

      it('handles zero correctly', () => {
        expect(formatNumber(0)).toBe('0,00');
      });

      it('handles null and undefined as zero', () => {
        expect(formatNumber(null)).toBe('0,00');
        expect(formatNumber(undefined)).toBe('0,00');
      });

      it('handles negative numbers correctly', () => {
        expect(formatNumber(-100)).toBe('-100,00');
        expect(formatNumber(-1234.56)).toBe('-1.234,56');
      });
    });

    describe('with custom decimal places', () => {
      it('formats with 0 decimals', () => {
        expect(formatNumber(100, 0)).toBe('100');
        expect(formatNumber(1234.56, 0)).toBe('1.235');
        expect(formatNumber(0, 0)).toBe('0');
      });

      it('formats with 1 decimal', () => {
        expect(formatNumber(100, 1)).toBe('100,0');
        expect(formatNumber(1234.56, 1)).toBe('1.234,6');
      });

      it('formats with 3 decimals', () => {
        expect(formatNumber(100, 3)).toBe('100,000');
        expect(formatNumber(1234.567, 3)).toBe('1.234,567');
      });

      it('formats with 4 decimals', () => {
        expect(formatNumber(1234.5678, 4)).toBe('1.234,5678');
      });

      it('handles zero with custom decimals', () => {
        expect(formatNumber(null, 0)).toBe('0');
        expect(formatNumber(null, 3)).toBe('0,000');
        expect(formatNumber(undefined, 4)).toBe('0,0000');
      });
    });

    describe('string input', () => {
      it('handles US format strings', () => {
        expect(formatNumber('1234.56')).toBe('1.234,56');
        expect(formatNumber('100')).toBe('100,00');
      });

      it('handles European format strings', () => {
        expect(formatNumber('1.234,56')).toBe('1.234,56');
        expect(formatNumber('100,50')).toBe('100,50');
      });
    });

    describe('edge cases', () => {
      it('handles NaN input', () => {
        expect(formatNumber(NaN)).toBe('0,00');
      });

      it('handles invalid string input', () => {
        expect(formatNumber('invalid')).toBe('0,00');
      });

      it('handles very large numbers', () => {
        expect(formatNumber(1000000000)).toBe('1.000.000.000,00');
      });
    });
  });

  describe('parseEuropeanNumber', () => {
    describe('standard European format', () => {
      it('parses numbers with comma decimal separator', () => {
        expect(parseEuropeanNumber('100,50')).toBe(100.5);
        expect(parseEuropeanNumber('1234,56')).toBe(1234.56);
        expect(parseEuropeanNumber('0,99')).toBe(0.99);
      });

      it('parses numbers with period thousands separator', () => {
        expect(parseEuropeanNumber('1.000,00')).toBe(1000);
        expect(parseEuropeanNumber('1.234.567,89')).toBe(1234567.89);
        expect(parseEuropeanNumber('10.000,50')).toBe(10000.5);
      });

      it('parses integers without decimal separator', () => {
        expect(parseEuropeanNumber('100')).toBe(100);
        expect(parseEuropeanNumber('1234')).toBe(1234);
      });

      it('parses numbers with € symbol', () => {
        expect(parseEuropeanNumber('€ 100,50')).toBe(100.5);
        expect(parseEuropeanNumber('€1.234,56')).toBe(1234.56);
        expect(parseEuropeanNumber('€ 10.000,00')).toBe(10000);
      });
    });

    describe('edge cases', () => {
      it('handles empty string', () => {
        expect(parseEuropeanNumber('')).toBe(0);
      });

      it('handles whitespace', () => {
        expect(parseEuropeanNumber('   ')).toBe(0);
      });

      it('handles zero', () => {
        expect(parseEuropeanNumber('0')).toBe(0);
        expect(parseEuropeanNumber('0,00')).toBe(0);
        expect(parseEuropeanNumber('€ 0,00')).toBe(0);
      });

      it('handles negative numbers', () => {
        expect(parseEuropeanNumber('-100,50')).toBe(-100.5);
        expect(parseEuropeanNumber('-1.234,56')).toBe(-1234.56);
      });

      it('handles invalid input as zero', () => {
        expect(parseEuropeanNumber('invalid')).toBe(0);
        expect(parseEuropeanNumber('abc')).toBe(0);
      });

      it('handles very large numbers', () => {
        expect(parseEuropeanNumber('1.000.000,00')).toBe(1000000);
        expect(parseEuropeanNumber('999.999.999,99')).toBe(999999999.99);
      });

      it('handles very small numbers', () => {
        expect(parseEuropeanNumber('0,01')).toBe(0.01);
        expect(parseEuropeanNumber('0,001')).toBe(0.001);
      });

      it('handles multiple € symbols', () => {
        expect(parseEuropeanNumber('€€ 100,50')).toBe(100.5);
      });
    });

    describe('US format input (no comma)', () => {
      it('parses US format as European (periods removed)', () => {
        // This is expected behavior - parseEuropeanNumber treats periods as thousands separators
        expect(parseEuropeanNumber('1234.56')).toBe(123456);
      });
    });
  });

  describe('formatPercentage', () => {
    describe('with default 0 decimals', () => {
      it('formats positive integers correctly', () => {
        expect(formatPercentage(21)).toBe('21%');
        expect(formatPercentage(100)).toBe('100%');
        expect(formatPercentage(0)).toBe('0%');
      });

      it('rounds decimal numbers to integer', () => {
        expect(formatPercentage(21.5)).toBe('22%');
        expect(formatPercentage(21.4)).toBe('21%');
        expect(formatPercentage(99.9)).toBe('100%');
      });

      it('handles null and undefined as zero', () => {
        expect(formatPercentage(null)).toBe('0%');
        expect(formatPercentage(undefined)).toBe('0%');
      });

      it('handles empty string as zero', () => {
        expect(formatPercentage('')).toBe('0%');
      });

      it('handles negative percentages', () => {
        expect(formatPercentage(-10)).toBe('-10%');
        expect(formatPercentage(-21.5)).toBe('-22%');
      });
    });

    describe('with custom decimal places', () => {
      it('formats with 1 decimal', () => {
        expect(formatPercentage(21.5, 1)).toBe('21,5%');
        expect(formatPercentage(21.45, 1)).toBe('21,5%');
      });

      it('formats with 2 decimals', () => {
        expect(formatPercentage(21.5, 2)).toBe('21,50%');
        expect(formatPercentage(21.456, 2)).toBe('21,46%');
        expect(formatPercentage(100, 2)).toBe('100,00%');
      });

      it('handles zero with custom decimals', () => {
        expect(formatPercentage(null, 2)).toBe('0%');
        expect(formatPercentage(0, 2)).toBe('0,00%');
      });
    });

    describe('string input', () => {
      it('handles US format strings', () => {
        expect(formatPercentage('21.5')).toBe('22%');
        expect(formatPercentage('100', 2)).toBe('100,00%');
      });

      it('handles European format strings', () => {
        expect(formatPercentage('21,5', 1)).toBe('21,5%');
        expect(formatPercentage('100,50', 2)).toBe('100,50%');
      });
    });

    describe('edge cases', () => {
      it('handles NaN input', () => {
        expect(formatPercentage(NaN)).toBe('0%');
      });

      it('handles invalid string input', () => {
        expect(formatPercentage('invalid')).toBe('0%');
      });

      it('handles very large percentages', () => {
        expect(formatPercentage(1000)).toBe('1.000%');
        expect(formatPercentage(1234.56, 2)).toBe('1.234,56%');
      });

      it('handles very small percentages', () => {
        expect(formatPercentage(0.5, 2)).toBe('0,50%');
        expect(formatPercentage(0.01, 2)).toBe('0,01%');
      });
    });
  });

  describe('integration tests', () => {
    it('formatCurrency and parseEuropeanNumber are inverses', () => {
      const testCases = [100, 1234.56, 0.99, 10000];
      testCases.forEach(value => {
        const formatted = formatCurrency(value);
        const parsed = parseEuropeanNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });

    it('formatNumber and parseEuropeanNumber are inverses', () => {
      const testCases = [100, 1234.56, 0.99, 10000];
      testCases.forEach(value => {
        const formatted = formatNumber(value);
        const parsed = parseEuropeanNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });

    it('handles chain of European format conversions', () => {
      const original = 1234.56;
      const formatted1 = formatCurrency(original);
      const parsed1 = parseEuropeanNumber(formatted1);
      const formatted2 = formatCurrency(parsed1);
      expect(formatted1).toBe(formatted2);
    });

    it('handles mixed format inputs correctly', () => {
      // US format string
      expect(formatCurrency('1000.50')).toBe(EUR('1.000,50'));

      // European format string
      expect(formatCurrency('1.000,50')).toBe(EUR('1.000,50'));

      // Both should produce same result after parsing
      const usFormat = parseEuropeanNumber(formatCurrency('1000.50', false));
      const eurFormat = parseEuropeanNumber(formatCurrency('1.000,50', false));
      expect(usFormat).toBe(eurFormat);
    });
  });

  describe('real-world scenarios', () => {
    it('handles typical VAT calculations', () => {
      const price = 100;
      const vat = 21;
      const priceWithVat = price * (1 + vat / 100);

      expect(formatCurrency(price)).toBe(EUR('100,00'));
      expect(formatPercentage(vat)).toBe('21%');
      expect(formatCurrency(priceWithVat)).toBe(EUR('121,00'));
    });

    it('handles invoice totals', () => {
      const items = [
        { price: 10.50, quantity: 2 },
        { price: 25.99, quantity: 1 },
        { price: 100, quantity: 3 },
      ];

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(formatCurrency(total)).toBe(EUR('346,99'));
    });

    it('handles discount calculations', () => {
      const originalPrice = 100;
      const discountPercent = 15;
      const discountedPrice = originalPrice * (1 - discountPercent / 100);

      expect(formatCurrency(originalPrice)).toBe(EUR('100,00'));
      expect(formatPercentage(discountPercent)).toBe('15%');
      expect(formatCurrency(discountedPrice)).toBe(EUR('85,00'));
    });

    it('handles stock value calculations', () => {
      const stockItems = [
        { price: 12.50, quantity: 100 },
        { price: 25.99, quantity: 50 },
        { price: 8.75, quantity: 200 },
      ];

      const totalValue = stockItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      expect(formatCurrency(totalValue)).toBe(EUR('4.299,50'));
    });

    it('handles profit margin calculations', () => {
      const buyingPrice = 100;
      const sellingPrice = 150;
      const margin = ((sellingPrice - buyingPrice) / sellingPrice) * 100;

      expect(formatCurrency(buyingPrice)).toBe(EUR('100,00'));
      expect(formatCurrency(sellingPrice)).toBe(EUR('150,00'));
      expect(formatPercentage(margin, 2)).toBe('33,33%');
    });

    it('handles weight and price per kg', () => {
      const weightKg = 2.5;
      const pricePerKg = 12.50;
      const totalPrice = weightKg * pricePerKg;

      expect(formatNumber(weightKg, 2)).toBe('2,50');
      expect(formatCurrency(pricePerKg)).toBe(EUR('12,50'));
      expect(formatCurrency(totalPrice)).toBe(EUR('31,25'));
    });
  });
});
