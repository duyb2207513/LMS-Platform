import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Course } from '../types';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { ImageWithFallback, StatusBadge } from './ui';

const levelLabels = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
export function money(value: number) { return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'; }

export function CourseCard({ course, onPress }: { course: Course; onPress(): void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: .85 }]}>
    <ImageWithFallback uri={course.thumbnailUrl} style={styles.image} accessibilityLabel={`Ảnh khóa học ${course.title}`} />
    <View style={styles.body}>
      <View style={styles.row}><StatusBadge label={levelLabels[course.level]} tone="primary" /><Text style={styles.category}>{course.category?.name}</Text></View>
      <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
      <Text style={styles.instructor}>{course.instructor?.fullName || 'LMS Platform'}</Text>
      <Text style={styles.price}>{course.isFree ? 'Miễn phí' : money(course.price)}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, ...shadows.soft },
  image: { height: 165, width: '100%' },
  body: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: colors.muted, ...typography.caption, maxWidth: '50%' },
  title: { color: colors.ink, ...typography.title, marginTop: spacing.sm },
  instructor: { color: colors.muted, ...typography.caption, marginTop: spacing.xs },
  price: { color: colors.primary, fontSize: 17, fontWeight: '800', marginTop: 12 },
});
