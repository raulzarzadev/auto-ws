import 'server-only'

import { getEnv } from '@/config/env'
import { stripe } from '@/config/stripe'

interface CreateCheckoutSessionInput {
  priceId: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
}

export const stripeService = {
  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    const env = getEnv()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: input.customerEmail,
      line_items: [
        {
          price: input.priceId,
          quantity: 1
        }
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        project: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    })
    return session
  },
  async listPrices() {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    })
    return prices.data
  }
}
