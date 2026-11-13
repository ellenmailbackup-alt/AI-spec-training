import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Fix the roast ID sequence to prevent duplicate key violations.
 *
 * This script ensures the roast_id_seq sequence is set to the correct value
 * based on the maximum ID currently in the roast table.
 *
 * Run this script if you encounter "duplicate key violation" errors when
 * adding new roasts through the UI.
 */
async function fixRoastSequence() {
  try {
    console.log('🔧 Fixing roast ID sequence...');

    // Get the current max ID from the roast table
    const maxIdResult = await db.execute(sql`SELECT MAX(id) as max_id FROM roast`);
    const maxId = (maxIdResult.rows[0] as any).max_id || 0;

    console.log(`Current max roast ID: ${maxId}`);

    // Get the current sequence value
    const currentSeqResult = await db.execute(sql`SELECT last_value FROM roast_id_seq`);
    const currentSeqValue = (currentSeqResult.rows[0] as any).last_value;

    console.log(`Current sequence value: ${currentSeqValue}`);

    // Set the sequence to max ID (with is_called=true, next value will be maxId + 1)
    await db.execute(sql`SELECT setval('roast_id_seq', ${maxId}, true)`);

    // Verify the fix
    const newSeqResult = await db.execute(sql`SELECT last_value FROM roast_id_seq`);
    const newSeqValue = (newSeqResult.rows[0] as any).last_value;

    console.log(`✅ Sequence fixed! Updated to ${newSeqValue}`);
    console.log(`Next roast will use ID: ${maxId + 1}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing roast sequence:', error);
    process.exit(1);
  }
}

fixRoastSequence();
