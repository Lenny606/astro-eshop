import type { InferSelectModel } from 'drizzle-orm';
import { products, categories, users, orders, orderItems, settings } from '../db/schema';

export type Product = InferSelectModel<typeof products>;
export type Category = InferSelectModel<typeof categories>;
export type User = InferSelectModel<typeof users>;
export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type Setting = InferSelectModel<typeof settings>;

export type ProductWithCategory = Product & {
  category?: Category;
};
