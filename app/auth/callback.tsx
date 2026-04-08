import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { applyActionCode } from 'firebase/auth';

import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

type Status = 'processing' | 'error';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<Status>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      let description: string | undefined;
      try {
        const getParam = (value: string | string[] | undefined) =>
          Array.isArray(value) ? value[0] : value;

        const mode = getParam(params.mode as string | string[] | undefined);
        const oobCode = getParam(params.oobCode as string | string[] | undefined);
        const type = getParam(params.type as string | string[] | undefined);
        description = getParam(params.error_description as string | string[] | undefined);
        const normalizedType = type ? type.toLowerCase() : undefined;
        const normalizedMode = mode ? mode.toLowerCase() : undefined;

        if (normalizedMode === 'resetpassword' && oobCode) {
          Alert.alert('Redefinicao de senha', 'Link validado. Atualize sua senha.');
          router.replace({
            pathname: '/auth/reset-password',
            params: { oobCode },
          });
          return;
        }

        if (normalizedMode === 'verifyemail' && oobCode) {
          await applyActionCode(auth, oobCode);
          Alert.alert('Email confirmado', 'Sua conta foi verificada com sucesso.');
          router.replace('/auth/login');
          return;
        }

        await useAuthStore.getState().initialize();

        if (normalizedType === 'recovery') {
          router.replace('/auth/reset-password');
        } else if (auth.currentUser) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/login');
        }
      } catch (error: any) {
        console.error('Firebase auth callback error', error);
        setErrorMessage(error?.message ?? description ?? 'Falha ao concluir a autenticacao.');
        setStatus('error');
      }
    };

    completeSignIn();
  }, [params, router]);

  return (
    <View style={styles.container}>
      {status === 'processing' ? (
        <>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.message}>Concluindo autenticacao...</Text>
        </>
      ) : (
        <>
          <Text style={[styles.message, styles.error]}>Nao foi possivel autenticar</Text>
          {errorMessage ? <Text style={styles.details}>{errorMessage}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: '#111827',
  },
  error: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  details: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
  },
});
