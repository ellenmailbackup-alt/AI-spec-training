import { pool } from './db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Starting POS migration...');

  try {
    const client = await pool.connect();

    try {
      // Step 1: Create sale_payment table
      console.log('Creating sale_payment table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sale_payment (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
          payment_method_id INTEGER NOT NULL REFERENCES payment_method(id),
          amount DECIMAL(10, 5) NOT NULL,
          creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
          modification_date TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ sale_payment table created');

      // Step 2: Create indexes
      console.log('Creating indexes...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sale_payment_sale_id ON sale_payment(sale_id);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sale_payment_payment_method_id ON sale_payment(payment_method_id);
      `);
      console.log('✅ Indexes created');

      // Step 3: Migrate existing data
      console.log('Migrating existing sales data...');
      const result = await client.query(`
        INSERT INTO sale_payment (sale_id, payment_method_id, amount)
        SELECT
          s.id,
          s.payment_method,
          COALESCE(SUM(sl.total_with_vat), 0)
            + COALESCE(s.shipping_cost_with_vat, 0)
            - COALESCE(s.discount_with_vat, 0) as total_amount
        FROM sale s
        LEFT JOIN salesline sl ON s.id = sl.sale_id
        WHERE s.payment_method IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM sale_payment sp WHERE sp.sale_id = s.id)
        GROUP BY s.id, s.payment_method, s.shipping_cost_with_vat, s.discount_with_vat
        RETURNING id;
      `);
      console.log(`✅ Migrated ${result.rowCount} existing sales`);

      // Step 4: Add receipt parameters
      console.log('Adding receipt parameters...');
      const params = [
        ['receipt_company_name', 'ConnectCode Coffee & Tea'],
        ['receipt_address', '[TO BE CONFIGURED]'],
        ['receipt_phone', '[TO BE CONFIGURED]'],
        ['receipt_email', '[TO BE CONFIGURED]'],
        ['receipt_vat_number', '[TO BE CONFIGURED]'],
        ['receipt_footer_text', 'Bedankt voor uw bezoek!']
      ];

      for (const [name, value] of params) {
        await client.query(`
          INSERT INTO parameter_table (parameter_name, parameter_value)
          VALUES ($1, $2)
          ON CONFLICT (parameter_name) DO NOTHING
        `, [name, value]);
      }
      console.log('✅ Receipt parameters added');

      console.log('\n✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Update receipt parameters with actual values');
      console.log('2. Verify customer ID 673 (Kruze) exists for guest sales');
      console.log('3. Set pos_item flags on products you want in POS\n');

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
