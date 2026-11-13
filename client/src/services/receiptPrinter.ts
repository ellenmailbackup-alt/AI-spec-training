/**
 * Receipt Printer Utility
 *
 * Formats and prints receipts using Star ESC/POS commands
 */

import { starPrinter } from './starPrinter';

export interface ReceiptItem {
  name: string;
  weight?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
}

export interface ReceiptPayment {
  method: string;
  amount: number;
}

export interface ReceiptData {
  saleId: number;
  date: Date;
  invoiceNumber?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  vatBreakdown: Array<{ rate: number; amount: number }>;
  total: number;
  payments: ReceiptPayment[];
  change?: number;
  companyInfo?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    vatNumber?: string;
    kvkNumber?: string;
  };
}

/**
 * Receipt Printer Class
 */
export class ReceiptPrinter {
  private readonly CHAR_WIDTH = 48; // Characters per line for Star mPOP

  /**
   * Format and print a receipt
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    if (!starPrinter.isConnected()) {
      throw new Error('Printer not connected');
    }

    const commands = this.buildReceiptCommands(data);
    await starPrinter.sendData(new Uint8Array(commands));
  }

  /**
   * Build ESC/POS commands for receipt
   */
  private buildReceiptCommands(data: ReceiptData): number[] {
    const commands: number[] = [];
    const encoder = new TextEncoder();

    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Initialize

    // Set character code table to CP858 (Euro support)
    commands.push(0x1B, 0x1D, 0x74, 0x13);

    // Company header
    if (data.companyInfo) {
      this.addCenteredBoldText(commands, data.companyInfo.name || '', encoder);

      if (data.companyInfo.address) {
        this.addCenteredText(commands, data.companyInfo.address, encoder);
      }

      const cityLine = [
        data.companyInfo.postalCode,
        data.companyInfo.city
      ].filter(Boolean).join(' ');
      if (cityLine) {
        this.addCenteredText(commands, cityLine, encoder);
      }

      if (data.companyInfo.phone) {
        this.addCenteredText(commands, `Tel: ${data.companyInfo.phone}`, encoder);
      }
      if (data.companyInfo.email) {
        this.addCenteredText(commands, data.companyInfo.email, encoder);
      }

      // VAT and KVK numbers
      if (data.companyInfo.vatNumber) {
        this.addCenteredText(commands, `BTW: ${data.companyInfo.vatNumber}`, encoder);
      }
      if (data.companyInfo.kvkNumber) {
        this.addCenteredText(commands, `KVK: ${data.companyInfo.kvkNumber}`, encoder);
      }

      this.addLine(commands, encoder);
    }

    // Receipt header
    const dateStr = this.formatDate(data.date);
    const timeStr = this.formatTime(data.date);

    this.addLeftRightText(commands, 'Bon', `#${data.saleId}`, encoder);
    this.addLeftRightText(commands, dateStr, timeStr, encoder);

    if (data.invoiceNumber) {
      this.addCenteredText(commands, `Factuur: ${data.invoiceNumber}`, encoder);
    }

    if (data.customerName) {
      this.addText(commands, `Klant: ${data.customerName}\n`, encoder);
    }

    this.addLine(commands, encoder);

    // Items
    for (const item of data.items) {
      // Product name
      this.addText(commands, `${item.name}\n`, encoder);

      // Quantity, price, total
      const weightUnit = item.weight && item.unit ? ` (${item.weight}${item.unit})` : '';
      const qtyStr = `${item.quantity}x ${this.formatCurrency(item.unitPrice)}${weightUnit}`;
      const totalStr = this.formatCurrency(item.total);

      this.addLeftRightText(commands, `  ${qtyStr}`, totalStr, encoder);
    }

    this.addLine(commands, encoder);

    // Subtotal
    this.addLeftRightText(
      commands,
      'Subtotaal',
      this.formatCurrency(data.subtotal),
      encoder
    );

    // Discount
    if (data.discount > 0) {
      this.addLeftRightText(
        commands,
        'Korting',
        `-${this.formatCurrency(data.discount)}`,
        encoder
      );
    }

    // VAT breakdown
    if (data.vatBreakdown.length > 0) {
      this.addLine(commands, encoder);
      this.addText(commands, 'BTW overzicht:\n', encoder);

      for (const vat of data.vatBreakdown) {
        this.addLeftRightText(
          commands,
          `  ${vat.rate}% BTW`,
          this.formatCurrency(vat.amount),
          encoder
        );
      }
    }

    this.addLine(commands, encoder);

    // Total (bold and double height)
    this.addLeftRightBoldText(
      commands,
      'TOTAAL',
      this.formatCurrency(data.total),
      encoder,
      true // double height
    );

    this.addLine(commands, encoder);

    // Payments
    this.addText(commands, 'Betaling:\n', encoder);
    for (const payment of data.payments) {
      this.addLeftRightText(
        commands,
        `  ${payment.method}`,
        this.formatCurrency(payment.amount),
        encoder
      );
    }

    // Change
    if (data.change && data.change > 0) {
      this.addLine(commands, encoder);
      this.addLeftRightText(
        commands,
        'Wisselgeld',
        this.formatCurrency(data.change),
        encoder
      );
    }

    this.addLine(commands, encoder);

    // Footer
    this.addCenteredText(commands, 'Bedankt voor uw bezoek!', encoder);
    this.addCenteredText(commands, 'Tot ziens!', encoder);

    // Feed and cut
    commands.push(0x1B, 0x64, 0x03); // ESC d 3 - Feed 3 lines and cut

    return commands;
  }

  /**
   * Add centered text
   */
  private addCenteredText(commands: number[], text: string, encoder: TextEncoder) {
    commands.push(0x1B, 0x1D, 0x61, 0x01); // Center alignment
    commands.push(...Array.from(encoder.encode(text + '\n')));
    commands.push(0x1B, 0x1D, 0x61, 0x00); // Left alignment
  }

  /**
   * Add centered bold text
   */
  private addCenteredBoldText(commands: number[], text: string, encoder: TextEncoder) {
    commands.push(0x1B, 0x1D, 0x61, 0x01); // Center alignment
    commands.push(0x1B, 0x45); // Bold on
    commands.push(...Array.from(encoder.encode(text + '\n')));
    commands.push(0x1B, 0x46); // Bold off
    commands.push(0x1B, 0x1D, 0x61, 0x00); // Left alignment
  }

  /**
   * Add left-aligned text
   */
  private addText(commands: number[], text: string, encoder: TextEncoder) {
    commands.push(...Array.from(encoder.encode(text)));
  }

  /**
   * Add text with left and right alignment
   */
  private addLeftRightText(
    commands: number[],
    left: string,
    right: string,
    encoder: TextEncoder
  ) {
    const padding = this.CHAR_WIDTH - left.length - right.length;
    const line = left + ' '.repeat(Math.max(0, padding)) + right + '\n';
    commands.push(...Array.from(encoder.encode(line)));
  }

  /**
   * Add bold text with left and right alignment
   */
  private addLeftRightBoldText(
    commands: number[],
    left: string,
    right: string,
    encoder: TextEncoder,
    doubleHeight = false
  ) {
    commands.push(0x1B, 0x45); // Bold on
    if (doubleHeight) {
      commands.push(0x1B, 0x69, 0x01, 0x01); // Double height and width
    }

    this.addLeftRightText(commands, left, right, encoder);

    if (doubleHeight) {
      commands.push(0x1B, 0x69, 0x00, 0x00); // Normal size
    }
    commands.push(0x1B, 0x46); // Bold off
  }

  /**
   * Add horizontal line
   */
  private addLine(commands: number[], encoder: TextEncoder) {
    commands.push(...Array.from(encoder.encode('-'.repeat(this.CHAR_WIDTH) + '\n')));
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return '€' + amount.toFixed(2).replace('.', ',');
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format time
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Singleton instance
export const receiptPrinter = new ReceiptPrinter();
