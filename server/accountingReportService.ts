import * as XLSX from 'xlsx';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { parameterService } from './parameterService';

// Format a YYYY-MM-DD (or ISO datetime) string as DD/MM/YYYY
function formatDate(dateStr: string): string {
  const dateOnly = String(dateStr).split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(dateStr);
}

// Return 1-4 for the quarter of a date string (YYYY-MM-DD or ISO)
function getQuarter(dateStr: string): number {
  const month = parseInt(String(dateStr).split('T')[0].split('-')[1], 10);
  return Math.ceil(month / 3);
}

// Extract the date-only part (YYYY-MM-DD) from a date string
function dateKey(dateStr: string): string {
  return String(dateStr).split('T')[0];
}

// Apply currency number format to given column indices for all data rows of a worksheet
function applyCurrencyFormat(ws: XLSX.WorkSheet, colIndices: number[]): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    for (const C of colIndices) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cellRef]) {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '#,##0.00';
      }
    }
  }
}

class AccountingReportService {

  // ─── Report 1: Boeren en Buren ──────────────────────────────────────────────

  async generateBoerenBurenReport(year: number): Promise<Buffer> {
    const result = await db.execute(sql`
      SELECT
        s.sales_date,
        c.first_name || ' ' || c.last_name AS customer_name,
        SUM(
          COALESCE(lines.line_total_without_vat, 0)
          + s.shipping_cost_without_vat
          - s.discount_without_vat
        ) AS total_without_vat,
        SUM(
          COALESCE(lines.line_total_with_vat, 0)
          + s.shipping_cost_with_vat
          - s.discount_with_vat
        ) AS total_with_vat
      FROM sale s
      JOIN customer c ON s.customer_id = c.id
      LEFT JOIN (
        SELECT sale_id,
          SUM(total_without_vat) AS line_total_without_vat,
          SUM(total_with_vat)    AS line_total_with_vat
        FROM salesline
        GROUP BY sale_id
      ) lines ON s.id = lines.sale_id
      WHERE LOWER(c.last_name) LIKE '%buurderij%'
        AND s.webshop_sale = false
        AND EXTRACT(YEAR FROM s.sales_date) = ${year}
      GROUP BY s.sales_date, c.id, c.first_name, c.last_name,
               s.shipping_cost_without_vat, s.discount_without_vat,
               s.shipping_cost_with_vat,    s.discount_with_vat
      ORDER BY s.sales_date, customer_name
    `);

    const allRows = result.rows as Array<{
      sales_date: string;
      customer_name: string;
      total_without_vat: string;
      total_with_vat: string;
    }>;

    const wb = XLSX.utils.book_new();

    for (let q = 1; q <= 4; q++) {
      const quarterRows = allRows.filter(r => getQuarter(r.sales_date) === q);

      const header = ['Date', 'Customer', 'Total excl. VAT', 'Total incl. VAT', 'VAT'];
      const aoa: (string | number)[][] = [header];

      // Group by date
      const byDate = new Map<string, typeof quarterRows>();
      for (const row of quarterRows) {
        const key = dateKey(row.sales_date);
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key)!.push(row);
      }

      let qExcl = 0;
      let qIncl = 0;

      for (const [date, dayRows] of byDate) {
        let dayExcl = 0;
        let dayIncl = 0;
        for (const r of dayRows) {
          const excl = parseFloat(Number(r.total_without_vat ?? 0).toFixed(2));
          const incl = parseFloat(Number(r.total_with_vat ?? 0).toFixed(2));
          const vat = parseFloat((incl - excl).toFixed(2));
          dayExcl += excl;
          dayIncl += incl;
          aoa.push([formatDate(date), String(r.customer_name ?? ''), excl, incl, vat]);
        }
        const dayVat = parseFloat((dayIncl - dayExcl).toFixed(2));
        aoa.push([
          `Subtotal ${formatDate(date)}`, '',
          parseFloat(dayExcl.toFixed(2)),
          parseFloat(dayIncl.toFixed(2)),
          dayVat,
        ]);
        qExcl += dayExcl;
        qIncl += dayIncl;
      }

      const qVat = parseFloat((qIncl - qExcl).toFixed(2));
      aoa.push([
        `Q${q} TOTAL`, '',
        parseFloat(qExcl.toFixed(2)),
        parseFloat(qIncl.toFixed(2)),
        qVat,
      ]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
      applyCurrencyFormat(ws, [2, 3, 4]);
      XLSX.utils.book_append_sheet(wb, ws, `Q${q}`);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  // ─── Report 2: B2C Sales ─────────────────────────────────────────────────────
  // One row per (sale × VAT rate group). Discount and shipping are distributed
  // proportionally to each VAT group based on its share of the sale line totals.
  // Subtotals are inserted for each (date, payment method, VAT rate) group.

  async generateB2CSalesReport(year: number): Promise<Buffer> {
    const result = await db.execute(sql`
      SELECT
        COALESCE(s.invoice_number, '0')          AS invoice_number,
        s.sales_date,
        pm.payment_method,
        COALESCE(c.company_name, '')             AS company_name,
        c.first_name,
        c.last_name,
        vc.percentage                            AS vat_percentage,
        SUM(sl.total_without_vat)                AS group_excl,
        SUM(sl.total_with_vat)                   AS group_incl,
        s.discount_without_vat,
        s.discount_with_vat,
        s.shipping_cost_with_vat,
        s.shipping_cost_without_vat,
        st.sale_total_excl
      FROM sale s
      JOIN customer c ON s.customer_id = c.id
      JOIN payment_method pm ON s.payment_method = pm.id
      JOIN salesline sl ON sl.sale_id = s.id
      JOIN product p ON sl.product_id = p.id
      JOIN vat_class vc ON p.vat_class_id = vc.id
      JOIN (
        SELECT sale_id, SUM(total_without_vat) AS sale_total_excl
        FROM salesline
        GROUP BY sale_id
      ) st ON st.sale_id = s.id
      WHERE c.b2b_client = false
        AND s.webshop_sale = false
        AND LOWER(c.last_name) NOT LIKE '%buurderij%'
        AND EXTRACT(YEAR FROM s.sales_date) = ${year}
      GROUP BY
        s.id, s.invoice_number, s.sales_date,
        pm.id, pm.payment_method,
        c.id, c.company_name, c.first_name, c.last_name,
        vc.id, vc.percentage,
        s.discount_without_vat, s.discount_with_vat,
        s.shipping_cost_with_vat, s.shipping_cost_without_vat,
        st.sale_total_excl
      ORDER BY s.sales_date, pm.payment_method, vc.percentage, s.id
    `);

    type B2CRow = {
      invoice_number: string;
      sales_date: string;
      payment_method: string;
      company_name: string;
      first_name: string;
      last_name: string;
      vat_percentage: string;
      group_excl: string;
      group_incl: string;
      discount_without_vat: string;
      discount_with_vat: string;
      shipping_cost_with_vat: string;
      shipping_cost_without_vat: string;
      sale_total_excl: string;
    };

    const allRows = result.rows as B2CRow[];

    // Column headers matching the original report names (A–R, columns C/D hidden)
    const header = [
      'INVOICE_NUM',                    // A  (0)
      'SALES_DATE',                     // B  (1)
      '',                               // C  (2) – hidden
      '',                               // D  (3) – hidden
      'PAYMENT_METHOD',                 // E  (4)
      'CUSTOMER_COMPANY_NAME',          // F  (5)
      'CUSTOMER_FIRSTNAME',             // G  (6)
      'CUSTOMER_LASTNAME',              // H  (7)
      'SALESLINE_LINETOTAL_WITHOUT_VAT',// I  (8)
      'SALESLINE_LINETOTAL_WITH_VAT',   // J  (9)
      'CT_VAT_PERCENTAGE',              // K  (10)
      'DISCOUNT_WITHOUT_VAT',           // L  (11)
      'DISCOUNT_WITH_VAT',              // M  (12)
      'SHIPPING_COST_WITH_VAT',         // N  (13) – WITH first (matches original)
      'SHIPPING_COST_WITHOUT_VAT',      // O  (14)
      'Total without VAT',              // P  (15)
      'Total with VAT',                 // Q  (16)
      'VAT',                            // R  (17)
    ];

    const wb = XLSX.utils.book_new();

    for (let q = 1; q <= 4; q++) {
      const quarterRows = allRows.filter(r => getQuarter(r.sales_date) === q);

      const aoa: (string | number)[][] = [header];
      // Track which 0-indexed aoa rows are subtotals (for bold styling)
      const boldRows: number[] = [];

      // Group by (date, payment_method, vat_percentage) — Map preserves insertion order
      type GroupMeta = { date: string; payment: string; vatPct: number; rows: B2CRow[] };
      const groups = new Map<string, GroupMeta>();
      for (const row of quarterRows) {
        const d = dateKey(row.sales_date);
        const v = parseFloat(row.vat_percentage || '0');
        const key = `${d}|${row.payment_method}|${v.toFixed(2)}`;
        if (!groups.has(key)) groups.set(key, { date: d, payment: row.payment_method, vatPct: v, rows: [] });
        groups.get(key)!.rows.push(row);
      }

      let qNetExcl = 0;
      let qNetIncl = 0;

      for (const g of groups.values()) {
        let groupNetExcl = 0;
        let groupNetIncl = 0;

        for (const r of g.rows) {
          const groupExcl    = parseFloat(r.group_excl || '0');
          const groupIncl    = parseFloat(r.group_incl || '0');
          const saleTotal    = parseFloat(r.sale_total_excl || '0');
          const saleDiscExcl = parseFloat(r.discount_without_vat || '0');
          const saleDiscIncl = parseFloat(r.discount_with_vat || '0');
          const saleShipIncl = parseFloat(r.shipping_cost_with_vat || '0');   // N
          const saleShipExcl = parseFloat(r.shipping_cost_without_vat || '0'); // O

          // Proportional share of this VAT group within the sale
          const prop = saleTotal > 0 ? groupExcl / saleTotal : 1;

          const discExcl = saleDiscExcl * prop;
          const discIncl = saleDiscIncl * prop;
          const shipIncl = saleShipIncl * prop;
          const shipExcl = saleShipExcl * prop;

          // P = I + O − L  |  Q = J + N − M
          const totalExcl = parseFloat((groupExcl + shipExcl - discExcl).toFixed(2));
          const totalIncl = parseFloat((groupIncl + shipIncl - discIncl).toFixed(2));
          const vatAmt    = parseFloat((totalIncl - totalExcl).toFixed(2));

          aoa.push([
            r.invoice_number || '0',           // A
            formatDate(r.sales_date),           // B
            '', '',                             // C, D (hidden)
            r.payment_method,                  // E
            r.company_name || '',              // F
            r.first_name || '',                // G
            r.last_name || '',                 // H
            groupExcl,                         // I (raw precision)
            groupIncl,                         // J (raw precision)
            g.vatPct / 100,                    // K (stored as decimal → formatted as %)
            parseFloat(discExcl.toFixed(5)),   // L
            parseFloat(discIncl.toFixed(5)),   // M
            parseFloat(shipIncl.toFixed(5)),   // N
            parseFloat(shipExcl.toFixed(5)),   // O
            totalExcl,                         // P
            totalIncl,                         // Q
            vatAmt,                            // R
          ]);

          groupNetExcl += totalExcl;
          groupNetIncl += totalIncl;
        }

        // Subtotal row for this (date, payment, VAT%) group
        const groupVat = parseFloat((groupNetIncl - groupNetExcl).toFixed(2));
        aoa.push([
          '',                                        // A
          formatDate(g.date),                        // B
          '', '',                                    // C, D
          g.payment,                                 // E
          '', '', '',                                // F, G, H
          '', '',                                    // I, J
          g.vatPct / 100,                            // K
          '', '', '', '',                            // L, M, N, O
          parseFloat(groupNetExcl.toFixed(2)),       // P
          parseFloat(groupNetIncl.toFixed(2)),       // Q
          parseFloat(groupVat.toFixed(2)),           // R
        ]);
        boldRows.push(aoa.length - 1);

        qNetExcl += groupNetExcl;
        qNetIncl += groupNetIncl;
      }

      // Quarter total row (also bold)
      const qVat = parseFloat((qNetIncl - qNetExcl).toFixed(2));
      aoa.push([
        `Q${q} TOTAL`, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        parseFloat(qNetExcl.toFixed(2)),
        parseFloat(qNetIncl.toFixed(2)),
        qVat,
      ]);
      boldRows.push(aoa.length - 1);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Number formats
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = 1; R <= range.e.r; R++) {
        // Raw line totals (I, J) — preserve database precision
        for (const C of [8, 9]) {
          const ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[ref]?.t === 'n') ws[ref].z = '#,##0.00000';
        }
        // Discount / shipping (L, M, N, O) — same
        for (const C of [11, 12, 13, 14]) {
          const ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[ref]?.t === 'n') ws[ref].z = '#,##0.00000';
        }
        // Computed totals (P, Q, R) — 2 decimals
        for (const C of [15, 16, 17]) {
          const ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[ref]?.t === 'n') ws[ref].z = '#,##0.00';
        }
        // VAT % (K) — percentage
        const kRef = XLSX.utils.encode_cell({ r: R, c: 10 });
        if (ws[kRef]?.t === 'n') ws[kRef].z = '0.00%';
      }

      // Bold styling for subtotal and total rows
      for (const rowIdx of boldRows) {
        for (let C = 0; C <= 17; C++) {
          const ref = XLSX.utils.encode_cell({ r: rowIdx, c: C });
          if (!ws[ref]) ws[ref] = { v: '', t: 's' };
          ws[ref].s = { font: { bold: true } };
        }
      }

      ws['!cols'] = [
        { wch: 12 },      // A invoice
        { wch: 14 },      // B date
        { hidden: true }, // C
        { hidden: true }, // D
        { wch: 18 },      // E payment method
        { wch: 20 },      // F company
        { wch: 14 },      // G first name
        { wch: 16 },      // H last name
        { wch: 20 },      // I line total excl
        { wch: 20 },      // J line total incl
        { wch: 10 },      // K vat %
        { wch: 16 },      // L discount excl
        { wch: 16 },      // M discount incl
        { wch: 16 },      // N shipping incl
        { wch: 16 },      // O shipping excl
        { wch: 16 },      // P total excl
        { wch: 16 },      // Q total incl
        { wch: 12 },      // R vat
      ];

      XLSX.utils.book_append_sheet(wb, ws, `Q${q}`);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true }) as Buffer;
  }

  // ─── Report 3: Kasboek (Cash Ledger) ─────────────────────────────────────────

  async generateCashPaymentsReport(year: number): Promise<Buffer> {
    // Beginning cash balance for this year, stored as parameter kas_beginsaldo_{year}
    const beginBalanceStr = await parameterService.getParameter(`kas_beginsaldo_${year}`) || '0';
    const beginBalance = parseFloat(beginBalanceStr) || 0;

    // Fixed kasboek account values
    const GROOTBOEK = '570000';
    const KAS_NAAM  = "Tripl'A Kas";
    const TEGENREKE = '400000';
    const OMSCHRIJV = 'koffie & thee';

    const result = await db.execute(sql`
      SELECT
        s.sales_date,
        CASE
          WHEN c.b2b_client = true AND c.company_name IS NOT NULL AND c.company_name != ''
            THEN c.company_name
          ELSE c.first_name || ' ' || c.last_name
        END AS customer_name,
        sp.amount AS cash_amount
      FROM sale_payment sp
      JOIN sale s     ON sp.sale_id          = s.id
      JOIN customer c ON s.customer_id       = c.id
      JOIN payment_method pm ON sp.payment_method_id = pm.id
      WHERE LOWER(pm.payment_method) = 'cash'
        AND EXTRACT(YEAR FROM s.sales_date) = ${year}
      ORDER BY s.sales_date, s.id
    `);

    const allRows = result.rows as Array<{
      sales_date: string;
      customer_name: string;
      cash_amount: string;
    }>;

    // Sum per quarter so we can derive the starting balance for Q2/Q3/Q4
    const quarterSums: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const row of allRows) {
      quarterSums[getQuarter(row.sales_date)] += parseFloat(Number(row.cash_amount ?? 0).toFixed(2));
    }
    const qStartBalance: Record<number, number> = {
      1: beginBalance,
      2: parseFloat((beginBalance + quarterSums[1]).toFixed(2)),
      3: parseFloat((beginBalance + quarterSums[1] + quarterSums[2]).toFixed(2)),
      4: parseFloat((beginBalance + quarterSums[1] + quarterSums[2] + quarterSums[3]).toFixed(2)),
    };

    const wb = XLSX.utils.book_new();
    const header = [
      'Grootboek', 'Kas omsc', 'Transactie', 'Tegenreke',
      'Naam tege', 'Datum tra', 'Omschrijv', 'Bedrag', 'Saldo kas',
    ];

    // First day of each quarter in DD/MM/YYYY
    const quarterFirstDay = (q: number): string => {
      const months = ['01', '04', '07', '10'];
      return `01/${months[q - 1]}/${year}`;
    };

    for (let q = 1; q <= 4; q++) {
      const quarterRows = allRows.filter(r => getQuarter(r.sales_date) === q);
      const aoa: (string | number)[][] = [header];

      const startBalance = qStartBalance[q];
      const beginsaldoLabel = q === 1 ? `Beginsaldo ${year}` : `Beginsaldo Q${q} ${year}`;

      // Opening balance row (no Bedrag — it is a balance carry-over, not a payment)
      aoa.push([GROOTBOEK, KAS_NAAM, '', '', '', quarterFirstDay(q), beginsaldoLabel, '', startBalance]);

      let runningBalance = startBalance;
      for (const r of quarterRows) {
        const amount = parseFloat(Number(r.cash_amount ?? 0).toFixed(2));
        runningBalance = parseFloat((runningBalance + amount).toFixed(2));
        aoa.push([
          GROOTBOEK, KAS_NAAM, '', TEGENREKE,
          String(r.customer_name ?? ''),
          formatDate(dateKey(r.sales_date)),
          OMSCHRIJV,
          amount,
          runningBalance,
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 25 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
      ];
      applyCurrencyFormat(ws, [7, 8]);
      XLSX.utils.book_append_sheet(wb, ws, `Q${q}`);
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const accountingReportService = new AccountingReportService();
