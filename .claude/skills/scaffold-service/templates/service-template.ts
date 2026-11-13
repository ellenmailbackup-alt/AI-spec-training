import { db } from './db';
import { eq } from 'drizzle-orm';
import { tableName, type InsertTableName, type TableName } from '@shared/schema';

export class NameService {
  // Simple reads can delegate to storage
  async getById(id: number): Promise<TableName | undefined> {
    const [result] = await db.select()
      .from(tableName)
      .where(eq(tableName.id, id));
    return result;
  }

  async getAll(): Promise<TableName[]> {
    return await db.select().from(tableName);
  }

  // Business logic with transactions
  async create(data: InsertTableName): Promise<TableName> {
    return await db.transaction(async (tx) => {
      // 1. Validate business rules
      // 2. Create main record
      const [record] = await tx.insert(tableName)
        .values(data)
        .returning();

      // 3. Create related records (stock movements, etc.)
      // 4. Return result
      return record;
    });
  }

  async update(id: number, data: Partial<InsertTableName>): Promise<TableName> {
    return await db.transaction(async (tx) => {
      // 1. Verify record exists
      const [existing] = await tx.select()
        .from(tableName)
        .where(eq(tableName.id, id));

      if (!existing) {
        throw new Error(`${tableName} with ID ${id} not found`);
      }

      // 2. Apply business rules
      // 3. Update record
      const [updated] = await tx.update(tableName)
        .set(data)
        .where(eq(tableName.id, id))
        .returning();

      return updated;
    });
  }

  async delete(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // 1. Verify record exists and can be deleted
      // 2. Clean up related records (stock movements, etc.)
      // 3. Delete main record
      const result = await tx.delete(tableName)
        .where(eq(tableName.id, id));

      return (result.rowCount ?? 0) > 0;
    });
  }
}

// Singleton export
export const nameService = new NameService();
