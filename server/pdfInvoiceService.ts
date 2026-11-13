/**
 * PDF Invoice Generation Service
 *
 * Generates professional PDF invoices for sales using PDFKit.
 * Follows the Belgian invoice format with VAT breakdown.
 */

import PDFDocument from 'pdfkit';
import type { SaleWithLines } from '@shared/schema';

/**
 * Format a number with specified decimal places
 */
function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Kruze Brand Colors - Enhanced for better visual hierarchy
const KRUZE_COLORS = {
  darkBrown: '#4E3C32',      // Main headers
  taupe: '#6E625A',          // Body text
  goldBeige: '#C2B197',      // Original highlights (kept for continuity)
  accentBrown: '#C89C7B',    // Main secondary accent (labels, borders)
  metadataLabel: '#A1856B',  // Metadata labels (DATUM, FACTUURNR, etc.)
  tableHeader: '#D1A97F',    // Table header background (richer peach)
  peachBeige: '#E8BF9C',     // Light accents
  deepBrown: '#8A6959',      // Totals box
  cream: '#F9F8F5',          // Background tint
  lightCream: '#FAF9F7',     // Alternating rows (already very light)
  footerText: '#7A6E68',     // Footer text (lighter grey for quotes)
};

// Company information (can be moved to database parameters later)
const COMPANY_INFO = {
  name: 'KRUZE',
  address: 'KOFFIESTRAAT 1',
  city: '1000 BRUSSEL',
  phone: '+32 2 000 00 00',
  email: 'info@kruze.be',
  vatNumber: 'BE 0000.000.000',
  rpr: 'RPR BRUSSEL',
  bankAccount: 'BE00 0000 0000 0000',
  bankName: 'Demo Bank',
};

interface InvoiceData extends SaleWithLines {
  // All data comes from SaleWithLines
}

export class PDFInvoiceService {
  /**
   * Generates a PDF invoice for a sale
   *
   * @param sale - The sale data with all line items and customer info
   * @returns PDFDocument stream
   */
  generateInvoice(sale: InvoiceData): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    // Generate the invoice content
    this.addHeader(doc);
    this.addCustomerInfo(doc, sale);
    this.addInvoiceMetadata(doc, sale);
    this.addProductTable(doc, sale);
    this.addSummary(doc, sale);
    this.addFooter(doc);

    // Finalize the PDF
    doc.end();

    return doc;
  }

  /**
   * Adds company header and logo/branding
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    const startY = 50;

    // Add Kruze logo on the left
    try {
      doc.image('server/assets/kruze-logo.png', 50, startY, { width: 120 });
    } catch (error) {
      console.error('Logo file not found:', error);
    }

    // Company details (left side, aligned with logo) - Sans-serif in taupe
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe)
      .text(COMPANY_INFO.address, 50, startY + 60)
      .text(COMPANY_INFO.city, 50, startY + 72)
      .text(`TEL: ${COMPANY_INFO.phone}`, 50, startY + 84)
      .text(`EMAIL: ${COMPANY_INFO.email}`, 50, startY + 96);
    
    doc.fontSize(8)
      .text(`BTW: ${COMPANY_INFO.vatNumber}`, 50, startY + 108)
      .text(COMPANY_INFO.rpr, 50, startY + 120);

    // Add some spacing
    doc.moveDown(6);
  }

  /**
   * Adds customer/billing information
   */
  private addCustomerInfo(doc: PDFKit.PDFDocument, sale: InvoiceData): void {
    const startY = 110;
    const boxX = 400;
    const factuurY = 50;

    // FACTUUR title
    doc.fontSize(11)
      .font('Times-Bold')
      .fillColor(KRUZE_COLORS.darkBrown)
      .text('FACTUUR', boxX, factuurY);

    // Section title in taupe
    doc.fontSize(10)
      .font('Times-Bold')
      .fillColor(KRUZE_COLORS.taupe)
      .text('FACTUURADRES', boxX, startY);

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe);

    let customerY = startY + 18;

    // Customer company name (if B2B)
    if (sale.customer?.companyName) {
      doc.text(sale.customer.companyName, boxX, customerY);
      customerY += 12;
    }

    // Customer name
    const customerName = [sale.customer?.firstName, sale.customer?.lastName]
      .filter(Boolean)
      .join(' ');
    if (customerName) {
      doc.text(customerName, boxX, customerY);
      customerY += 12;
    }

    // Billing address
    if (sale.customer?.billingAddressStreet) {
      doc.text(sale.customer.billingAddressStreet, boxX, customerY);
      customerY += 12;
    }

    // City and postal code
    const cityLine = [
      sale.customer?.billingAddressPostalCode,
      sale.customer?.billingAddressCity,
    ]
      .filter(Boolean)
      .join('  ');
    if (cityLine) {
      doc.text(cityLine, boxX, customerY);
      customerY += 12;
    }

    // VAT number (if B2B)
    if (sale.customer?.vatNumber) {
      doc.text(sale.customer.vatNumber, boxX, customerY);
      customerY += 12;
    }
  }

  /**
   * Adds invoice metadata (date, invoice number, customer number)
   */
  private addInvoiceMetadata(doc: PDFKit.PDFDocument, sale: InvoiceData): void {
    const startY = 210;

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(KRUZE_COLORS.metadataLabel);

    // Format date as DD/MM/YYYY
    const salesDate = new Date(sale.salesDate);
    const formattedDate = `${salesDate.getDate().toString().padStart(2, '0')}/${(salesDate.getMonth() + 1).toString().padStart(2, '0')}/${salesDate.getFullYear()}`;

    doc.text(`DATUM:`, 50, startY)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe)
      .text(formattedDate, 115, startY);

    doc.font('Helvetica-Bold')
      .fillColor(KRUZE_COLORS.metadataLabel)
      .text(`FACTUURNR.:`, 200, startY)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe)
      .text(sale.invoiceNumber || '', 280, startY);

    doc.font('Helvetica-Bold')
      .fillColor(KRUZE_COLORS.metadataLabel)
      .text(`KLANTNR.:`, 380, startY)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe)
      .text(sale.customer?.id?.toString() || '', 445, startY);
  }

  /**
   * Adds product table with line items with warm Kruze colors
   */
  private addProductTable(doc: PDFKit.PDFDocument, sale: InvoiceData): void {
    const startY = 240;
    let currentY = startY;

    // Table header with richer peach/brown background
    doc.roundedRect(50, currentY, 510, 22, 3)
      .fillAndStroke(KRUZE_COLORS.tableHeader, KRUZE_COLORS.tableHeader);

    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(KRUZE_COLORS.darkBrown);

    doc.text('PRODUCT OMSCHRIJVING', 55, currentY + 7, { width: 180 });
    doc.text('EENHEIDSPRIJS', 235, currentY + 7, { width: 70, align: 'right' });
    doc.text('AANTAL', 305, currentY + 7, { width: 35, align: 'right' });
    doc.text('PRIJS EXCL BTW', 340, currentY + 7, { width: 65, align: 'right' });
    doc.text('6 % BTW', 405, currentY + 7, { width: 55, align: 'right' });
    doc.text('21 % BTW', 460, currentY + 7, { width: 55, align: 'right' });

    currentY += 22;

    // Table rows with alternating warm backgrounds
    doc.fontSize(8).font('Helvetica');

    if (sale.salesLines && sale.salesLines.length > 0) {
      sale.salesLines.forEach((line, index) => {
        const bgColor = index % 2 === 0 ? KRUZE_COLORS.lightCream : '#FFFFFF';
        doc.rect(50, currentY, 510, 18).fill(bgColor);

        // Calculate VAT amounts by rate
        const totalWithoutVat = parseFloat(line.totalWithoutVat);
        const totalWithVat = parseFloat(line.totalWithVat);
        const vatAmount = totalWithVat - totalWithoutVat;
        const vatRate = parseFloat(line.vatPercentage || '0');

        // Determine if this is 6% or 21% VAT
        const vat6Amount = Math.abs(vatRate - 0.06) < 0.001 ? vatAmount : 0;
        const vat21Amount = Math.abs(vatRate - 0.21) < 0.001 ? vatAmount : 0;

        // Use Dutch name if available, otherwise fall back to English name
        const productName = line.product.nameDutch || line.product.name;

        doc.fillColor(KRUZE_COLORS.taupe)
          .text(productName, 55, currentY + 5, { width: 175 })
          .text(this.formatCurrency(line.unitPriceWithoutVat), 235, currentY + 5, { width: 70, align: 'right' })
          .text(formatNumber(parseFloat(line.amount), 0), 305, currentY + 5, { width: 35, align: 'right' })
          .text(this.formatCurrency(line.totalWithoutVat), 340, currentY + 5, { width: 65, align: 'right' })
          .text(this.formatCurrency(vat6Amount), 405, currentY + 5, { width: 55, align: 'right' })
          .text(this.formatCurrency(vat21Amount), 460, currentY + 5, { width: 55, align: 'right' });

        currentY += 18;
      });
    }

    // Store the end of table position for summary
    doc.y = currentY + 10;
  }

  /**
   * Adds summary section with totals and VAT breakdown
   */
  private addSummary(doc: PDFKit.PDFDocument, sale: InvoiceData): void {
    const summaryX = 350;
    let currentY = doc.y + 10;

    // Calculate totals
    const productsSubtotalWithoutVat = sale.salesLines?.reduce(
      (sum, item) => sum + parseFloat(item.totalWithoutVat),
      0
    ) || 0;

    const shippingWithoutVat = sale.shippingCostWithoutVat
      ? parseFloat(sale.shippingCostWithoutVat)
      : 0;
    const shippingWithVat = sale.shippingCostWithVat
      ? parseFloat(sale.shippingCostWithVat)
      : 0;
    const discountWithoutVat = sale.discountWithoutVat
      ? parseFloat(sale.discountWithoutVat)
      : 0;
    const discountWithVat = sale.discountWithVat
      ? parseFloat(sale.discountWithVat)
      : 0;

    const subtotalWithoutVat =
      productsSubtotalWithoutVat + shippingWithoutVat - discountWithoutVat;
    const subtotalWithVat =
      sale.salesLines?.reduce((sum, item) => sum + parseFloat(item.totalWithVat), 0) || 0 +
      shippingWithVat - discountWithVat;

    // Calculate VAT by percentage
    const vatByPercentage = this.calculateVATByPercentage(sale);
    const totalVat = Object.values(vatByPercentage).reduce((sum, vat) => sum + vat, 0);

    // Summary box with warm colors
    doc.fontSize(9).font('Helvetica');

    // Draw summary table
    const summaryData = [
      { label: 'TOTAAL EXCL BTW', value: subtotalWithoutVat, bold: false },
      { label: 'VERZENDING EXCL BTW', value: shippingWithoutVat, bold: false },
      { label: 'KORTING', value: discountWithoutVat, bold: false },
    ];

    // Add VAT rows
    Object.keys(vatByPercentage)
      .sort((a, b) => parseFloat(b) - parseFloat(a))
      .forEach((percentage) => {
        const vatPercent = parseFloat(percentage) * 100;
        summaryData.push({
          label: `BTW ${Math.round(vatPercent)} %`,
          value: vatByPercentage[percentage],
          bold: false,
        });
      });

    summaryData.push(
      { label: 'TOTALE BTW', value: totalVat, bold: false },
      { label: 'TOTAAL BTW INCL', value: subtotalWithVat, bold: true }
    );

    summaryData.forEach((row, index) => {
      const isLast = index === summaryData.length - 1;
      const rowHeight = isLast ? 28 : 18;

      if (isLast) {
        // Grand total in warm deep brown box
        doc.roundedRect(summaryX, currentY, 195, rowHeight, 3)
          .fillAndStroke(KRUZE_COLORS.deepBrown, KRUZE_COLORS.deepBrown);
        doc.fillColor('#FFFFFF');
      }

      const font = row.bold || isLast ? 'Helvetica-Bold' : 'Helvetica';
      const fontSize = isLast ? 12 : 9;

      doc.fontSize(fontSize).font(font);
      
      if (!isLast) {
        doc.fillColor(KRUZE_COLORS.taupe);
      }
      
      doc.text(row.label, summaryX + 5, currentY + (isLast ? 8 : 5), { width: 120 });
      doc.text(
        this.formatCurrency(row.value),
        summaryX + 125,
        currentY + (isLast ? 8 : 5),
        { width: 65, align: 'right' }
      );

      currentY += rowHeight;
    });
  }

  /**
   * Adds footer with warm, friendly payment terms and gratitude
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 700;

    // Add a soft horizontal line above footer
    doc.moveTo(50, footerY - 10)
      .lineTo(545, footerY - 10)
      .strokeColor(KRUZE_COLORS.peachBeige)
      .stroke();

    // Warm, friendly payment terms
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor(KRUZE_COLORS.taupe)
      .text(
        'Gelieve het totaalbedrag binnen 15 dagen te voldoen.',
        50,
        footerY,
        { align: 'center' }
      )
      .text(
        'Heb je vragen? We helpen je graag.',
        50,
        footerY + 14,
        { align: 'center' }
      );

    // Bank details in soft brown
    doc.fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(KRUZE_COLORS.accentBrown)
      .text(
        `${COMPANY_INFO.bankName}: ${COMPANY_INFO.bankAccount}`,
        50,
        footerY + 38,
        { align: 'center' }
      );

    // Warm gratitude message in serif font with lighter grey
    doc.fontSize(10)
      .font('Times-Italic')
      .fillColor(KRUZE_COLORS.footerText)
      .text(
        'Dankjewel voor je vertrouwen in Kruze.',
        50,
        footerY + 60,
        { align: 'center' }
      )
      .text(
        'Tot snel — voor nog meer smaakmomenten.',
        50,
        footerY + 75,
        { align: 'center' }
      );
  }

  /**
   * Calculate VAT amounts grouped by percentage
   */
  private calculateVATByPercentage(sale: InvoiceData): Record<string, number> {
    const vatByPercentage: Record<string, number> = {};

    // Calculate product VAT
    sale.salesLines?.forEach((line) => {
      const vatPercentage = line.vatPercentage || '0';
      const vatAmount =
        parseFloat(line.totalWithVat) - parseFloat(line.totalWithoutVat);

      if (!vatByPercentage[vatPercentage]) {
        vatByPercentage[vatPercentage] = 0;
      }
      vatByPercentage[vatPercentage] += vatAmount;
    });

    // Calculate shipping VAT
    const shippingWithoutVat = sale.shippingCostWithoutVat
      ? parseFloat(sale.shippingCostWithoutVat)
      : 0;
    const shippingWithVat = sale.shippingCostWithVat
      ? parseFloat(sale.shippingCostWithVat)
      : 0;
    const shippingVat = shippingWithVat - shippingWithoutVat;

    if (shippingVat > 0.01) {
      const shippingRate = (shippingVat / shippingWithoutVat);
      // Round to nearest standard rate
      const standardRate = this.roundToStandardVATRate(shippingRate);
      const rateKey = standardRate.toString();

      if (!vatByPercentage[rateKey]) {
        vatByPercentage[rateKey] = 0;
      }
      vatByPercentage[rateKey] += shippingVat;
    }

    // Subtract discount VAT proportionally
    const discountWithoutVat = sale.discountWithoutVat
      ? parseFloat(sale.discountWithoutVat)
      : 0;
    const discountWithVat = sale.discountWithVat
      ? parseFloat(sale.discountWithVat)
      : 0;
    const discountVat = discountWithVat - discountWithoutVat;

    if (discountVat > 0.01) {
      const totalVat = Object.values(vatByPercentage).reduce((sum, v) => sum + v, 0);
      Object.keys(vatByPercentage).forEach((rate) => {
        const proportion = vatByPercentage[rate] / totalVat;
        vatByPercentage[rate] -= discountVat * proportion;
      });
    }

    return vatByPercentage;
  }

  /**
   * Rounds a VAT rate to the nearest standard Belgian VAT rate
   */
  private roundToStandardVATRate(rate: number): number {
    const standardRates = [0, 0.06, 0.12, 0.21];
    return standardRates.reduce((prev, curr) =>
      Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
    );
  }

  /**
   * Formats a number as currency (EUR)
   */
  private formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  }
}

export const pdfInvoiceService = new PDFInvoiceService();
