import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';

import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

// O Firebase 12 possui a implementação RN,
// mas existe um problema conhecido na resolução dos tipos.
// @ts-expect-error React Native export exists at runtime.
import { getReactNativePersistence } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

let authInstance: Auth;

try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  if (error?.code !== 'auth/already-initialized') {
    throw error;
  }

  authInstance = getAuth(firebaseApp);
}

console.log(
  '[WILD FIREBASE]',
  'app:', firebaseApp?.name,
  'auth:', !!authInstance,
  'authApp:', authInstance?.app?.name,
);


export const app = firebaseApp;
export const auth = authInstance;
export const db = getFirestore(firebaseApp);

console.log(
  '[WILD FIREBASE PROJECT]',
  firebaseApp.options.projectId,
);
