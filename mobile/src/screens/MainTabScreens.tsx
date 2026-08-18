import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, coursesApi, notificationPreferencesApi, notificationsApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppBar, BottomSheet, Button, Field, Screen, StateView } from '../components/ui';
import { CourseCard } from '../components/CourseCard';
import type { AppNotification, Category, Course, NotificationPreference } from '../types';
import { colors, shadow } from '../theme';
import { useAppTheme } from '../providers/ThemeProvider';
import { useNotifications } from '../notifications/NotificationContext';
import { notificationDestination } from '../notifications/notificationNavigation';

export function SearchScreen({ navigation }: { navigation: any }) {
  const { palette } = useAppTheme();
  const [query, setQuery] = useState(''); const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]); const [items, setItems] = useState<Course[]>([]);
  const [filterOpen, setFilterOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const search = useCallback(async () => { setLoading(true); try { const [courses, categoryResult] = await Promise.all([coursesApi.list({ search: query.trim() || undefined, categoryId: categoryId || undefined, limit: 30 }), categoriesApi.list()]); setItems(courses.data.data); setCategories(categoryResult.data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, [query, categoryId]);
  useEffect(() => { void search(); }, [categoryId]);
  return <View style={[styles.page, { backgroundColor: palette.background }]}><Screen topInset scroll={false} quickScroll={false}>
    <AppBar title="Tìm kiếm" subtitle="Tìm nhanh khóa học phù hợp" onFilter={() => setFilterOpen(true)} />
    <View style={styles.searchBody}><Field label="Từ khóa" value={query} onChangeText={setQuery} placeholder="Tên khóa học, chủ đề..." returnKeyType="search" onSubmitEditing={search} />
      <FlatList data={items} keyExtractor={item => item.id} showsVerticalScrollIndicator={false}
        contentContainerStyle={items.length ? styles.listContent : styles.emptyList}
        renderItem={({ item }) => <CourseCard course={item} onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })} />}
        ListEmptyComponent={<StateView loading={loading} error={error} empty="Không tìm thấy khóa học phù hợp" onRetry={search} variant="list" />} />
    </View>
  </Screen><BottomSheet visible={filterOpen} title="Lọc theo danh mục" onClose={() => setFilterOpen(false)}><ScrollView style={{ maxHeight: 430 }}><FilterRow label="Tất cả danh mục" selected={!categoryId} onPress={() => { setCategoryId(''); setFilterOpen(false); }} />{categories.map(item => <FilterRow key={item.id} label={item.name} selected={categoryId === item.id} onPress={() => { setCategoryId(item.id); setFilterOpen(false); }} />)}</ScrollView></BottomSheet></View>;
}

export function NotificationsScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { refreshUnread } = useNotifications();
  const { palette } = useAppTheme();
  const [items, setItems] = useState<AppNotification[]>([]); const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); try { const result = await notificationsApi.list({ page: 1, limit: 50, ...(unreadOnly ? { isRead: false } : {}) }); setItems(result.data.data); setError(''); await refreshUnread(); }
    catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); }
  }, [refreshUnread, unreadOnly, user]);
  useEffect(() => { void load(); }, [load]);
  const openPreferences = async () => { setPrefsOpen(true); if (!prefs) try { setPrefs((await notificationPreferencesApi.get()).data.data); } catch (e) { Alert.alert('Không thể tải tùy chọn', getApiMessage(e)); } };
  const patchPreference = async (key: keyof NotificationPreference, value: boolean) => { if (!prefs) return; const next = { ...prefs, [key]: value }; setPrefs(next); try { setPrefs((await notificationPreferencesApi.update({ [key]: value })).data.data); } catch (e) { setPrefs(prefs); Alert.alert('Không thể lưu', getApiMessage(e)); } };
  const read = async (item: AppNotification) => {
    if (!item.isRead) await notificationsApi.markRead(item.id);
    const destination = notificationDestination(item.type, item.data || {});
    navigation.navigate(destination.name, destination.params);
    await load();
  };
  const remove = async (item: AppNotification) => { try { await notificationsApi.remove(item.id); setItems(current => current.filter(row => row.id !== item.id)); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } };
  if (!user) return <Screen topInset><AppBar title="Thông báo" /><StateView empty="Đăng nhập để xem thông báo của bạn" /><Button title="Đăng nhập" onPress={() => navigation.navigate('Login')} /></Screen>;
  return <View style={[styles.page, { backgroundColor: palette.background }]}><Screen topInset scroll={false} quickScroll={false}>
    <FlatList data={items} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} refreshing={loading && items.length > 0} onRefresh={load}
      contentContainerStyle={items.length ? styles.listContent : styles.emptyList}
      ListHeaderComponent={<View><AppBar title="Thông báo" subtitle={`${items.filter(item => !item.isRead).length} chưa đọc`} onMore={openPreferences} />
        <View style={styles.segment}><Pressable onPress={() => setUnreadOnly(false)} style={[styles.segmentItem, !unreadOnly && styles.segmentActive]}><Text style={[styles.segmentText, !unreadOnly && styles.segmentTextActive]}>Tất cả</Text></Pressable><Pressable onPress={() => setUnreadOnly(true)} style={[styles.segmentItem, unreadOnly && styles.segmentActive]}><Text style={[styles.segmentText, unreadOnly && styles.segmentTextActive]}>Chưa đọc</Text></Pressable></View>
        <View style={styles.markRow}><Text style={styles.swipeHint}>Vuốt trái để xóa · chạm để đánh dấu đã đọc</Text><Text style={styles.markAll} onPress={async () => { await notificationsApi.markAllRead(); await load(); }}>Đọc tất cả</Text></View></View>}
      ListEmptyComponent={<StateView loading={loading} error={error} empty="Bạn chưa có thông báo nào" onRetry={load} variant="list" />}
      renderItem={({ item }) => <SwipeNotification item={item} onPress={() => void read(item)} onDelete={() => void remove(item)} />} />
  </Screen><BottomSheet visible={prefsOpen} title="Tùy chọn thông báo" onClose={() => setPrefsOpen(false)}>{prefs ? <ScrollView style={{ maxHeight: 480 }}>{preferenceRows.map(row => <PreferenceRow key={row.key} label={row.label} note={row.note} value={prefs[row.key]} onChange={value => void patchPreference(row.key, value)} />)}</ScrollView> : <StateView loading />}</BottomSheet></View>;
}

function SwipeNotification({ item, onPress, onDelete }: { item: AppNotification; onPress(): void; onDelete(): void }) {
  const x = useRef(new Animated.Value(0)).current;
  const { palette, isDark } = useAppTheme();
  const pan = useMemo(() => PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy), onPanResponderMove: (_, g) => x.setValue(Math.max(-96, Math.min(0, g.dx))), onPanResponderRelease: (_, g) => { if (g.dx < -70) Animated.timing(x, { toValue: -96, duration: 160, useNativeDriver: true }).start(); else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(); } }), [x]);
  return <View style={styles.swipeWrap}><Pressable style={styles.deleteAction} onPress={onDelete}><Ionicons name="trash-outline" size={22} color="#fff" /><Text style={styles.deleteText}>Xóa</Text></Pressable><Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }] }}><Pressable onPress={onPress} style={[styles.notification, { backgroundColor: !item.isRead ? (isDark ? '#2b2740' : '#f6f2ff') : palette.surface }]}><View style={[styles.notificationIcon, { backgroundColor: `${notificationColor[item.type] || palette.primary}18` }]}><Ionicons name={notificationIcon[item.type] || 'notifications-outline'} size={23} color={notificationColor[item.type] || palette.primary} /></View><View style={{ flex: 1 }}><View style={styles.notificationTop}><Text numberOfLines={1} style={[styles.notificationTitle, { color: palette.ink }]}>{item.title}</Text>{!item.isRead && <View style={[styles.unreadDot, { backgroundColor: palette.primary }]} />}</View><Text numberOfLines={2} style={[styles.notificationMessage, { color: palette.muted }]}>{item.message}</Text><Text style={[styles.notificationTime, { color: palette.muted }]}>{relativeTime(item.createdAt)}</Text></View></Pressable></Animated.View></View>;
}

const preferenceRows: Array<{ key: keyof NotificationPreference; label: string; note: string }> = [
  { key: 'inAppEnabled', label: 'Thông báo trong ứng dụng', note: 'Bật hoặc tắt toàn bộ thông báo trong app' }, { key: 'emailEnabled', label: 'Thông báo qua email', note: 'Nhận các cập nhật quan trọng qua email' },
  { key: 'pushEnabled', label: 'Thông báo đẩy', note: 'Nhận thông báo khi ứng dụng đang đóng' },
  { key: 'courseUpdates', label: 'Cập nhật khóa học', note: 'Bài học mới và thông báo khóa học' }, { key: 'assignmentReminders', label: 'Nhắc hạn bài tập', note: 'Nhắc các bài tập sắp đến hạn' },
  { key: 'quizResults', label: 'Kết quả quiz', note: 'Thông báo sau khi chấm quiz' }, { key: 'certificateUpdates', label: 'Chứng chỉ', note: 'Thông báo khi chứng chỉ được cấp' },
];
const notificationIcon: Partial<Record<AppNotification['type'], keyof typeof Ionicons.glyphMap>> = { WELCOME: 'sparkles-outline', COURSE_ENROLLED: 'school-outline', NEW_LESSON: 'play-circle-outline', COURSE_ANNOUNCEMENT: 'megaphone-outline', ASSIGNMENT_DUE: 'document-text-outline', ASSIGNMENT_GRADED: 'checkmark-done-outline', QUIZ_RESULT: 'ribbon-outline', PAYMENT_SUCCEEDED: 'card-outline', CERTIFICATE_ISSUED: 'medal-outline', DIRECT_MESSAGE: 'chatbubble-ellipses-outline' };
const notificationColor: Partial<Record<AppNotification['type'], string>> = { ASSIGNMENT_DUE: colors.warning, CERTIFICATE_ISSUED: colors.success, WELCOME: colors.primary };
function relativeTime(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return 'Vừa xong'; if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`; if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`; return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)); }
function FilterRow({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) { const { palette } = useAppTheme(); return <Pressable onPress={onPress} style={[styles.filterRow, { borderBottomColor: palette.border }]}><Text style={[styles.filterLabel, { color: palette.ink }, selected && { color: palette.primary, fontWeight: '900' }]}>{label}</Text>{selected && <Ionicons name="checkmark-circle" size={23} color={palette.primary} />}</Pressable>; }
function PreferenceRow({ label, note, value, onChange }: { label: string; note: string; value: boolean; onChange(value: boolean): void }) { const { palette } = useAppTheme(); return <View style={[styles.preferenceRow, { borderBottomColor: palette.border }]}><View style={{ flex: 1 }}><Text style={[styles.preferenceLabel, { color: palette.ink }]}>{label}</Text><Text style={[styles.preferenceNote, { color: palette.muted }]}>{note}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: '#555b6c', true: '#a994ff' }} thumbColor={value ? palette.primary : '#fff'} /></View>; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, searchBody: { flex: 1, paddingTop: 14 }, listContent: { paddingBottom: 24 }, emptyList: { flexGrow: 1 }, filterRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, filterLabel: { color: colors.ink, fontSize: 16 }, segment: { flexDirection: 'row', backgroundColor: '#ececf4', borderRadius: 14, padding: 4, marginTop: 14 }, segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' }, segmentActive: { backgroundColor: '#fff', ...shadow }, segmentText: { color: colors.muted, fontWeight: '800' }, segmentTextActive: { color: colors.primary }, markRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginVertical: 14 }, swipeHint: { color: colors.muted, fontSize: 10, flex: 1 }, markAll: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  swipeWrap: { overflow: 'hidden', borderRadius: 18, marginBottom: 10, backgroundColor: colors.danger }, deleteAction: { position: 'absolute', right: 0, width: 96, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, deleteText: { color: '#fff', fontWeight: '800', fontSize: 11, marginTop: 3 }, notification: { minHeight: 100, backgroundColor: '#fff', padding: 14, flexDirection: 'row', gap: 12 }, unread: { backgroundColor: '#f6f2ff' }, notificationIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, notificationTop: { flexDirection: 'row', alignItems: 'center', gap: 7 }, notificationTitle: { flex: 1, color: colors.ink, fontWeight: '900' }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }, notificationMessage: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }, notificationTime: { color: '#9ca3af', fontSize: 10, marginTop: 6 }, preferenceRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, preferenceLabel: { color: colors.ink, fontWeight: '800' }, preferenceNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
