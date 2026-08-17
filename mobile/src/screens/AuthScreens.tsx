import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../auth/AuthContext';
import { API_URL, getApiMessage } from '../api/client';
import { authApi } from '../api/services';
import { Button, Field, Screen, SectionTitle } from '../components/ui';
import type { RootStackParamList } from '../types';
import { colors } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const tokenFrom = (value: string) => {
  const trimmed = value.trim();
  try { return new URL(trimmed).searchParams.get('token') || trimmed; } catch { return trimmed; }
};
const goToAccount = (navigation: NativeStackScreenProps<RootStackParamList, 'Login'>['navigation']) => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'AccountTab' } }] });

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Login'>) {
  const { login, completeOAuth, googleLogin } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (!email.trim() || !password) return setError('Vui lòng nhập email và mật khẩu');
    setLoading(true); setError('');
    try { await login(email.trim().toLowerCase(), password); goToAccount(navigation); }
    catch (e) { setError(getApiMessage(e, 'Email hoặc mật khẩu không đúng')); }
    finally { setLoading(false); }
  }
  async function github() {
    setLoading(true); setError('');
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'lmsplatform', path: 'auth/github' });
      const result = await WebBrowser.openAuthSessionAsync(`${API_URL}/auth/github?redirectUri=${encodeURIComponent(redirectUri)}`, redirectUri);
      if (result.type !== 'success') return;
      const url = new URL(result.url);
      const oauthError = url.searchParams.get('error');
      const code = url.searchParams.get('code');
      if (oauthError) throw new Error(oauthError);
      if (!code) throw new Error('Không nhận được mã xác thực từ GitHub');
      await completeOAuth(code);
      goToAccount(navigation);
    } catch (e) { setError(getApiMessage(e, 'Không thể đăng nhập bằng GitHub')); }
    finally { setLoading(false); }
  }
  return <Screen><AuthBrand /><SectionTitle title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục hành trình học tập" />
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ban@example.com" />
    <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
    <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}><Text style={styles.link}>Quên mật khẩu?</Text></Pressable>
    {!!error && <Text style={styles.error}>{error}</Text>}<Button title="Đăng nhập" onPress={submit} loading={loading} />
    <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>hoặc</Text><View style={styles.line} /></View>
    <GoogleLoginButton disabled={loading} onToken={async idToken => { setLoading(true); setError(''); try { await googleLogin(idToken); goToAccount(navigation); } catch (e) { setError(getApiMessage(e, 'Không thể đăng nhập bằng Google')); } finally { setLoading(false); } }} />
    <Button title="Tiếp tục với GitHub" variant="outline" onPress={github} loading={loading} />
    <Button title="Chưa có tài khoản? Đăng ký" variant="ghost" onPress={() => navigation.navigate('Register')} />
  </Screen>;
}

function GoogleLoginButton({ disabled, onToken }: { disabled: boolean; onToken(idToken: string): Promise<void> }) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const platformClientId = Platform.select({
    ios: iosClientId,
    android: androidClientId,
    default: webClientId,
  });

  // The provider validates native client IDs as soon as its hook mounts. Keep
  // optional Google login from crashing the complete screen when a platform
  // has not been configured yet.
  if (!platformClientId) return null;

  return <ConfiguredGoogleLoginButton
    androidClientId={androidClientId}
    disabled={disabled}
    iosClientId={iosClientId}
    onToken={onToken}
    webClientId={webClientId}
  />;
}

function ConfiguredGoogleLoginButton({
  androidClientId,
  disabled,
  iosClientId,
  onToken,
  webClientId,
}: {
  androidClientId?: string;
  disabled: boolean;
  iosClientId?: string;
  onToken(idToken: string): Promise<void>;
  webClientId?: string;
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ webClientId, iosClientId, androidClientId, selectAccount: true });
  const onTokenRef = useRef(onToken);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);
  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken || response.params.id_token;
    if (idToken) void onTokenRef.current(idToken);
  }, [response]);
  return <Button title="Tiếp tục với Google" variant="outline" disabled={!request || disabled} onPress={() => void promptAsync()} />;
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
      Alert.alert('Đăng ký thành công', 'Hãy mở email để xác minh tài khoản.', [{ text: 'Nhập mã thủ công', onPress: () => navigation.replace('VerifyEmail') }, { text: 'Đăng nhập', onPress: () => navigation.replace('Login') }]);
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

export function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>) {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState('');
  async function submit() { setLoading(true); setMessage(''); try { await authApi.forgotPassword(email.trim().toLowerCase()); setMessage('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.'); } catch (e) { setMessage(getApiMessage(e)); } finally { setLoading(false); } }
  return <Screen><SectionTitle title="Quên mật khẩu" subtitle="Nhập email để nhận liên kết đặt lại mật khẩu" /><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />{!!message && <Text style={styles.info}>{message}</Text>}<Button title="Gửi liên kết" onPress={submit} loading={loading} disabled={!email.trim()} /><Button title="Tôi đã có token" variant="ghost" onPress={() => navigation.navigate('ResetPassword')} /></Screen>;
}

export function ResetPasswordScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ResetPassword'>) {
  const [token, setToken] = useState(route.params?.token || ''); const [newPassword, setPassword] = useState(''); const [confirmNewPassword, setConfirm] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit() { setLoading(true); setError(''); try { await authApi.resetPassword({ token: tokenFrom(token), newPassword, confirmNewPassword }); Alert.alert('Thành công', 'Mật khẩu đã được đặt lại.', [{ text: 'Đăng nhập', onPress: () => navigation.replace('Login') }]); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }
  return <Screen><SectionTitle title="Đặt lại mật khẩu" subtitle="Bạn có thể dán cả liên kết hoặc token nhận trong email" /><Field label="Token hoặc liên kết" value={token} onChangeText={setToken} autoCapitalize="none" /><Field label="Mật khẩu mới" value={newPassword} onChangeText={setPassword} secureTextEntry /><Field label="Xác nhận mật khẩu" value={confirmNewPassword} onChangeText={setConfirm} secureTextEntry />{!!error && <Text style={styles.error}>{error}</Text>}<Button title="Đặt lại mật khẩu" onPress={submit} loading={loading} /></Screen>;
}

export function VerifyEmailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>) {
  const [token, setToken] = useState(route.params?.token || ''); const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState('');
  async function verify() { setLoading(true); setMessage(''); try { await authApi.verifyEmail(tokenFrom(token)); Alert.alert('Thành công', 'Email đã được xác minh.', [{ text: 'Đăng nhập', onPress: () => navigation.replace('Login') }]); } catch (e) { setMessage(getApiMessage(e)); } finally { setLoading(false); } }
  async function resend() { setLoading(true); setMessage(''); try { await authApi.resendVerification(email.trim().toLowerCase()); setMessage('Nếu tài khoản cần xác minh, email mới đã được gửi.'); } catch (e) { setMessage(getApiMessage(e)); } finally { setLoading(false); } }
  return <Screen><SectionTitle title="Xác minh email" subtitle="Mở deep link trong email hoặc dán token tại đây" /><Field label="Token hoặc liên kết" value={token} onChangeText={setToken} autoCapitalize="none" /><Button title="Xác minh" onPress={verify} loading={loading} disabled={!token.trim()} /><View style={styles.space} /><Field label="Gửi lại tới email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />{!!message && <Text style={styles.info}>{message}</Text>}<Button title="Gửi lại email" variant="outline" onPress={resend} loading={loading} disabled={!email.trim()} /></Screen>;
}

export function ConfirmEmailChangeScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ConfirmEmailChange'>) {
  const { logout } = useAuth(); const [token, setToken] = useState(route.params?.token || ''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit() { setLoading(true); setError(''); try { await authApi.confirmEmailChange(tokenFrom(token)); await logout(); Alert.alert('Thành công', 'Email đã thay đổi. Vui lòng đăng nhập lại.', [{ text: 'Đăng nhập', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }
  return <Screen><SectionTitle title="Xác nhận email mới" subtitle="Xác nhận sẽ đăng xuất tất cả phiên đang hoạt động" /><Field label="Token hoặc liên kết" value={token} onChangeText={setToken} autoCapitalize="none" />{!!error && <Text style={styles.error}>{error}</Text>}<Button title="Xác nhận đổi email" onPress={submit} loading={loading} disabled={!token.trim()} /></Screen>;
}

function AuthBrand() { return <View style={styles.brand}><View style={styles.logoBox}><Ionicons name="book-outline" size={32} color="#fff" /></View><Text style={styles.brandText}>LMS Platform</Text></View>; }
const styles = StyleSheet.create({ brand: { alignItems: 'center', marginVertical: 25 }, logoBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, brandText: { color: colors.primary, fontSize: 22, fontWeight: '900', marginTop: 8 }, error: { color: colors.danger, marginBottom: 8 }, info: { color: colors.muted, lineHeight: 20, marginBottom: 10 }, forgot: { alignSelf: 'flex-end', paddingVertical: 5, marginBottom: 8 }, link: { color: colors.primary, fontWeight: '800' }, divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 15 }, line: { height: 1, flex: 1, backgroundColor: colors.border }, or: { color: colors.muted, fontSize: 12 }, space: { height: 24 } });
