import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { getApiMessage } from '../api/client';
import { lessonsApi, sectionsApi, type LessonInput } from '../api/services';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { CourseSection, Lesson, LessonType, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseBuilder'>;
type LessonDraft = { sectionId: string; lesson?: Lesson; title: string; lessonType: LessonType; content: string; durationSeconds: string; isPreview: boolean; isRequired: boolean; isPublished: boolean };

const blankLesson = (sectionId: string): LessonDraft => ({ sectionId, title: '', lessonType: 'TEXT', content: '', durationSeconds: '', isPreview: false, isRequired: true, isPublished: false });

export function CourseBuilderScreen({ route }: Props) {
  const { course } = route.params;
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionDraft, setSectionDraft] = useState<{ id?: string; title: string } | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSections((await sectionsApi.list(course.id)).data.data); setError(''); }
    catch (e) { setError(getApiMessage(e)); }
    finally { setLoading(false); }
  }, [course.id]);
  useEffect(() => { void load(); }, [load]);

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

  return <Screen>
    <SectionTitle title="Course builder" subtitle={course.title} />
    <Button title="+ Thêm chương" onPress={() => setSectionDraft({ title: '' })} />
    {loading || error || !sections.length ? <StateView loading={loading} error={error} empty="Chưa có chương nào" onRetry={load} /> : sections.map((section, sectionIndex) =>
      <View key={section.id} style={styles.sectionCard}>
        <View style={styles.headingRow}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>CHƯƠNG {sectionIndex + 1}</Text><Text style={styles.sectionTitle}>{section.title}</Text></View>
          <Pressable onPress={() => setSectionDraft({ id: section.id, title: section.title })}><Text style={styles.link}>Sửa</Text></Pressable>
          <Pressable onPress={() => removeSection(section)}><Text style={styles.danger}>Xóa</Text></Pressable>
        </View>
        {section.lessons.map((lesson, lessonIndex) => <View key={lesson.id} style={styles.lessonRow}>
          <View style={{ flex: 1 }}><Text style={styles.lessonTitle}>{lessonIndex + 1}. {lesson.title}</Text><Text style={styles.meta}>{typeName[lesson.lessonType]} · {lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</Text></View>
          {(lesson.lessonType === 'VIDEO' || lesson.lessonType === 'DOCUMENT') && <Pressable disabled={uploadingId === lesson.id} onPress={() => void pickLessonFile(lesson)}><Text style={styles.link}>{uploadingId === lesson.id ? 'Đang tải...' : lesson.videoUrl || lesson.documentUrl ? 'Đổi file' : 'Tải file'}</Text></Pressable>}
          <Pressable onPress={() => editLesson(section.id, lesson)}><Text style={styles.link}>Sửa</Text></Pressable>
          <Pressable onPress={() => removeLesson(lesson)}><Text style={styles.danger}>Xóa</Text></Pressable>
        </View>)}
        <Button title="+ Thêm bài học" variant="outline" onPress={() => setLessonDraft(blankLesson(section.id))} />
      </View>)}

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
  </Screen>;
}

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress(): void }) { return <Pressable style={styles.toggle} onPress={onPress}><View style={[styles.box, value && styles.boxOn]}><Text style={{ color: '#fff' }}>{value ? '✓' : ''}</Text></View><Text style={styles.toggleText}>{label}</Text></Pressable>; }
const typeName = { VIDEO: 'Video', TEXT: 'Văn bản', DOCUMENT: 'Tài liệu' };
const styles = StyleSheet.create({ sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 14, ...shadow }, headingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }, eyebrow: { color: colors.primary, fontWeight: '900', fontSize: 11 }, sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 18, marginTop: 3 }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14 }, lessonTitle: { color: colors.ink, fontWeight: '700' }, meta: { color: colors.muted, fontSize: 12, marginTop: 3 }, link: { color: colors.primary, fontWeight: '800', fontSize: 12 }, danger: { color: colors.danger, fontWeight: '800', fontSize: 12 }, overlay: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 22 }, modal: { backgroundColor: '#fff', borderRadius: 20, padding: 20 }, modalTitle: { color: colors.ink, fontWeight: '900', fontSize: 22, marginBottom: 18 }, label: { color: colors.ink, fontWeight: '700', marginBottom: 7 }, picker: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 15 }, toggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, box: { width: 24, height: 24, borderWidth: 2, borderColor: colors.primary, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, boxOn: { backgroundColor: colors.primary }, toggleText: { color: colors.ink, fontWeight: '600', marginLeft: 10 }, fileHint: { color: colors.muted, backgroundColor: '#f3f0fb', padding: 12, borderRadius: 10, marginBottom: 15 } });
