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
  stripeSessionId?: string;
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
      return db.transaction((tx) => {
        const orderId = crypto.randomUUID();

        // 1. Create order header
        tx.insert(orders).values({
          id: orderId,
          customerEmail: data.customerEmail,
          shippingName: data.shippingName,
          shippingStreet: data.shippingStreet,
          shippingCity: data.shippingCity,
          shippingPsc: data.shippingPsc,
          paymentMethod: data.paymentMethod,
          total: data.total,
          stripeSessionId: data.stripeSessionId,
          status: 'pending',
          createdAt: new Date(),
        }).run();

        // 2. Create order items
        const itemsToInsert = data.items.map(item => ({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        }));

        tx.insert(orderItems).values(itemsToInsert).run();

        // 3. Update stock 
        for (const item of data.items) {
          const product = tx.select().from(products)
            .where(eq(products.id, item.productId))
            .get();

          if (product) {
            const newStock = product.stock - item.quantity;
            if (newStock < 0) {
              tx.rollback();
              throw new Error(`Nedostatečné zásoby pro produkt: ${product.name}`);
            }
            
            tx.update(products)
              .set({ stock: newStock })
              .where(eq(products.id, item.productId))
              .run();
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

  async findByStripeSessionId(sessionId: string) {
    try {
      return await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.stripeSessionId, sessionId),
      });
    } catch (error) {
      logger.error({ error, sessionId }, 'OrderRepository: findByStripeSessionId failed');
      throw new DatabaseError();
    }
  }

  async updateStatus(id: string, status: 'pending' | 'paid' | 'shipped' | 'cancelled') {
    try {
      await db.update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .run();
      logger.info({ id, status }, 'OrderRepository: status updated');
    } catch (error) {
      logger.error({ error, id, status }, 'OrderRepository: updateStatus failed');
      throw new DatabaseError();
    }
  }
}

export const orderRepository = new OrderRepository();
