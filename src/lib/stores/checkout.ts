import { persistentAtom } from '@nanostores/persistent';

export interface CheckoutData {
  email: string;
  name: string;
  street: string;
  city: string;
  psc: string;
  paymentMethod: 'karta' | 'prevod';
}

export const checkoutStore = persistentAtom<CheckoutData>('checkout', {
  email: '',
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
    email: '',
    name: '',
    street: '',
    city: '',
    psc: '',
    paymentMethod: 'karta',
  });
};
