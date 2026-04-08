import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, useThemeStore } from '../../store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const studyStats = [
  { id: 'tempo', label: 'Tempo de Estudo', value: '127h', icon: '⏱️', color: '#10B981' },
  { id: 'quiz', label: 'Quizzes Realizados', value: '45', icon: '🎯', color: '#3B82F6' },
  { id: 'acertos', label: 'Taxa de Acerto', value: '78%', icon: '✅', color: '#F59E0B' },
  { id: 'dias', label: 'Dias Estudando', value: '23', icon: '📅', color: '#8B5CF6' },
];

const achievements = [
  { id: 1, name: 'Primeiro Passo', description: 'Completou o onboarding', icon: '🎉', unlocked: true },
  { id: 2, name: 'Estudioso', description: 'Estudou por 7 dias seguidos', icon: '📚', unlocked: true },
  { id: 3, name: 'Quiz Master', description: 'Acertou 10 questões seguidas', icon: '🏆', unlocked: false },
  { id: 4, name: 'Maratona', description: 'Estudou por 2 horas seguidas', icon: '🔥', unlocked: false },
];

const settings = [
  { id: 'notifications', label: 'Notificações', icon: '🔔', type: 'switch', value: true },
  { id: 'darkMode', label: 'Modo Escuro', icon: '🌙', type: 'switch', value: false },
  { id: 'sound', label: 'Sons', icon: '🔊', type: 'switch', value: true },
  { id: 'privacy', label: 'Privacidade', icon: '🔒', type: 'link' },
  { id: 'help', label: 'Ajuda', icon: '❓', type: 'link' },
  { id: 'about', label: 'Sobre', icon: 'ℹ️', type: 'link' },
];

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const isDark = useThemeStore((s) => s.theme === 'dark');
  const setTheme = useThemeStore((s) => s.setTheme);
  const { user, signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  const handleSettingPress = async (settingId: string) => {
    if (settingId === 'privacy') {
      Alert.alert('Privacidade', 'A politica de privacidade sera publicada em breve.');
      return;
    }

    if (settingId === 'help') {
      try {
        await Linking.openURL('https://github.com/gabrielbraithwaitesantos/aprendermais/issues');
      } catch {
        Alert.alert('Ajuda', 'Nao foi possivel abrir o canal de suporte.');
      }
      return;
    }

    if (settingId === 'about') {
      Alert.alert('Sobre', 'Aprender+ v1.0. App de estudo para ENEM e vestibulares.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const getLevel = (days: number) => {
    if (days >= 30) return { level: 'Mestre', color: '#8B5CF6', icon: '👑' };
    if (days >= 20) return { level: 'Avançado', color: '#10B981', icon: '⭐' };
    if (days >= 10) return { level: 'Intermediário', color: '#F59E0B', icon: '🌟' };
    return { level: 'Iniciante', color: '#3B82F6', icon: '🌱' };
  };

  const userLevel = getLevel(23);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/hero-logo.png')}
                resizeMode='contain'
                style={styles.heroLogo}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Meu Perfil</Text>
              <Text style={styles.subtitle}>Gerencie sua conta e progresso</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0) || 'E'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.displayName || 'Estudante'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.levelContainer}>
                  <Text style={styles.levelIcon}>{userLevel.icon}</Text>
                  <Text style={[styles.levelText, { color: userLevel.color }]}>
                    {userLevel.level}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Study Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
            <View style={styles.statsGrid}>
              {studyStats.map((stat) => (
                <View key={stat.id} style={styles.statCard}>
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Conquistas</Text>
            <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={[
                    styles.achievementIcon,
                    { opacity: achievement.unlocked ? 1 : 0.3 }
                  ]}>
                    <Text style={styles.achievementIconText}>{achievement.icon}</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementName,
                      { opacity: achievement.unlocked ? 1 : 0.5 }
                    ]}>
                      {achievement.name}
                    </Text>
                    <Text style={[
                      styles.achievementDescription,
                      { opacity: achievement.unlocked ? 0.8 : 0.4 }
                    ]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.unlocked && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Configurações</Text>
            <View style={styles.settingsList}>
              {settings.map((setting) => (
                <TouchableOpacity
                  key={setting.id}
                  style={styles.settingItem}
                  onPress={() => {
                    if (setting.type === 'link') {
                      handleSettingPress(setting.id);
                    }
                  }}
                  activeOpacity={setting.type === 'link' ? 0.85 : 1}
                >
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>{setting.icon}</Text>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                  </View>
                  {setting.type === 'switch' ? (
                    <Switch
                      value={
                        setting.id === 'notifications' ? notifications :
                        setting.id === 'darkMode' ? isDark :
                        setting.id === 'sound' ? sound : false
                      }
                      onValueChange={(value) => {
                        if (setting.id === 'notifications') setNotifications(value);
                        if (setting.id === 'darkMode') setTheme(value ? 'dark' : 'light');
                        if (setting.id === 'sound') setSound(value);
                      }}
                      trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#10B981' }}
                      thumbColor="white"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Study Goals */}
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Metas de Estudo</Text>
            <View style={styles.goalsCard}>
              <View style={styles.goalItem}>
                <Ionicons name="flag-outline" size={24} color="#10B981" />
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>Meta Semanal</Text>
                  <Text style={styles.goalValue}>15 horas</Text>
                  <View style={styles.goalProgress}>
                    <View style={[styles.goalProgressFill, { width: '70%' }]} />
                  </View>
                </View>
              </View>
              <View style={styles.goalItem}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>Dias Estudando</Text>
                  <Text style={styles.goalValue}>23 de 30</Text>
                  <View style={styles.goalProgress}>
                    <View style={[styles.goalProgressFill, { width: '77%' }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  logoContainer: {
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  heroLogo: {
    width: 46,
    height: 46,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelIcon: {
    fontSize: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  achievementsSection: {
    marginBottom: 32,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
  goalsSection: {
    marginBottom: 32,
  },
  goalsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  goalTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  goalProgress: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 40,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
