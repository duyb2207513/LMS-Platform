import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { categoriesApi, coursesApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { Category, Course, CourseInput, CourseLevel, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

export function InstructorCoursesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'InstructorCourses'>) {
  const [items, setItems] = useState<Course[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems((await coursesApi.managed({ limit: 50 })).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { const unsubscribe = navigation.addListener('focus', () => { void load(); }); return unsubscribe; }, [navigation, load]);
  async function toggle(course: Course) { try { course.status === 'PUBLISHED' ? await coursesApi.unpublish(course.id) : await coursesApi.publish(course.id); await load(); } catch (e) { Alert.alert('Không thể đổi trạng thái', getApiMessage(e)); } }
  function remove(course: Course) { Alert.alert('Xóa khóa học?', 'Khóa học đã xuất bản sẽ được lưu trữ.', [{ text: 'Hủy' }, { text: 'Xác nhận', style: 'destructive', onPress: async () => { try { await coursesApi.remove(course.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } }]); }
  return <Screen><SectionTitle title="Khóa học của tôi" subtitle="Tạo, chỉnh sửa và xuất bản nội dung" /><Button title="+ Tạo khóa học" onPress={() => navigation.navigate('CourseForm')} />
    {loading || error || !items.length ? <StateView loading={loading} error={error} empty="Bạn chưa có khóa học nào" onRetry={load} /> : items.map(course => <View key={course.id} style={styles.card}>
      {course.thumbnailUrl ? <Image source={{ uri: course.thumbnailUrl }} style={styles.thumb} /> : <View style={[styles.thumb, styles.fallback]}><Text style={{ color: colors.primary, fontSize: 28 }}>▤</Text></View>}
      <View style={{ flex: 1 }}><View style={styles.row}><Text style={styles.status}>{course.status}</Text><Text style={styles.level}>{course.level}</Text></View><Text style={styles.title}>{course.title}</Text><Text style={styles.category}>{course.category?.name}</Text>
        <View style={styles.actions}><Pressable onPress={() => navigation.navigate('CourseForm', { course })}><Text style={styles.action}>Sửa</Text></Pressable>{course.status !== 'ARCHIVED' && <Pressable onPress={() => toggle(course)}><Text style={styles.action}>{course.status === 'PUBLISHED' ? 'Gỡ' : 'Xuất bản'}</Text></Pressable>}<Pressable onPress={() => remove(course)}><Text style={styles.danger}>Xóa</Text></Pressable></View>
      </View></View>)}
  </Screen>;
}

export function CourseFormScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'CourseForm'>) {
  const course = route.params?.course; const [categories, setCategories] = useState<Category[]>([]); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [imageUri, setImageUri] = useState<string | null>(null);
  const [form, setForm] = useState({ title: course?.title || '', description: course?.description || '', categoryId: course?.categoryId || course?.category?.id || '', level: course?.level || 'BEGINNER' as CourseLevel, price: String(course?.price || 0), isFree: course?.isFree || false, language: course?.language || 'Vietnamese', requirements: course?.requirements || '', learningOutcomes: course?.learningOutcomes || '' });
  useEffect(() => { categoriesApi.list().then(({ data }) => { setCategories(data.data); if (!form.categoryId && data.data[0]) setForm(old => ({ ...old, categoryId: data.data[0].id })); }).catch(e => setError(getApiMessage(e))); }, []);
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm(old => ({ ...old, [key]: value }));
  async function pickImage() { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return Alert.alert('Cần quyền truy cập ảnh'); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8, allowsEditing: true, aspect: [16, 9] }); if (!result.canceled) setImageUri(result.assets[0].uri); }
  async function save() {
    const input: CourseInput = { title: form.title.trim(), description: form.description.trim(), categoryId: form.categoryId, level: form.level, price: form.isFree ? 0 : Number(form.price), isFree: form.isFree, language: form.language.trim(), requirements: form.requirements.trim() || null, learningOutcomes: form.learningOutcomes.trim() || null };
    setSaving(true); setError('');
    try { const saved = course ? (await coursesApi.update(course.id, input)).data.data : (await coursesApi.create(input)).data.data; if (imageUri) await coursesApi.uploadThumbnail(saved.id, imageUri); Alert.alert('Thành công', course ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học nháp.', [{ text: 'OK', onPress: navigation.goBack }]); }
    catch (e) { setError(getApiMessage(e, 'Không thể lưu khóa học')); } finally { setSaving(false); }
  }
  return <Screen><SectionTitle title={course ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'} subtitle="Thông tin đầy đủ giúp khóa học dễ được tìm thấy" />
    <Field label="Tên khóa học" value={form.title} onChangeText={set('title')} />
    <Field label="Mô tả" value={form.description} onChangeText={set('description')} multiline />
    <Text style={styles.label}>Danh mục</Text><View style={styles.picker}><Picker selectedValue={form.categoryId} onValueChange={set('categoryId')}>{categories.map(item => <Picker.Item key={item.id} label={item.name} value={item.id} />)}</Picker></View>
    <Text style={styles.label}>Trình độ</Text><View style={styles.picker}><Picker selectedValue={form.level} onValueChange={set('level')}><Picker.Item label="Cơ bản" value="BEGINNER" /><Picker.Item label="Trung cấp" value="INTERMEDIATE" /><Picker.Item label="Nâng cao" value="ADVANCED" /></Picker></View>
    <Pressable style={styles.checkRow} onPress={() => set('isFree')(!form.isFree)}><View style={[styles.check, form.isFree && styles.checked]}><Text style={{ color: '#fff' }}>{form.isFree ? '✓' : ''}</Text></View><Text style={styles.checkText}>Khóa học miễn phí</Text></Pressable>
    {!form.isFree && <Field label="Giá (VND)" value={form.price} onChangeText={set('price')} keyboardType="numeric" />}
    <Field label="Ngôn ngữ" value={form.language} onChangeText={set('language')} />
    <Field label="Yêu cầu" value={form.requirements} onChangeText={set('requirements')} multiline />
    <Field label="Kết quả học tập" value={form.learningOutcomes} onChangeText={set('learningOutcomes')} multiline />
    <Button title={imageUri ? 'Đã chọn ảnh — chọn lại' : 'Chọn ảnh thumbnail'} variant="outline" onPress={pickImage} />
    {!!imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}{!!error && <Text style={styles.error}>{error}</Text>}
    <Button title={course ? 'Lưu thay đổi' : 'Tạo khóa học'} onPress={save} loading={saving} disabled={!form.title.trim() || !form.description.trim() || !form.categoryId} />
  </Screen>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', gap: 13, backgroundColor: '#fff', padding: 13, marginTop: 13, borderRadius: 17, ...shadow }, thumb: { width: 88, height: 88, borderRadius: 13 }, fallback: { backgroundColor: '#eeeaff', alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', justifyContent: 'space-between' }, status: { color: colors.primary, fontSize: 10, fontWeight: '800' }, level: { color: colors.muted, fontSize: 10 }, title: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 7 }, category: { color: colors.muted, fontSize: 12, marginTop: 3 }, actions: { flexDirection: 'row', gap: 17, marginTop: 10 }, action: { color: colors.primary, fontWeight: '700' }, danger: { color: colors.danger, fontWeight: '700' }, label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 7 }, picker: { borderWidth: 1, borderColor: '#e8e9f2', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }, checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, check: { width: 24, height: 24, borderWidth: 2, borderColor: colors.primary, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.primary }, checkText: { marginLeft: 10, color: colors.ink, fontWeight: '600' }, preview: { width: '100%', height: 180, borderRadius: 15, marginVertical: 10 }, error: { color: colors.danger, marginVertical: 8 } });
