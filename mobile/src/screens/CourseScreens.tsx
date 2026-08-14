import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoriesApi, coursesApi, enrollmentsApi, reviewsApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { CourseCard, money } from '../components/CourseCard';
import { AppBar, Button, Field, ImageWithFallback, Screen, SectionTitle, Snackbar, StateView } from '../components/ui';
import type { Category, Course, Enrollment, Review, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../providers/ThemeProvider';

export function CoursesScreen({ navigation }: { navigation: any }) {
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
  return <Screen scroll={false} topInset><AppBar title="Khóa học" subtitle="Khám phá nội dung đang xuất bản" onSearch={() => navigation.navigate('SearchTab')} />
    <Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Nhập tên khóa học..." returnKeyType="search" onSubmitEditing={load} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }}>
      <Chip label="Tất cả" active={!categoryId} onPress={() => setCategory('')} />
      {categories.map(item => <Chip key={item.id} label={item.name} active={categoryId === item.id} onPress={() => setCategory(item.id)} />)}
    </ScrollView>
    <FlatList data={courses} keyExtractor={course => course.id} showsVerticalScrollIndicator={false}
      refreshing={loading && courses.length > 0} onRefresh={load}
      contentContainerStyle={courses.length ? styles.listContent : styles.emptyList}
      renderItem={({ item }) => <CourseCard course={item} onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })} />}
      ListEmptyComponent={<StateView loading={loading} error={error} empty="Chưa có khóa học phù hợp" onRetry={load} variant="list" />} />
  </Screen>;
}

export function CourseDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'CourseDetail'>) {
  const { user } = useAuth();
  const { palette, isDark } = useAppTheme();
  const [course, setCourse] = useState<Course | null>(null); const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [tab, setTab] = useState<'overview' | 'reviews'>('overview');
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]); const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, totalReviews: 0 }); const [rating, setRating] = useState(0); const [reviewText, setReviewText] = useState(''); const [savingReview, setSavingReview] = useState(false);
  const loadReviews = useCallback(async (courseId: string) => { const result = (await reviewsApi.list(courseId)).data.data; setReviews(result.items); setReviewSummary(result.summary); const own = result.items.find(item => item.user.id === user?.id); if (own) { setRating(own.rating); setReviewText(own.content || ''); } }, [user?.id]);
  const load = useCallback(async () => { try { const item = (await coursesApi.detail(route.params.slug)).data.data; setCourse(item); const tasks: Promise<unknown>[] = [loadReviews(item.id)]; if (user?.role === 'STUDENT') tasks.push(enrollmentsApi.mine().then(result => setEnrollment(result.data.data.find(row => row.courseId === item.id) || null))); await Promise.all(tasks); setError(''); } catch (e) { setError(getApiMessage(e)); } }, [route.params.slug, loadReviews, user?.role]);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);
  async function enroll() {
    if (!course) return;
    setEnrolling(true);
    try { const result = await enrollmentsApi.enroll(course.id); setEnrollment(result.data.data); navigation.navigate('Learning', { courseId: course.id, courseTitle: course.title }); }
    catch (e) {
      const message = getApiMessage(e);
      if (message.toLowerCase().includes('already enrolled')) navigation.navigate('MyCourses');
      else setError(message);
    } finally { setEnrolling(false); }
  }
  async function checkout() {
    if (!course) return;
    setOrdering(true);
    try { navigation.navigate('Checkout', { courseId: course.id, courseTitle: course.title, price: course.price }); }
    catch (e) { Alert.alert('Không thể mở thanh toán', getApiMessage(e)); }
    finally { setOrdering(false); }
  }
  async function saveReview() { if (!course || !rating) return; setSavingReview(true); try { const own = reviews.find(item => item.user.id === user?.id); if (own) await reviewsApi.update(own.id, { rating, content: reviewText.trim() || null }); else await reviewsApi.create(course.id, { rating, content: reviewText.trim() || null }); await loadReviews(course.id); setNotice({ message: 'Đánh giá đã được lưu.', tone: 'success' }); } catch (e) { setNotice({ message: getApiMessage(e, 'Không thể lưu đánh giá'), tone: 'danger' }); } finally { setSavingReview(false); } }
  if (!course) return <Screen><StateView loading={!error} error={error} onRetry={load} /></Screen>;
  return <View style={[styles.detailPage, { backgroundColor: palette.background }]}><Screen>
    <ImageWithFallback uri={course.thumbnailUrl} style={styles.heroImage} accessibilityLabel={`Ảnh khóa học ${course.title}`} />
    <View style={styles.badges}><Badge icon="layers-outline" label={levelName[course.level]} /><Badge icon="language-outline" label={course.language || 'Vietnamese'} /></View>
    <Text style={[styles.title, { color: palette.ink }]}>{course.title}</Text>
    <View style={styles.instructorRow}><View style={styles.instructorAvatar}>{course.instructor?.avatarUrl ? <Image source={{ uri: course.instructor.avatarUrl }} style={styles.instructorAvatar} /> : <Text style={styles.instructorLetter}>{course.instructor?.fullName?.charAt(0) || 'L'}</Text>}</View><View style={{ flex: 1 }}><Text style={[styles.byLabel, { color: palette.muted }]}>Giảng viên</Text><Text style={[styles.byName, { color: palette.ink }]}>{course.instructor?.fullName || 'LMS Platform'}</Text></View><View style={[styles.ratingPill, { backgroundColor: isDark ? '#3a3221' : '#fff8e6' }]}><Ionicons name="star" size={15} color={palette.warning} /><Text style={[styles.ratingPillText, { color: palette.ink }]}>{reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews})</Text></View></View>
    {enrollment && <View style={styles.ownedBanner}><Ionicons name="checkmark-circle" size={22} color={colors.success} /><View style={{ flex: 1 }}><Text style={styles.ownedTitle}>Bạn đã sở hữu khóa học này</Text><Text style={styles.ownedText}>Tiến độ hiện tại {Math.round(enrollment.progressPercent)}%</Text></View></View>}
    <View style={[styles.tabs, { backgroundColor: isDark ? '#292d3b' : '#ececf4' }]}><Pressable onPress={() => setTab('overview')} style={[styles.tab, tab === 'overview' && styles.tabActive, tab === 'overview' && { backgroundColor: palette.surface }]}><Text style={[styles.tabText, { color: palette.muted }, tab === 'overview' && styles.tabTextActive, tab === 'overview' && { color: palette.primary }]}>Tổng quan</Text></Pressable><Pressable onPress={() => setTab('reviews')} style={[styles.tab, tab === 'reviews' && styles.tabActive, tab === 'reviews' && { backgroundColor: palette.surface }]}><Text style={[styles.tabText, { color: palette.muted }, tab === 'reviews' && styles.tabTextActive, tab === 'reviews' && { color: palette.primary }]}>Đánh giá</Text></Pressable></View>
    {tab === 'overview' ? <>
      <InfoSection icon="information-circle-outline" title="Giới thiệu" text={course.description || 'Khóa học chưa có mô tả.'} />
      {!!course.learningOutcomes && <InfoSection icon="sparkles-outline" title="Bạn sẽ học được gì?" text={course.learningOutcomes} tone={colors.success} />}
      {!!course.requirements && <InfoSection icon="checkmark-done-outline" title="Yêu cầu" text={course.requirements} tone={colors.warning} />}
    </> : <>
      <View style={[styles.reviewSummaryBox, { backgroundColor: palette.surface }]}><Text style={[styles.ratingNumber, { color: palette.ink }]}>{reviewSummary.averageRating.toFixed(1)}</Text><View><Text style={styles.starsSmall}>{'★'.repeat(Math.round(reviewSummary.averageRating))}{'☆'.repeat(5 - Math.round(reviewSummary.averageRating))}</Text><Text style={[styles.byLabel, { color: palette.muted }]}>{reviewSummary.totalReviews} đánh giá từ học viên</Text></View></View>
      {user?.role === 'STUDENT' && enrollment && <View style={[styles.reviewForm, { backgroundColor: palette.surface }]}><Text style={[styles.reviewLabel, { color: palette.ink }]}>Trải nghiệm của bạn</Text><Stars value={rating} onChange={setRating} /><Field label="Nhận xét" value={reviewText} onChangeText={setReviewText} multiline placeholder="Chia sẻ trải nghiệm học tập..." /><Button title={reviews.some(item => item.user.id === user.id) ? 'Cập nhật đánh giá' : 'Gửi đánh giá'} onPress={saveReview} loading={savingReview} disabled={!rating} /></View>}
      {reviews.length ? reviews.map(review => <View key={review.id} style={[styles.review, { borderTopColor: palette.border }]}><View style={styles.reviewTop}><Text style={[styles.reviewer, { color: palette.ink }]}>{review.user.fullName}</Text><Text style={styles.starsSmall}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text></View>{!!review.content && <Text style={[styles.body, { color: palette.muted }]}>{review.content}</Text>}</View>) : <StateView empty="Khóa học chưa có đánh giá" />}
    </>}
    <View style={{ height: 92 }} />
  </Screen>
  <View style={[styles.purchaseDock, { backgroundColor: palette.surface, borderTopColor: palette.border }]}><View style={{ flex: 1 }}><Text style={[styles.dockLabel, { color: palette.muted }]}>{enrollment ? 'Tiến độ của bạn' : course.isFree ? 'Học phí' : 'Giá khóa học'}</Text><Text style={[styles.dockPrice, { color: palette.ink }]}>{enrollment ? `${Math.round(enrollment.progressPercent)}% hoàn thành` : course.isFree ? 'Miễn phí' : money(course.price)}</Text></View><View style={styles.dockAction}>
    {!user ? <Button title="Đăng nhập" onPress={() => navigation.navigate('Login')} /> : enrollment ? <Button title="Tiếp tục học" onPress={() => navigation.navigate('Learning', { courseId: course.id, courseTitle: course.title })} /> : user.role === 'STUDENT' && course.isFree ? <Button title="Đăng ký miễn phí" onPress={enroll} loading={enrolling} /> : user.role === 'STUDENT' ? <Button title="Mua khóa học" onPress={checkout} loading={ordering} /> : <Text style={styles.purchaseNote}>Chỉ học viên có thể đăng ký</Text>}
  </View></View><Snackbar visible={!!notice} message={notice?.message || ''} tone={notice?.tone} onDismiss={() => setNotice(null)} /></View>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  const { palette } = useAppTheme();
  return <Text onPress={onPress} style={[styles.chip, { color: palette.muted, backgroundColor: palette.surface, borderColor: palette.border }, active && styles.chipActive, active && { color: '#fff', backgroundColor: palette.primary, borderColor: palette.primary }]}>{label}</Text>;
}
function Stars({ value, onChange }: { value: number; onChange(value: number): void }) { return <View style={styles.stars}>{[1, 2, 3, 4, 5].map(star => <Pressable key={star} onPress={() => onChange(star)}><Text style={[styles.star, star <= value && styles.starOn]}>★</Text></Pressable>)}</View>; }
function Badge({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) { const { palette, isDark } = useAppTheme(); return <View style={[styles.badge, { backgroundColor: isDark ? '#312b4d' : '#eee9ff' }]}><Ionicons name={icon} size={14} color={palette.primary} /><Text style={[styles.badgeText, { color: palette.primaryDark }]}>{label}</Text></View>; }
function InfoSection({ icon, title, text, tone = colors.primary }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; tone?: string }) { const { palette } = useAppTheme(); return <View style={[styles.infoSection, { borderBottomColor: palette.border }]}><View style={[styles.infoIcon, { backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={21} color={tone} /></View><View style={{ flex: 1 }}><Text style={[styles.h2, { color: palette.ink }]}>{title}</Text><Text style={[styles.body, { color: palette.muted }]}>{text}</Text></View></View>; }
const levelName = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
const styles = StyleSheet.create({ listContent: { paddingBottom: 24 }, emptyList: { flexGrow: 1 }, detailPage: { flex: 1, backgroundColor: colors.background }, chip: { color: colors.muted, paddingVertical: 9, paddingHorizontal: 15, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', overflow: 'hidden' }, chipActive: { color: '#fff', backgroundColor: colors.primary, borderColor: colors.primary }, heroImage: { width: '100%', height: 224, borderRadius: 24, marginBottom: 16 }, placeholder: { backgroundColor: '#ede8ff', alignItems: 'center', justifyContent: 'center' }, badges: { flexDirection: 'row', gap: 8 }, badge: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#eee9ff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { color: colors.primaryDark, fontWeight: '800', fontSize: 11 }, title: { color: colors.ink, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 12 }, instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 }, instructorAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, instructorLetter: { color: '#fff', fontWeight: '900', fontSize: 18 }, byLabel: { color: colors.muted, fontSize: 11 }, byName: { color: colors.ink, fontWeight: '800', marginTop: 2 }, ratingPill: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#fff8e6', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 13 }, ratingPillText: { color: colors.ink, fontSize: 11, fontWeight: '800' }, ownedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eafaf3', borderRadius: 16, padding: 13, marginTop: 16 }, ownedTitle: { color: '#11633f', fontWeight: '900' }, ownedText: { color: '#438267', fontSize: 12, marginTop: 2 }, tabs: { flexDirection: 'row', backgroundColor: '#ececf4', borderRadius: 14, padding: 4, marginTop: 20, marginBottom: 6 }, tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tabActive: { backgroundColor: '#fff', ...shadow }, tabText: { color: colors.muted, fontWeight: '800' }, tabTextActive: { color: colors.primary }, infoSection: { flexDirection: 'row', gap: 12, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: colors.border }, infoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, h2: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 7 }, body: { color: colors.muted, fontSize: 15, lineHeight: 24 }, reviewSummaryBox: { backgroundColor: '#fff', borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }, ratingNumber: { color: colors.ink, fontSize: 38, fontWeight: '900' }, purchaseNote: { color: colors.muted, textAlign: 'center', fontSize: 11 }, reviewForm: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 14 }, reviewLabel: { color: colors.ink, fontWeight: '800' }, stars: { flexDirection: 'row', gap: 5, marginVertical: 10 }, star: { color: '#d5d7df', fontSize: 34 }, starOn: { color: colors.warning }, review: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 14 }, reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, reviewer: { color: colors.ink, fontWeight: '900' }, starsSmall: { color: colors.warning, fontSize: 15 }, purchaseDock: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 82, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow }, dockLabel: { color: colors.muted, fontSize: 11 }, dockPrice: { color: colors.ink, fontWeight: '900', fontSize: 16, marginTop: 2 }, dockAction: { width: '48%' } });
