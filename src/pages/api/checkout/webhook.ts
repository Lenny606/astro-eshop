import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe';
import { orderRepository } from '../../../repositories/order.repository';
import { logger } from '../../../lib/logger';

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    logger.error('Webhook: Missing signature or webhook secret');
    return new Response(JSON.stringify({ error: 'Missing configuration' }), { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    logger.info({ type: event.type }, 'Webhook: Received Stripe event');

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      if (orderId) {
        logger.info({ orderId }, 'Webhook: Processing successful payment');
        await orderRepository.updateStatus(orderId, 'paid');
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    logger.error({ error }, 'Webhook: Error processing event');
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), { status: 400 });
  }
};
