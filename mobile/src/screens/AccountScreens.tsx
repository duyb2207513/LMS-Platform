import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { usersApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { imageUploadFile } from '../api/media';
import { AppBar, Button, Field, Screen, SectionTitle } from '../components/ui';
import type { RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

export function DashboardScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  if (!user) return <Screen topInset><AppBar title="Cá nhân" /><SectionTitle title="Bạn chưa đăng nhập" subtitle="Đăng nhập để xem khóa học, tiến độ và thông tin tài khoản" /><Button title="Đăng nhập" onPress={() => navigation.navigate('Login')} /><Button title="Tạo tài khoản" variant="outline" onPress={() => navigation.navigate('Register')} /></Screen>;
  return <Screen topInset><AppBar title="Cá nhân" subtitle={roleName[user.role]} /><View style={styles.welcome}><View style={styles.avatarSmall}>{user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarSmall} /> : <Text style={styles.avatarLetter}>{user.fullName.charAt(0)}</Text>}</View><View style={{ flex: 1 }}><Text style={styles.hello}>Xin chào,</Text><Text style={styles.name}>{user.fullName}</Text><Text style={styles.role}>{roleName[user.role]}</Text></View></View>
    <Text style={styles.groupTitle}>HỌC TẬP VÀ HOẠT ĐỘNG</Text>
    <Menu icon="compass-outline" title="Khám phá khóa học" note="Danh sách khóa học đang xuất bản" onPress={() => navigation.navigate('CoursesTab')} />
    {user.role === 'STUDENT' && <><Menu icon="library-outline" title="Khóa học của tôi" note="Học tiếp, bài tập và tiến độ" onPress={() => navigation.navigate('MyCourses')} /><Menu icon="stats-chart-outline" title="Phân tích học tập" note="Thời gian học, streak và kết quả" onPress={() => navigation.navigate('Analytics')} /><Menu icon="receipt-outline" title="Đơn hàng của tôi" note="Thanh toán và lịch sử giao dịch" onPress={() => navigation.navigate('Orders')} /><Menu icon="return-down-back-outline" title="Hoàn tiền" note="Theo dõi các yêu cầu hoàn tiền" onPress={() => navigation.navigate('Refunds')} /><Menu icon="medal-outline" title="Chứng chỉ của tôi" note="Xem các chứng chỉ đã được cấp" onPress={() => navigation.navigate('Certificates')} /></>}
    {(user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && <><Menu icon="create-outline" title="Quản lý khóa học" note="Course builder, bài tập và thông báo" onPress={() => navigation.navigate('InstructorCourses')} /><Menu icon="analytics-outline" title="Analytics giảng viên" note="Học viên và hiệu quả khóa học" onPress={() => navigation.navigate('Analytics')} /><Menu icon="wallet-outline" title="Doanh thu" note="Earning, số dư và payout" onPress={() => navigation.navigate('Revenue')} /></>}
    {user.role === 'ADMIN' && <><Text style={styles.groupTitle}>QUẢN TRỊ SPRINT 10</Text><Menu icon="grid-outline" title="Quản lý danh mục" note="Tạo, sửa và xóa category" onPress={() => navigation.navigate('AdminCategories')} /><Menu icon="ticket-outline" title="Coupon" note="Tạo và bật/tắt mã giảm giá" onPress={() => navigation.navigate('AdminCoupons')} /><Menu icon="reload-outline" title="Duyệt hoàn tiền" note="Approve hoặc reject yêu cầu" onPress={() => navigation.navigate('AdminRefunds')} /><Menu icon="cash-outline" title="Payout giảng viên" note="Xử lý payout sandbox" onPress={() => navigation.navigate('AdminPayouts')} /></>}
    <Text style={styles.groupTitle}>TÀI KHOẢN</Text><Menu icon="person-outline" title="Hồ sơ cá nhân" note="Xem và cập nhật thông tin" onPress={() => navigation.navigate('Profile')} /><Menu icon="lock-closed-outline" title="Đổi mật khẩu" note="Bảo vệ tài khoản của bạn" onPress={() => navigation.navigate('ChangePassword')} /><Menu icon="shield-checkmark-outline" title="Xác minh chứng chỉ" note="Kiểm tra chứng chỉ công khai" onPress={() => navigation.navigate('VerifyCertificate')} />
    <Button title="Đăng xuất" variant="outline" onPress={async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); }} />
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
  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .85 });
    if (result.canceled) return;
    setLoading(true); setError('');
    try { const file = await imageUploadFile(result.assets[0], 'avatar'); const profile = (await usersApi.uploadAvatar(file)).data.data; await setUser(profile); setAvatarUrl(profile.avatarUrl || ''); }
    catch (e) { setError(getApiMessage(e, 'Không thể tải ảnh đại diện')); } finally { setLoading(false); }
  }
  return <Screen><SectionTitle title="Hồ sơ của tôi" subtitle="Bạn chỉ có thể cập nhật họ tên và ảnh đại diện" />
    {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.initial}>{fullName.charAt(0).toUpperCase()}</Text></View>}
    <Field label="Họ và tên" value={fullName} onChangeText={setFullName} />
    <Field label="Email" value={user?.email || ''} editable={false} />
    <Button title="Chọn ảnh đại diện" variant="outline" onPress={() => void pickAvatar()} loading={loading} />
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
function Menu({ icon, title, note, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; note: string; onPress(): void }) { return <Pressable onPress={onPress} style={styles.menu}><View style={styles.menuIcon}><Ionicons name={icon} size={22} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuNote}>{note}</Text></View><Ionicons name="chevron-forward" size={22} color={colors.muted} /></Pressable>; }
const styles = StyleSheet.create({ welcome: { backgroundColor: colors.primary, borderRadius: 22, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14, ...shadow }, avatarSmall: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' }, avatarLetter: { color: '#fff', fontSize: 25, fontWeight: '900' }, hello: { color: '#ddd5ff', fontSize: 13 }, name: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 2 }, role: { color: colors.amber, fontSize: 10, fontWeight: '800', marginTop: 6 }, groupTitle: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 10, marginBottom: 9 }, menu: { minHeight: 76, backgroundColor: '#fff', padding: 13, borderRadius: 17, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center', ...shadow }, menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, menuTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, menuNote: { color: colors.muted, fontSize: 11, marginTop: 4 }, avatar: { width: 105, height: 105, borderRadius: 55, alignSelf: 'center', marginBottom: 24 }, avatarFallback: { backgroundColor: '#e9e3ff', alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.primary, fontSize: 42, fontWeight: '900' }, error: { color: colors.danger, marginBottom: 9 } });
