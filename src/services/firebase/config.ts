import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    FirebaseError,
    getApp,
    getApps,
    initializeApp,
    type FirebaseApp,
} from 'firebase/app';

import {
    getAuth,
    initializeAuth,
    type Auth,
} from 'firebase/auth';

// Firebase 12: export React Native não reconhecido
// pelas declarações TypeScript em algumas configurações.
// @ts-expect-error React Native export missing from web typings
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
};

let cachedServices: FirebaseServices | null = null;

function required(value: string | undefined, key: string): string {
    if (!value?.trim()) {
        throw new Error(`[Wild Firebase] Variável não configurada: ${key}`);
    }
    return value;
}


export function getFirebaseServices(): FirebaseServices {
    if (cachedServices) return cachedServices;

    const firebaseConfig = {
        apiKey: required(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, 'API_KEY'),
        authDomain: required(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'AUTH_DOMAIN'),
        projectId: required(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'PROJECT_ID'),
        storageBucket: required(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, 'STORAGE_BUCKET'),
        messagingSenderId: required(
            process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            'MESSAGING_SENDER_ID',
        ),
        appId: required(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, 'APP_ID'),
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    let auth: Auth;
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch (error) {
        // Fast Refresh pode executar a inicialização mais de uma vez.
        if (
            error instanceof FirebaseError &&
            error.code === 'auth/already-initialized'
        ) {
            auth = getAuth(app);
        } else {
            throw error;
        }
    }

    cachedServices = {
        app,
        auth,
        db: getFirestore(app),
    };
    return cachedServices;
}
