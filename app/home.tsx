import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type ProfileRow = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  [key: string]: any;
};

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProfiles = useCallback(async (options?: { showLoader?: boolean }) => {
    try {
      if (options?.showLoader) {
        setLoading(true);
      }
      setErrorMessage(null);
      const { data, error } = await supabase.from('profiles').select('*').limit(10);
      if (error) {
        if (error?.message?.toLowerCase().includes('does not exist')) {
          setErrorMessage('Tabela "profiles" nao encontrada. Veja o README para criar a tabela de teste.');
        } else {
          setErrorMessage(error.message);
        }
        setRows([]);
        return;
      }
      setRows(data ?? []);
      setLastUpdated(new Date());
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Falha ao carregar perfis.');
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles({ showLoader: true });
  }, [fetchProfiles]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
  };

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return 'Nunca atualizado';
    return `Atualizado em ${lastUpdated.toLocaleDateString()} às ${lastUpdated.toLocaleTimeString()}`;
  }, [lastUpdated]);

  const renderItem = ({ item }: { item: ProfileRow }) => {
    const email = item.email ?? 'Sem email';
    const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'Sem data';
    const initial = email?.[0]?.toUpperCase() ?? '?';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{email}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text style={styles.cardSubtitle}>{item.id}</Text>
            </View>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.cardSubtitle}>{createdAt}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#EEF2FF', '#FDF2F8']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={16} color="#4338CA" />
            <Text style={styles.heroBadgeText}>Smoke Test Supabase</Text>
          </View>
          <Text style={styles.heroTitle}>Ola, {user?.email ?? 'visitante'} :)</Text>
          <Text style={styles.heroSubtitle}>
            Acompanhe os registros recentes da tabela <Text style={styles.bold}>profiles</Text> e valide sua integracao rapidamente.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Registros</Text>
              <Text style={styles.statValue}>{rows.length}</Text>
              <Text style={styles.statHint}>limite 10</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{errorMessage ? 'Erro' : loading ? 'Carregando' : 'Online'}</Text>
              <Text style={styles.statHint}>{formattedLastUpdated}</Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => fetchProfiles({ showLoader: true })}>
              <Ionicons name="refresh-outline" size={18} color="#4338CA" />
              <Text style={styles.actionText}>Atualizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={signOut}>
              <Ionicons name="log-out-outline" size={18} color="#4338CA" />
              <Text style={styles.actionText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ultimos registros</Text>
              <Text style={styles.sectionSubtitle}>Pull to refresh ou use o botao acima</Text>
            </View>
            <Ionicons name="document-text-outline" size={20} color="#4338CA" />
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loaderText}>Carregando dados da tabela "profiles"...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />
              <View style={styles.errorTextWrapper}>
                <Text style={styles.errorTitle}>Algo deu errado</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Ionicons name="search-outline" size={24} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>Sem registros</Text>
                  <Text style={styles.emptyText}>Adicione dados na tabela "profiles" e atualize para ve-los aqui.</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button title="Atualizar lista" onPress={() => fetchProfiles({ showLoader: true })} />
          <Button title="Sair" onPress={signOut} variant="ghost" style={styles.signOutButton} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    gap: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  heroSubtitle: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  statHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(67,56,202,0.08)',
  },
  actionText: {
    color: '#4338CA',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#4B5563',
  },
  listSection: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 13,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTextWrapper: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorText: {
    color: '#B91C1C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
  },
  cardInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingHorizontal: 32,
  },
  footer: {
    marginTop: 16,
    gap: 12,
  },
  signOutButton: {
    marginTop: 4,
  },
});
