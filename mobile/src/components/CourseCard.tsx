import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Course } from '../types';
import { colors, shadow } from '../theme';

const levelLabels = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
export function money(value: number) { return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'; }

export function CourseCard({ course, onPress }: { course: Course; onPress(): void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: .85 }]}>
    {course.thumbnailUrl
      ? <Image source={{ uri: course.thumbnailUrl }} style={styles.image} />
      : <View style={[styles.image, styles.placeholder]}><Text style={styles.book}>▤</Text></View>}
    <View style={styles.body}>
      <View style={styles.row}><Text style={styles.badge}>{levelLabels[course.level]}</Text><Text style={styles.category}>{course.category?.name}</Text></View>
      <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
      <Text style={styles.instructor}>{course.instructor?.fullName || 'LMS Platform'}</Text>
      <Text style={styles.price}>{course.isFree ? 'Miễn phí' : money(course.price)}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, ...shadow },
  image: { height: 165, width: '100%' },
  placeholder: { backgroundColor: '#ede8ff', alignItems: 'center', justifyContent: 'center' },
  book: { fontSize: 54, color: colors.primary },
  body: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: colors.primary, backgroundColor: '#eeeaff', fontSize: 12, fontWeight: '700', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  category: { color: colors.muted, fontSize: 12, maxWidth: '50%' },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 25, marginTop: 12 },
  instructor: { color: colors.muted, marginTop: 7 },
  price: { color: colors.primary, fontSize: 17, fontWeight: '800', marginTop: 12 },
});
