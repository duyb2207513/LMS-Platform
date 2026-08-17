import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { getApiMessage } from '../api/client';
import { authApi } from '../api/services';
import { Button, Card, Field, Screen, SectionTitle, StatusBadge } from '../components/ui';
import type { AuthSession, RootStackParamList } from '../types';
import { colors } from '../theme';

const deviceName = (agent: string | null) => {
  if (!agent) return 'Thiết bị không xác định';
  if (/iPhone|iPad/i.test(agent)) return 'iPhone / iPad';
  if (/Android/i.test(agent)) return 'Android';
  if (/Windows/i.test(agent)) return 'Windows';
  if (/Macintosh|Mac OS/i.test(agent)) return 'Mac';
  return agent.slice(0, 55);
};

export function SecurityScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Security'>) {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<AuthSession[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState(''); const [password, setPassword] = useState(''); const [sending, setSending] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setSessions((await authApi.sessions()).data.data); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function revoke(session: AuthSession) {
    try { await authApi.revokeSession(session.id); if (session.isCurrent) { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } else await load(); }
    catch (e) { Alert.alert('Không thể đăng xuất thiết bị', getApiMessage(e)); }
  }
  async function revokeOthers() { try { await authApi.revokeOtherSessions(); await load(); Alert.alert('Hoàn tất', 'Đã đăng xuất tất cả thiết bị khác.'); } catch (e) { Alert.alert('Không thể thực hiện', getApiMessage(e)); } }
  async function changeEmail() { setSending(true); setError(''); try { await authApi.changeEmail({ newEmail: newEmail.trim().toLowerCase(), ...(password ? { currentPassword: password } : {}) }); Alert.alert('Đã gửi email', 'Mở liên kết xác nhận trên thiết bị này để hoàn tất.'); setNewEmail(''); setPassword(''); } catch (e) { setError(getApiMessage(e)); } finally { setSending(false); } }
  return <Screen refreshing={loading} onRefresh={() => void load()}><SectionTitle title="Bảo mật và thiết bị" subtitle="Quản lý email và các phiên đang đăng nhập" />
    <Card style={styles.changeCard}><Text style={styles.cardTitle}>Đổi địa chỉ email</Text><Text style={styles.note}>Email hiện tại: {user?.email}</Text><Field label="Email mới" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" /><Field label="Mật khẩu hiện tại (nếu có)" value={password} onChangeText={setPassword} secureTextEntry />{!!error && <Text style={styles.error}>{error}</Text>}<Button title="Gửi liên kết xác nhận" onPress={changeEmail} loading={sending} disabled={!newEmail.trim()} /></Card>
    <View style={styles.heading}><Text style={styles.cardTitle}>Thiết bị đang đăng nhập</Text>{sessions.length > 1 && <Pressable onPress={() => void revokeOthers()}><Text style={styles.link}>Đăng xuất thiết bị khác</Text></Pressable>}</View>
    {sessions.map(session => <Card key={session.id} style={styles.session}><View style={styles.deviceIcon}><Ionicons name="phone-portrait-outline" size={24} color={colors.primary} /></View><View style={styles.sessionBody}><View style={styles.sessionTitle}><Text numberOfLines={1} style={styles.device}>{deviceName(session.userAgent)}</Text>{session.isCurrent && <StatusBadge label="Thiết bị này" tone="success" />}</View><Text style={styles.meta}>IP: {session.ipAddress || 'Không rõ'}</Text><Text style={styles.meta}>Hoạt động: {new Date(session.lastUsedAt).toLocaleString('vi-VN')}</Text></View><Pressable accessibilityLabel="Đăng xuất thiết bị" onPress={() => void revoke(session)} style={styles.revoke}><Ionicons name="log-out-outline" size={21} color={colors.danger} /></Pressable></Card>)}
    {!loading && !sessions.length && <Text style={styles.note}>Không có phiên đăng nhập nào.</Text>}
  </Screen>;
}

const styles = StyleSheet.create({ changeCard: { padding: 16, marginBottom: 25 }, cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' }, note: { color: colors.muted, lineHeight: 20, marginVertical: 8 }, error: { color: colors.danger, marginBottom: 8 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, link: { color: colors.primary, fontSize: 12, fontWeight: '800' }, session: { padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 11 }, deviceIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, sessionBody: { flex: 1 }, sessionTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 }, device: { color: colors.ink, fontWeight: '800', flexShrink: 1 }, meta: { color: colors.muted, fontSize: 10, marginTop: 3 }, revoke: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' } });
