import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { coursesApi } from '../api/services';
import { CourseCard } from '../components/CourseCard';
import { Button, IconButton, StateView } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import type { Course } from '../types';
import { colors } from '../theme';

export function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setCourses((await coursesApi.list({ limit: 8 })).data.data); setError(''); }
    catch { setError('Không thể tải khóa học nổi bật'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><View style={styles.brand}><View style={styles.logo}><Ionicons name="book-outline" size={23} color="#fff" /></View><Text style={styles.brandText}>LMS Platform</Text></View><IconButton icon="search-outline" label="Tìm kiếm" onPress={() => navigation.navigate('SearchTab')} /></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
      <LinearGradient colors={['#5535ff', '#aa13ff', '#4a2cc7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.pill}><View style={styles.dot} /><Text style={styles.pillText}>Học mọi lúc, mọi nơi</Text></View>
        <Text style={styles.heading}>Nâng tầm kiến thức</Text><Text style={styles.highlight}>cùng LMS Platform</Text>
        <Text style={styles.copy}>Khóa học thực tế, tiến độ rõ ràng và trải nghiệm học tập được tối ưu cho điện thoại.</Text>
        <View style={styles.heroActions}><View style={{ flex: 1 }}><Button title="Khám phá" variant="outline" onPress={() => navigation.navigate('CoursesTab')} /></View><View style={{ flex: 1 }}><Button title={user ? 'Học tiếp' : 'Đăng nhập'} onPress={() => user ? navigation.navigate('AccountTab') : navigation.navigate('Login')} /></View></View>
      </LinearGradient>
      <View style={styles.stats}><Stat value="100+" label="Khóa học" /><Stat value="50+" label="Giảng viên" /><Stat value="1K+" label="Học viên" /></View>
      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Khóa học nổi bật</Text><Text style={styles.sectionNote}>Kéo ngang để khám phá</Text></View><Text onPress={() => navigation.navigate('CoursesTab')} style={styles.seeAll}>Xem tất cả</Text></View>
      {loading || error ? <StateView loading={loading} error={error} onRetry={load} /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={292} decelerationRate="fast" contentContainerStyle={styles.horizontal}>{courses.map(course => <View key={course.id} style={styles.course}><CourseCard course={course} onPress={() => navigation.navigate('CourseDetail', { slug: course.slug })} /></View>)}</ScrollView>}
      <View style={styles.verify}><Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.verifyTitle}>Xác minh chứng chỉ</Text><Text style={styles.verifyText}>Kiểm tra tính hợp lệ bằng mã công khai.</Text></View><Ionicons name="chevron-forward" size={22} color={colors.primary} onPress={() => navigation.navigate('VerifyCertificate')} /></View>
    </ScrollView>
  </SafeAreaView>;
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { height: 66, paddingHorizontal: 18, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, brandText: { color: colors.ink, fontSize: 20, fontWeight: '900' }, content: { padding: 18, paddingBottom: 36 },
  hero: { borderRadius: 28, padding: 22, overflow: 'hidden' }, pill: { alignSelf: 'flex-start', backgroundColor: '#ffffff20', borderColor: '#ffffff44', borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1de2a7', marginRight: 7 }, pillText: { color: '#fff', fontSize: 12, fontWeight: '700' }, heading: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 38, marginTop: 20 }, highlight: { color: colors.amber, fontSize: 30, fontWeight: '900', lineHeight: 38 }, copy: { color: '#eeeaff', lineHeight: 22, marginTop: 13 }, heroActions: { flexDirection: 'row', gap: 9, marginTop: 18 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 }, stat: { flex: 1, backgroundColor: '#fff', borderRadius: 17, paddingVertical: 15, alignItems: 'center' }, statValue: { color: colors.ink, fontSize: 19, fontWeight: '900' }, statLabel: { color: colors.muted, fontSize: 11, marginTop: 3 }, sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 13 }, sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' }, sectionNote: { color: colors.muted, fontSize: 12, marginTop: 3 }, seeAll: { color: colors.primary, fontWeight: '800' }, horizontal: { paddingRight: 10 }, course: { width: 280, marginRight: 12 }, verify: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#eee9ff', borderRadius: 20, padding: 17 }, verifyTitle: { color: colors.ink, fontWeight: '900' }, verifyText: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
