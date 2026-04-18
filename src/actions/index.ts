import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productRepository } from '../repositories/product.repository';
import { orderRepository } from '../repositories/order.repository';
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

  simulateOrder: defineAction({
    input: z.object({
      items: z.array(z.object({
        id: z.string(),
        quantity: z.number(),
      })),
      customer: z.object({
        email: z.string().email(),
        name: z.string(),
        street: z.string(),
        city: z.string(),
        psc: z.string(),
        paymentMethod: z.enum(['karta', 'prevod']),
      }),
    }),
    handler: async ({ items, customer }) => {
      logger.info({ items, customer }, 'Action: simulateOrder triggered');
      
      try {
        // Fetch real product data for prices
        const productIds = items.map(i => i.id);
        const productsFromDb = await Promise.all(
          productIds.map(id => productRepository.findById(id))
        );

        const orderItemsData = items.map(item => {
          const product = productsFromDb.find(p => p?.id === item.id);
          if (!product) throw new Error(`Produkt ${item.id} nebyl nalezen`);
          return {
            productId: item.id,
            quantity: item.quantity,
            price: product.price,
          };
        });

        const total = orderItemsData.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Persistent storage via Repository (includes transaction and stock update)
        const { orderId } = await orderRepository.createOrder({
          customerEmail: customer.email,
          shippingName: customer.name,
          shippingStreet: customer.street,
          shippingCity: customer.city,
          shippingPsc: customer.psc,
          paymentMethod: customer.paymentMethod as 'karta' | 'prevod',
          total,
          items: orderItemsData,
        });

        // Simulační zpoždění pro lepší UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        logger.info({ orderId }, 'Action: simulateOrder success - returning to client');
        return { 
          success: true, 
          orderId 
        };
      } catch (error) {
        logger.error({ 
          error: error instanceof Error ? { message: error.message, stack: error.stack } : error, 
          customer 
        }, 'Action: simulateOrder failed');
        throw new Error(error instanceof Error ? error.message : 'Objednávku se nepodařilo zpracovat.');
      }
    },
  }),
};
