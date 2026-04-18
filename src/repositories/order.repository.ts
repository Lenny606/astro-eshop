import { db } from '../db';
import { orders, orderItems, products } from '../db/schema';
import { BaseRepository } from './base.repository';
import { logger } from '../lib/logger';
import { DatabaseError } from '../lib/errors';
import { eq } from 'drizzle-orm';

export interface CreateOrderData {
  customerEmail: string;
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPsc: string;
  paymentMethod: 'karta' | 'prevod';
  total: number;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}

export class OrderRepository extends BaseRepository<typeof orders> {
  constructor() {
    super(orders);
  }

  async createOrder(data: CreateOrderData) {
    try {
      return await db.transaction(async (tx) => {
        const orderId = crypto.randomUUID();

        // 1. Create order header
        await tx.insert(orders).values({
          id: orderId,
          customerEmail: data.customerEmail,
          shippingName: data.shippingName,
          shippingStreet: data.shippingStreet,
          shippingCity: data.shippingCity,
          shippingPsc: data.shippingPsc,
          paymentMethod: data.paymentMethod,
          total: data.total,
          status: 'pending',
          createdAt: new Date(),
        });

        // 2. Create order items
        const itemsToInsert = data.items.map(item => ({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        }));

        await tx.insert(orderItems).values(itemsToInsert);

        // 3. Update stock 
        for (const item of data.items) {
          const product = await tx.query.products.findFirst({
            where: (p, { eq }) => eq(p.id, item.productId)
          });

          if (product) {
            const newStock = product.stock - item.quantity;
            if (newStock < 0) {
              tx.rollback();
              throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            // Update stock
            await tx.update(products)
              .set({ stock: newStock })
              .where(eq(products.id, item.productId));
          }
        }

        return { orderId };
      });
    } catch (error) {
      logger.error({ error, data }, 'OrderRepository: createOrder failed');
      throw new DatabaseError(error instanceof Error ? error.message : 'Failed to create order');
    }
  }

  async findWithItems(id: string) {
    try {
      return await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, id),
        with: {
        //@ts-ignore - Drizzle relations sometimes have typing lag in IDE
          items: {
            with: {
              product: true
            }
          }
        }
      });
    } catch (error) {
      logger.error({ error, id }, 'OrderRepository: findWithItems failed');
      throw new DatabaseError();
    }
  }
}

export const orderRepository = new OrderRepository();
