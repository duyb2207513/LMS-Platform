import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { getApiMessage } from '../api/client';
import { Button, Field, Screen, SectionTitle } from '../components/ui';
import type { RootStackParamList } from '../types';
import { colors } from '../theme';

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Login'>) {
  const { login } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (!email.trim() || !password) return setError('Vui lòng nhập email và mật khẩu');
    setLoading(true); setError('');
    try { await login(email.trim().toLowerCase(), password); navigation.replace('Main', { screen: 'AccountTab' }); }
    catch (e) { setError(getApiMessage(e, 'Email hoặc mật khẩu không đúng')); }
    finally { setLoading(false); }
  }
  return <Screen><AuthBrand /><SectionTitle title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục hành trình học tập" />
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ban@example.com" />
    <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
    {!!error && <Text style={styles.error}>{error}</Text>}<Button title="Đăng nhập" onPress={submit} loading={loading} />
    <Button title="Chưa có tài khoản? Đăng ký" variant="ghost" onPress={() => navigation.navigate('Register')} />
  </Screen>;
}

export function RegisterScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Register'>) {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const set = (key: keyof typeof form) => (value: string) => setForm(old => ({ ...old, [key]: value }));
  async function submit() {
    if (form.fullName.trim().length < 2) return setError('Họ tên phải có ít nhất 2 ký tự');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true); setError('');
    try {
      await register({ ...form, fullName: form.fullName.trim(), email: form.email.trim().toLowerCase() });
      Alert.alert('Đăng ký thành công', 'Bạn có thể đăng nhập bằng tài khoản vừa tạo.', [{ text: 'Đăng nhập', onPress: () => navigation.replace('Login') }]);
    } catch (e) { setError(getApiMessage(e, 'Không thể đăng ký tài khoản')); }
    finally { setLoading(false); }
  }
  return <Screen><AuthBrand /><SectionTitle title="Tạo tài khoản" subtitle="Bắt đầu học tập miễn phí cùng LMS Platform" />
    <Field label="Họ và tên" value={form.fullName} onChangeText={set('fullName')} placeholder="Trần Minh Duy" />
    <Field label="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder="ban@example.com" />
    <Field label="Mật khẩu" value={form.password} onChangeText={set('password')} secureTextEntry placeholder="Tối thiểu 8 ký tự, gồm hoa, thường và số" />
    <Field label="Xác nhận mật khẩu" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry placeholder="Nhập lại mật khẩu" />
    {!!error && <Text style={styles.error}>{error}</Text>}<Button title="Đăng ký" onPress={submit} loading={loading} />
    <Button title="Đã có tài khoản? Đăng nhập" variant="ghost" onPress={() => navigation.navigate('Login')} />
  </Screen>;
}

function AuthBrand() { return <View style={styles.brand}><Text style={styles.logo}>▤</Text><Text style={styles.brandText}>LMS Platform</Text></View>; }
const styles = StyleSheet.create({ brand: { alignItems: 'center', marginVertical: 25 }, logo: { color: colors.primary, fontSize: 48 }, brandText: { color: colors.primary, fontSize: 22, fontWeight: '900', marginTop: 6 }, error: { color: colors.danger, marginBottom: 8 } });
