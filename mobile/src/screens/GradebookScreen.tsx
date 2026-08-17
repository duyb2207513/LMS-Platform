import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { assignmentsApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { AppBar, Button, Card, Field, MetricCard, Screen, SectionTitle, StateView, StatusBadge } from '../components/ui';
import { courseGradesCsv } from '../gradebook/csv';
import type { AssignmentSubmission, CourseGrade, CourseGradeRule, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

type PendingSubmission = AssignmentSubmission & { assignmentTitle: string; maxScore: number };

export function GradebookScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Gradebook'>) {
  const [grades, setGrades] = useState<CourseGrade[]>([]); const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [rule, setRule] = useState<CourseGradeRule | null>(null); const [query, setQuery] = useState(''); const [tab, setTab] = useState<'grades' | 'pending'>('grades');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); try {
      const [gradeResult, ruleResult, assignmentResult] = await Promise.all([assignmentsApi.courseGrades(route.params.courseId), assignmentsApi.gradeRule(route.params.courseId), assignmentsApi.list(route.params.courseId)]);
      const ungraded = (await Promise.all(assignmentResult.data.data.map(async assignment => (await assignmentsApi.submissions(assignment.id)).data.data.filter(item => !item.feedback).map(item => ({ ...item, assignmentTitle: assignment.title, maxScore: assignment.maxScore }))))).flat();
      setGrades(gradeResult.data.data); setRule(ruleResult.data.data); setPending(ungraded); setError('');
    } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); }
  }, [route.params.courseId]);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => grades.filter(item => `${item.student?.fullName} ${item.student?.email}`.toLowerCase().includes(query.toLowerCase())), [grades, query]);
  const updateRule = async () => {
    if (!rule) return; if (rule.assignmentWeight + rule.quizWeight !== 100) return Alert.alert('Trọng số chưa hợp lệ', 'Tổng trọng số bài tập và quiz phải bằng 100%.');
    setSaving(true); try { setRule((await assignmentsApi.updateGradeRule(route.params.courseId, { assignmentWeight: rule.assignmentWeight, quizWeight: rule.quizWeight, passingScore: rule.passingScore })).data.data); Alert.alert('Đã lưu quy tắc tính điểm'); } catch (e) { Alert.alert('Không thể lưu', getApiMessage(e)); } finally { setSaving(false); }
  };
  const exportCsv = async () => {
    try { const uri = `${FileSystem.cacheDirectory}gradebook-${route.params.courseId}.csv`; await FileSystem.writeAsStringAsync(uri, courseGradesCsv(route.params.courseTitle, grades), { encoding: FileSystem.EncodingType.UTF8 }); await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Xuất bảng điểm' }); } catch (e) { Alert.alert('Không thể xuất bảng điểm', getApiMessage(e)); }
  };
  return <Screen refreshing={loading} onRefresh={load}><AppBar title="Sổ điểm" subtitle={route.params.courseTitle} onBack={navigation.goBack} />
    <View style={styles.metrics}><MetricCard icon="people-outline" label="Học viên" value={String(grades.length)} /><MetricCard icon="time-outline" label="Chờ chấm" value={String(pending.length)} tone={colors.warning} /></View>
    {rule && <Card><SectionTitle title="Quy tắc điểm tổng kết" subtitle="Tổng hai trọng số phải bằng 100%" /><View style={styles.ruleRow}><Field label="Bài tập (%)" value={String(rule.assignmentWeight)} onChangeText={value => setRule({ ...rule, assignmentWeight: Number(value) || 0 })} keyboardType="number-pad" /><Field label="Quiz (%)" value={String(rule.quizWeight)} onChangeText={value => setRule({ ...rule, quizWeight: Number(value) || 0 })} keyboardType="number-pad" /></View><Field label="Điểm đạt (%)" value={String(rule.passingScore)} onChangeText={value => setRule({ ...rule, passingScore: Number(value) || 0 })} keyboardType="number-pad" /><Button title="Lưu quy tắc" onPress={updateRule} loading={saving} /></Card>}
    <View style={styles.tabs}><Tab label={`Bảng điểm (${grades.length})`} active={tab === 'grades'} onPress={() => setTab('grades')} /><Tab label={`Chờ chấm (${pending.length})`} active={tab === 'pending'} onPress={() => setTab('pending')} /></View>
    {tab === 'grades' && <><Field label="Tìm học viên" value={query} onChangeText={setQuery} placeholder="Tên hoặc email" /><Button title="Xuất CSV" variant="outline" onPress={exportCsv} disabled={!grades.length} />{loading || error || !filtered.length ? <StateView loading={loading} error={error} empty="Chưa có dữ liệu điểm" onRetry={load} /> : filtered.map(item => <GradeCard key={item.studentId} item={item} />)}</>}
    {tab === 'pending' && (loading || error || !pending.length ? <StateView loading={loading} error={error} empty="Không còn bài nào chờ chấm" onRetry={load} /> : pending.map(item => <Pressable key={item.id} onPress={() => navigation.navigate('SubmissionDetail', { submissionId: item.id, maxScore: item.maxScore })} style={styles.pending}><View style={styles.pendingIcon}><Ionicons name="document-text-outline" size={22} color={colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.name}>{item.student?.fullName || 'Học viên'}</Text><Text style={styles.meta}>{item.assignmentTitle} · Lần {item.attemptNumber}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable>))}
  </Screen>;
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) { return <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>; }
function GradeCard({ item }: { item: CourseGrade }) { return <Card><View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.name}>{item.student?.fullName || item.studentId}</Text><Text style={styles.meta}>{item.student?.email}</Text></View><StatusBadge label={item.passed ? 'ĐẠT' : 'CHƯA ĐẠT'} tone={item.passed ? 'success' : 'danger'} /></View><View style={styles.scoreRow}><Score label="Bài tập" value={item.assignment.percent} note={`${item.assignment.graded}/${item.assignment.total} đã chấm`} /><Score label="Quiz" value={item.quiz.percent} note={`${item.quiz.attempted}/${item.quiz.total} đã làm`} /><Score label="Tổng kết" value={item.finalScore} strong /></View></Card>; }
function Score({ label, value, note, strong }: { label: string; value: number; note?: string; strong?: boolean }) { return <View style={[styles.scoreBox, strong && styles.scoreStrong]}><Text style={[styles.scoreValue, strong && { color: '#fff' }]}>{value.toFixed(1)}</Text><Text style={[styles.scoreLabel, strong && { color: '#e9e2ff' }]}>{label}</Text>{note && <Text style={[styles.scoreNote, strong && { color: '#d8ccff' }]}>{note}</Text>}</View>; }
const styles = StyleSheet.create({ metrics: { flexDirection: 'row', marginVertical: 14 }, ruleRow: { flexDirection: 'row', gap: 10 }, tabs: { flexDirection: 'row', backgroundColor: '#ececf4', padding: 4, borderRadius: 14, marginVertical: 14 }, tab: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, tabActive: { backgroundColor: '#fff', ...shadow }, tabText: { color: colors.muted, fontWeight: '800', fontSize: 12 }, tabTextActive: { color: colors.primary }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, name: { color: colors.ink, fontWeight: '900', fontSize: 16 }, meta: { color: colors.muted, fontSize: 11, marginTop: 4 }, scoreRow: { flexDirection: 'row', gap: 7, marginTop: 15 }, scoreBox: { flex: 1, minHeight: 88, borderRadius: 14, backgroundColor: '#f6f4fb', padding: 10, justifyContent: 'center' }, scoreStrong: { backgroundColor: colors.primary }, scoreValue: { color: colors.ink, fontSize: 19, fontWeight: '900' }, scoreLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 2 }, scoreNote: { color: colors.muted, fontSize: 8, marginTop: 4 }, pending: { minHeight: 82, backgroundColor: '#fff', borderRadius: 17, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, pendingIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff4d6', alignItems: 'center', justifyContent: 'center' } });
