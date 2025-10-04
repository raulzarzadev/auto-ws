import 'server-only'

import Stripe from 'stripe'
import { getEnv } from '@/config/env'

const env = getEnv()

export const stripe = new Stripe(env.STRIPE_SECRET_KEY)

export const getStripePublicKey = () => env.STRIPE_PUBLIC_KEY
export const getStripeWebhookSecret = () => env.STRIPE_WEBHOOK_SECRET
