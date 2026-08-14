import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Course } from '../types';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { ImageWithFallback, StatusBadge } from './ui';
import { useAppTheme } from '../providers/ThemeProvider';

const levelLabels = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
export function money(value: number) { return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'; }

export function CourseCard({ course, onPress }: { course: Course; onPress(): void }) {
  const { palette } = useAppTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: palette.surface }, pressed && { opacity: .85 }]}>
    <ImageWithFallback uri={course.thumbnailUrl} style={styles.image} accessibilityLabel={`Ảnh khóa học ${course.title}`} />
    <View style={styles.body}>
      <View style={styles.row}><StatusBadge label={levelLabels[course.level]} tone="primary" /><Text style={[styles.category, { color: palette.muted }]}>{course.category?.name}</Text></View>
      <Text style={[styles.title, { color: palette.ink }]} numberOfLines={2}>{course.title}</Text>
      <Text style={[styles.instructor, { color: palette.muted }]}>{course.instructor?.fullName || 'LMS Platform'}</Text>
      <Text style={[styles.price, { color: palette.primary }]}>{course.isFree ? 'Miễn phí' : money(course.price)}</Text>
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
