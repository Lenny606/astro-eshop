import { db } from './index';
import { products, categories } from './schema';
import { logger } from '../lib/logger';
import categoriesData from '../data/categories.json';
import productsData from '../data/products.json';

async function seed() {
  logger.info('Seeding database...');
  
  // Seed Categories
  logger.info('Inserting categories...');
  for (const category of categoriesData) {
    await db.insert(categories).values(category).onConflictDoUpdate({
      target: categories.id,
      set: category,
    });
  }

  // Seed Products
  logger.info('Inserting products...');
  for (const product of productsData) {
    await db.insert(products).values(product as any).onConflictDoUpdate({
      target: products.id,
      set: product as any,
    });
  }

  logger.info('Seeding completed successfully.');
}

seed().catch((err) => {
  logger.error(err, 'Seeding failed');
  process.exit(1);
});
