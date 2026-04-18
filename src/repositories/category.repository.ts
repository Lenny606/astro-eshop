import { categories } from '../db/schema';
import { BaseRepository } from './base.repository';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { DatabaseError } from '../lib/errors';

export class CategoryRepository extends BaseRepository<typeof categories> {
  constructor() {
    super(categories);
  }

  async findBySlug(slug: string) {
    try {
      return await db.query.categories.findFirst({
        where: eq(categories.slug, slug),
        with: {
          subcategories: true,
          parent: true,
        },
      });
    } catch (error) {
      logger.error({ error, slug }, 'CategoryRepository: findBySlug failed');
      throw new DatabaseError();
    }
  }
}

export const categoryRepository = new CategoryRepository();
