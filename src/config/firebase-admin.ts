import 'server-only'

import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getEnv } from '@/config/env'

const env = getEnv()

const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

// Skip initialization during build time when credentials are not available
const shouldInitialize =
  process.env.NODE_ENV !== 'production' ||
  (env.FIREBASE_PRIVATE_KEY !== 'demo-private-key' &&
    !env.FIREBASE_PRIVATE_KEY.includes('demo'))

const app = shouldInitialize
  ? getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey
        }),
        databaseURL: env.FIREBASE_DATABASE_URL
      })
  : null

export const firebaseAdminApp = app!
export const firebaseAdminAuth = app ? getAuth(app) : (null as any)
export const firebaseAdminDb = app ? getFirestore(app) : (null as any)
