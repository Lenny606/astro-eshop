import { db } from './index';
import { products } from './schema';
import { logger } from '../lib/logger';

async function seed() {
  logger.info('Seeding database...');
  
  const sampleProducts = [
    {
      id: 'prod_1',
      name: 'Nexus Alpha Object',
      description: 'Quantum-state physical interface for workspace optimization.',
      price: 129.00,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    },
    {
      id: 'prod_2',
      name: 'Void Sphere',
      description: 'High-density kinetic dampening module for premium environments.',
      price: 249.00,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  for (const product of sampleProducts) {
    await db.insert(products).values(product).onConflictDoUpdate({
      target: products.id,
      set: product,
    });
  }

  logger.info('Seeding completed successfully.');
}

seed().catch((err) => {
  logger.error(err, 'Seeding failed');
  process.exit(1);
});
