import { z } from 'zod'

interface FirebaseConfigShape {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

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
    NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
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

const rawFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
const parsedFirebaseConfig: FirebaseConfigShape | null = rawFirebaseConfig
  ? JSON.parse(rawFirebaseConfig)
  : null

const pickFirebaseValue = <K extends keyof FirebaseConfigShape>(key: K) =>
  parsedFirebaseConfig?.[key]

const env = envSchema.parse({
  NEXT_PUBLIC_FIREBASE_API_KEY:
    pickFirebaseValue('apiKey') ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    pickFirebaseValue('authDomain') ??
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    pickFirebaseValue('projectId') ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    pickFirebaseValue('storageBucket') ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    pickFirebaseValue('messagingSenderId') ??
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID:
    pickFirebaseValue('appId') ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    pickFirebaseValue('measurementId') ??
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
