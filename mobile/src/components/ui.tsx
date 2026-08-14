import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, type TextInputProps, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';

export function Screen({ children, scroll = true, topInset = false, refreshing = false, onRefresh, quickScroll = true }: {
  children: ReactNode; scroll?: boolean; topInset?: boolean; refreshing?: boolean; onRefresh?(): void; quickScroll?: boolean;
}) {
  const ref = useRef<ScrollView>(null);
  const [awayFromTop, setAwayFromTop] = useState(false);
  const body = scroll
    ? <ScrollView ref={ref} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false} scrollEventThrottle={16}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      onScroll={event => setAwayFromTop(event.nativeEvent.contentOffset.y > 360)}>{children}</ScrollView>
    : <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>;
  return <SafeAreaView style={styles.safe} edges={topInset ? ['top', 'bottom'] : ['bottom']}><KeyboardAvoidingView
    style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}
    {scroll && quickScroll && awayFromTop && <Pressable accessibilityLabel="Cuộn lên đầu trang" onPress={() => ref.current?.scrollTo({ y: 0, animated: true })} style={styles.floatingScroll}><Ionicons name="arrow-up" size={22} color="#fff" /></Pressable>}
  </KeyboardAvoidingView></SafeAreaView>;
}

export function AppBar({ title, subtitle, onBack, onSearch, onFilter, onMore }: {
  title: string; subtitle?: string; onBack?(): void; onSearch?(): void; onFilter?(): void; onMore?(): void;
}) {
  return <View style={styles.appBar}>
    {onBack && <IconButton icon="chevron-back" label="Quay lại" onPress={onBack} />}
    <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.appBarTitle}>{title}</Text>{subtitle && <Text numberOfLines={1} style={styles.appBarSubtitle}>{subtitle}</Text>}</View>
    {onSearch && <IconButton icon="search-outline" label="Tìm kiếm" onPress={onSearch} />}
    {onFilter && <IconButton icon="options-outline" label="Bộ lọc" onPress={onFilter} />}
    {onMore && <IconButton icon="ellipsis-horizontal" label="Thêm" onPress={onMore} />}
  </View>;
}

export function IconButton({ icon, label, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress(): void; badge?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && { opacity: .55 }]}>
    <Ionicons name={icon} size={23} color={colors.ink} />
    {!!badge && <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge > 99 ? '99+' : badge}</Text></View>}
  </Pressable>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) { return <View style={[styles.card, style]}>{children}</View>; }

export function MetricCard({ icon, label, value, tone = colors.primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone?: string }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${tone}18` }]}><Ionicons name={icon} size={22} color={tone} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose(): void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
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
      <Animated.View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom), transform: [{ translateY }] }]} {...pan.panHandlers}>
        <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><IconButton icon="close" label="Đóng" onPress={onClose} /></View>
        {children}
      </Animated.View>
    </View>
  </Modal>;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: {
  title: string; onPress(): void; loading?: boolean; variant?: 'primary' | 'outline' | 'danger' | 'ghost'; disabled?: boolean;
}) {
  return <Pressable onPress={onPress} disabled={disabled || loading}
    style={({ pressed }) => [styles.button, styles[`button_${variant}`], (pressed || disabled) && { opacity: .65 }]}>
    {loading ? <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'} />
      : <Text style={[styles.buttonText, (variant === 'outline' || variant === 'ghost') && { color: colors.primary }]}>{title}</Text>}
  </Pressable>;
}

export function Field({ label, error, multiline, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#9aa1b2" multiline={multiline}
      style={[styles.input, multiline && styles.textarea, error && { borderColor: colors.danger }]} {...props} />
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ marginBottom: 18 }}><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>;
}

export function StateView({ loading, error, empty, onRetry }: { loading?: boolean; error?: string; empty?: string; onRetry?(): void }) {
  if (loading) return <View style={styles.state}><ActivityIndicator size="large" color={colors.primary} /><Text>Đang tải...</Text></View>;
  if (error) return <View style={styles.state}><Text style={styles.error}>{error}</Text>{onRetry && <Button title="Thử lại" onPress={onRetry} variant="outline" />}</View>;
  return <View style={styles.state}><Text style={styles.subtitle}>{empty || 'Chưa có dữ liệu'}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  button: { minHeight: 50, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  button_primary: { backgroundColor: colors.primary, ...shadow },
  button_outline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.primary },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: 'transparent' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fieldWrap: { marginBottom: 14 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 15, fontSize: 16, color: colors.ink },
  textarea: { height: 110, textAlignVertical: 'top', paddingTop: 14 },
  error: { color: colors.danger, marginTop: 5 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5 },
  state: { flex: 1, minHeight: 240, gap: 14, alignItems: 'center', justifyContent: 'center', padding: 24 },
  floatingScroll: { position: 'absolute', right: 18, bottom: 18, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  appBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' },
  appBarTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, appBarSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f6f5fb', alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', right: 2, top: 1, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, iconBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, ...shadow },
  metric: { width: 150, minHeight: 142, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginRight: 12, ...shadow }, metricIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, metricValue: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 13 }, metricLabel: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#11182755' }, sheet: { maxHeight: '88%', backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 8, ...shadow }, sheetHandle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#d7d8e0', alignSelf: 'center', marginBottom: 8 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sheetTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
});
