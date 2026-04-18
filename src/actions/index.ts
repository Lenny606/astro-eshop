import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productRepository } from '../repositories/product.repository';
import { stripe } from '../lib/stripe';
import { logger } from '../lib/logger';
import { PaymentError } from '../lib/errors';

export const server = {
  getProducts: defineAction({
    handler: async () => {
      logger.info('Action: getProducts triggered');
      return await productRepository.findAll();
    },
  }),

  createCheckoutSession: defineAction({
    input: z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    }),
    handler: async ({ productId, quantity }) => {
      logger.info({ productId, quantity }, 'Action: createCheckoutSession triggered');
      
      const product = await productRepository.findById(productId);
      if (!product) throw new Error('Product not found');

      try {
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                  description: product.description,
                  images: product.image ? [product.image] : [],
                },
                unit_amount: Math.round(product.price * 100),
              },
              quantity: quantity,
            },
          ],
          mode: 'payment',
          success_url: `${import.meta.env.PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/cancel`,
        });

        return { url: session.url };
      } catch (error) {
        logger.error({ error, productId }, 'Action: createCheckoutSession failed');
        throw new PaymentError(error instanceof Error ? error.message : 'Stripe session creation failed');
      }
    },
  }),
};
