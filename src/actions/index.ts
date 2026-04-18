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

  initiateStripeCheckout: defineAction({
    input: z.object({
      items: z.array(z.object({
        id: z.string(),
        quantity: z.number().min(1),
      })),
      customer: z.object({
        email: z.string().email(),
        name: z.string(),
        street: z.string(),
        city: z.string(),
        psc: z.string(),
      }),
    }),
    handler: async ({ items, customer }) => {
      logger.info({ customer, itemsCount: items.length }, 'Action: initiateStripeCheckout triggered');
      
      try {
        // 1. Fetch real product data
        const productsFromDb = await Promise.all(
          items.map(item => productRepository.findById(item.id))
        );

        const lineItems = items.map(item => {
          const product = productsFromDb.find(p => p?.id === item.id);
          if (!product) throw new Error(`Produkt ${item.id} nebyl nalezen`);
          
          return {
            price_data: {
              currency: 'czk',
              product_data: {
                name: product.name,
                description: product.description,
                images: product.image ? [product.image] : [],
              },
              unit_amount: product.price, // v haléřích
            },
            quantity: item.quantity,
          };
        });

        const orderItemsData = items.map(item => {
          const product = productsFromDb.find(p => p?.id === item.id);
          return {
            productId: item.id,
            quantity: item.quantity,
            price: product!.price,
          };
        });

        const total = orderItemsData.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // 2. Create pending order in DB
        const { orderId } = await orderRepository.createOrder({
          customerEmail: customer.email,
          shippingName: customer.name,
          shippingStreet: customer.street,
          shippingCity: customer.city,
          shippingPsc: customer.psc,
          paymentMethod: 'karta',
          total,
          items: orderItemsData,
        });

        // 3. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
          line_items: lineItems,
          mode: 'payment',
          customer_email: customer.email,
          client_reference_id: orderId,
          metadata: { orderId },
          success_url: `${import.meta.env.PUBLIC_SITE_URL}/api/checkout/verify?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/checkout?step=3&error=cancelled`,
        });

        // 4. Link session ID to order (Background update, doesn't need to block redirect)
        orderRepository.update(orderId, { stripeSessionId: session.id }).catch((err: Error) => 
          logger.error({ err, orderId, sessionId: session.id }, 'Failed to link stripe session ID to order')
        );

        return { url: session.url };
      } catch (error) {
        logger.error({ error }, 'Action: initiateStripeCheckout failed');
        throw new PaymentError(error instanceof Error ? error.message : 'Stripe checkout initiation failed');
      }
    },
  }),

  simulateOrder: defineAction({
    input: z.object({
      items: z.array(z.object({
        id: z.string(),
        quantity: z.number().min(1),
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
        const productsFromDb = await Promise.all(
          items.map(id => productRepository.findById(id.id))
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

        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, orderId };
      } catch (error) {
        logger.error({ error }, 'Action: simulateOrder failed');
        throw new Error(error instanceof Error ? error.message : 'Objednávku se nepodařilo zpracovat.');
      }
    },
  }),
};
