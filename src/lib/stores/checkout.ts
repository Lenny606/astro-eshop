import { persistentAtom } from '@nanostores/persistent';

export interface CheckoutData {
  name: string;
  street: string;
  city: string;
  psc: string;
  paymentMethod: 'karta' | 'prevod';
}

export const checkoutStore = persistentAtom<CheckoutData>('checkout', {
  name: '',
  street: '',
  city: '',
  psc: '',
  paymentMethod: 'karta',
}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const updateCheckoutField = (key: keyof CheckoutData, value: string) => {
  const current = checkoutStore.get();
  checkoutStore.set({
    ...current,
    [key]: value,
  });
};

export const clearCheckout = () => {
  checkoutStore.set({
    name: '',
    street: '',
    city: '',
    psc: '',
    paymentMethod: 'karta',
  });
};
