import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { auth } from '../lib/firebase';
import { syncAuthUserProfile } from '../lib/firebaseData';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  quickSignInTestUser: () => Promise<void>;
  resendConfirmationEmail: (email: string, password: string) => Promise<void>;
}

let authUnsubscribe: (() => void) | null = null;
const TEST_LOGIN_EMAIL = 'teste@gmail.com';
const TEST_LOGIN_PASSWORD = 'teste123';

const syncProfileInBackground = (user: User) => {
  syncAuthUserProfile(user).catch((syncError) => {
    console.warn('syncAuthUserProfile', syncError);
  });
};

const toReadableAuthError = (error: any) => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Email invalido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este email ja esta em uso.';
    case 'auth/weak-password':
      return 'Senha fraca. Use pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde e tente novamente.';
    case 'auth/email-not-verified':
      return 'Email not confirmed';
    case 'auth/operation-not-allowed':
      return 'Metodo de login desativado no Firebase. Ative Email/Senha e Google Authentication no console.';
    case 'auth/account-exists-with-different-credential':
      return 'Ja existe uma conta com este email usando outro metodo de acesso.';
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado.';
    case 'auth/network-request-failed':
      return 'Falha de rede. Verifique sua conexao e tente novamente.';
    default:
      return error?.message ?? 'Falha de autenticacao.';
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      if (authUnsubscribe) {
        const currentUser = auth.currentUser;
        set({ user: currentUser, loading: false });
        if (currentUser) {
          syncProfileInBackground(currentUser);
        }
        return;
      }

      let isSettled = false;
      const settle = () => {
        isSettled = true;
      };

      const timeoutId = setTimeout(() => {
        if (isSettled) return;
        settle();
        set({ loading: false });
      }, 8000);

      authUnsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
          if (!isSettled) {
            settle();
            clearTimeout(timeoutId);
          }

          set({ user: nextUser, loading: false });

          if (nextUser) {
            syncProfileInBackground(nextUser);
          }
        },
        (error) => {
          if (!isSettled) {
            settle();
            clearTimeout(timeoutId);
          }

          set({ error: toReadableAuthError(error), loading: false });
        }
      );
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
        } catch (verificationError) {
          console.warn('sendEmailVerification', verificationError);
        }

        await firebaseSignOut(auth);
        const error = new Error('Email not confirmed');
        (error as any).code = 'auth/email-not-verified';
        throw error;
      }

      syncProfileInBackground(credential.user);

      set({ user: credential.user, loading: false });
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
      throw e;
    }
  },

  signUp: async (email, password, name) => {
    set({ error: null, loading: true });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim().length > 0) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      syncProfileInBackground(credential.user);

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn('sendEmailVerification', verificationError);
      }

      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
      throw e;
    }
  },

  signOut: async () => {
    set({ error: null, loading: true });
    try {
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
      throw e;
    }
  },

  quickSignInTestUser: async () => {
    if (!__DEV__) {
      throw new Error('Login rapido disponivel apenas em desenvolvimento.');
    }

    set({ error: null, loading: true });
    try {
      let credential: UserCredential;

      try {
        credential = await signInWithEmailAndPassword(auth, TEST_LOGIN_EMAIL, TEST_LOGIN_PASSWORD);
      } catch (signInError: any) {
        const code = signInError?.code ?? '';
        if (
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/invalid-email'
        ) {
          credential = await createUserWithEmailAndPassword(auth, TEST_LOGIN_EMAIL, TEST_LOGIN_PASSWORD);
        } else if (code === 'auth/wrong-password') {
          throw new Error(
            'A conta de teste ja existe com outra senha. Ajuste para teste123 no Firebase Authentication.'
          );
        } else {
          throw signInError;
        }
      }

      syncProfileInBackground(credential.user);
      set({ user: credential.user, loading: false });
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
      throw e;
    }
  },

  resendConfirmationEmail: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      if (credential.user.emailVerified) {
        await firebaseSignOut(auth);
        set({ user: null, loading: false });
        return;
      }

      await sendEmailVerification(credential.user);
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (e: any) {
      set({ error: toReadableAuthError(e), loading: false });
      throw e;
    }
  },
}));
