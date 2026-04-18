import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe';
import { orderRepository } from '../../../repositories/order.repository';
import { logger } from '../../../lib/logger';

export const GET: APIRoute = async ({ url, redirect }) => {
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    logger.error('Verify payment: No session_id provided');
    return redirect('/checkout?error=missing_session');
  }

  try {
    // 1. Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId || session.client_reference_id;

    if (!orderId) {
       logger.error({ sessionId }, 'Verify payment: No orderId found in session metadata');
       return redirect('/checkout/fail?reason=no_order_id');
    }

    // 2. Check payment status
    if (session.payment_status === 'paid') {
      logger.info({ orderId, sessionId }, 'Verify payment: Payment confirmed');
      
      // Update DB
      await orderRepository.updateStatus(orderId, 'paid');
      
      // Redirect to success UI page
      return redirect(`/checkout/success?order_id=${orderId}`);
    } else {
      logger.warn({ orderId, sessionId, status: session.payment_status }, 'Verify payment: Payment not completed');
      return redirect(`/checkout/fail?order_id=${orderId}&status=${session.payment_status}`);
    }
  } catch (error) {
    logger.error({ error, sessionId }, 'Verify payment: Error processing redirect');
    return redirect('/checkout/fail?error=internal_error');
  }
};
