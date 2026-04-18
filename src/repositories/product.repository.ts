import { products } from '../db/schema';
import { BaseRepository } from './base.repository';
import { db } from '../db';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { DatabaseError } from '../lib/errors';

export class ProductRepository extends BaseRepository<typeof products> {
  constructor() {
    super(products);
  }

  async findInStock() {
    try {
      return await db.select().from(this.table).where(gte(this.table.stock, 1));
    } catch (error) {
      logger.error({ error }, 'ProductRepository: findInStock failed');
      throw new DatabaseError();
    }
  }

  async updateStock(id: string, delta: number) {
    try {
      const product = await this.findById(id);
      if (!product) return null;

      const newStock = product.stock + delta;
      if (newStock < 0) throw new Error('Insufficient stock');

      return await db.update(this.table)
        .set({ stock: newStock })
        .where(eq(this.table.id, id))
        .returning();
    } catch (error) {
      logger.error({ error, id, delta }, 'ProductRepository: updateStock failed');
      throw new DatabaseError(error instanceof Error ? error.message : 'Stock update failed');
    }
  }
}

export const productRepository = new ProductRepository();
