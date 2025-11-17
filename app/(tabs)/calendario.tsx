import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/themeStore';

type CalendarEvent = {
  id: string;
  title: string;
  notes?: string;
  timestamp: number;
  category: 'simulado' | 'prova' | 'mentoria';
};

const STORAGE_KEY = 'calendar.events.v1';

export default function CalendarioScreen() {
  const theme = useThemeColors();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'agenda' | 'week' | 'month'>('agenda');
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState<Date>(() => new Date());
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('simulado');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setEvents(JSON.parse(saved));
        } else {
          setEvents([
            {
              id: 'sample-1',
              title: 'Revisao ENEM - Matematica',
              timestamp: Date.now() + 1000 * 60 * 60 * 24,
              category: 'mentoria',
            },
            {
              id: 'sample-2',
              title: 'Simulado oficial',
              timestamp: Date.now() + 1000 * 60 * 60 * 48,
              category: 'simulado',
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => null);
    }
  }, [events, loading]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events]
  );

  const monthMatrix = useMemo(() => generateMonthMatrix(new Date(), events), [events]);
  const weekPreview = useMemo(() => buildWeekPreview(events), [events]);

  const resetForm = () => {
    setFormTitle('');
    setFormNotes('');
    setFormDate(new Date());
    setFormCategory('simulado');
    setEditingEventId(null);
  };

  const openModal = (event?: CalendarEvent) => {
    if (event) {
      setFormTitle(event.title);
      setFormNotes(event.notes ?? '');
      setFormDate(new Date(event.timestamp));
      setFormCategory(event.category);
      setEditingEventId(event.id);
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSaveEvent = () => {
    if (!formTitle.trim()) {
      Alert.alert('Informe um titulo', 'Digite o nome do evento antes de salvar.');
      return;
    }
    const payload: CalendarEvent = {
      id: editingEventId ?? Math.random().toString(36).slice(2),
      title: formTitle.trim(),
      notes: formNotes.trim() || undefined,
      timestamp: formDate.getTime(),
      category: formCategory,
    };
    setEvents((prev) =>
      editingEventId ? prev.map((item) => (item.id === editingEventId ? payload : item)) : [...prev, payload]
    );
    closeModal();
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
    if (editingEventId === id) {
      closeModal();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Calendario inteligente</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Seu cronograma de estudos sempre organizado.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Ionicons name='add' size={18} color='#FFFFFF' />
            <Text style={styles.addButtonText}>Novo evento</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          {[
            { id: 'agenda', label: 'Agenda' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.segmentItem, viewMode === mode.id && { backgroundColor: '#4F46E5' }]}
              onPress={() => setViewMode(mode.id as typeof viewMode)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: viewMode === mode.id ? '#FFFFFF' : theme.textMuted },
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color='#FFFFFF' />
            <Text style={{ color: '#FFFFFF', marginLeft: 8 }}>Carregando eventos...</Text>
          </View>
        ) : viewMode === 'agenda' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Agenda</Text>
            {sortedEvents.length === 0 ? (
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                Nenhum evento cadastrado. Toque em &quot;Novo evento&quot;.
              </Text>
            ) : (
              sortedEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => openModal(event)}>
                  <View style={[styles.eventDot, { backgroundColor: colorByCategory(event.category) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                    <Text style={[styles.eventDate, { color: theme.textMuted }]}>{formatDateTime(event.timestamp)}</Text>
                    {event.notes ? (
                      <Text style={[styles.eventNotes, { color: theme.textMuted }]} numberOfLines={2}>
                        {event.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name='chevron-forward' size={16} color={theme.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : viewMode === 'week' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Semana em foco</Text>
            <View style={styles.weekRow}>
              {weekPreview.map((day) => (
                <View key={`${day.label}-${day.date}`} style={styles.dayCell}>
                  <Text style={[styles.dayLabel, { color: theme.textMuted }]}>{day.label}</Text>
                  <View
                    style={[
                      styles.dayDot,
                      day.hasEvent ? { backgroundColor: '#4F46E5', opacity: 1 } : { opacity: 0.2 },
                    ]}
                  />
                  <Text style={[styles.dayDate, { color: theme.text, opacity: 0.8 }]}>{day.date}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Visao mensal</Text>
            <View style={styles.monthHeader}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, index) => (
                <Text key={`${d}-${index}`} style={[styles.monthLabel, { color: theme.textMuted }]}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {monthMatrix.map((cell, index) => (
                <View key={index} style={styles.monthCell}>
                  {cell ? (
                    <>
                      <Text style={[styles.monthDayText, { color: theme.text }]}>{cell.day}</Text>
                      {cell.events.length > 0 ? (
                        <View style={styles.monthBulletRow}>
                          {cell.events.slice(0, 2).map((evt) => (
                            <View key={evt.id} style={[styles.monthBullet, { backgroundColor: colorByCategory(evt.category) }]} />
                          ))}
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType='slide' onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingEventId ? 'Editar evento' : 'Novo evento'}
            </Text>
            <TextInput
              placeholder='Titulo'
              placeholderTextColor={theme.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
              style={[styles.modalInput, { color: theme.text, borderColor: theme.textMuted + '44' }]}
            />
            <TextInput
              placeholder='Notas (opcional)'
              placeholderTextColor={theme.textMuted}
              value={formNotes}
              onChangeText={setFormNotes}
              style={[styles.modalInput, { color: theme.text, borderColor: theme.textMuted + '44' }]}
            />
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Quando</Text>
              <View style={styles.row}>
                {['Hoje', 'Amanha', '1 semana'].map((label, idx) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.chip}
                    onPress={() => {
                      const next = new Date();
                      if (idx === 1) next.setDate(next.getDate() + 1);
                      if (idx === 2) next.setDate(next.getDate() + 7);
                      setFormDate(next);
                    }}
                  >
                    <Text style={styles.chipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                {['08:00', '14:00', '19:00'].map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={styles.chip}
                    onPress={() => {
                      const parts = slot.split(':').map(Number);
                      const next = new Date(formDate);
                      next.setHours(parts[0], parts[1], 0, 0);
                      setFormDate(next);
                    }}
                  >
                    <Text style={styles.chipText}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.datePreview, { color: theme.text }]}>{formatDateTime(formDate.getTime())}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Categoria</Text>
              <View style={styles.row}>
                {[
                  { id: 'simulado', label: 'Simulado' },
                  { id: 'prova', label: 'Prova' },
                  { id: 'mentoria', label: 'Mentoria' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      formCategory === cat.id && {
                        backgroundColor: colorByCategory(cat.id as CalendarEvent['category']),
                      },
                    ]}
                    onPress={() => setFormCategory(cat.id as CalendarEvent['category'])}
                  >
                    <Text style={styles.categoryChipText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              {editingEventId ? (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert('Remover evento', 'Deseja excluir este evento?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(editingEventId) },
                    ])
                  }
                >
                  <Text style={styles.deleteText}>Excluir</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent}>
                <Text style={styles.saveText}>{editingEventId ? 'Atualizar' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function colorByCategory(category: CalendarEvent['category']) {
  switch (category) {
    case 'prova':
      return '#F87171';
    case 'mentoria':
      return '#0EA5E9';
    default:
      return '#10B981';
  }
}

function formatDateTime(value: number) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} às ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function buildWeekPreview(events: CalendarEvent[]) {
  const start = new Date();
  const preview: { label: string; date: number; hasEvent: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const label = current.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 2).toUpperCase();
    const hasEvent = events.some(
      (evt) => new Date(evt.timestamp).toDateString() === current.toDateString()
    );
    preview.push({ label, date: current.getDate(), hasEvent });
  }
  return preview;
}

function generateMonthMatrix(current: Date, events: CalendarEvent[]) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix: ({ day: number; date: Date; events: CalendarEvent[] } | null)[] = [];

  for (let i = 0; i < firstWeekday; i++) matrix.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayEvents = events.filter(
      (evt) => new Date(evt.timestamp).toDateString() === date.toDateString()
    );
    matrix.push({ day, date, events: dayEvents });
  }
  while (matrix.length % 7 !== 0) matrix.push(null);
  return matrix;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 18 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 999,
  },
  segmentText: { fontSize: 12, fontWeight: '700' },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', flex: 1, gap: 6 },
  dayLabel: { fontSize: 12, fontWeight: '700' },
  dayDot: { width: 10, height: 10, borderRadius: 5 },
  dayDate: { fontSize: 12, fontWeight: '600' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  eventDot: { width: 14, height: 14, borderRadius: 7 },
  eventTitle: { fontSize: 15, fontWeight: '700' },
  eventDate: { fontSize: 12 },
  eventNotes: { fontSize: 12, marginTop: 4 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  monthLabel: { width: 32, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: {
    width: `${100 / 7}%`,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  monthDayText: { fontWeight: '700' },
  monthBulletRow: { flexDirection: 'row', gap: 4 },
  monthBullet: { width: 6, height: 6, borderRadius: 3 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  modalSection: { gap: 8 },
  modalLabel: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(79,70,229,0.08)',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  datePreview: { fontWeight: '700', fontSize: 14 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipText: { color: '#FFFFFF', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 'auto' },
  deleteText: { color: '#EF4444', fontWeight: '700' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelText: { color: '#6B7280', fontWeight: '700' },
  saveBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  emptySubtitle: { fontSize: 13 },
});
