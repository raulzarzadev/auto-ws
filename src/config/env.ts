import { z } from 'zod'

const envSchema = z
  .object({
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().default('demo-api-key'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
      .string()
      .default('demo.firebaseapp.com'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().default('demo-project'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
      .string()
      .default('demo-project.appspot.com'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
      .string()
      .default('000000000000'),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().default('1:000000000000:web:demo'),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().default('G-XXXXXXXXXX'),
    FIREBASE_CLIENT_EMAIL: z
      .string()
      .default('demo@demo-project.iam.gserviceaccount.com'),
    FIREBASE_PRIVATE_KEY: z.string().default('demo-private-key'),
    FIREBASE_DATABASE_URL: z
      .string()
      .default('https://demo-project.firebaseio.com'),
    STRIPE_PUBLIC_KEY: z.string().default('pk_test_123456789'),
    STRIPE_SECRET_KEY: z.string().default('sk_test_123456789'),
    STRIPE_WEBHOOK_SECRET: z.string().default('whsec_demo'),
    WHATSAPP_SESSION_COLLECTION: z.string().default('whatsappSessions')
  })
  .transform((values) => ({
    ...values,
    isProduction: process.env.NODE_ENV === 'production'
  }))

const env = envSchema.parse({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  WHATSAPP_SESSION_COLLECTION: process.env.WHATSAPP_SESSION_COLLECTION
})

export type AppEnv = typeof env

export const getEnv = () => env
