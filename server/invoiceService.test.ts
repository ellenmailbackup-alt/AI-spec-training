import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./parameterService', () => ({
  parameterService: {
    getCurrentYear: vi.fn(),
  },
}));

vi.mock('@shared/schema', () => ({
  invoiceNumbers: { invoiceYear: 'invoiceYear', invoiceLastNumber: 'invoiceLastNumber' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val, type: 'eq' })),
}));

import { InvoiceService } from './invoiceService';
import { db } from './db';
import { parameterService } from './parameterService';

function mockSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  };
}

function mockSelectChainWithLock(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        for: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

function mockInsertChain(rows: unknown[]) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(rows),
    }),
  };
}

function mockUpdateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

const mockedDb = db as any;
const mockedParameterService = parameterService as any;

describe('InvoiceService', () => {
  let service: InvoiceService;
  const CURRENT_YEAR = 2026;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvoiceService();
    mockedParameterService.getCurrentYear.mockResolvedValue(CURRENT_YEAR);
  });

  describe('getNextInvoiceNumber', () => {
    it('returns invoiceLastNumber + 1 when a record exists', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 41 }]),
      );
      expect(await service.getNextInvoiceNumber()).toBe(42);
    });

    it('returns 1 when invoiceLastNumber is 0 (first invoice of year)', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 0 }]),
      );
      expect(await service.getNextInvoiceNumber()).toBe(1);
    });

    it('queries parameterService for current year', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 99 }]),
      );
      await service.getNextInvoiceNumber();
      expect(mockedParameterService.getCurrentYear).toHaveBeenCalledOnce();
    });

    it('throws when no record exists for current year', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      await expect(service.getNextInvoiceNumber()).rejects.toThrow(
        `Invoice number record not found for year ${CURRENT_YEAR}`,
      );
    });

    it('propagates errors from parameterService.getCurrentYear', async () => {
      mockedParameterService.getCurrentYear.mockRejectedValue(
        new Error('Current year not configured'),
      );
      await expect(service.getNextInvoiceNumber()).rejects.toThrow('Current year not configured');
    });
  });

  describe('generateInvoiceNumber', () => {
    it('increments and returns the new number', async () => {
      const mockTx = {
        select: vi.fn().mockReturnValue(
          mockSelectChainWithLock([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 10 }]),
        ),
        update: vi.fn().mockReturnValue(mockUpdateChain()),
      };
      expect(await service.generateInvoiceNumber(mockTx)).toBe(11);
    });

    it('calls .for("update") to acquire row-level lock', async () => {
      const forMock = vi.fn().mockResolvedValue([
        { id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 5 },
      ]);
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ for: forMock }),
          }),
        }),
        update: vi.fn().mockReturnValue(mockUpdateChain()),
      };
      await service.generateInvoiceNumber(mockTx);
      expect(forMock).toHaveBeenCalledWith('update');
    });

    it('persists the incremented value via tx.update', async () => {
      const setMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
      const mockTx = {
        select: vi.fn().mockReturnValue(
          mockSelectChainWithLock([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 20 }]),
        ),
        update: vi.fn().mockReturnValue({ set: setMock }),
      };
      await service.generateInvoiceNumber(mockTx);
      expect(setMock).toHaveBeenCalledWith({ invoiceLastNumber: 21 });
    });

    it('handles 0 → 1 boundary case', async () => {
      const mockTx = {
        select: vi.fn().mockReturnValue(
          mockSelectChainWithLock([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 0 }]),
        ),
        update: vi.fn().mockReturnValue(mockUpdateChain()),
      };
      expect(await service.generateInvoiceNumber(mockTx)).toBe(1);
    });

    it('throws when no record exists for the year', async () => {
      const mockTx = {
        select: vi.fn().mockReturnValue(mockSelectChainWithLock([])),
        update: vi.fn(),
      };
      await expect(service.generateInvoiceNumber(mockTx)).rejects.toThrow(
        `Invoice number record not found for year ${CURRENT_YEAR}`,
      );
    });

    it('does not call tx.update when throwing', async () => {
      const mockTx = {
        select: vi.fn().mockReturnValue(mockSelectChainWithLock([])),
        update: vi.fn(),
      };
      await expect(service.generateInvoiceNumber(mockTx)).rejects.toThrow();
      expect(mockTx.update).not.toHaveBeenCalled();
    });

    it('propagates errors from parameterService.getCurrentYear', async () => {
      mockedParameterService.getCurrentYear.mockRejectedValue(new Error('Not configured'));
      const mockTx = { select: vi.fn(), update: vi.fn() };
      await expect(service.generateInvoiceNumber(mockTx)).rejects.toThrow('Not configured');
    });
  });

  describe('initializeYear', () => {
    it('creates and returns a new record starting at 0', async () => {
      const created = { id: 1, invoiceYear: 2027, invoiceLastNumber: 0 };
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      mockedDb.insert.mockReturnValue(mockInsertChain([created]));
      expect(await service.initializeYear(2027)).toEqual(created);
    });

    it('inserts with invoiceLastNumber set to 0', async () => {
      const valuesMock = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, invoiceYear: 2027, invoiceLastNumber: 0 }]),
      });
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      mockedDb.insert.mockReturnValue({ values: valuesMock });
      await service.initializeYear(2027);
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceYear: 2027, invoiceLastNumber: 0 }),
      );
    });

    it('throws when year already exists', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 15 }]),
      );
      await expect(service.initializeYear(CURRENT_YEAR)).rejects.toThrow(
        `Invoice numbering already initialized for year ${CURRENT_YEAR}`,
      );
    });

    it('includes existing last number in error message', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 99 }]),
      );
      await expect(service.initializeYear(CURRENT_YEAR)).rejects.toThrow('99');
    });

    it('does not call db.insert when year already exists', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 5 }]),
      );
      await expect(service.initializeYear(CURRENT_YEAR)).rejects.toThrow();
      expect(mockedDb.insert).not.toHaveBeenCalled();
    });

    it('can initialize a past year', async () => {
      const created = { id: 2, invoiceYear: 2020, invoiceLastNumber: 0 };
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      mockedDb.insert.mockReturnValue(mockInsertChain([created]));
      expect((await service.initializeYear(2020)).invoiceYear).toBe(2020);
    });
  });

  describe('getYearStatus', () => {
    it('returns the record for a specified year', async () => {
      const record = { id: 1, invoiceYear: 2025, invoiceLastNumber: 77 };
      mockedDb.select.mockReturnValue(mockSelectChain([record]));
      expect(await service.getYearStatus(2025)).toEqual(record);
    });

    it('returns undefined when no record exists', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      expect(await service.getYearStatus(2025)).toBeUndefined();
    });

    it('uses current year when no year argument provided', async () => {
      const record = { id: 1, invoiceYear: CURRENT_YEAR, invoiceLastNumber: 50 };
      mockedDb.select.mockReturnValue(mockSelectChain([record]));
      await service.getYearStatus();
      expect(mockedParameterService.getCurrentYear).toHaveBeenCalledOnce();
    });

    it('does not call parameterService when year argument is provided', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      await service.getYearStatus(2025);
      expect(mockedParameterService.getCurrentYear).not.toHaveBeenCalled();
    });

    it('returns undefined when defaulting to current year and no record exists', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      expect(await service.getYearStatus()).toBeUndefined();
    });

    it('propagates errors from parameterService when no year provided', async () => {
      mockedParameterService.getCurrentYear.mockRejectedValue(new Error('Not configured'));
      await expect(service.getYearStatus()).rejects.toThrow('Not configured');
    });
  });
});
