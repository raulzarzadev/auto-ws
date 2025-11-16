import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    }

// Skip initialization during build time when credentials are not available
const shouldInitialize =
  typeof window !== 'undefined' || // Browser environment
  (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && // Has API key
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key' && // Not demo
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('demo')) // Not demo variant

const firebaseApp: FirebaseApp | null = shouldInitialize
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseAuth = firebaseApp
  ? getAuth(firebaseApp)
  : (null as unknown as Auth)
export const firestore = firebaseApp
  ? getFirestore(firebaseApp)
  : (null as unknown as Firestore)
export { firebaseApp }
