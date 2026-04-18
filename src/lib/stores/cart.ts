import { persistentAtom } from '@nanostores/persistent';
import type { Product } from '../../types';

export interface CartItem extends Product {
  quantity: number;
}

export type CartStore = Record<string, CartItem>;

export const cartStore = persistentAtom<CartStore>('cart', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const addItem = (product: Product) => {
  const cart = { ...cartStore.get() };
  const existing = cart[product.id];

  if (existing) {
    cart[product.id] = {
      ...existing,
      quantity: existing.quantity + 1,
    };
  } else {
    cart[product.id] = {
      ...product,
      quantity: 1,
    };
  }
  cartStore.set(cart);
};

export const removeItem = (productId: string) => {
  const cart = { ...cartStore.get() };
  delete cart[productId];
  cartStore.set(cart);
};

export const updateQuantity = (productId: string, quantity: number) => {
  if (quantity <= 0) {
    removeItem(productId);
    return;
  }
  
  const cart = { ...cartStore.get() };
  if (cart[productId]) {
    cart[productId] = {
      ...cart[productId],
      quantity,
    };
    cartStore.set(cart);
  }
};

export const clearCart = () => {
  cartStore.set({});
};
