import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { usersApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { Button, Field, Screen, SectionTitle } from '../components/ui';
import type { RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

export function DashboardScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) {
  const { user, logout } = useAuth();
  if (!user) return <Screen><SectionTitle title="Bạn chưa đăng nhập" /><Button title="Đăng nhập" onPress={() => navigation.replace('Login')} /></Screen>;
  return <Screen><View style={styles.welcome}><Text style={styles.hello}>Xin chào,</Text><Text style={styles.name}>{user.fullName}</Text><Text style={styles.role}>{roleName[user.role]}</Text></View>
    <Menu title="Khám phá khóa học" note="Danh sách khóa học đang xuất bản" onPress={() => navigation.navigate('Courses')} />
    <Menu title="Hồ sơ cá nhân" note="Xem và cập nhật thông tin" onPress={() => navigation.navigate('Profile')} />
    <Menu title="Đổi mật khẩu" note="Bảo vệ tài khoản của bạn" onPress={() => navigation.navigate('ChangePassword')} />
    {(user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && <Menu title="Quản lý khóa học" note="Tạo, sửa và xuất bản khóa học" onPress={() => navigation.navigate('InstructorCourses')} />}
    {user.role === 'ADMIN' && <Menu title="Quản lý danh mục" note="Tạo, sửa và xóa category" onPress={() => navigation.navigate('AdminCategories')} />}
    <Button title="Đăng xuất" variant="outline" onPress={async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }} />
  </Screen>;
}

export function ProfileScreen() {
  const { user, refreshProfile, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || ''); const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  useEffect(() => { void refreshProfile().then(profile => { setFullName(profile.fullName); setAvatarUrl(profile.avatarUrl || ''); }).catch(() => undefined); }, [refreshProfile]);
  async function save() {
    setLoading(true); setError('');
    try { const result = await usersApi.update({ fullName: fullName.trim(), avatarUrl: avatarUrl.trim() || null }); await setUser(result.data.data); Alert.alert('Thành công', 'Đã cập nhật hồ sơ.'); }
    catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); }
  }
  return <Screen><SectionTitle title="Hồ sơ của tôi" subtitle="Bạn chỉ có thể cập nhật họ tên và ảnh đại diện" />
    {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.initial}>{fullName.charAt(0).toUpperCase()}</Text></View>}
    <Field label="Họ và tên" value={fullName} onChangeText={setFullName} />
    <Field label="Email" value={user?.email || ''} editable={false} />
    <Field label="URL ảnh đại diện" value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" placeholder="https://example.com/avatar.jpg" />
    {!!error && <Text style={styles.error}>{error}</Text>}<Button title="Lưu thay đổi" onPress={save} loading={loading} />
  </Screen>;
}

export function ChangePasswordScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ChangePassword'>) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const set = (key: keyof typeof form) => (value: string) => setForm(old => ({ ...old, [key]: value }));
  async function save() {
    if (form.newPassword !== form.confirmNewPassword) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true); setError('');
    try { await usersApi.changePassword(form); Alert.alert('Thành công', 'Mật khẩu đã được thay đổi.', [{ text: 'OK', onPress: navigation.goBack }]); }
    catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); }
  }
  return <Screen><SectionTitle title="Đổi mật khẩu" subtitle="Mật khẩu mới cần có chữ hoa, chữ thường và số" />
    <Field label="Mật khẩu hiện tại" value={form.currentPassword} onChangeText={set('currentPassword')} secureTextEntry />
    <Field label="Mật khẩu mới" value={form.newPassword} onChangeText={set('newPassword')} secureTextEntry />
    <Field label="Xác nhận mật khẩu mới" value={form.confirmNewPassword} onChangeText={set('confirmNewPassword')} secureTextEntry />
    {!!error && <Text style={styles.error}>{error}</Text>}<Button title="Đổi mật khẩu" onPress={save} loading={loading} />
  </Screen>;
}

const roleName = { STUDENT: 'HỌC VIÊN', INSTRUCTOR: 'GIẢNG VIÊN', ADMIN: 'QUẢN TRỊ VIÊN' };
function Menu({ title, note, onPress }: { title: string; note: string; onPress(): void }) { return <Pressable onPress={onPress} style={styles.menu}><View><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuNote}>{note}</Text></View><Text style={styles.arrow}>›</Text></Pressable>; }
const styles = StyleSheet.create({ welcome: { backgroundColor: colors.primary, borderRadius: 22, padding: 22, marginBottom: 20, ...shadow }, hello: { color: '#ddd5ff', fontSize: 16 }, name: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 4 }, role: { color: colors.amber, fontSize: 12, fontWeight: '800', marginTop: 10 }, menu: { minHeight: 78, backgroundColor: '#fff', padding: 17, borderRadius: 17, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadow }, menuTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, menuNote: { color: colors.muted, fontSize: 13, marginTop: 4 }, arrow: { color: colors.primary, fontSize: 32 }, avatar: { width: 105, height: 105, borderRadius: 55, alignSelf: 'center', marginBottom: 24 }, avatarFallback: { backgroundColor: '#e9e3ff', alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.primary, fontSize: 42, fontWeight: '900' }, error: { color: colors.danger, marginBottom: 9 } });
