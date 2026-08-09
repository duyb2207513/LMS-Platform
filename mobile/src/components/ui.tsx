import type { ReactNode } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, type TextInputProps, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const body = scroll
    ? <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>;
  return <SafeAreaView style={styles.safe} edges={['bottom']}><KeyboardAvoidingView
    style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView></SafeAreaView>;
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
});
