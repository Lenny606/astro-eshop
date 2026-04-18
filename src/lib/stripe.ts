import Stripe from 'stripe';

if (!import.meta.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined in environment variables.');
}

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-01-27-ac', // Use latest or pinned version
  typescript: true,
});
