import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Linking, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { certificatesApi, commentsApi, enrollmentsApi, learningApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { BottomSheet, Button, Field, ImageWithFallback, Screen, SectionTitle, StateView } from '../components/ui';
import type { Comment, CourseContent, CourseProgress, Enrollment, Lesson, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../providers/ThemeProvider';

export function MyCoursesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'MyCourses'>) {
  const { palette } = useAppTheme();
  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const load = useCallback(async () => { setLoading(true); try { setItems((await enrollmentsApi.mine()).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);
  async function issueCertificate(courseId: string) { try { await certificatesApi.issue(courseId); navigation.navigate('Certificates'); } catch (e) { Alert.alert('Chưa thể cấp chứng chỉ', getApiMessage(e)); } }
  const visibleItems = items.filter(item => filter === 'all' || (filter === 'completed' ? item.status === 'COMPLETED' : item.status !== 'COMPLETED'));
  const activeCount = items.filter(item => item.status !== 'COMPLETED').length;
  const completedCount = items.filter(item => item.status === 'COMPLETED').length;
  return <Screen scroll={false}>
    <FlatList data={visibleItems} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} refreshing={loading && items.length > 0} onRefresh={load}
      contentContainerStyle={visibleItems.length ? { paddingBottom: 24 } : { flexGrow: 1 }}
      ListHeaderComponent={<View><SectionTitle title="Khóa học của tôi" subtitle="Học tiếp từ đúng nơi bạn đã dừng lại" />
        {!!items.length && <><View style={styles.librarySummary}><View style={styles.libraryMetric}><Text style={styles.libraryValue}>{items.length}</Text><Text style={styles.libraryLabel}>Đã đăng ký</Text></View><View style={styles.libraryDivider} /><View style={styles.libraryMetric}><Text style={styles.libraryValue}>{activeCount}</Text><Text style={styles.libraryLabel}>Đang học</Text></View><View style={styles.libraryDivider} /><View style={styles.libraryMetric}><Text style={styles.libraryValue}>{completedCount}</Text><Text style={styles.libraryLabel}>Hoàn thành</Text></View></View>
        <View style={styles.libraryFilters}><LibraryFilter label="Tất cả" active={filter === 'all'} onPress={() => setFilter('all')} /><LibraryFilter label="Đang học" active={filter === 'active'} onPress={() => setFilter('active')} /><LibraryFilter label="Hoàn thành" active={filter === 'completed'} onPress={() => setFilter('completed')} /></View></>}</View>}
      ListEmptyComponent={<View style={{ flex: 1 }}><StateView loading={loading} error={error} empty={items.length ? 'Không có khóa học trong nhóm này' : 'Bạn chưa đăng ký khóa học nào'} onRetry={load} variant="list" />{!loading && !error && !items.length && <Button title="Khám phá khóa học" onPress={() => navigation.navigate('Main', { screen: 'CoursesTab' })} />}</View>}
      renderItem={({ item }) => <View style={[styles.libraryCard, { backgroundColor: palette.surface }]}>
        <View><ImageWithFallback uri={item.course.thumbnailUrl} style={styles.libraryImage} accessibilityLabel={`Ảnh khóa học ${item.course.title}`} /><View style={[styles.libraryStatus, item.status === 'COMPLETED' && styles.libraryStatusDone]}><Ionicons name={item.status === 'COMPLETED' ? 'checkmark-circle' : item.progressPercent ? 'play-circle' : 'sparkles'} size={13} color={item.status === 'COMPLETED' ? colors.success : colors.primary} /><Text style={[styles.libraryStatusText, item.status === 'COMPLETED' && { color: colors.success }]}>{item.status === 'COMPLETED' ? 'Đã hoàn thành' : item.progressPercent ? 'Đang học' : 'Mới đăng ký'}</Text></View></View>
        <Text style={[styles.libraryTitle, { color: palette.ink }]}>{item.course.title}</Text><Text style={[styles.libraryInstructor, { color: palette.muted }]}>{item.course.instructor?.fullName || 'LMS Platform'} · {item.course.category?.name || 'Khóa học'}</Text>
        <View style={styles.progressHeading}><Text style={[styles.percent, { color: palette.primary }]}>{Math.round(item.progressPercent)}% hoàn thành</Text><Text style={[styles.libraryHint, { color: palette.muted }]}>{item.progressPercent ? 'Tiếp tục hành trình' : 'Sẵn sàng bắt đầu'}</Text></View><ProgressBar value={item.progressPercent} />
        <Button title={item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học'} onPress={() => navigation.navigate('Learning', { courseId: item.course.id, courseTitle: item.course.title })} />{item.status === 'COMPLETED' && <Button title="Nhận chứng chỉ" variant="outline" onPress={() => issueCertificate(item.course.id)} />}
      </View>} />
  </Screen>;
}

function LibraryFilter({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.libraryFilter, active && styles.libraryFilterActive]}><Text style={[styles.libraryFilterText, active && styles.libraryFilterTextActive]}>{label}</Text></Pressable>; }

export function LearningScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Learning'>) {
  const insets = useSafeAreaInsets();
  const { courseId, courseTitle } = route.params;
  const [content, setContent] = useState<CourseContent | null>(null);
  const [summary, setSummary] = useState<CourseProgress | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [discussionOpen, setDiscussionOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contentResult, progressResult] = await Promise.all([learningApi.content(courseId), learningApi.progress(courseId)]);
      const nextContent = contentResult.data.data;
      setContent(nextContent); setSummary(progressResult.data.data); setError('');
      const lessons = nextContent.sections.flatMap(section => section.lessons);
      setSelectedId(current => route.params.lessonId && lessons.some(item => item.id === route.params.lessonId) ? route.params.lessonId : current && lessons.some(item => item.id === current) ? current : (lessons.find(item => !item.progress?.isCompleted) || lessons[0])?.id || null);
    } catch (e) { setError(getApiMessage(e)); }
    finally { setLoading(false); }
  }, [courseId, route.params.lessonId]);
  useEffect(() => { void load(); }, [load]);

  const lessons = useMemo(() => content?.sections.flatMap(section => section.lessons) || [], [content]);
  const selected = lessons.find(item => item.id === selectedId) || null;

  async function setComplete(value: boolean) {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await learningApi.updateProgress(selected.id, { isCompleted: value, ...(selected.lessonType === 'VIDEO' && value && selected.durationSeconds ? { lastWatchedSecond: selected.durationSeconds } : {}) });
      setSummary(result.data.data.courseProgress);
      setContent(current => current ? { ...current, sections: current.sections.map(section => ({ ...section, lessons: section.lessons.map(lesson => lesson.id === selected.id ? { ...lesson, progress: result.data.data.lessonProgress } : lesson) })) } : current);
    }
    catch (e) { Alert.alert('Không thể lưu tiến độ', getApiMessage(e)); }
    finally { setSaving(false); }
  }
  async function savePosition(second: number) {
    if (!selected || selected.lessonType !== 'VIDEO') return;
    try { await learningApi.updateProgress(selected.id, { lastWatchedSecond: Math.max(0, Math.floor(second)) }); }
    catch { /* Lần lưu tiếp theo sẽ thử lại, không ngắt video đang phát. */ }
  }
  function selectLesson(lesson: Lesson) { setSelectedId(lesson.id); setSidebar(false); setDiscussionOpen(false); }
  const lessonSwipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy)) || (gesture.dy < -35 && Math.abs(gesture.dy) > Math.abs(gesture.dx)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -60 && Math.abs(gesture.dy) > Math.abs(gesture.dx)) { setSidebar(true); return; }
      const index = lessons.findIndex(item => item.id === selectedId);
      if (gesture.dx < -55 && index < lessons.length - 1) selectLesson(lessons[index + 1]);
      if (gesture.dx > 55 && index > 0) selectLesson(lessons[index - 1]);
    },
  }), [lessons, selectedId]);

  if (loading || error || !content) return <Screen><StateView loading={loading} error={error} onRetry={load} /></Screen>;
  const selectedIndex = selected ? lessons.findIndex(item => item.id === selected.id) : -1;
  const previous = selectedIndex > 0 ? lessons[selectedIndex - 1] : null;
  const next = selectedIndex >= 0 && selectedIndex < lessons.length - 1 ? lessons[selectedIndex + 1] : null;
  return <View style={phaseOneStyles.learningPage}><Screen>
    <View style={phaseOneStyles.learningHeader}><View style={{ flex: 1 }}><Text style={styles.learningEyebrow}>ĐANG HỌC</Text><Text numberOfLines={2} style={styles.learningTitle}>{courseTitle}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Mở danh sách bài học" onPress={() => setSidebar(true)} style={phaseOneStyles.curriculumButton}><Ionicons name="list-outline" size={23} color={colors.primary} /><Text style={phaseOneStyles.curriculumText}>{summary?.completedLessons || 0}/{summary?.totalLessons || 0}</Text></Pressable></View>
    <View style={styles.progressHeading}><Text style={styles.progressText}>Tiến độ khóa học</Text><Text style={phaseOneStyles.progressPercent}>{Math.round(summary?.progressPercent || 0)}%</Text></View><ProgressBar value={summary?.progressPercent || 0} />
    {!selected ? <StateView empty="Khóa học chưa có bài học đã xuất bản" /> : <View style={styles.viewerCard} {...lessonSwipe.panHandlers}>
      <View style={phaseOneStyles.lessonHeading}><View style={{ flex: 1 }}><Text style={styles.lessonType}>{typeName[selected.lessonType]} · BÀI {selectedIndex + 1}/{lessons.length}</Text><Text style={styles.viewerTitle}>{selected.title}</Text></View>{selected.progress?.isCompleted && <View style={phaseOneStyles.completedPill}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={phaseOneStyles.completedPillText}>Đã xong</Text></View>}</View>
      {selected.lessonType === 'TEXT' && <ScrollView style={styles.textViewer} nestedScrollEnabled><Text style={styles.contentText}>{selected.content || 'Bài học chưa có nội dung.'}</Text></ScrollView>}
      {selected.lessonType === 'VIDEO' && (selected.videoUrl ? <VideoLessonViewer key={selected.id} uri={selected.videoUrl} initialSecond={selected.progress?.lastWatchedSecond || 0} onSave={savePosition} /> : <MissingContent text="Video chưa được tải lên." />)}
      {selected.lessonType === 'DOCUMENT' && (selected.documentUrl ? <DocumentViewer uri={selected.documentUrl} /> : <MissingContent text="Tài liệu chưa được tải lên." />)}
      {selected.quiz && <Button title={`Làm quiz: ${selected.quiz.title}`} variant="outline" onPress={() => navigation.navigate('Quiz', { quizId: selected.quiz!.id, title: selected.quiz!.title })} />}
      <Text style={styles.swipeNote}>Vuốt trái/phải để chuyển bài · vuốt lên để mở mục lục</Text>
    </View>}
    <View style={phaseOneStyles.learningTools}><LearningTool icon="list-outline" label="Mục lục" onPress={() => setSidebar(true)} /><LearningTool icon="document-text-outline" label="Bài tập" onPress={() => navigation.navigate('Assignments', { courseId, courseTitle })} /><LearningTool icon="megaphone-outline" label="Thông báo" onPress={() => navigation.navigate('Announcements', { courseId, courseTitle })} /></View>
    {selected && <Pressable accessibilityRole="button" accessibilityState={{ expanded: discussionOpen }} onPress={() => setDiscussionOpen(open => !open)} style={phaseOneStyles.discussionToggle}><View style={phaseOneStyles.discussionToggleIcon}><Ionicons name="chatbubbles-outline" size={22} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={phaseOneStyles.discussionToggleTitle}>Thảo luận bài học</Text><Text style={styles.muted}>Hỏi đáp với giảng viên và học viên</Text></View><Ionicons name={discussionOpen ? 'chevron-up' : 'chevron-down'} size={21} color={colors.muted} /></Pressable>}
    {selected && discussionOpen && <Discussion key={selected.id} lessonId={selected.id} />}
    <BottomSheet visible={sidebar} title="Chương và bài học" onClose={() => setSidebar(false)}><ScrollView style={{ maxHeight: 570 }}>{content.sections.map((section, sectionIndex) => <View key={section.id} style={styles.sidebarSection}><Text style={styles.sidebarSectionTitle}>Chương {sectionIndex + 1}: {section.title}</Text>{section.lessons.map((lesson, lessonIndex) => <Pressable key={lesson.id} onPress={() => selectLesson(lesson)} style={[styles.sidebarLesson, lesson.id === selectedId && styles.sidebarLessonActive]}><Text style={[styles.completion, lesson.progress?.isCompleted && styles.completionDone]}>{lesson.progress?.isCompleted ? '✓' : lessonIndex + 1}</Text><View style={{ flex: 1 }}><Text style={styles.sidebarLessonTitle}>{lesson.title}</Text><Text style={styles.muted}>{typeName[lesson.lessonType]}</Text></View></Pressable>)}</View>)}</ScrollView></BottomSheet>
    <View style={{ height: selected ? 88 : 0 }} />
  </Screen>{selected && <View style={[phaseOneStyles.learningDock, { paddingBottom: Math.max(10, insets.bottom) }]}><Pressable accessibilityRole="button" accessibilityLabel="Bài trước" disabled={!previous} onPress={() => previous && selectLesson(previous)} style={[phaseOneStyles.dockNav, !previous && phaseOneStyles.dockDisabled]}><Ionicons name="chevron-back" size={24} color={previous ? colors.ink : '#c8cad3'} /></Pressable><Pressable accessibilityRole="button" accessibilityState={{ checked: !!selected.progress?.isCompleted, disabled: saving }} disabled={saving} onPress={() => void setComplete(!selected.progress?.isCompleted)} style={[phaseOneStyles.completeAction, selected.progress?.isCompleted && phaseOneStyles.completeActionDone]}><Ionicons name={selected.progress?.isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} size={21} color={selected.progress?.isCompleted ? colors.success : '#fff'} /><Text style={[phaseOneStyles.completeActionText, selected.progress?.isCompleted && { color: colors.success }]}>{saving ? 'Đang lưu...' : selected.progress?.isCompleted ? 'Đã hoàn thành' : 'Hoàn thành bài'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Bài tiếp theo" disabled={!next} onPress={() => next && selectLesson(next)} style={[phaseOneStyles.dockNav, !next && phaseOneStyles.dockDisabled]}><Ionicons name="chevron-forward" size={24} color={next ? colors.ink : '#c8cad3'} /></Pressable></View>}</View>;
}

function LearningTool({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress(): void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={phaseOneStyles.learningTool}><View style={phaseOneStyles.learningToolIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View><Text style={phaseOneStyles.learningToolText}>{label}</Text></Pressable>; }

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
function Discussion({ lessonId }: { lessonId: string }) {
  const { user } = useAuth(); const [items, setItems] = useState<Comment[]>([]); const [content, setContent] = useState(''); const [replyTo, setReplyTo] = useState<Comment | null>(null); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems((await commentsApi.list(lessonId)).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, [lessonId]);
  useEffect(() => { void load(); }, [load]);
  async function send() { if (!content.trim()) return; setSending(true); try { await commentsApi.create(lessonId, { content: content.trim(), parentId: replyTo?.id }); setContent(''); setReplyTo(null); await load(); } catch (e) { Alert.alert('Không thể gửi bình luận', getApiMessage(e)); } finally { setSending(false); } }
  function remove(item: Comment) { Alert.alert('Xóa bình luận?', 'Các câu trả lời vẫn được giữ lại.', [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: async () => { try { await commentsApi.remove(item.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } }]); }
  const row = (item: Comment, reply = false) => <View key={item.id} style={[styles.comment, reply && styles.reply]}><View style={{ flex: 1 }}><Text style={styles.commentAuthor}>{item.user.fullName} <Text style={styles.role}>{item.user.role === 'INSTRUCTOR' ? 'GIẢNG VIÊN' : item.user.role === 'ADMIN' ? 'ADMIN' : ''}</Text></Text><Text style={[styles.commentText, item.isDeleted && { fontStyle: 'italic' }]}>{item.isDeleted ? 'Bình luận đã bị xóa' : item.content}</Text>{!item.isDeleted && !reply && <Pressable onPress={() => setReplyTo(item)}><Text style={styles.discussionLink}>Trả lời</Text></Pressable>}</View>{item.user.id === user?.id && !item.isDeleted && <Pressable onPress={() => remove(item)}><Text style={styles.deleteComment}>Xóa</Text></Pressable>}</View>;
  return <View style={styles.discussion}><SectionTitle title="Thảo luận bài học" subtitle="Đặt câu hỏi và trao đổi với giảng viên" />{loading ? <StateView loading /> : error ? <StateView error={error} onRetry={load} /> : items.length ? items.map(item => <View key={item.id}>{row(item)}{item.replies?.map(reply => row(reply, true))}</View>) : <Text style={styles.muted}>Chưa có bình luận. Hãy bắt đầu cuộc thảo luận.</Text>}
    {replyTo && <View style={styles.replying}><Text style={styles.muted}>Đang trả lời {replyTo.user.fullName}</Text><Pressable onPress={() => setReplyTo(null)}><Text style={styles.deleteComment}>Hủy</Text></Pressable></View>}
    <View style={styles.composer}><View style={{ flex: 1 }}><Field label={replyTo ? 'Câu trả lời' : 'Bình luận'} value={content} onChangeText={setContent} multiline placeholder="Nhập nội dung..." /></View><Button title="Gửi" onPress={send} loading={sending} disabled={!content.trim()} /></View>
  </View>;
}
const phaseOneStyles = StyleSheet.create({
  learningPage: { flex: 1, backgroundColor: colors.background },
  learningHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  curriculumButton: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' },
  curriculumText: { color: colors.primary, fontSize: 9, fontWeight: '900', marginTop: 1 },
  progressPercent: { color: colors.primary, fontWeight: '900', fontSize: 13 },
  lessonHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  completedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e9f9f1', borderRadius: 15, paddingHorizontal: 8, paddingVertical: 6 },
  completedPillText: { color: colors.success, fontSize: 10, fontWeight: '900' },
  learningTools: { flexDirection: 'row', gap: 9, marginTop: 14 },
  learningTool: { flex: 1, minHeight: 82, backgroundColor: '#fff', borderRadius: 17, padding: 10, alignItems: 'center', justifyContent: 'center' },
  learningToolIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' },
  learningToolText: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 6 },
  discussionToggle: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 13, marginTop: 14 },
  discussionToggleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' },
  discussionToggleTitle: { color: colors.ink, fontWeight: '900' },
  learningDock: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, ...shadow },
  dockNav: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#f4f3f8', alignItems: 'center', justifyContent: 'center' },
  dockDisabled: { opacity: 0.45 },
  completeAction: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: colors.primary, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  completeActionDone: { backgroundColor: '#e9f9f1', borderWidth: 1, borderColor: '#b9ead1' },
  completeActionText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});

export function ProgressBar({ value }: { value: number }) { return <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value))}%` }]} /></View>; }
const typeName = { VIDEO: 'VIDEO', TEXT: 'BÀI ĐỌC', DOCUMENT: 'TÀI LIỆU' };
const styles = StyleSheet.create({ librarySummary: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 17, marginBottom: 14 }, libraryMetric: { flex: 1, alignItems: 'center' }, libraryValue: { color: '#fff', fontSize: 22, fontWeight: '900' }, libraryLabel: { color: '#ddd5ff', fontSize: 10, marginTop: 3 }, libraryDivider: { width: 1, backgroundColor: '#ffffff30' }, libraryFilters: { flexDirection: 'row', backgroundColor: '#ececf4', borderRadius: 14, padding: 4, marginBottom: 15 }, libraryFilter: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 }, libraryFilterActive: { backgroundColor: '#fff', ...shadow }, libraryFilterText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, libraryFilterTextActive: { color: colors.primary }, libraryCard: { backgroundColor: '#fff', borderRadius: 21, padding: 14, marginBottom: 16, ...shadow }, libraryImage: { width: '100%', height: 154, borderRadius: 16 }, libraryStatus: { position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1edff', borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6 }, libraryStatusDone: { backgroundColor: '#e9f9f1' }, libraryStatusText: { color: colors.primary, fontWeight: '900', fontSize: 10 }, libraryTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 13 }, libraryInstructor: { color: colors.muted, fontSize: 12, marginTop: 4 }, libraryHint: { color: colors.muted, fontSize: 10 }, placeholder: { backgroundColor: '#eee8ff', alignItems: 'center', justifyContent: 'center' }, muted: { color: colors.muted, fontSize: 12, marginTop: 4 }, track: { height: 8, backgroundColor: '#e9e5f7', borderRadius: 10, overflow: 'hidden', marginTop: 8 }, fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 10 }, percent: { color: colors.primary, fontWeight: '800', fontSize: 12 }, learningEyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11 }, learningTitle: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '900', marginTop: 4 }, progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }, progressText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, learningActions: { flexDirection: 'row', gap: 8, marginTop: 8 }, viewerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 12, ...shadow }, lessonType: { color: colors.primary, fontWeight: '900', fontSize: 11 }, viewerTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 5, marginBottom: 14 }, textViewer: { maxHeight: 390, backgroundColor: '#f8f7fc', borderRadius: 14, padding: 16, marginBottom: 12 }, contentText: { color: colors.ink, fontSize: 16, lineHeight: 27 }, video: { width: '100%', height: 220, backgroundColor: '#111', borderRadius: 14, marginBottom: 12 }, document: { width: '100%', height: 420, backgroundColor: '#f5f5f5', marginBottom: 8 }, missing: { minHeight: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f4fb', borderRadius: 14, marginBottom: 12 }, lessonNav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginTop: 6 }, navLink: { color: colors.primary, fontWeight: '900', fontSize: 12 }, swipeNote: { color: colors.muted, fontSize: 9 }, sidebarSection: { marginBottom: 18 }, sidebarSectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 8 }, sidebarLesson: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 13, marginBottom: 6, backgroundColor: '#fff' }, sidebarLessonActive: { backgroundColor: '#eee8ff' }, sidebarLessonTitle: { color: colors.ink, fontWeight: '700' }, completion: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.muted, textAlign: 'center', lineHeight: 26, fontWeight: '800' }, completionDone: { backgroundColor: colors.primary, color: '#fff', borderColor: colors.primary }, discussion: { marginTop: 24, backgroundColor: '#fff', borderRadius: 20, padding: 16, ...shadow }, comment: { flexDirection: 'row', gap: 10, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border }, reply: { marginLeft: 28, backgroundColor: '#f8f7fc', paddingHorizontal: 12, borderRadius: 12 }, commentAuthor: { color: colors.ink, fontWeight: '900' }, role: { color: colors.primary, fontSize: 9 }, commentText: { color: colors.ink, marginTop: 5, lineHeight: 21 }, discussionLink: { color: colors.primary, fontWeight: '800', marginTop: 7 }, deleteComment: { color: colors.danger, fontWeight: '700', fontSize: 12 }, replying: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eee8ff', padding: 10, borderRadius: 10, marginTop: 12 }, composer: { marginTop: 12 } });
