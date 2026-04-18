import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerEmail: text('customer_email').notNull(),
  total: real('total').notNull(),
  status: text('status').notNull().default('pending'), // pending, paid, shipped, cancelled
  stripeSessionId: text('stripe_session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
});
