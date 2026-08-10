import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoriesApi, coursesApi, enrollmentsApi, reviewsApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { CourseCard, money } from '../components/CourseCard';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { Category, Course, Review, RootStackParamList } from '../types';
import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';

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
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null); const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]); const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 }); const [rating, setRating] = useState(0); const [reviewText, setReviewText] = useState(''); const [savingReview, setSavingReview] = useState(false);
  const loadReviews = useCallback(async (courseId: string) => { const result = (await reviewsApi.list(courseId)).data.data; setReviews(result.items); setReviewSummary(result.summary); const own = result.items.find(item => item.user.id === user?.id); if (own) { setRating(own.rating); setReviewText(own.content || ''); } }, [user?.id]);
  const load = useCallback(async () => { try { const item = (await coursesApi.detail(route.params.slug)).data.data; setCourse(item); await loadReviews(item.id); } catch (e) { setError(getApiMessage(e)); } }, [route.params.slug, loadReviews]);
  useEffect(() => { void load(); }, [load]);
  async function enroll() {
    if (!course) return;
    setEnrolling(true);
    try { await enrollmentsApi.enroll(course.id); navigation.navigate('MyCourses'); }
    catch (e) {
      const message = getApiMessage(e);
      if (message.toLowerCase().includes('already enrolled')) navigation.navigate('MyCourses');
      else setError(message);
    } finally { setEnrolling(false); }
  }
  async function saveReview() { if (!course || !rating) return; setSavingReview(true); try { const own = reviews.find(item => item.user.id === user?.id); if (own) await reviewsApi.update(own.id, { rating, content: reviewText.trim() || null }); else await reviewsApi.create(course.id, { rating, content: reviewText.trim() || null }); await loadReviews(course.id); Alert.alert('Cảm ơn bạn', 'Đánh giá đã được lưu.'); } catch (e) { Alert.alert('Không thể đánh giá', getApiMessage(e)); } finally { setSavingReview(false); } }
  if (!course) return <Screen><StateView loading={!error} error={error} onRetry={load} /></Screen>;
  return <Screen>{course.thumbnailUrl ? <Image source={{ uri: course.thumbnailUrl }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.placeholder]}><Text style={{ fontSize: 64, color: colors.primary }}>▤</Text></View>}
    <Text style={styles.category}>{course.category?.name}</Text><Text style={styles.title}>{course.title}</Text>
    <Text style={styles.by}>Giảng viên: {course.instructor?.fullName}</Text><Text style={styles.price}>{course.isFree ? 'Miễn phí' : money(course.price)}</Text>
    <Text style={styles.h2}>Giới thiệu</Text><Text style={styles.body}>{course.description}</Text>
    {!!course.learningOutcomes && <><Text style={styles.h2}>Bạn sẽ học được gì?</Text><Text style={styles.body}>{course.learningOutcomes}</Text></>}
    {!!course.requirements && <><Text style={styles.h2}>Yêu cầu</Text><Text style={styles.body}>{course.requirements}</Text></>}
    <View style={styles.reviewHeader}><View><Text style={styles.h2}>Đánh giá khóa học</Text><Text style={styles.ratingSummary}>{reviewSummary.averageRating.toFixed(1)} ★ · {reviewSummary.totalReviews} đánh giá</Text></View></View>
    {user?.role === 'STUDENT' && <View style={styles.reviewForm}><Text style={styles.reviewLabel}>Đánh giá của bạn</Text><Stars value={rating} onChange={setRating} /><Field label="Nhận xét" value={reviewText} onChangeText={setReviewText} multiline placeholder="Chia sẻ trải nghiệm học tập..." /><Button title={reviews.some(item => item.user.id === user.id) ? 'Cập nhật đánh giá' : 'Gửi đánh giá'} onPress={saveReview} loading={savingReview} disabled={!rating} /></View>}
    {reviews.map(review => <View key={review.id} style={styles.review}><View style={styles.reviewTop}><Text style={styles.reviewer}>{review.user.fullName}</Text><Text style={styles.starsSmall}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text></View>{!!review.content && <Text style={styles.body}>{review.content}</Text>}</View>)}
    {!user && <Button title="Đăng nhập để bắt đầu" onPress={() => navigation.navigate('Login')} />}
    {user?.role === 'STUDENT' && course.isFree && <Button title="Đăng ký miễn phí" onPress={enroll} loading={enrolling} />}
  </Screen>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  return <Text onPress={onPress} style={[styles.chip, active && styles.chipActive]}>{label}</Text>;
}
function Stars({ value, onChange }: { value: number; onChange(value: number): void }) { return <View style={styles.stars}>{[1, 2, 3, 4, 5].map(star => <Pressable key={star} onPress={() => onChange(star)}><Text style={[styles.star, star <= value && styles.starOn]}>★</Text></Pressable>)}</View>; }
const styles = StyleSheet.create({ chip: { color: colors.muted, paddingVertical: 9, paddingHorizontal: 15, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', overflow: 'hidden' }, chipActive: { color: '#fff', backgroundColor: colors.primary, borderColor: colors.primary }, heroImage: { width: '100%', height: 210, borderRadius: 20, marginBottom: 20 }, placeholder: { backgroundColor: '#ede8ff', alignItems: 'center', justifyContent: 'center' }, category: { color: colors.primary, fontWeight: '700' }, title: { color: colors.ink, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 8 }, by: { color: colors.muted, marginTop: 10 }, price: { color: colors.primary, fontSize: 22, fontWeight: '900', marginTop: 14 }, h2: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 25, marginBottom: 7 }, body: { color: colors.muted, fontSize: 16, lineHeight: 25 }, reviewHeader: { marginTop: 12 }, ratingSummary: { color: colors.warning, fontWeight: '900', fontSize: 17 }, reviewForm: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 14 }, reviewLabel: { color: colors.ink, fontWeight: '800' }, stars: { flexDirection: 'row', gap: 5, marginVertical: 10 }, star: { color: '#d5d7df', fontSize: 34 }, starOn: { color: colors.warning }, review: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14 }, reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, reviewer: { color: colors.ink, fontWeight: '900' }, starsSmall: { color: colors.warning, fontSize: 15 } });
