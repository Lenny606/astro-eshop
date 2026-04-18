import { db } from '../db';
import { eq, count } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { logger } from '../lib/logger';
import { DatabaseError } from '../lib/errors';

export abstract class BaseRepository<T extends SQLiteTable> {
  constructor(protected readonly table: T) {}

  async findAll() {
    try {
      return await db.select().from(this.table);
    } catch (error) {
      logger.error({ error, table: this.table._.name }, 'BaseRepository: findAll failed');
      throw new DatabaseError();
    }
  }

  async findById(id: string) {
    try {
      // Assuming 'id' is always the primary key name for simplicity in base class
      // In a real scenario, you'd use the actual schema metadata
      const results = await db.select().from(this.table).where(eq((this.table as any).id, id));
      return results[0] || null;
    } catch (error) {
      logger.error({ error, id, table: this.table._.name }, 'BaseRepository: findById failed');
      throw new DatabaseError();
    }
  }

  async count() {
    try {
      const results = await db.select({ value: count() }).from(this.table);
      return results[0]?.value ?? 0;
    } catch (error) {
      logger.error({ error, table: this.table._.name }, 'BaseRepository: count failed');
      throw new DatabaseError();
    }
  }

  async update(id: string, data: Partial<any>) {
    try {
      await db.update(this.table)
        .set(data)
        .where(eq((this.table as any).id, id))
        .run();
      logger.info({ id, table: this.table._.name }, 'BaseRepository: update success');
    } catch (error) {
      logger.error({ error, id, data, table: this.table._.name }, 'BaseRepository: update failed');
      throw new DatabaseError();
    }
  }
}
