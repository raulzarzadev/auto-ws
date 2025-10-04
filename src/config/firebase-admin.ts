import 'server-only'

import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getEnv } from '@/config/env'

const env = getEnv()

const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey
        }),
        databaseURL: env.FIREBASE_DATABASE_URL
      })

export const firebaseAdminApp = app
export const firebaseAdminAuth = getAuth(app)
export const firebaseAdminDb = getFirestore(app)
