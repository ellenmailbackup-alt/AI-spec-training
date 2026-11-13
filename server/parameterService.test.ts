import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@shared/schema', () => ({
  parameterTable: {
    parameterName: 'parameterName',
    parameterValue: 'parameterValue',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val, type: 'eq' })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, type: 'sql' })),
}));

import { ParameterService } from './parameterService';
import { db } from './db';

function mockSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  };
}

function mockSelectAllChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockResolvedValue(rows),
    }),
  };
}

function mockUpdateChain(rows: unknown[]) {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(rows),
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

const mockedDb = db as any;

describe('ParameterService', () => {
  let service: ParameterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ParameterService();
  });

  describe('getParameter', () => {
    it('returns the parameter value when found', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2026' }]),
      );
      expect(await service.getParameter('current_year')).toBe('2026');
    });

    it('returns undefined when parameter not found', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      expect(await service.getParameter('nonexistent')).toBeUndefined();
    });
  });

  describe('getCurrentYear', () => {
    it('returns the current year as a number when valid', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2026' }]),
      );
      expect(await service.getCurrentYear()).toBe(2026);
    });

    it('throws when current_year parameter is not configured', async () => {
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      await expect(service.getCurrentYear()).rejects.toThrow(
        'Current year not configured in system',
      );
    });

    it('throws when value is NaN', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: 'abc' }]),
      );
      await expect(service.getCurrentYear()).rejects.toThrow('Invalid current year value');
    });

    it('throws when year is below 2000', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '1999' }]),
      );
      await expect(service.getCurrentYear()).rejects.toThrow('Invalid current year value');
    });

    it('throws when year is above 2100', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2101' }]),
      );
      await expect(service.getCurrentYear()).rejects.toThrow('Invalid current year value');
    });

    it('accepts boundary value 2000', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2000' }]),
      );
      expect(await service.getCurrentYear()).toBe(2000);
    });

    it('accepts boundary value 2100', async () => {
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2100' }]),
      );
      expect(await service.getCurrentYear()).toBe(2100);
    });
  });

  describe('setParameter', () => {
    it('updates existing parameter', async () => {
      const updated = { parameterName: 'current_year', parameterValue: '2027' };
      mockedDb.select.mockReturnValue(
        mockSelectChain([{ parameterName: 'current_year', parameterValue: '2026' }]),
      );
      mockedDb.update.mockReturnValue(mockUpdateChain([updated]));

      const result = await service.setParameter('current_year', '2027');
      expect(result).toEqual(updated);
      expect(mockedDb.update).toHaveBeenCalled();
      expect(mockedDb.insert).not.toHaveBeenCalled();
    });

    it('creates new parameter when not found', async () => {
      const created = { parameterName: 'new_param', parameterValue: 'value' };
      mockedDb.select.mockReturnValue(mockSelectChain([]));
      mockedDb.insert.mockReturnValue(mockInsertChain([created]));

      const result = await service.setParameter('new_param', 'value');
      expect(result).toEqual(created);
      expect(mockedDb.insert).toHaveBeenCalled();
      expect(mockedDb.update).not.toHaveBeenCalled();
    });
  });

  describe('getAllParameters', () => {
    it('returns all parameters ordered by name', async () => {
      const params = [
        { parameterName: 'a_param', parameterValue: '1' },
        { parameterName: 'b_param', parameterValue: '2' },
      ];
      mockedDb.select.mockReturnValue(mockSelectAllChain(params));
      expect(await service.getAllParameters()).toEqual(params);
    });

    it('returns empty array when no parameters exist', async () => {
      mockedDb.select.mockReturnValue(mockSelectAllChain([]));
      expect(await service.getAllParameters()).toEqual([]);
    });
  });
});
