import { sqliteTable, text, integer, real, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// --- USERS ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID/ULID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'), // 'admin', 'user'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// --- CATEGORIES ---
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id),
});

// --- PRODUCTS ---
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  stock: integer('stock').notNull().default(0),
  image: text('image'),
  categoryId: integer('category_id').references(() => categories.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// --- ORDERS ---
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id), // Link to user if logged in
  customerEmail: text('customer_email').notNull(),
  shippingName: text('shipping_name').notNull().default(''),
  shippingStreet: text('shipping_street').notNull().default(''),
  shippingCity: text('shipping_city').notNull().default(''),
  shippingPsc: text('shipping_psc').notNull().default(''),
  paymentMethod: text('payment_method').notNull().default('karta'), // karta, prevod
  total: integer('total').notNull(),
  status: text('status').notNull().default('pending'), // pending, paid, shipped, cancelled
  stripeSessionId: text('stripe_session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// --- ORDER ITEMS ---
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
});

// --- SETTINGS ---
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
