import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Fix ALL PostgreSQL sequences to prevent duplicate key violations.
 *
 * This script finds all sequences in the database and updates them to match
 * the maximum ID values in their corresponding tables.
 *
 * Run this script if you encounter "duplicate key violation" errors after
 * importing data with explicit IDs.
 */
async function fixAllSequences() {
  try {
    console.log('🔧 Fixing all PostgreSQL sequences...\n');

    // Get all sequences in the database
    const sequencesResult = await db.execute(sql`
      SELECT
        schemaname,
        sequencename,
        REPLACE(sequencename, '_id_seq', '') as table_name
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);

    const sequences = sequencesResult.rows as Array<{
      schemaname: string;
      sequencename: string;
      table_name: string;
    }>;

    console.log(`Found ${sequences.length} sequences to check:\n`);

    let fixed = 0;
    for (const seq of sequences) {
      try {
        // Get the current max ID from the table
        const maxIdResult = await db.execute(
          sql.raw(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${seq.table_name}`)
        );
        const maxId = (maxIdResult.rows[0] as any).max_id;

        // Get the current sequence value
        const currentSeqResult = await db.execute(
          sql.raw(`SELECT last_value FROM ${seq.sequencename}`)
        );
        const currentSeqValue = (currentSeqResult.rows[0] as any).last_value;

        // Only update if the sequence is behind the max ID
        if (maxId > currentSeqValue || currentSeqValue === 1) {
          await db.execute(
            sql.raw(`SELECT setval('${seq.sequencename}', ${maxId}, true)`)
          );
          console.log(`✅ ${seq.table_name.padEnd(25)} | Max ID: ${String(maxId).padStart(6)} | Seq: ${String(currentSeqValue).padStart(6)} → ${String(maxId).padStart(6)} (next: ${maxId + 1})`);
          fixed++;
        } else {
          console.log(`⏭️  ${seq.table_name.padEnd(25)} | Max ID: ${String(maxId).padStart(6)} | Seq: ${String(currentSeqValue).padStart(6)} (OK)`);
        }
      } catch (error) {
        console.log(`⚠️  ${seq.table_name.padEnd(25)} | Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n✅ Sequence fix completed! Updated ${fixed} sequences.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing sequences:', error);
    process.exit(1);
  }
}

fixAllSequences();
