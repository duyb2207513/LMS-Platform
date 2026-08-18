import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { announcementsApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppBar, BottomSheet, Button, Card, Field, Screen, StateView } from '../components/ui';
import type { Announcement, RootStackParamList } from '../types';
import { colors } from '../theme';

export function AnnouncementsScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Announcements'>) {
  const { user } = useAuth(); const canManage = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const [items, setItems] = useState<Announcement[]>([]); const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems((await announcementsApi.list(route.params.courseId)).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, [route.params.courseId]);
  useEffect(() => { void load(); }, [load]);
  const publish = (item: Announcement) => Alert.alert('Công bố thông báo?', 'Tất cả học viên đang theo học sẽ nhận được thông báo.', [{ text: 'Hủy' }, { text: 'Công bố', onPress: async () => { try { await announcementsApi.publish(item.id); await load(); } catch (e) { Alert.alert('Không thể công bố', getApiMessage(e)); } } }]);
  const remove = (item: Announcement) => Alert.alert('Xóa thông báo?', item.title, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: async () => { try { await announcementsApi.remove(item.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } }]);
  return <View style={{ flex: 1 }}><Screen refreshing={loading} onRefresh={load}><AppBar title="Thông báo khóa học" subtitle={route.params.courseTitle} onBack={navigation.goBack} onMore={canManage ? () => { setEditing(null); setFormOpen(true); } : undefined} />
    {canManage && <Button title="＋ Soạn thông báo" onPress={() => { setEditing(null); setFormOpen(true); }} />}
    {loading || error || !items.length ? <StateView loading={loading} error={error} empty="Chưa có thông báo khóa học" onRetry={load} /> : items.map(item => <Card key={item.id}><View style={styles.top}><View style={[styles.icon, item.status === 'PUBLISHED' && styles.iconPublished]}><Ionicons name="megaphone-outline" size={22} color={item.status === 'PUBLISHED' ? colors.success : colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.status === 'PUBLISHED' ? `Đã công bố · ${date(item.publishedAt || item.createdAt)}` : `Bản nháp · ${date(item.createdAt)}`}</Text></View></View><Text style={styles.content}>{item.content}</Text>{canManage && <View style={styles.actions}>{item.status === 'DRAFT' && <><Pressable onPress={() => { setEditing(item); setFormOpen(true); }}><Text style={styles.link}>Chỉnh sửa</Text></Pressable><Pressable onPress={() => publish(item)}><Text style={styles.publish}>Công bố</Text></Pressable></>}<Pressable onPress={() => remove(item)}><Text style={styles.delete}>Xóa</Text></Pressable></View>}</Card>)}
  </Screen><BottomSheet visible={formOpen} title={editing ? 'Chỉnh sửa thông báo' : 'Thông báo mới'} onClose={() => setFormOpen(false)}><AnnouncementForm courseId={route.params.courseId} item={editing} onDone={async () => { setFormOpen(false); await load(); }} /></BottomSheet></View>;
}

function AnnouncementForm({ courseId, item, onDone }: { courseId: string; item: Announcement | null; onDone(): void }) {
  const [title, setTitle] = useState(item?.title || ''); const [content, setContent] = useState(item?.content || ''); const [saving, setSaving] = useState(false);
  const save = async () => { if (!title.trim() || !content.trim()) return Alert.alert('Thiếu nội dung', 'Vui lòng nhập tiêu đề và nội dung.'); setSaving(true); try { if (item) await announcementsApi.update(item.id, { title: title.trim(), content: content.trim() }); else await announcementsApi.create(courseId, { title: title.trim(), content: content.trim() }); onDone(); } catch (e) { Alert.alert('Không thể lưu', getApiMessage(e)); } finally { setSaving(false); } };
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }}><Field label="Tiêu đề" value={title} onChangeText={setTitle} placeholder="Ví dụ: Lịch học tuần này" /><Field label="Nội dung" value={content} onChangeText={setContent} multiline placeholder="Nội dung gửi đến học viên..." /><View style={styles.note}><Ionicons name="information-circle-outline" size={20} color={colors.primary} /><Text style={styles.noteText}>Thông báo mới được lưu ở dạng bản nháp. Bạn có thể kiểm tra lại trước khi công bố.</Text></View><Button title={item ? 'Lưu thay đổi' : 'Lưu bản nháp'} onPress={save} loading={saving} /></ScrollView>;
}

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const styles = StyleSheet.create({ top: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#fff4d6', alignItems: 'center', justifyContent: 'center' }, iconPublished: { backgroundColor: '#dcfce7' }, title: { color: colors.ink, fontSize: 17, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 11, marginTop: 4 }, content: { color: colors.ink, lineHeight: 23, marginTop: 16 }, actions: { flexDirection: 'row', gap: 22, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 13 }, link: { color: colors.primary, fontWeight: '800' }, publish: { color: colors.success, fontWeight: '800' }, delete: { color: colors.danger, fontWeight: '800' }, note: { flexDirection: 'row', gap: 8, backgroundColor: '#eee9ff', padding: 13, borderRadius: 14, marginBottom: 12 }, noteText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 } });
