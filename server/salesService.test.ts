import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock transaction helper
const mockTx: any = {
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
};

vi.mock('./db', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => callback(mockTx)),
  },
}));

vi.mock('./storage', () => ({
  storage: {
    getSale: vi.fn(),
    getSales: vi.fn(),
    getSalesByCustomer: vi.fn(),
  },
}));

vi.mock('./invoiceService', () => ({
  invoiceService: {
    generateInvoiceNumber: vi.fn(),
  },
}));

vi.mock('@shared/schema', () => ({
  sales: { id: 'id', customerId: 'customerId', salesStatus: 'salesStatus' },
  salesLines: { saleId: 'saleId', productId: 'productId' },
  salePayments: { saleId: 'saleId' },
  customers: { id: 'id' },
  products: { id: 'id' },
  vatClasses: { id: 'id', percentage: 'percentage' },
  paymentMethods: { paymentMethod: 'paymentMethod' },
  salesStatuses: { id: 'id', salesStatus: 'salesStatus' },
  stockMovements: { saleId: 'saleId' },
  stockMovementReasons: { reason: 'reason' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val, type: 'eq' })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, type: 'sql' })),
}));

import { SalesService } from './salesService';
import { storage } from './storage';
import { invoiceService } from './invoiceService';

const mockedStorage = storage as any;
const mockedInvoiceService = invoiceService as any;

// Status IDs matching the service
const NEW_STATUS_ID = 1;
const SHIPPED_STATUS_ID = 2;
const INVOICED_STATUS_ID = 3;
const PAID_STATUS_ID = 4;

describe('SalesService', () => {
  let service: SalesService;

  const baseLineItem = {
    productId: 1,
    amount: '2',
    weight: '0.250',
    pricePerUnit: '10.00',
    totalWithoutVat: '20.00',
    totalWithVat: '24.20',
  };

  const baseCreateRequest = {
    customerId: 1,
    salesDate: new Date('2026-03-01'),
    salesStatus: NEW_STATUS_ID,
    paymentMethod: 1,
    lineItems: [baseLineItem],
    requiresInvoiceNumber: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default tx mocks for createSale
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          customerId: 1,
          invoiceNumber: '0',
          salesDate: '2026-03-01',
          salesStatus: NEW_STATUS_ID,
          paymentMethod: 1,
          webshopSale: false,
          stockUpdated: false,
          uploadedAccounting: false,
          shippingCostWithoutVat: '0',
          shippingCostWithVat: '0',
          discountPercentage: '0',
          discountWithoutVat: '0',
          discountWithVat: '0',
          totalWithVat: '24.20',
        }]),
      }),
    });

    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 1, firstName: 'Test' }]),
        leftJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              salesLine: baseLineItem,
              product: { id: 1, name: 'Coffee' },
              vatPercentage: '21',
            }]),
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });

    service = new SalesService();
  });

  describe('createSale', () => {
    it('throws if no line items provided', async () => {
      await expect(
        service.createSale({ ...baseCreateRequest, lineItems: [] }),
      ).rejects.toThrow('Sale must have at least one line item');
    });

    it('uses "0" as invoice number for B2C (requiresInvoiceNumber=false)', async () => {
      const result = await service.createSale(baseCreateRequest);
      expect(mockedInvoiceService.generateInvoiceNumber).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('generates invoice number for B2B (requiresInvoiceNumber=true)', async () => {
      mockedInvoiceService.generateInvoiceNumber.mockResolvedValue(42);
      await service.createSale({ ...baseCreateRequest, requiresInvoiceNumber: true });
      expect(mockedInvoiceService.generateInvoiceNumber).toHaveBeenCalledWith(mockTx);
    });

    it('calls tx.insert for sale, line items, and payment', async () => {
      await service.createSale(baseCreateRequest);
      // 3 inserts: sale, line items, payment
      expect(mockTx.insert).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateSale', () => {
    it('throws if no line items provided', async () => {
      await expect(
        service.updateSale(1, { ...baseCreateRequest, lineItems: [] }),
      ).rejects.toThrow('Sale must have at least one line item');
    });

    it('throws if sale is paid (status=4)', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                salesStatus: PAID_STATUS_ID,
                statusName: 'Paid',
              }]),
            }),
          }),
        }),
      });

      await expect(
        service.updateSale(1, baseCreateRequest),
      ).rejects.toThrow('Cannot edit a sale that has been marked as paid');
    });

    it('throws if sale not found', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await expect(
        service.updateSale(999, baseCreateRequest),
      ).rejects.toThrow('Sale not found');
    });
  });

  describe('deleteSale', () => {
    it('throws if sale is paid', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                salesStatus: PAID_STATUS_ID,
                statusName: 'Paid',
              }]),
            }),
          }),
        }),
      });

      await expect(service.deleteSale(1)).rejects.toThrow(
        'Cannot delete a sale that has been marked as paid',
      );
    });

    it('returns false if sale not found', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      expect(await service.deleteSale(999)).toBe(false);
    });

    it('deletes in correct order: payments, lines, sale', async () => {
      const deleteOrder: string[] = [];
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                salesStatus: NEW_STATUS_ID,
                statusName: 'New',
              }]),
            }),
          }),
        }),
      });
      mockTx.delete.mockImplementation((table: any) => {
        deleteOrder.push(table.saleId ? 'child' : 'sale');
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      });

      await service.deleteSale(1);
      // 3 deletes: payments, lines, sale
      expect(mockTx.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateSaleStatus', () => {
    it('throws if changing from PAID status', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              salesStatus: PAID_STATUS_ID,
            }]),
          }),
        }),
      });

      await expect(
        service.updateSaleStatus(1, NEW_STATUS_ID),
      ).rejects.toThrow('Cannot change the status of a paid sale');
    });

    it('throws if moving backwards (e.g., SHIPPED → NEW)', async () => {
      mockTx.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              salesStatus: SHIPPED_STATUS_ID,
            }]),
          }),
        }),
      });

      await expect(
        service.updateSaleStatus(1, NEW_STATUS_ID),
      ).rejects.toThrow('Cannot move to a previous status');
    });

    it('returns needsConfirmation for INVOICED without stock movements', async () => {
      // First select: get current sale
      const selectMock = vi.fn();
      selectMock
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 1,
                salesStatus: NEW_STATUS_ID,
              }]),
            }),
          }),
        })
        // Second select: check existing stock movements
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // no stock movements
            }),
          }),
        });
      mockTx.select = selectMock;

      const result = await service.updateSaleStatus(1, INVOICED_STATUS_ID, false);
      expect(result.needsConfirmation).toBe(true);
    });
  });

  describe('delegation methods', () => {
    it('getSale delegates to storage', async () => {
      const mockSale = { id: 1, customerId: 1 };
      mockedStorage.getSale.mockResolvedValue(mockSale);
      expect(await service.getSale(1)).toEqual(mockSale);
      expect(mockedStorage.getSale).toHaveBeenCalledWith(1);
    });

    it('getSales delegates to storage', async () => {
      const mockSales = [{ id: 1 }, { id: 2 }];
      mockedStorage.getSales.mockResolvedValue(mockSales);
      expect(await service.getSales()).toEqual(mockSales);
    });

    it('getSalesByCustomer delegates to storage', async () => {
      const mockSales = [{ id: 1, customerId: 5 }];
      mockedStorage.getSalesByCustomer.mockResolvedValue(mockSales);
      expect(await service.getSalesByCustomer(5)).toEqual(mockSales);
      expect(mockedStorage.getSalesByCustomer).toHaveBeenCalledWith(5);
    });
  });
});
