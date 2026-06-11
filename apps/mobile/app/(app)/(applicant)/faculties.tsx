import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Faculty } from '@student-journey/shared';

interface Specialty {
  id: number;
  name: string;
  code?: string;
  form?: 'o' | 'oz';
  formLabel?: string;
  budget_places?: number;
  paid_places?: number;
}

export default function FacultiesScreen() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState('');
  const [chosenFacultyId, setChosenFacultyId] = useState<number | null>(null);
  const [questDone, setQuestDone] = useState(false);

  const loadFaculties = async () => {
    setError('');
    const res = await api.get<Faculty[] | { results?: Faculty[]; count?: number } | any>('/faculties');
    if (res.success && res.data) {
      // Django DRF может вернуть пагинированный объект {count, results:[]} или прямой массив
      const raw = res.data;
      const list: Faculty[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
          ? raw.results
          : [];
      setFaculties(list);
      if (list.length === 0 && !Array.isArray(raw)) {
        setError('Неожиданный формат данных от сервера');
      }
    } else {
      setError(res.message || 'Не удалось загрузить факультеты');
    }
  };

  const loadSpecialties = async (facultyId: number) => {
    setLoadingSpecialties(true);
    setSpecialties([]);
    const res = await api.get<any>(`/faculties/specialties?faculty=${facultyId}`);
    if (res.success && res.data) {
      const raw = res.data;
      const list: Specialty[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
          ? raw.results
          : [];
      setSpecialties(list);
    }
    setLoadingSpecialties(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadFaculties();
      // Загружаем сохранённый ранее выбор с сервера
      const chosen = await api.get<{ chosenFacultyId: number | null; chosenSpecialtyId: number | null }>('/faculties/chosen');
      if (chosen.success && chosen.data?.chosenFacultyId) {
        setChosenFacultyId(chosen.data.chosenFacultyId);
        if (chosen.data.chosenSpecialtyId) {
          setSelectedSpecialty(chosen.data.chosenSpecialtyId);
        }
      }
    };
    init().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFaculties();
    if (selected) await loadSpecialties(selected);
    setRefreshing(false);
  };

  const selectFaculty = (id: number) => {
    if (selected === id) {
      setSelected(null);
      setSpecialties([]);
      setSelectedSpecialty(null);
    } else {
      setSelected(id);
      setSelectedSpecialty(null);
      loadSpecialties(id);
    }
  };

  const choose = async () => {
    if (!selected) return;
    setChoosing(true);
    try {
      const faculty = faculties.find((f) => f.id === selected);
      const specialty = specialties.find((s) => s.id === selectedSpecialty);
      const res = await api.post<{ facultyId: number; questCompleted: any }>('/faculties/choose', {
        facultyId: selected,
        facultyName: faculty?.name ?? null,
        specialtyId: selectedSpecialty,
        specialtyName: specialty?.name ?? null,
      });
      if (res.success) {
        setChosenFacultyId(selected);
        if (res.data?.questCompleted) setQuestDone(true);
      }
    } finally {
      setChoosing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color="#0ea5e9" size="large" />
          <Text style={styles.loadingText}>Загрузка факультетов...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || faculties.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.title}>Факультеты</Text>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏫</Text>
            <Text style={styles.emptyTitle}>
              {error ? 'Нет подключения' : 'Нет данных'}
            </Text>
            <Text style={styles.emptyText}>
              {error
                ? 'Не удалось загрузить список факультетов.\nПотяните вниз чтобы повторить.'
                : 'Список факультетов пока не заполнен.'}
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const chosenFaculty = faculties.find((f) => f.id === chosenFacultyId);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Факультеты</Text>
        <Text style={styles.subtitle}>Выбери направление обучения</Text>

        {/* Текущий выбор */}
        {chosenFacultyId && (
          <Card style={styles.chosenCard}>
            <View style={styles.chosenRow}>
              <Text style={styles.chosenEmoji}>✅</Text>
              <View style={styles.chosenInfo}>
                <Text style={styles.chosenLabel}>Ваш выбор</Text>
                <Text style={styles.chosenName}>{chosenFaculty?.name}</Text>
              </View>
              {questDone && <Badge variant="success">+XP</Badge>}
            </View>
          </Card>
        )}

        {/* Список факультетов */}
        {faculties.map((f) => {
          const isSelected = selected === f.id;
          const isChosen = chosenFacultyId === f.id;

          return (
            <View key={f.id}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => selectFaculty(f.id)}
              >
                <Card style={[styles.facultyCard, isSelected && styles.facultyCardSelected, isChosen && styles.facultyCardChosen]}>
                  <View style={styles.facultyRow}>
                    <View style={styles.facultyIcon}>
                      <Text style={styles.facultyIconText}>🎓</Text>
                    </View>
                    <View style={styles.facultyInfo}>
                      <Text style={styles.facultyName}>{f.name}</Text>
                      {isChosen && (
                        <Text style={styles.facultyChosen}>Выбран вами</Text>
                      )}
                    </View>
                    <Text style={styles.chevron}>{isSelected ? '▲' : '▼'}</Text>
                  </View>
                </Card>
              </TouchableOpacity>

              {/* Специальности (раскрываются при выборе факультета) */}
              {isSelected && (
                <View style={styles.specialtiesBox}>
                  {loadingSpecialties ? (
                    <ActivityIndicator color="#0ea5e9" style={{ marginVertical: 12 }} />
                  ) : specialties.length > 0 ? (
                    <>
                      <Text style={styles.specialtiesTitle}>Направления подготовки</Text>
                      {specialties.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.specialtyRow, selectedSpecialty === s.id && styles.specialtyRowActive]}
                          onPress={() => setSelectedSpecialty(s.id === selectedSpecialty ? null : s.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.specialtyLeft}>
                            <Text style={[styles.specialtyName, selectedSpecialty === s.id && styles.specialtyNameActive]}>
                              {s.name}
                            </Text>
                            <View style={styles.specialtyMeta}>
                              {s.code && (
                                <Text style={styles.specialtyCode}>{s.code}</Text>
                              )}
                              {s.formLabel && (
                                <Text style={[
                                  styles.specialtyForm,
                                  s.form === 'oz' && styles.specialtyFormOz,
                                ]}>
                                  {s.formLabel}
                                </Text>
                              )}
                            </View>
                          </View>
                          {selectedSpecialty === s.id && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.noSpecialties}>Направления не указаны</Text>
                  )}

                  <TouchableOpacity
                    style={[styles.chooseBtn, choosing && styles.chooseBtnDisabled]}
                    onPress={choose}
                    disabled={choosing}
                    activeOpacity={0.85}
                  >
                    {choosing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.chooseBtnText}>
                          {chosenFacultyId === f.id ? '✓ Уже выбран' : 'Выбрать этот факультет'}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  scroll: { padding: 20, paddingBottom: 40, gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 15, marginTop: 8 },

  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 4 },

  emptyCard: { alignItems: 'center', paddingVertical: 36 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  chosenCard: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac' },
  chosenRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chosenEmoji: { fontSize: 28 },
  chosenInfo: { flex: 1 },
  chosenLabel: { fontSize: 12, color: '#16a34a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  chosenName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },

  facultyCard: { marginBottom: 0 },
  facultyCardSelected: { borderWidth: 2, borderColor: '#0ea5e9' },
  facultyCardChosen: { borderWidth: 2, borderColor: '#22c55e' },
  facultyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  facultyIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center',
  },
  facultyIconText: { fontSize: 20 },
  facultyInfo: { flex: 1 },
  facultyName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  facultyChosen: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: 12, color: '#94a3b8' },

  specialtiesBox: {
    backgroundColor: '#fff',
    marginTop: -4,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#0ea5e9',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 14,
    gap: 8,
  },
  specialtiesTitle: {
    fontSize: 12, fontWeight: '600', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  specialtyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', gap: 8,
  },
  specialtyRowActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  specialtyLeft: { flex: 1 },
  specialtyName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  specialtyNameActive: { color: '#0369a1' },
  specialtyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  specialtyCode: { fontSize: 11, color: '#94a3b8' },
  specialtyForm: {
    fontSize: 10, fontWeight: '600', color: '#0369a1',
    backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  specialtyFormOz: { color: '#7c3aed', backgroundColor: '#ede9fe' },
  checkMark: { fontSize: 16, color: '#0ea5e9', fontWeight: '800' },
  noSpecialties: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },

  chooseBtn: {
    backgroundColor: '#0ea5e9', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  chooseBtnDisabled: { backgroundColor: '#94a3b8' },
  chooseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
