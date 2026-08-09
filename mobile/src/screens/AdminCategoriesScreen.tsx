import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoriesApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { Category } from '../types';
import { colors, shadow } from '../theme';

export function AdminCategoriesScreen() {
  const [items, setItems] = useState<Category[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [editing, setEditing] = useState<Category | null | undefined>(undefined); const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { setItems((await categoriesApi.list()).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  function open(category: Category | null) { setEditing(category); setName(category?.name || ''); setDescription(category?.description || ''); }
  async function save() { setSaving(true); try { editing ? await categoriesApi.update(editing.id, { name: name.trim(), description: description.trim() }) : await categoriesApi.create({ name: name.trim(), description: description.trim() }); setEditing(undefined); await load(); } catch (e) { Alert.alert('Không thể lưu', getApiMessage(e)); } finally { setSaving(false); } }
  function remove(item: Category) { Alert.alert('Xóa danh mục?', item.name, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: async () => { try { await categoriesApi.remove(item.id); await load(); } catch (e) { Alert.alert('Không thể xóa', getApiMessage(e)); } } }]); }
  return <Screen><SectionTitle title="Danh mục" subtitle="Quản lý category dành cho Admin" /><Button title="+ Tạo danh mục" onPress={() => open(null)} />
    {loading || error ? <StateView loading={loading} error={error} onRetry={load} /> : items.map(item => <View key={item.id} style={styles.card}><View style={{ flex: 1 }}><Text style={styles.name}>{item.name}</Text><Text style={styles.slug}>/{item.slug}</Text><Text style={styles.desc}>{item.description || 'Chưa có mô tả'}</Text></View><View><Pressable onPress={() => open(item)}><Text style={styles.edit}>Sửa</Text></Pressable><Pressable onPress={() => remove(item)}><Text style={styles.delete}>Xóa</Text></Pressable></View></View>)}
    <Modal visible={editing !== undefined} transparent animationType="fade" onRequestClose={() => setEditing(undefined)}><View style={styles.overlay}><View style={styles.modal}><Text style={styles.modalTitle}>{editing ? 'Cập nhật danh mục' : 'Tạo danh mục'}</Text><Field label="Tên" value={name} onChangeText={setName} /><Field label="Mô tả" value={description} onChangeText={setDescription} multiline /><Button title="Lưu" onPress={save} loading={saving} disabled={!name.trim()} /><Button title="Hủy" variant="ghost" onPress={() => setEditing(undefined)} /></View></View></Modal>
  </Screen>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 17, padding: 17, marginTop: 13, ...shadow }, name: { color: colors.ink, fontSize: 17, fontWeight: '800' }, slug: { color: colors.primary, fontSize: 12, marginTop: 3 }, desc: { color: colors.muted, marginTop: 8, paddingRight: 8 }, edit: { color: colors.primary, fontWeight: '700', padding: 5 }, delete: { color: colors.danger, fontWeight: '700', padding: 5 }, overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 20 }, modal: { backgroundColor: '#fff', borderRadius: 22, padding: 20 }, modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginBottom: 18 } });
