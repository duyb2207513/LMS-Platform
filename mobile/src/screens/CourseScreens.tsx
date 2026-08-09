import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoriesApi, coursesApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { CourseCard, money } from '../components/CourseCard';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { Category, Course, RootStackParamList } from '../types';
import { colors } from '../theme';

export function CoursesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Courses'>) {
  const [courses, setCourses] = useState<Course[]>([]); const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(''); const [categoryId, setCategory] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [courseResult, categoryResult] = await Promise.all([coursesApi.list({ search: search || undefined, categoryId: categoryId || undefined, limit: 30 }), categoriesApi.list()]);
      setCourses(courseResult.data.data); setCategories(categoryResult.data.data);
    } catch (e) { setError(getApiMessage(e, 'Không thể tải khóa học')); } finally { setLoading(false); }
  }, [search, categoryId]);
  useEffect(() => { void load(); }, [load]);
  return <Screen scroll={false}><SectionTitle title="Khóa học" subtitle="Tìm khóa học phù hợp với mục tiêu của bạn" />
    <Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Nhập tên khóa học..." returnKeyType="search" onSubmitEditing={load} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }}>
      <Chip label="Tất cả" active={!categoryId} onPress={() => setCategory('')} />
      {categories.map(item => <Chip key={item.id} label={item.name} active={categoryId === item.id} onPress={() => setCategory(item.id)} />)}
    </ScrollView>
    {loading || error || !courses.length ? <StateView loading={loading} error={error} empty="Chưa có khóa học phù hợp" onRetry={load} />
      : <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} showsVerticalScrollIndicator={false}>
        {courses.map(course => <CourseCard key={course.id} course={course} onPress={() => navigation.navigate('CourseDetail', { slug: course.slug })} />)}
      </ScrollView>}
  </Screen>;
}

export function CourseDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'CourseDetail'>) {
  const [course, setCourse] = useState<Course | null>(null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { setCourse((await coursesApi.detail(route.params.slug)).data.data); } catch (e) { setError(getApiMessage(e)); } }, [route.params.slug]);
  useEffect(() => { void load(); }, [load]);
  if (!course) return <Screen><StateView loading={!error} error={error} onRetry={load} /></Screen>;
  return <Screen>{course.thumbnailUrl ? <Image source={{ uri: course.thumbnailUrl }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.placeholder]}><Text style={{ fontSize: 64, color: colors.primary }}>▤</Text></View>}
    <Text style={styles.category}>{course.category?.name}</Text><Text style={styles.title}>{course.title}</Text>
    <Text style={styles.by}>Giảng viên: {course.instructor?.fullName}</Text><Text style={styles.price}>{course.isFree ? 'Miễn phí' : money(course.price)}</Text>
    <Text style={styles.h2}>Giới thiệu</Text><Text style={styles.body}>{course.description}</Text>
    {!!course.learningOutcomes && <><Text style={styles.h2}>Bạn sẽ học được gì?</Text><Text style={styles.body}>{course.learningOutcomes}</Text></>}
    {!!course.requirements && <><Text style={styles.h2}>Yêu cầu</Text><Text style={styles.body}>{course.requirements}</Text></>}
    <Button title="Đăng nhập để bắt đầu" onPress={() => navigation.navigate('Login')} />
  </Screen>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  return <Text onPress={onPress} style={[styles.chip, active && styles.chipActive]}>{label}</Text>;
}
const styles = StyleSheet.create({ chip: { color: colors.muted, paddingVertical: 9, paddingHorizontal: 15, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', overflow: 'hidden' }, chipActive: { color: '#fff', backgroundColor: colors.primary, borderColor: colors.primary }, heroImage: { width: '100%', height: 210, borderRadius: 20, marginBottom: 20 }, placeholder: { backgroundColor: '#ede8ff', alignItems: 'center', justifyContent: 'center' }, category: { color: colors.primary, fontWeight: '700' }, title: { color: colors.ink, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 8 }, by: { color: colors.muted, marginTop: 10 }, price: { color: colors.primary, fontSize: 22, fontWeight: '900', marginTop: 14 }, h2: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 25, marginBottom: 7 }, body: { color: colors.muted, fontSize: 16, lineHeight: 25 } });
