import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { getApiMessage } from '../api/client';
import { lessonsApi, sectionsApi, type LessonInput } from '../api/services';
import { BottomSheet, Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { CourseSection, Lesson, LessonType, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseBuilder'>;
type LessonDraft = { sectionId: string; lesson?: Lesson; title: string; lessonType: LessonType; content: string; durationSeconds: string; isPreview: boolean; isRequired: boolean; isPublished: boolean };

const blankLesson = (sectionId: string): LessonDraft => ({ sectionId, title: '', lessonType: 'TEXT', content: '', durationSeconds: '', isPreview: false, isRequired: true, isPublished: false });

export function CourseBuilderScreen({ route, navigation }: Props) {
  const { course } = route.params;
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionDraft, setSectionDraft] = useState<{ id?: string; title: string } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ sectionId: string; lesson: Lesson } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSections((await sectionsApi.list(course.id)).data.data); setError(''); }
    catch (e) { setError(getApiMessage(e)); }
    finally { setLoading(false); }
  }, [course.id]);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);

  async function saveSection() {
    if (!sectionDraft?.title.trim()) return;
    setSaving(true);
    try {
      if (sectionDraft.id) await sectionsApi.update(sectionDraft.id, { title: sectionDraft.title.trim() });
      else await sectionsApi.create(course.id, { title: sectionDraft.title.trim() });
      setSectionDraft(null); await load();
    } catch (e) { Alert.alert('Không thể lưu chương', getApiMessage(e)); }
    finally { setSaving(false); }
  }

  function removeSection(section: CourseSection) {
    Alert.alert('Xóa chương?', 'Tất cả bài học và file trong chương cũng sẽ bị xóa.', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await sectionsApi.remove(section.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } },
    ]);
  }

  function editLesson(sectionId: string, lesson: Lesson) {
    setLessonDraft({ sectionId, lesson, title: lesson.title, lessonType: lesson.lessonType, content: lesson.content || '', durationSeconds: lesson.durationSeconds ? String(lesson.durationSeconds) : '', isPreview: lesson.isPreview, isRequired: lesson.isRequired, isPublished: lesson.isPublished });
  }

  async function saveLesson() {
    if (!lessonDraft?.title.trim()) return;
    const existingFile = lessonDraft.lessonType === 'VIDEO' ? lessonDraft.lesson?.videoUrl : lessonDraft.lesson?.documentUrl;
    const input: LessonInput = {
      title: lessonDraft.title.trim(), lessonType: lessonDraft.lessonType,
      content: lessonDraft.lessonType === 'TEXT' ? lessonDraft.content.trim() || null : null,
      durationSeconds: lessonDraft.durationSeconds ? Number(lessonDraft.durationSeconds) : null,
      isPreview: lessonDraft.isPreview, isRequired: lessonDraft.isRequired,
      isPublished: lessonDraft.lessonType === 'TEXT' || existingFile ? lessonDraft.isPublished : false,
    };
    setSaving(true);
    try {
      if (lessonDraft.lesson) await lessonsApi.update(lessonDraft.lesson.id, input);
      else await lessonsApi.create(lessonDraft.sectionId, input);
      setLessonDraft(null); await load();
    } catch (e) { Alert.alert('Không thể lưu bài học', getApiMessage(e)); }
    finally { setSaving(false); }
  }

  function removeLesson(lesson: Lesson) {
    Alert.alert('Xóa bài học?', lesson.title, [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await lessonsApi.remove(lesson.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } },
    ]);
  }

  async function pickLessonFile(lesson: Lesson) {
    const result = await DocumentPicker.getDocumentAsync({ type: lesson.lessonType === 'VIDEO' ? ['video/mp4', 'video/webm'] : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], copyToCacheDirectory: true });
    if (result.canceled) return;
    setUploadingId(lesson.id);
    try { const asset = result.assets[0]; await lessonsApi.uploadFile(lesson.id, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType }); await load(); }
    catch (e) { Alert.alert('Tải file thất bại', getApiMessage(e)); }
    finally { setUploadingId(null); }
  }

  const lessonCount = sections.reduce((total, section) => total + section.lessons.length, 0);
  const publishedCount = sections.reduce((total, section) => total + section.lessons.filter(lesson => lesson.isPublished).length, 0);
  return <View style={builderPhaseStyles.page}><Screen refreshing={loading} onRefresh={load}>
    <SectionTitle title="Xây dựng khóa học" subtitle={course.title} />
    <View style={builderPhaseStyles.summary}><BuilderMetric value={sections.length} label="Chương" /><View style={builderPhaseStyles.summaryDivider} /><BuilderMetric value={lessonCount} label="Bài học" /><View style={builderPhaseStyles.summaryDivider} /><BuilderMetric value={publishedCount} label="Đã xuất bản" /></View>
    <View style={builderPhaseStyles.builderTools}><BuilderTool icon="document-text-outline" title="Bài tập" note="Tạo và chấm bài" onPress={() => navigation.navigate('AssignmentManager', { courseId: course.id, courseTitle: course.title })} /><BuilderTool icon="megaphone-outline" title="Thông báo" note="Gửi đến học viên" onPress={() => navigation.navigate('Announcements', { courseId: course.id, courseTitle: course.title })} /></View>
    <Button title="＋ Thêm chương mới" onPress={() => setSectionDraft({ title: '' })} />
    {loading || error || !sections.length ? <StateView loading={loading} error={error} empty="Chưa có chương nào" onRetry={load} /> : sections.map((section, sectionIndex) =>
      <View key={section.id} style={builderPhaseStyles.sectionCard}>
        <View style={builderPhaseStyles.headingRow}><View style={builderPhaseStyles.chapterNumber}><Text style={builderPhaseStyles.chapterNumberText}>{sectionIndex + 1}</Text></View><View style={{ flex: 1 }}><Text style={builderPhaseStyles.eyebrow}>CHƯƠNG {sectionIndex + 1} · {section.lessons.length} BÀI</Text><Text style={builderPhaseStyles.sectionTitle}>{section.title}</Text></View>
          <BuilderIconButton icon="create-outline" label="Sửa chương" onPress={() => setSectionDraft({ id: section.id, title: section.title })} />
          <BuilderIconButton icon="trash-outline" label="Xóa chương" danger onPress={() => removeSection(section)} />
        </View>
        {section.lessons.map((lesson, lessonIndex) => <Pressable accessibilityRole="button" accessibilityLabel={`Tùy chọn bài ${lesson.title}`} onPress={() => setSelectedLesson({ sectionId: section.id, lesson })} key={lesson.id} style={builderPhaseStyles.lessonRow}>
          <View style={builderPhaseStyles.lessonIcon}><Ionicons name={lessonTypeIcon[lesson.lessonType]} size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={2} style={builderPhaseStyles.lessonTitle}>{lessonIndex + 1}. {lesson.title}</Text><View style={builderPhaseStyles.lessonMeta}><Text style={builderPhaseStyles.meta}>{typeName[lesson.lessonType]}</Text><View style={[builderPhaseStyles.statusDot, lesson.isPublished && builderPhaseStyles.statusDotLive]} /><Text style={[builderPhaseStyles.meta, lesson.isPublished && { color: colors.success }]}>{lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Text>{uploadingId === lesson.id && <Text style={builderPhaseStyles.uploading}>Đang tải file...</Text>}</View></View><Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
        </Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => setLessonDraft(blankLesson(section.id))} style={builderPhaseStyles.addLesson}><Ionicons name="add-circle-outline" size={20} color={colors.primary} /><Text style={builderPhaseStyles.addLessonText}>Thêm bài học</Text></Pressable>
      </View>)}

    <BottomSheet visible={!!selectedLesson} title={selectedLesson?.lesson.title || 'Tùy chọn bài học'} onClose={() => setSelectedLesson(null)}>{selectedLesson && <View>
      {(selectedLesson.lesson.lessonType === 'VIDEO' || selectedLesson.lesson.lessonType === 'DOCUMENT') && <SheetAction icon="cloud-upload-outline" title={selectedLesson.lesson.videoUrl || selectedLesson.lesson.documentUrl ? 'Thay file nội dung' : 'Tải file nội dung'} note={selectedLesson.lesson.lessonType === 'VIDEO' ? 'MP4 hoặc WebM' : 'PDF, Word hoặc PowerPoint'} onPress={() => { const lesson = selectedLesson.lesson; setSelectedLesson(null); void pickLessonFile(lesson); }} />}
      <SheetAction icon="help-circle-outline" title={selectedLesson.lesson.quiz ? 'Chỉnh sửa quiz' : 'Thêm quiz'} note="Câu hỏi, đáp án và điểm" onPress={() => { const lesson = selectedLesson.lesson; setSelectedLesson(null); navigation.navigate('QuizBuilder', { lesson }); }} />
      <SheetAction icon="create-outline" title="Chỉnh sửa bài học" note="Tên, nội dung và trạng thái" onPress={() => { editLesson(selectedLesson.sectionId, selectedLesson.lesson); setSelectedLesson(null); }} />
      <SheetAction icon="trash-outline" title="Xóa bài học" note="Hành động này không thể hoàn tác" danger onPress={() => { const lesson = selectedLesson.lesson; setSelectedLesson(null); removeLesson(lesson); }} />
    </View>}</BottomSheet>

    <Modal visible={!!sectionDraft} transparent animationType="fade" onRequestClose={() => setSectionDraft(null)}>
      <View style={styles.overlay}><View style={styles.modal}><Text style={styles.modalTitle}>{sectionDraft?.id ? 'Sửa chương' : 'Thêm chương'}</Text><Field label="Tên chương" value={sectionDraft?.title || ''} onChangeText={title => setSectionDraft(old => old ? { ...old, title } : old)} autoFocus /><Button title="Lưu chương" onPress={saveSection} loading={saving} /><Button title="Hủy" variant="ghost" onPress={() => setSectionDraft(null)} /></View></View>
    </Modal>
    <Modal visible={!!lessonDraft} animationType="slide" onRequestClose={() => setLessonDraft(null)}>
      <Screen><SectionTitle title={lessonDraft?.lesson ? 'Sửa bài học' : 'Thêm bài học'} subtitle="File video/tài liệu được tải lên sau khi lưu bài" />
        <Field label="Tên bài học" value={lessonDraft?.title || ''} onChangeText={title => setLessonDraft(old => old ? { ...old, title } : old)} />
        <Text style={styles.label}>Loại nội dung</Text><View style={styles.picker}><Picker selectedValue={lessonDraft?.lessonType} enabled={!lessonDraft?.lesson} onValueChange={(lessonType: LessonType) => setLessonDraft(old => old ? { ...old, lessonType } : old)}><Picker.Item label="Văn bản" value="TEXT" /><Picker.Item label="Video" value="VIDEO" /><Picker.Item label="Tài liệu" value="DOCUMENT" /></Picker></View>
        {lessonDraft?.lessonType === 'TEXT' && <Field label="Nội dung" value={lessonDraft.content} onChangeText={content => setLessonDraft(old => old ? { ...old, content } : old)} multiline />}
        {lessonDraft?.lessonType === 'VIDEO' && <Field label="Thời lượng (giây)" value={lessonDraft.durationSeconds} onChangeText={durationSeconds => setLessonDraft(old => old ? { ...old, durationSeconds } : old)} keyboardType="numeric" />}
        <Toggle label="Bắt buộc hoàn thành" value={lessonDraft?.isRequired || false} onPress={() => setLessonDraft(old => old ? { ...old, isRequired: !old.isRequired } : old)} />
        <Toggle label="Cho phép xem trước" value={lessonDraft?.isPreview || false} onPress={() => setLessonDraft(old => old ? { ...old, isPreview: !old.isPreview } : old)} />
        {(lessonDraft?.lessonType === 'TEXT' || lessonDraft?.lesson?.videoUrl || lessonDraft?.lesson?.documentUrl)
          ? <Toggle label="Xuất bản bài học" value={lessonDraft?.isPublished || false} onPress={() => setLessonDraft(old => old ? { ...old, isPublished: !old.isPublished } : old)} />
          : <Text style={styles.fileHint}>Lưu bài và tải file lên trước khi xuất bản.</Text>}
        <Button title="Lưu bài học" onPress={saveLesson} loading={saving} /><Button title="Hủy" variant="ghost" onPress={() => setLessonDraft(null)} />
      </Screen>
    </Modal>
  </Screen></View>;
}

function BuilderMetric({ value, label }: { value: number; label: string }) { return <View style={builderPhaseStyles.metric}><Text style={builderPhaseStyles.metricValue}>{value}</Text><Text style={builderPhaseStyles.metricLabel}>{label}</Text></View>; }
function BuilderTool({ icon, title, note, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; note: string; onPress(): void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={builderPhaseStyles.builderTool}><View style={builderPhaseStyles.builderToolIcon}><Ionicons name={icon} size={22} color={colors.primary} /></View><Text style={builderPhaseStyles.builderToolTitle}>{title}</Text><Text style={builderPhaseStyles.builderToolNote}>{note}</Text></Pressable>; }
function BuilderIconButton({ icon, label, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; danger?: boolean; onPress(): void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={7} onPress={onPress} style={builderPhaseStyles.iconButton}><Ionicons name={icon} size={19} color={danger ? colors.danger : colors.primary} /></Pressable>; }
function SheetAction({ icon, title, note, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; note: string; danger?: boolean; onPress(): void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={builderPhaseStyles.sheetAction}><View style={[builderPhaseStyles.sheetActionIcon, danger && { backgroundColor: '#fff0f1' }]}><Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} /></View><View style={{ flex: 1 }}><Text style={[builderPhaseStyles.sheetActionTitle, danger && { color: colors.danger }]}>{title}</Text><Text style={builderPhaseStyles.sheetActionNote}>{note}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable>; }
const lessonTypeIcon: Record<LessonType, keyof typeof Ionicons.glyphMap> = { VIDEO: 'play-circle-outline', TEXT: 'reader-outline', DOCUMENT: 'document-attach-outline' };

const builderPhaseStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, summary: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 16, marginBottom: 13 }, metric: { flex: 1, alignItems: 'center' }, metricValue: { color: '#fff', fontSize: 22, fontWeight: '900' }, metricLabel: { color: '#ddd5ff', fontSize: 10, marginTop: 3 }, summaryDivider: { width: 1, backgroundColor: '#ffffff2d' },
  builderTools: { flexDirection: 'row', gap: 10, marginBottom: 8 }, builderTool: { flex: 1, minHeight: 112, backgroundColor: '#fff', borderRadius: 18, padding: 13 }, builderToolIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, builderToolTitle: { color: colors.ink, fontWeight: '900', marginTop: 9 }, builderToolNote: { color: colors.muted, fontSize: 10, marginTop: 3 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 14, marginTop: 14 }, headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 }, chapterNumber: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, chapterNumberText: { color: '#fff', fontWeight: '900' }, eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 9 }, sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 17, marginTop: 3 }, iconButton: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#f6f5fa', alignItems: 'center', justifyContent: 'center' },
  lessonRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 11 }, lessonIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, lessonTitle: { color: colors.ink, fontWeight: '800', lineHeight: 20 }, lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }, meta: { color: colors.muted, fontSize: 10 }, statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#a4a8b3' }, statusDotLive: { backgroundColor: colors.success }, uploading: { color: colors.primary, fontSize: 9, fontWeight: '800' }, addLesson: { minHeight: 48, borderRadius: 14, backgroundColor: '#f6f3ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8 }, addLessonText: { color: colors.primary, fontWeight: '900' },
  sheetAction: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, sheetActionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, sheetActionTitle: { color: colors.ink, fontWeight: '900' }, sheetActionNote: { color: colors.muted, fontSize: 10, marginTop: 3 },
});

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress(): void }) { return <Pressable style={styles.toggle} onPress={onPress}><View style={[styles.box, value && styles.boxOn]}><Text style={{ color: '#fff' }}>{value ? '✓' : ''}</Text></View><Text style={styles.toggleText}>{label}</Text></Pressable>; }
const typeName = { VIDEO: 'Video', TEXT: 'Văn bản', DOCUMENT: 'Tài liệu' };
const styles = StyleSheet.create({ builderTools: { flexDirection: 'row', gap: 8, marginBottom: 6 }, sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 14, ...shadow }, headingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }, eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11 }, sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 18, marginTop: 3 }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14 }, lessonTitle: { color: colors.ink, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 12, marginTop: 3 }, link: { color: colors.primary, fontWeight: '800', fontSize: 12 }, danger: { color: colors.danger, fontWeight: '800', fontSize: 12 }, overlay: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 22 }, modal: { backgroundColor: '#fff', borderRadius: 20, padding: 20 }, modalTitle: { color: colors.ink, fontWeight: '900', fontSize: 22, marginBottom: 18 }, label: { color: colors.ink, fontWeight: '700', marginBottom: 7 }, picker: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 15 }, toggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, box: { width: 24, height: 24, borderWidth: 2, borderColor: colors.primary, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, boxOn: { backgroundColor: colors.primary }, toggleText: { color: colors.ink, fontWeight: '600', marginLeft: 10 }, fileHint: { color: colors.muted, backgroundColor: '#f3f0fb', padding: 12, borderRadius: 10, marginBottom: 15 } });
