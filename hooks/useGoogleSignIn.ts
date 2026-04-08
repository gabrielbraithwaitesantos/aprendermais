import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';

import { auth, googleProvider } from '../lib/firebase';
import { syncAuthUserProfile } from '../lib/firebaseData';

WebBrowser.maybeCompleteAuthSession();

type ExtraConfig = {
  authRedirectUri?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
};

const legacyManifestExtra = (Constants as { manifestExtra?: unknown }).manifestExtra;
const manifestExtra = (Constants.expoConfig?.extra ?? legacyManifestExtra ?? {}) as ExtraConfig;

const normalize = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isHttpUrl = (value?: string) => Boolean(value && /^https?:\/\//i.test(value));

const getCurrentWebOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : 'origem-web-indisponivel';

const POPUP_TIMEOUT_MS = 12000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('google-popup-timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const syncProfileSafely = (user: User) => {
  syncAuthUserProfile(user).catch((syncError) => {
    console.warn('syncAuthUserProfile', syncError);
  });
};

const getWebRedirectUri = () => {
  if (typeof window === 'undefined') {
    return makeRedirectUri({ path: 'auth/callback' });
  }

  const pathName = window.location.pathname || '/';
  const hasGhPagesBase = pathName === '/aprendermais' || pathName.startsWith('/aprendermais/');
  const basePath = hasGhPagesBase ? '/aprendermais' : '';
  return `${window.location.origin}${basePath}/auth/callback`;
};

export function useGoogleSignIn() {
  const isWebAuth = Platform.OS === 'web';
  const configuredRedirect = normalize(manifestExtra.authRedirectUri);
  const redirectUri =
    isWebAuth
      ? isHttpUrl(configuredRedirect)
        ? configuredRedirect
        : getWebRedirectUri()
      : undefined;

  const webClientId = manifestExtra.googleClientId ?? process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  const androidClientId = manifestExtra.googleAndroidClientId ?? webClientId;
  const iosClientId = manifestExtra.googleIosClientId ?? webClientId;
  const resolvedClientId =
    Platform.select({
      ios: iosClientId,
      android: androidClientId,
      default: webClientId,
    }) ?? webClientId ?? androidClientId ?? iosClientId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWebAuth) return;

    let disposed = false;

    const resolveRedirectSignIn = async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (disposed || !redirectResult?.user) return;
        syncProfileSafely(redirectResult.user);
      } catch (err: any) {
        if (disposed) return;
        const code = err?.code ?? '';
        if (code === 'auth/unauthorized-domain') {
          setError(
            `Dominio nao autorizado no Firebase Auth. Adicione este dominio: ${getCurrentWebOrigin()} em Authentication > Settings > Authorized domains.`
          );
        } else if (code) {
          setError(`Falha no retorno do login Google (${code}).`);
        }
      }
    };

    resolveRedirectSignIn();

    return () => {
      disposed = true;
    };
  }, [isWebAuth]);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: resolvedClientId ?? '',
    webClientId: webClientId ?? undefined,
    androidClientId: androidClientId ?? undefined,
    iosClientId: iosClientId ?? undefined,
    redirectUri,
    scopes: ['openid', 'email', 'profile'],
    selectAccount: true,
  });

  const isReady = useMemo(
    () => (isWebAuth ? true : Boolean(request && resolvedClientId)),
    [isWebAuth, request, resolvedClientId]
  );

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isReady) {
      setError('Configuracao do Google OAuth indisponivel.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      if (isWebAuth) {
        try {
          const signInResult = await withTimeout(signInWithPopup(auth, googleProvider), POPUP_TIMEOUT_MS);
          syncProfileSafely(signInResult.user);
          return true;
        } catch (webAuthError: any) {
          const code = webAuthError?.code ?? '';
          const shouldFallbackToRedirect =
            webAuthError?.message === 'google-popup-timeout' ||
            code === 'auth/popup-blocked' ||
            code === 'auth/cancelled-popup-request';

          if (shouldFallbackToRedirect) {
            await signInWithRedirect(auth, googleProvider);
            return false;
          }

          throw webAuthError;
        }
      }

      if (!request) {
        setError('Configuracao do Google OAuth indisponivel.');
        return false;
      }

      const result = await promptAsync();
      if (result.type === 'error') {
        const code = result.params?.error ?? result.errorCode ?? 'oauth_error';
        const description = result.params?.error_description;

        if (code === 'invalid_request' || code === 'disallowed_useragent') {
          setError(
            `Google bloqueou a requisicao. redirect_uri em uso: ${redirectUri ?? 'indefinido'}. Revise client IDs e redirect URI no Google Cloud Console.`
          );
        } else {
          setError(
            description
              ? `${code}: ${description} | redirect_uri: ${redirectUri ?? 'indefinido'}`
              : `Falha no login Google (${code}). redirect_uri: ${redirectUri ?? 'indefinido'}`
          );
        }

        return false;
      }

      if (result.type !== 'success') {
        if (result.type !== 'dismiss' && result.type !== 'cancel') {
          setError('Login com Google cancelado.');
        }
        return false;
      }

      const idToken = result.params?.id_token ?? result.authentication?.idToken;
      if (!idToken) {
        setError('Nao recebemos o token do Google. Tente novamente.');
        return false;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const signInResult = await signInWithCredential(auth, credential);
      syncProfileSafely(signInResult.user);

      return true;
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/popup-blocked') {
        setError('Pop-up bloqueado pelo navegador. Libere pop-ups para continuar com Google.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Login com Google cancelado.');
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          `Dominio nao autorizado no Firebase Auth. Adicione este dominio: ${
            isWebAuth ? getCurrentWebOrigin() : 'dominio-indisponivel'
          } em Authentication > Settings > Authorized domains.`
        );
      } else {
        setError(err?.message ?? 'Falha inesperada ao entrar com Google.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady, isWebAuth, promptAsync, redirectUri, request]);

  return {
    isReady,
    loading,
    error,
    signInWithGoogle,
  };
}
