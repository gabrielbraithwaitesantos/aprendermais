import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import WebWebView from 'react-native-web-webview';
import WebView from 'react-native-webview';
import { useThemeColors, useThemeStore } from '../../../../store/themeStore';
import { LEGAL_NOTICE } from '../../../../lib/legal';
import { supabase } from '../../../../lib/supabase';
import { OFFICIAL_RESOURCES } from '../../../../data/officialResources';

type ResourceRow = {
  id: string;
  title: string | null;
  description: string | null;
  resource_url: string | null;
  kind: string;
  track?: {
    title: string;
  } | null;
};

const GOOGLE_VIEWER = 'https://docs.google.com/gview?embedded=1&url=';
const BROKEN_URLS: Record<string, string> = {
  'https://download.inep.gov.br/educacao_basica/enem/provas/2023/1_dia_caderno_1_azul_aplicacao_regular.pdf':
    'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
  'https://download.inep.gov.br/educacao_basica/enem/provas/2022/1_dia_caderno_1_azul_aplicacao_regular.pdf':
    'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
};

function getHost(url?: string | null) {
  if (!url) return 'link externo';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'link externo';
  }
}

export default function RecursoViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const themeName = useThemeStore((s) => s.theme);
  const [resource, setResource] = useState<ResourceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const WebViewComponent: any = isWeb ? WebWebView : WebView;

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('study_track_items')
        .select('id, title, description, resource_url, kind, track:study_tracks(title)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        const fallback = OFFICIAL_RESOURCES.find((item) => item.id === id);
        if (fallback) {
          setResource({
            id: fallback.id,
            title: fallback.title,
            description: fallback.description,
            resource_url: fallback.url,
            kind: 'resource',
            track: { title: fallback.trackTitle },
          });
          setError(null);
        } else {
          setError(error.message);
          setResource(null);
        }
      } else if (data) {
        setResource(data as ResourceRow | null);
        setError(null);
        setViewerError(null);
      } else {
        const fallback = OFFICIAL_RESOURCES.find((item) => item.id === id);
        if (fallback) {
          setResource({
            id: fallback.id,
            title: fallback.title,
            description: fallback.description,
            resource_url: fallback.url,
            kind: 'resource',
            track: { title: fallback.trackTitle },
          });
          setError(null);
        } else {
          setResource(null);
        }
      }
      setLoading(false);
    };

    fetchResource();
  }, [id]);

  const useGoogleViewer = Platform.OS === 'android' || isWeb;
  const pdfUri = useMemo(() => {
    if (!resource?.resource_url) return null;
    const fixed = BROKEN_URLS[resource.resource_url] ?? resource.resource_url;
    if (useGoogleViewer) {
      return `${GOOGLE_VIEWER}${encodeURIComponent(fixed)}`;
    }
    return fixed;
  }, [resource?.resource_url, useGoogleViewer]);

  const injectedScript = useMemo(() => {
    if (!useGoogleViewer) return undefined;
    return `
      (function () {
        const sendIfUnavailable = () => {
          const bodyText = document.body ? document.body.innerText || '' : '';
          if (bodyText.includes('Nenhuma visualiza\u00e7\u00e3o dispon\u00edvel') || bodyText.includes('No preview available')) {
            window.ReactNativeWebView.postMessage('preview_unavailable');
          }
        };
        setTimeout(sendIfUnavailable, 1200);
        document.addEventListener('DOMContentLoaded', () => setTimeout(sendIfUnavailable, 500));
      })();
      true;
    `;
  }, [useGoogleViewer]);

  const openInBrowser = async () => {
    if (resource?.resource_url) {
      await WebBrowser.openBrowserAsync(resource.resource_url);
    }
  };

  const host = getHost(resource?.resource_url);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.content, styles.center]}>
          <ActivityIndicator color="#4F46E5" />
          <Text style={{ color: theme.text }}>Carregando recurso...</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.content, styles.center]}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'Recurso nao encontrado.'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.notice,
            {
              backgroundColor: themeName === 'dark' ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
              borderColor: themeName === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.noticeText, { color: theme.textMuted }]}>{LEGAL_NOTICE}</Text>
        </View>

        <View style={styles.headerCard}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {resource.title || 'Recurso oficial'}
            </Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]}>
              {resource.track?.title || 'Trilha oficial'} - {host}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerAction} onPress={openInBrowser}>
            <Ionicons name="open-outline" size={16} color="#111827" />
            <Text style={styles.headerActionText}>Abrir</Text>
          </TouchableOpacity>
        </View>

        {resource.resource_url ? (
          viewerError ? (
            <View style={[styles.viewerFallback, { backgroundColor: themeName === 'dark' ? '#0B1220' : '#F3F4F6' }]}>
              <Ionicons name="alert-circle-outline" size={24} color={theme.text} />
              <Text style={[styles.errorText, { color: theme.text }]}>{viewerError}</Text>
              <TouchableOpacity style={styles.linkBtn} onPress={openInBrowser}>
                <Ionicons name="open-outline" size={16} color={theme.text} />
                <Text style={[styles.linkBtnText, { color: theme.text }]}>Abrir no navegador</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewer}>
              <WebViewComponent
                source={{ uri: pdfUri ?? resource.resource_url }}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#4F46E5" />
                  </View>
                )}
                onLoadStart={() => setViewerError(null)}
                onError={() =>
                  setViewerError(
                    'Esta fonte nao permite visualizacao embutida. Use o botao abaixo para abrir no navegador.'
                  )
                }
                injectedJavaScript={injectedScript}
                onMessage={(event) => {
                  if (event.nativeEvent.data === 'preview_unavailable') {
                    setViewerError(
                      'Esta fonte nao permite visualizacao embutida. Use o botao abaixo para abrir no navegador.'
                    );
                  }
                }}
              />
            </View>
          )
        ) : (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              Sem URL cadastrada para este item.
            </Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[
              styles.linkBtn,
              { borderColor: themeName === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)' },
            ]}
            onPress={openInBrowser}
          >
            <Ionicons name="open-outline" size={16} color={theme.text} />
            <Text style={[styles.linkBtnText, { color: theme.text }]}>Abrir no navegador</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 10, gap: 12 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  noticeText: { fontSize: 12, flex: 1 },
  headerCard: {
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: { flex: 1, gap: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 12 },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
  },
  headerActionText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  viewer: {
    minHeight: 460,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  viewerFallback: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkBtnText: { fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 13, textAlign: 'center' },
});
