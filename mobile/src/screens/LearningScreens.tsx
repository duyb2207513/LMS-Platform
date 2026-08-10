import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { WebView } from 'react-native-webview';
import { enrollmentsApi, learningApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { Button, Screen, SectionTitle, StateView } from '../components/ui';
import type { CourseContent, CourseProgress, Enrollment, Lesson, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

export function MyCoursesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'MyCourses'>) {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems((await enrollmentsApi.mine()).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);
  return <Screen><SectionTitle title="Khóa học của tôi" subtitle="Tiếp tục học từ nơi bạn đã dừng lại" />
    {loading || error || !items.length ? <StateView loading={loading} error={error} empty="Bạn chưa đăng ký khóa học nào" onRetry={load} /> : items.map(item => <View key={item.id} style={styles.courseCard}>
      {item.course.thumbnailUrl ? <Image source={{ uri: item.course.thumbnailUrl }} style={styles.thumbnail} /> : <View style={[styles.thumbnail, styles.placeholder]}><Text style={styles.book}>▤</Text></View>}
      <View style={{ flex: 1 }}><Text style={styles.courseTitle}>{item.course.title}</Text><Text style={styles.muted}>{item.course.instructor?.fullName || 'LMS Platform'}</Text><ProgressBar value={item.progressPercent} /><Text style={styles.percent}>{Math.round(item.progressPercent)}% hoàn thành</Text><Button title={item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học'} onPress={() => navigation.navigate('Learning', { courseId: item.course.id, courseTitle: item.course.title })} /></View>
    </View>)}
  </Screen>;
}

export function LearningScreen({ route }: NativeStackScreenProps<RootStackParamList, 'Learning'>) {
  const { courseId, courseTitle } = route.params;
  const [content, setContent] = useState<CourseContent | null>(null);
  const [summary, setSummary] = useState<CourseProgress | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentResult, progressResult] = await Promise.all([learningApi.content(courseId), learningApi.progress(courseId)]);
      const nextContent = contentResult.data.data;
      setContent(nextContent); setSummary(progressResult.data.data); setError('');
      const lessons = nextContent.sections.flatMap(section => section.lessons);
      setSelectedId(current => current && lessons.some(item => item.id === current) ? current : (lessons.find(item => !item.progress?.isCompleted) || lessons[0])?.id || null);
    } catch (e) { setError(getApiMessage(e)); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { void load(); }, [load]);

  const lessons = useMemo(() => content?.sections.flatMap(section => section.lessons) || [], [content]);
  const selected = lessons.find(item => item.id === selectedId) || null;

  async function setComplete(value: boolean) {
    if (!selected) return;
    setSaving(true);
    try { await learningApi.updateProgress(selected.id, { isCompleted: value, ...(selected.lessonType === 'VIDEO' && value && selected.durationSeconds ? { lastWatchedSecond: selected.durationSeconds } : {}) }); await load(); }
    catch (e) { Alert.alert('Không thể lưu tiến độ', getApiMessage(e)); }
    finally { setSaving(false); }
  }
  async function savePosition(second: number) {
    if (!selected || selected.lessonType !== 'VIDEO') return;
    try { await learningApi.updateProgress(selected.id, { lastWatchedSecond: Math.max(0, Math.floor(second)) }); }
    catch { /* Lần lưu tiếp theo sẽ thử lại, không ngắt video đang phát. */ }
  }
  function selectLesson(lesson: Lesson) { setSelectedId(lesson.id); setSidebar(false); }

  if (loading || error || !content) return <Screen><StateView loading={loading} error={error} onRetry={load} /></Screen>;
  return <Screen>
    <Text style={styles.learningEyebrow}>ĐANG HỌC</Text><Text style={styles.learningTitle}>{courseTitle}</Text>
    <View style={styles.progressHeading}><Text style={styles.progressText}>{summary?.completedLessons || 0}/{summary?.totalLessons || 0} bài hoàn thành</Text><Text style={styles.progressText}>{Math.round(summary?.progressPercent || 0)}%</Text></View><ProgressBar value={summary?.progressPercent || 0} />
    <Button title="☰ Chương và bài học" variant="outline" onPress={() => setSidebar(true)} />
    {!selected ? <StateView empty="Khóa học chưa có bài học đã xuất bản" /> : <View style={styles.viewerCard}>
      <Text style={styles.lessonType}>{typeName[selected.lessonType]}</Text><Text style={styles.viewerTitle}>{selected.title}</Text>
      {selected.lessonType === 'TEXT' && <ScrollView style={styles.textViewer} nestedScrollEnabled><Text style={styles.contentText}>{selected.content || 'Bài học chưa có nội dung.'}</Text></ScrollView>}
      {selected.lessonType === 'VIDEO' && (selected.videoUrl ? <VideoLessonViewer key={selected.id} uri={selected.videoUrl} initialSecond={selected.progress?.lastWatchedSecond || 0} onSave={savePosition} /> : <MissingContent text="Video chưa được tải lên." />)}
      {selected.lessonType === 'DOCUMENT' && (selected.documentUrl ? <DocumentViewer uri={selected.documentUrl} /> : <MissingContent text="Tài liệu chưa được tải lên." />)}
      <Button title={selected.progress?.isCompleted ? '✓ Đã hoàn thành — đánh dấu chưa xong' : '✓ Đánh dấu hoàn thành'} variant={selected.progress?.isCompleted ? 'outline' : 'primary'} onPress={() => setComplete(!selected.progress?.isCompleted)} loading={saving} />
      {lessons.findIndex(item => item.id === selected.id) < lessons.length - 1 && <Button title="Bài tiếp theo →" variant="ghost" onPress={() => selectLesson(lessons[lessons.findIndex(item => item.id === selected.id) + 1])} />}
    </View>}
    <Modal visible={sidebar} animationType="slide" onRequestClose={() => setSidebar(false)}>
      <Screen><View style={styles.sidebarHeader}><SectionTitle title="Nội dung khóa học" subtitle={`${summary?.completedLessons || 0}/${summary?.totalLessons || 0} bài hoàn thành`} /><Pressable onPress={() => setSidebar(false)}><Text style={styles.close}>✕</Text></Pressable></View>
        {content.sections.map((section, sectionIndex) => <View key={section.id} style={styles.sidebarSection}><Text style={styles.sidebarSectionTitle}>Chương {sectionIndex + 1}: {section.title}</Text>{section.lessons.map((lesson, lessonIndex) => <Pressable key={lesson.id} onPress={() => selectLesson(lesson)} style={[styles.sidebarLesson, lesson.id === selectedId && styles.sidebarLessonActive]}><Text style={[styles.completion, lesson.progress?.isCompleted && styles.completionDone]}>{lesson.progress?.isCompleted ? '✓' : lessonIndex + 1}</Text><View style={{ flex: 1 }}><Text style={styles.sidebarLessonTitle}>{lesson.title}</Text><Text style={styles.muted}>{typeName[lesson.lessonType]}</Text></View></Pressable>)}</View>)}
      </Screen>
    </Modal>
  </Screen>;
}

function VideoLessonViewer({ uri, initialSecond, onSave }: { uri: string; initialSecond: number; onSave(second: number): void }) {
  const lastSaved = useRef(Math.floor(initialSecond));
  const latestTime = useRef(Math.floor(initialSecond));
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const player = useVideoPlayer(uri, instance => {
    instance.currentTime = initialSecond;
    instance.timeUpdateEventInterval = 1;
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const second = Math.floor(currentTime);
    latestTime.current = second;
    if (second - lastSaved.current >= 10) {
      lastSaved.current = second;
      onSaveRef.current(second);
    }
  });
  useEffect(() => {
    return () => { if (latestTime.current > lastSaved.current) onSaveRef.current(latestTime.current); };
  }, []);
  return <VideoView style={styles.video} player={player} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture />;
}

function DocumentViewer({ uri }: { uri: string }) { return <View><WebView source={{ uri }} style={styles.document} startInLoadingState /><Button title="Mở tài liệu bên ngoài" variant="outline" onPress={() => void Linking.openURL(uri)} /></View>; }
function MissingContent({ text }: { text: string }) { return <View style={styles.missing}><Text style={styles.muted}>{text}</Text></View>; }
export function ProgressBar({ value }: { value: number }) { return <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value))}%` }]} /></View>; }
const typeName = { VIDEO: 'VIDEO', TEXT: 'BÀI ĐỌC', DOCUMENT: 'TÀI LIỆU' };
const styles = StyleSheet.create({ courseCard: { backgroundColor: '#fff', borderRadius: 19, padding: 14, marginBottom: 14, flexDirection: 'row', gap: 14, ...shadow }, thumbnail: { width: 92, height: 110, borderRadius: 14 }, placeholder: { backgroundColor: '#eee8ff', alignItems: 'center', justifyContent: 'center' }, book: { color: colors.primary, fontSize: 36 }, courseTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' }, muted: { color: colors.muted, fontSize: 12, marginTop: 4 }, track: { height: 8, backgroundColor: '#e9e5f7', borderRadius: 10, overflow: 'hidden', marginTop: 11 }, fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 10 }, percent: { color: colors.primary, fontWeight: '800', fontSize: 12, marginTop: 5 }, learningEyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11 }, learningTitle: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '900', marginTop: 4 }, progressHeading: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }, progressText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, viewerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 12, ...shadow }, lessonType: { color: colors.primary, fontWeight: '900', fontSize: 11 }, viewerTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 5, marginBottom: 14 }, textViewer: { maxHeight: 390, backgroundColor: '#f8f7fc', borderRadius: 14, padding: 16, marginBottom: 12 }, contentText: { color: colors.ink, fontSize: 16, lineHeight: 27 }, video: { width: '100%', height: 220, backgroundColor: '#111', borderRadius: 14, marginBottom: 12 }, document: { width: '100%', height: 420, backgroundColor: '#f5f5f5', marginBottom: 8 }, missing: { minHeight: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f4fb', borderRadius: 14, marginBottom: 12 }, sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between' }, close: { color: colors.ink, fontSize: 24, padding: 4 }, sidebarSection: { marginBottom: 18 }, sidebarSectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 8 }, sidebarLesson: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, marginBottom: 6, backgroundColor: '#fff' }, sidebarLessonActive: { backgroundColor: '#eee8ff' }, sidebarLessonTitle: { color: colors.ink, fontWeight: '700' }, completion: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.muted, textAlign: 'center', lineHeight: 26, fontWeight: '800' }, completionDone: { backgroundColor: colors.primary, color: '#fff', borderColor: colors.primary } });
