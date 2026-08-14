import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, type ImageStyle, type StyleProp, type TextInputProps, type ViewStyle, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, shadows, spacing, typography } from '../theme';
import { useAppTheme } from '../providers/ThemeProvider';

export function Screen({ children, scroll = true, topInset = false, refreshing = false, onRefresh, quickScroll = true, contentStyle }: {
  children: ReactNode; scroll?: boolean; topInset?: boolean; refreshing?: boolean; onRefresh?(): void; quickScroll?: boolean; contentStyle?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  const ref = useRef<ScrollView>(null);
  const [awayFromTop, setAwayFromTop] = useState(false);
  const body = scroll
    ? <ScrollView ref={ref} contentContainerStyle={[styles.screenContent, contentStyle]} keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false} scrollEventThrottle={16}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      onScroll={event => setAwayFromTop(event.nativeEvent.contentOffset.y > 360)}>{children}</ScrollView>
    : <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>;
  return <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={topInset ? ['top', 'bottom'] : ['bottom']}><KeyboardAvoidingView
    style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}
    {scroll && quickScroll && awayFromTop && <Pressable accessibilityLabel="Cuộn lên đầu trang" onPress={() => ref.current?.scrollTo({ y: 0, animated: true })} style={styles.floatingScroll}><Ionicons name="arrow-up" size={22} color="#fff" /></Pressable>}
  </KeyboardAvoidingView></SafeAreaView>;
}

export function AppBar({ title, subtitle, onBack, onSearch, onFilter, onMore }: {
  title: string; subtitle?: string; onBack?(): void; onSearch?(): void; onFilter?(): void; onMore?(): void;
}) {
  const { palette } = useAppTheme();
  return <View style={[styles.appBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
    {onBack && <IconButton icon="chevron-back" label="Quay lại" onPress={onBack} />}
    <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.appBarTitle, { color: palette.ink }]}>{title}</Text>{subtitle && <Text numberOfLines={1} style={[styles.appBarSubtitle, { color: palette.muted }]}>{subtitle}</Text>}</View>
    {onSearch && <IconButton icon="search-outline" label="Tìm kiếm" onPress={onSearch} />}
    {onFilter && <IconButton icon="options-outline" label="Bộ lọc" onPress={onFilter} />}
    {onMore && <IconButton icon="ellipsis-horizontal" label="Thêm" onPress={onMore} />}
  </View>;
}

export function IconButton({ icon, label, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress(): void; badge?: number }) {
  const { palette, isDark } = useAppTheme();
  const handlePress = () => { void Haptics.selectionAsync().catch(() => undefined); onPress(); };
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={handlePress} style={({ pressed }) => [styles.iconButton, { backgroundColor: isDark ? '#2b3040' : '#f6f5fb' }, pressed && { opacity: .55 }]}>
    <Ionicons name={icon} size={23} color={palette.ink} />
    {!!badge && <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge > 99 ? '99+' : badge}</Text></View>}
  </Pressable>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { const { palette } = useAppTheme(); return <View style={[styles.card, { backgroundColor: palette.surface }, style]}>{children}</View>; }

type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
const statusTones: Record<StatusTone, { background: string; foreground: string }> = {
  neutral: { background: '#f1f3f7', foreground: colors.muted },
  primary: { background: '#eee9ff', foreground: colors.primaryDark },
  success: { background: '#eaf8f1', foreground: colors.success },
  warning: { background: '#fff5dc', foreground: '#9a6700' },
  danger: { background: '#ffebee', foreground: colors.danger },
};

export function StatusBadge({ label, tone = 'neutral', icon }: { label: string; tone?: StatusTone; icon?: keyof typeof Ionicons.glyphMap }) {
  const palette = statusTones[tone];
  return <View style={[styles.statusBadge, { backgroundColor: palette.background }]}>
    {icon && <Ionicons name={icon} size={13} color={palette.foreground} />}
    <Text style={[styles.statusBadgeText, { color: palette.foreground }]}>{label}</Text>
  </View>;
}

export function ImageWithFallback({ uri, style, accessibilityLabel, fallbackIcon = 'book-outline' }: {
  uri?: string | null; style: StyleProp<ImageStyle>; accessibilityLabel?: string; fallbackIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const { palette, isDark } = useAppTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (!uri || failed) return <View style={[style, styles.imageFallback, { backgroundColor: isDark ? '#2d2845' : '#eee9ff' }]} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Ionicons name={fallbackIcon} size={38} color={palette.primary} />
  </View>;
  return <Image source={{ uri }} style={style} resizeMode="cover" accessibilityLabel={accessibilityLabel} onError={() => setFailed(true)} />;
}

export function Skeleton({ width = '100%', height = 16, radius: skeletonRadius = radius.sm, style }: {
  width?: number | `${number}%`; height?: number; radius?: number; style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useAppTheme();
  const opacity = useRef(new Animated.Value(.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: .45, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View accessibilityLabel="Đang tải" style={[styles.skeleton, { width, height, borderRadius: skeletonRadius, opacity, backgroundColor: isDark ? '#34394a' : '#e6e7ee' }, style]} />;
}

export function SkeletonCard() {
  const { palette } = useAppTheme();
  return <View style={[styles.skeletonCard, { backgroundColor: palette.surface }]}><Skeleton height={148} radius={radius.lg} /><Skeleton width="42%" style={{ marginTop: spacing.md }} /><Skeleton height={22} style={{ marginTop: spacing.sm }} /><Skeleton width="72%" style={{ marginTop: spacing.xs }} /></View>;
}

export function Snackbar({ visible, message, tone = 'success', onDismiss, actionLabel, onAction }: {
  visible: boolean; message: string; tone?: 'success' | 'danger' | 'neutral'; onDismiss(): void; actionLabel?: string; onAction?(): void;
}) {
  const dismissRef = useRef(onDismiss);
  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!visible) return;
    void Haptics.notificationAsync(tone === 'danger' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const timeout = setTimeout(() => dismissRef.current(), 3200);
    return () => clearTimeout(timeout);
  }, [message, tone, visible]);
  if (!visible) return null;
  const icon = tone === 'success' ? 'checkmark-circle' : tone === 'danger' ? 'alert-circle' : 'information-circle';
  const foreground = tone === 'danger' ? '#ffd9de' : tone === 'success' ? '#c8f7df' : '#fff';
  return <View accessibilityLiveRegion="polite" style={styles.snackbar}>
    <Ionicons name={icon} size={21} color={foreground} />
    <Text style={styles.snackbarText}>{message}</Text>
    {actionLabel && onAction ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.snackbarAction}>{actionLabel}</Text></Pressable> : <Pressable accessibilityRole="button" accessibilityLabel="Đóng thông báo" onPress={onDismiss} hitSlop={8} style={styles.snackbarClose}><Ionicons name="close" size={21} color="#fff" /></Pressable>}
  </View>;
}

export function MetricCard({ icon, label, value, tone = colors.primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone?: string }) {
  const { palette } = useAppTheme();
  return <View style={[styles.metric, { backgroundColor: palette.surface }]}><View style={[styles.metricIcon, { backgroundColor: `${tone}18` }]}><Ionicons name={icon} size={22} color={tone} /></View><Text style={[styles.metricValue, { color: palette.ink }]}>{value}</Text><Text style={[styles.metricLabel, { color: palette.muted }]}>{label}</Text></View>;
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose(): void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 100 || gesture.vy > 1.1) { translateY.setValue(0); onClose(); }
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  }), [onClose, translateY]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.sheet, { backgroundColor: palette.surface, paddingBottom: Math.max(20, insets.bottom), transform: [{ translateY }] }]} {...pan.panHandlers}>
        <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} /><View style={styles.sheetHeader}><Text style={[styles.sheetTitle, { color: palette.ink }]}>{title}</Text><IconButton icon="close" label="Đóng" onPress={onClose} /></View>
        {children}
      </Animated.View>
    </View>
  </Modal>;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: {
  title: string; onPress(): void; loading?: boolean; variant?: 'primary' | 'outline' | 'danger' | 'ghost'; disabled?: boolean;
}) {
  const { palette } = useAppTheme();
  const handlePress = () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); onPress(); };
  return <Pressable onPress={handlePress} disabled={disabled || loading}
    accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }}
    style={({ pressed }) => [styles.button, styles[`button_${variant}`], variant === 'primary' && { backgroundColor: palette.primary }, variant === 'outline' && { backgroundColor: palette.surface, borderColor: palette.primary }, (pressed || disabled) && { opacity: .65 }]}>
    {loading ? <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? palette.primary : '#fff'} />
      : <Text style={[styles.buttonText, (variant === 'outline' || variant === 'ghost') && { color: palette.primary }]}>{title}</Text>}
  </Pressable>;
}

export function Field({ label, error, multiline, ...props }: TextInputProps & { label: string; error?: string }) {
  const { palette } = useAppTheme();
  return <View style={styles.fieldWrap}>
    <Text style={[styles.label, { color: palette.ink }]}>{label}</Text>
    <TextInput placeholderTextColor={palette.muted} multiline={multiline}
      style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.ink }, multiline && styles.textarea, error && { borderColor: palette.danger }]} {...props} />
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { palette } = useAppTheme();
  return <View style={{ marginBottom: 18 }}><Text style={[styles.title, { color: palette.ink }]}>{title}</Text>{subtitle && <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>}</View>;
}

export function StateView({ loading, error, empty, onRetry, variant = 'default' }: { loading?: boolean; error?: string; empty?: string; onRetry?(): void; variant?: 'default' | 'list' }) {
  const { palette } = useAppTheme();
  if (loading && variant === 'list') return <View style={styles.skeletonList}><SkeletonCard /><SkeletonCard /></View>;
  if (loading) return <View style={styles.state}><ActivityIndicator size="large" color={palette.primary} /><Text style={{ color: palette.ink }}>Đang tải...</Text></View>;
  if (error) return <View style={styles.state}><Text style={styles.error}>{error}</Text>{onRetry && <Button title="Thử lại" onPress={onRetry} variant="outline" />}</View>;
  return <View style={styles.state}><Text style={[styles.subtitle, { color: palette.muted }]}>{empty || 'Chưa có dữ liệu'}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.xs, flexGrow: 1 },
  button: { minHeight: 50, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xxs },
  button_primary: { backgroundColor: colors.primary, ...shadow },
  button_outline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.primary },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: 'transparent' },
  buttonText: { color: '#fff', ...typography.bodyStrong },
  fieldWrap: { marginBottom: radius.md },
  label: { color: colors.ink, ...typography.label, marginBottom: spacing.xs },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#fff', paddingHorizontal: spacing.md, fontSize: 16, color: colors.ink },
  textarea: { height: 110, textAlignVertical: 'top', paddingTop: radius.md },
  error: { color: colors.danger, marginTop: 5 },
  title: { color: colors.ink, ...typography.heading },
  subtitle: { color: colors.muted, ...typography.body, marginTop: spacing.xxs },
  state: { flex: 1, minHeight: 240, gap: radius.md, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  floatingScroll: { position: 'absolute', right: 18, bottom: 18, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  appBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: radius.md, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' },
  appBarTitle: { color: colors.ink, ...typography.title, fontWeight: '900' }, appBarSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#f6f5fb', alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', right: 2, top: 1, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, iconBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: radius.md, ...shadows.soft },
  metric: { width: 150, minHeight: 142, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginRight: 12, ...shadow }, metricIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, metricValue: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 13 }, metricLabel: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#11182755' }, sheet: { maxHeight: '88%', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 8, ...shadow }, sheetHandle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#d7d8e0', alignSelf: 'center', marginBottom: 8 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sheetTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  statusBadge: { minHeight: 27, alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusBadgeText: { ...typography.caption, fontWeight: '800' },
  imageFallback: { backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skeleton: { backgroundColor: '#e6e7ee' },
  skeletonCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.md, ...shadows.soft },
  skeletonList: { flex: 1, paddingTop: spacing.sm },
  snackbar: { position: 'absolute', zIndex: 50, left: spacing.md, right: spacing.md, bottom: spacing.lg, minHeight: 58, borderRadius: radius.md, paddingLeft: spacing.md, paddingRight: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.ink, ...shadows.elevated },
  snackbarText: { flex: 1, color: '#fff', ...typography.bodyStrong },
  snackbarAction: { color: '#d8ccff', ...typography.label, padding: spacing.xs },
  snackbarClose: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
