import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWhere = vi.hoisted(() => vi.fn());

vi.mock('./db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    }),
  },
}));

vi.mock('./parameterService', () => ({
  parameterService: {
    getCurrentYear: vi.fn(),
  },
}));

vi.mock('@shared/schema', () => ({
  stockMovements: {
    productId: 'productId',
    quantity: 'quantity',
    reason: 'reason',
    date: 'date',
    saleId: 'saleId',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val, type: 'eq' })),
  and: vi.fn((...args: unknown[]) => ({ args, type: 'and' })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, type: 'sql' })),
}));

import { StockMovementService, STOCK_MOVEMENT_REASONS } from './stockMovementService';
import { parameterService } from './parameterService';

const mockedParameterService = parameterService as any;

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StockMovementService();
    mockedParameterService.getCurrentYear.mockResolvedValue(2026);
  });

  describe('STOCK_MOVEMENT_REASONS', () => {
    it('has correct numeric values', () => {
      expect(STOCK_MOVEMENT_REASONS.START_STOCK).toBe(1);
      expect(STOCK_MOVEMENT_REASONS.BUY).toBe(2);
      expect(STOCK_MOVEMENT_REASONS.SALE).toBe(3);
      expect(STOCK_MOVEMENT_REASONS.CORRECTION).toBe(4);
      expect(STOCK_MOVEMENT_REASONS.OWN_USE).toBe(5);
      expect(STOCK_MOVEMENT_REASONS.ROAST).toBe(11);
      expect(STOCK_MOVEMENT_REASONS.FINAL_STOCK).toBe(12);
    });

    it('has unique IDs', () => {
      const values = Object.values(STOCK_MOVEMENT_REASONS);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('getProductStockStats', () => {
    it('returns stats with current year', async () => {
      mockWhere.mockResolvedValueOnce([{
        startStock: 100,
        totalBought: 50,
        totalSold: 30,
        currentStock: 120,
      }]);

      const result = await service.getProductStockStats(1);

      expect(result).toEqual({
        currentYear: 2026,
        startStock: 100,
        totalBought: 50,
        totalSold: 30,
        currentStock: 120,
      });
    });

    it('returns zeros when no movements exist', async () => {
      mockWhere.mockResolvedValueOnce([{
        startStock: null,
        totalBought: null,
        totalSold: null,
        currentStock: null,
      }]);

      const result = await service.getProductStockStats(1);

      expect(result).toEqual({
        currentYear: 2026,
        startStock: 0,
        totalBought: 0,
        totalSold: 0,
        currentStock: 0,
      });
    });

    it('returns zeros for empty result set', async () => {
      mockWhere.mockResolvedValueOnce([undefined]);

      const result = await service.getProductStockStats(1);

      expect(result.startStock).toBe(0);
      expect(result.totalBought).toBe(0);
      expect(result.totalSold).toBe(0);
      expect(result.currentStock).toBe(0);
    });

    it('queries parameterService for current year', async () => {
      mockWhere.mockResolvedValueOnce([{ startStock: 0, totalBought: 0, totalSold: 0, currentStock: 0 }]);
      await service.getProductStockStats(1);
      expect(mockedParameterService.getCurrentYear).toHaveBeenCalledOnce();
    });

    it('propagates parameterService errors', async () => {
      mockedParameterService.getCurrentYear.mockRejectedValue(new Error('Not configured'));
      await expect(service.getProductStockStats(1)).rejects.toThrow('Not configured');
    });
  });

  describe('getCurrentStock', () => {
    it('returns total quantity', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 42 }]);
      expect(await service.getCurrentStock(1)).toBe(42);
    });

    it('returns 0 for products with no movements', async () => {
      mockWhere.mockResolvedValueOnce([{ total: null }]);
      expect(await service.getCurrentStock(1)).toBe(0);
    });

    it('returns 0 for empty result', async () => {
      mockWhere.mockResolvedValueOnce([undefined]);
      expect(await service.getCurrentStock(1)).toBe(0);
    });

    it('handles decimal quantities', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 12.345 }]);
      expect(await service.getCurrentStock(1)).toBe(12.345);
    });

    it('handles exact zero', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 0 }]);
      expect(await service.getCurrentStock(1)).toBe(0);
    });
  });

  describe('getMovementsByDateRange', () => {
    const movements = [
      { id: 1, productId: 1, date: '2026-01-15', quantity: '10', reason: 2 },
      { id: 2, productId: 1, date: '2026-03-01', quantity: '-5', reason: 3 },
      { id: 3, productId: 1, date: '2026-06-15', quantity: '20', reason: 2 },
    ];

    it('returns all movements when no dates provided', async () => {
      mockWhere.mockResolvedValueOnce(movements);
      const result = await service.getMovementsByDateRange(1);
      expect(result).toEqual(movements);
    });

    it('filters by start date only', async () => {
      mockWhere.mockResolvedValueOnce(movements);
      const result = await service.getMovementsByDateRange(1, new Date('2026-02-01'));
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
    });

    it('filters by end date only', async () => {
      mockWhere.mockResolvedValueOnce(movements);
      const result = await service.getMovementsByDateRange(1, undefined, new Date('2026-04-01'));
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('filters by both start and end dates', async () => {
      mockWhere.mockResolvedValueOnce(movements);
      const result = await service.getMovementsByDateRange(
        1,
        new Date('2026-02-01'),
        new Date('2026-04-01'),
      );
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    it('returns empty array when no movements match', async () => {
      mockWhere.mockResolvedValueOnce(movements);
      const result = await service.getMovementsByDateRange(
        1,
        new Date('2027-01-01'),
        new Date('2027-12-31'),
      );
      expect(result).toEqual([]);
    });

    it('returns empty when no movements exist for product', async () => {
      mockWhere.mockResolvedValueOnce([]);
      const result = await service.getMovementsByDateRange(999);
      expect(result).toEqual([]);
    });
  });

  describe('getMovementsByReason', () => {
    it('returns movements matching the reason', async () => {
      const buyMovements = [
        { id: 1, productId: 1, reason: 2, quantity: '10' },
        { id: 2, productId: 1, reason: 2, quantity: '20' },
      ];
      mockWhere.mockResolvedValueOnce(buyMovements);
      const result = await service.getMovementsByReason(1, STOCK_MOVEMENT_REASONS.BUY);
      expect(result).toEqual(buyMovements);
    });

    it('returns empty array when no movements match', async () => {
      mockWhere.mockResolvedValueOnce([]);
      const result = await service.getMovementsByReason(1, STOCK_MOVEMENT_REASONS.CORRECTION);
      expect(result).toEqual([]);
    });
  });

  describe('getTotalQuantity', () => {
    it('returns total for product without filters', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 100 }]);
      expect(await service.getTotalQuantity(1)).toBe(100);
    });

    it('returns 0 when no movements exist', async () => {
      mockWhere.mockResolvedValueOnce([{ total: null }]);
      expect(await service.getTotalQuantity(1)).toBe(0);
    });

    it('returns 0 for empty result', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 0 }]);
      expect(await service.getTotalQuantity(1)).toBe(0);
    });

    it('filters by reasonId when provided', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 50 }]);
      const result = await service.getTotalQuantity(1, STOCK_MOVEMENT_REASONS.BUY);
      expect(result).toBe(50);
    });

    it('filters by year when provided', async () => {
      // First mockWhere call: the initial query build at line 206-211
      // Second mockWhere call: the year-specific query at line 215-225
      mockWhere.mockReturnValueOnce(undefined); // first query (not awaited)
      mockWhere.mockResolvedValueOnce([{ total: 30 }]); // second query (awaited)
      const result = await service.getTotalQuantity(1, undefined, 2026);
      expect(result).toBe(30);
    });

    it('filters by both reasonId and year', async () => {
      mockWhere.mockReturnValueOnce(undefined); // first query build
      mockWhere.mockResolvedValueOnce([{ total: 20 }]); // year-filtered query
      const result = await service.getTotalQuantity(1, STOCK_MOVEMENT_REASONS.SALE, 2026);
      expect(result).toBe(20);
    });

    it('handles decimal totals', async () => {
      mockWhere.mockResolvedValueOnce([{ total: 12.5 }]);
      expect(await service.getTotalQuantity(1)).toBe(12.5);
    });
  });
});
