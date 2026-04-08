import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

type ExtraConfig = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
};

const extra = (Constants.expoConfig?.extra ??
  // @ts-ignore legacy manifest support
  Constants.manifestExtra ??
  {}) as ExtraConfig;

const normalize = (value?: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
};

const env = (key: string) =>
  normalize(
    (typeof process !== 'undefined' ? process.env?.[key] : undefined) ??
      (typeof globalThis !== 'undefined' ? (globalThis as any)[key] : undefined)
  );

const projectId =
  normalize(extra.firebaseProjectId) ?? env('EXPO_PUBLIC_FIREBASE_PROJECT_ID') ?? 'aprendermais-e9e08';

const firebaseConfig = {
  apiKey:
    normalize(extra.firebaseApiKey) ??
    env('EXPO_PUBLIC_FIREBASE_API_KEY') ??
    'missing-firebase-api-key',
  authDomain:
    normalize(extra.firebaseAuthDomain) ??
    env('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') ??
    `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    normalize(extra.firebaseStorageBucket) ??
    env('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') ??
    `${projectId}.appspot.com`,
  messagingSenderId:
    normalize(extra.firebaseMessagingSenderId) ??
    env('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ??
    '000000000000',
  appId:
    normalize(extra.firebaseAppId) ??
    env('EXPO_PUBLIC_FIREBASE_APP_ID') ??
    '1:000000000000:web:local-dev',
};

const missingConfig =
  firebaseConfig.apiKey === 'missing-firebase-api-key' ||
  firebaseConfig.appId === '1:000000000000:web:local-dev';

if (missingConfig) {
  console.warn(
    '[firebase] Configuracao incompleta. Defina EXPO_PUBLIC_FIREBASE_API_KEY e EXPO_PUBLIC_FIREBASE_APP_ID para habilitar producao.'
  );
}

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app);
  } catch {
    auth = getAuth(app);
  }
}

let db: Firestore;
try {
  db =
    Platform.OS === 'web'
      ? getFirestore(app)
      : initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
} catch {
  db = getFirestore(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app as firebaseApp, auth, db, googleProvider };
