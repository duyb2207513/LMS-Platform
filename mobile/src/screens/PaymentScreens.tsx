import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { certificatesApi, ordersApi } from '../api/services';
import { getApiMessage } from '../api/client';
import { Button, Field, Screen, SectionTitle, StateView } from '../components/ui';
import type { Certificate, CertificateVerification, Order, RootStackParamList } from '../types';
import { colors, shadow } from '../theme';

const money = (value: number, currency = 'VND') => `${new Intl.NumberFormat('vi-VN').format(value)} ${currency === 'VND' ? '₫' : currency}`;
const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const orderLabel = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy' } as const;

export function OrdersScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Orders'>) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setOrders((await ordersApi.mine()).data.data); setError(''); }
    catch (e) { setError(getApiMessage(e, 'Không thể tải lịch sử đơn hàng')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);
  function cancel(order: Order) {
    Alert.alert('Hủy đơn hàng?', `Đơn ${order.orderNumber} sẽ không thể tiếp tục thanh toán.`, [
      { text: 'Giữ đơn', style: 'cancel' },
      { text: 'Hủy đơn', style: 'destructive', onPress: async () => { try { await ordersApi.cancel(order.id); await load(); } catch (e) { Alert.alert('Không thể hủy đơn', getApiMessage(e)); } } }
    ]);
  }
  return <Screen scroll={false}><SectionTitle title="Đơn hàng của tôi" subtitle="Theo dõi trạng thái và tiếp tục thanh toán các khóa học" />
    {loading || error || !orders.length ? <StateView loading={loading} error={error} empty="Bạn chưa có đơn hàng nào" onRetry={load} /> : <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {orders.map(order => <View key={order.id} style={styles.card}>
        <View style={styles.row}><Text style={styles.orderNumber}>{order.orderNumber}</Text><StatusBadge status={order.status} /></View>
        <Text style={styles.muted}>{date(order.createdAt)}</Text>
        <View style={styles.divider} />
        {order.items.map(item => <View key={item.id} style={styles.itemRow}><Text style={styles.itemTitle}>{item.courseTitleSnapshot}</Text><Text style={styles.itemPrice}>{money(item.priceSnapshot, order.currency)}</Text></View>)}
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.total}>{money(order.total, order.currency)}</Text></View>
        {order.status === 'PENDING' && <View style={styles.actions}><View style={{ flex: 1 }}><Button title="Hủy" variant="ghost" onPress={() => cancel(order)} /></View><View style={{ flex: 1.4 }}><Button title="Thanh toán" onPress={() => navigation.navigate('Checkout', { orderId: order.id })} /></View></View>}
        {order.status === 'PAID' && <Button title="Xem kết quả" variant="outline" onPress={() => navigation.navigate('PaymentResult', { orderId: order.id })} />}
      </View>)}
    </ScrollView>}
  </Screen>;
}

export function CheckoutScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Checkout'>) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setOrder((await ordersApi.get(route.params.orderId)).data.data); setError(''); }
    catch (e) { setError(getApiMessage(e, 'Không thể tải đơn hàng')); }
    finally { setLoading(false); }
  }, [route.params.orderId]);
  useEffect(() => { void load(); }, [load]);
  async function pay() {
    setPaying(true);
    try {
      const result = (await ordersApi.initiateMockPayment(route.params.orderId)).data.data;
      navigation.navigate('MockPayment', { orderId: route.params.orderId, checkoutUrl: result.mockPaymentUrl });
    } catch (e) { Alert.alert('Không thể tạo thanh toán', getApiMessage(e)); }
    finally { setPaying(false); }
  }
  if (loading || error || !order) return <Screen><StateView loading={loading} error={error} onRetry={load} /></Screen>;
  if (order.status !== 'PENDING') return <Screen><SectionTitle title="Đơn hàng đã được xử lý" /><StatusBadge status={order.status} /><Button title="Xem kết quả" onPress={() => navigation.replace('PaymentResult', { orderId: order.id })} /></Screen>;
  return <Screen><SectionTitle title="Xác nhận thanh toán" subtitle={`Đơn hàng ${order.orderNumber}`} />
    <View style={styles.summary}>{order.items.map(item => <View key={item.id} style={styles.checkoutItem}><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.courseTitleSnapshot}</Text><Text style={styles.muted}>Quyền truy cập trọn đời</Text></View><Text style={styles.itemPrice}>{money(item.priceSnapshot, order.currency)}</Text></View>)}
      <View style={styles.divider} /><View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng thanh toán</Text><Text style={styles.total}>{money(order.total, order.currency)}</Text></View>
    </View>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Thanh toán thử nghiệm</Text><Text style={styles.noticeText}>Sprint 4 đang dùng Mock Payment. Không có tiền thật được trừ khỏi tài khoản của bạn.</Text></View>
    <Button title={`Thanh toán ${money(order.total, order.currency)}`} onPress={pay} loading={paying} />
    <Button title="Quay lại lịch sử đơn" variant="ghost" onPress={() => navigation.navigate('Orders')} />
  </Screen>;
}

export function MockPaymentScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'MockPayment'>) {
  const handled = useRef(false);
  return <View style={styles.webviewPage}>
    <WebView
      source={{ uri: route.params.checkoutUrl }}
      startInLoadingState
      onLoadEnd={({ nativeEvent }) => {
        if (!handled.current && nativeEvent.url.includes('/callback')) {
          handled.current = true;
          navigation.replace('PaymentResult', { orderId: route.params.orderId });
        }
      }}
      renderError={() => <StateView error="Không thể mở trang thanh toán" onRetry={() => navigation.replace('Checkout', { orderId: route.params.orderId })} />}
    />
  </View>;
}

export function PaymentResultScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'PaymentResult'>) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setOrder((await ordersApi.get(route.params.orderId)).data.data); setError(''); }
    catch (e) { setError(getApiMessage(e)); }
    finally { setLoading(false); }
  }, [route.params.orderId]);
  useEffect(() => { void load(); }, [load]);
  if (loading || error || !order) return <Screen><StateView loading={loading} error={error} onRetry={load} /></Screen>;
  const lastPayment = order.payments[0];
  const success = order.status === 'PAID';
  const failed = lastPayment?.status === 'FAILED';
  return <Screen><View style={[styles.resultIcon, success ? styles.resultSuccess : styles.resultFailure]}><Text style={styles.resultMark}>{success ? '✓' : failed ? '!' : '…'}</Text></View>
    <Text style={styles.resultTitle}>{success ? 'Thanh toán thành công' : failed ? 'Thanh toán thất bại' : 'Đang chờ thanh toán'}</Text>
    <Text style={styles.resultText}>{success ? 'Khóa học đã được thêm vào tài khoản của bạn.' : failed ? 'Giao dịch chưa thành công. Bạn có thể thử thanh toán lại.' : 'Backend chưa ghi nhận kết quả thanh toán.'}</Text>
    <View style={styles.receipt}><Info label="Mã đơn" value={order.orderNumber} /><Info label="Số tiền" value={money(order.total, order.currency)} /><Info label="Thời gian" value={date(order.paidAt || lastPayment?.createdAt || order.createdAt)} /><Info label="Trạng thái" value={success ? 'Đã thanh toán' : failed ? 'Thất bại' : 'Chờ xử lý'} /></View>
    {success ? <><Button title="Vào khóa học của tôi" onPress={() => navigation.navigate('MyCourses')} /><Button title="Xem lịch sử đơn" variant="outline" onPress={() => navigation.navigate('Orders')} /></> : <><Button title="Thử thanh toán lại" onPress={() => navigation.replace('Checkout', { orderId: order.id })} /><Button title="Kiểm tra lại" variant="outline" onPress={load} /></>}
  </Screen>;
}

export function CertificatesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Certificates'>) {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setItems((await certificatesApi.mine()).data.data); setError(''); } catch (e) { setError(getApiMessage(e)); } finally { setLoading(false); } }, []);
  useEffect(() => navigation.addListener('focus', () => { void load(); }), [navigation, load]);
  return <Screen><SectionTitle title="Chứng chỉ của tôi" subtitle="Thành quả bạn đã đạt được trên LMS Platform" />
    {loading || error || !items.length ? <StateView loading={loading} error={error} empty="Bạn chưa có chứng chỉ nào" onRetry={load} /> : items.map(item => <View key={item.id} style={styles.certificate}>
      <View style={styles.ribbon}><Text style={styles.ribbonText}>LMS</Text></View><Text style={styles.certificateLabel}>CHỨNG CHỈ HOÀN THÀNH</Text><Text style={styles.certificateCourse}>{item.courseTitleSnapshot}</Text><Text style={styles.certificateStudent}>{item.studentNameSnapshot}</Text><Info label="Mã chứng chỉ" value={item.certificateNumber} /><Info label="Ngày cấp" value={date(item.issuedAt)} />
      {!!item.revokedAt && <Text style={styles.revoked}>Chứng chỉ đã bị thu hồi</Text>}
      <Button title="Xác minh chứng chỉ" variant="outline" onPress={() => navigation.navigate('VerifyCertificate', { initialCode: item.verificationCode })} />
    </View>)}
  </Screen>;
}

export function VerifyCertificateScreen({ route }: NativeStackScreenProps<RootStackParamList, 'VerifyCertificate'>) {
  const [code, setCode] = useState(route.params?.initialCode || '');
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verify = useCallback(async () => {
    if (!code.trim()) return setError('Vui lòng nhập mã chứng chỉ');
    setLoading(true); setError(''); setResult(null);
    try { setResult((await certificatesApi.verify(code.trim())).data.data); }
    catch (e) { setError(getApiMessage(e, 'Không tìm thấy chứng chỉ')); }
    finally { setLoading(false); }
  }, [code]);
  useEffect(() => { if (route.params?.initialCode) void verify(); }, []);
  return <Screen><SectionTitle title="Xác minh chứng chỉ" subtitle="Trang công khai — không yêu cầu đăng nhập" />
    <Field label="Mã chứng chỉ hoặc mã xác minh" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="LMS-2026-..." returnKeyType="search" onSubmitEditing={verify} />
    <Button title="Kiểm tra chứng chỉ" onPress={verify} loading={loading} />
    {!!error && <View style={styles.invalidBox}><Text style={styles.invalidTitle}>Không xác minh được</Text><Text style={styles.noticeText}>{error}</Text></View>}
    {result && <View style={[styles.verifyCard, result.valid ? styles.verifyValid : styles.verifyInvalid]}><Text style={styles.verifyIcon}>{result.valid ? '✓' : '!'}</Text><Text style={styles.verifyTitle}>{result.valid ? 'Chứng chỉ hợp lệ' : 'Chứng chỉ không còn hiệu lực'}</Text><Info label="Học viên" value={result.certificate.studentNameSnapshot} /><Info label="Khóa học" value={result.certificate.courseTitleSnapshot} /><Info label="Giảng viên" value={result.certificate.instructorNameSnapshot} /><Info label="Mã chứng chỉ" value={result.certificate.certificateNumber} /><Info label="Ngày cấp" value={date(result.certificate.issuedAt)} /></View>}
  </Screen>;
}

function StatusBadge({ status }: { status: Order['status'] }) { return <View style={[styles.badge, styles[`badge_${status}`]]}><Text style={[styles.badgeText, styles[`badgeText_${status}`]]}>{orderLabel[status]}</Text></View>; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 17, marginBottom: 14, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderNumber: { color: colors.ink, fontWeight: '900', flex: 1 }, muted: { color: colors.muted, fontSize: 12, marginTop: 5 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { fontSize: 11, fontWeight: '900' },
  badge_PENDING: { backgroundColor: '#fff4d6' }, badgeText_PENDING: { color: '#a36300' }, badge_PAID: { backgroundColor: '#dcfce7' }, badgeText_PAID: { color: colors.success }, badge_CANCELLED: { backgroundColor: '#f1f2f4' }, badgeText_CANCELLED: { color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 }, itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 10 }, itemTitle: { color: colors.ink, fontWeight: '700', flex: 1 }, itemPrice: { color: colors.ink, fontWeight: '800' }, totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, totalLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' }, total: { color: colors.primary, fontSize: 21, fontWeight: '900' }, actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  summary: { backgroundColor: '#fff', borderRadius: 20, padding: 18, ...shadow }, checkoutItem: { flexDirection: 'row', gap: 10, paddingVertical: 8 }, notice: { backgroundColor: '#eee9ff', borderRadius: 16, padding: 16, marginVertical: 18 }, noticeTitle: { color: colors.primary, fontWeight: '900' }, noticeText: { color: colors.muted, lineHeight: 21, marginTop: 5 }, webviewPage: { flex: 1, backgroundColor: '#fff' },
  resultIcon: { width: 88, height: 88, borderRadius: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 20 }, resultSuccess: { backgroundColor: '#dcfce7' }, resultFailure: { backgroundColor: '#fee2e2' }, resultMark: { color: colors.success, fontSize: 48, fontWeight: '900' }, resultTitle: { color: colors.ink, fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 20 }, resultText: { color: colors.muted, lineHeight: 23, textAlign: 'center', marginTop: 8 }, receipt: { backgroundColor: '#fff', borderRadius: 18, padding: 17, marginVertical: 22, ...shadow }, info: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 8 }, infoLabel: { color: colors.muted, flex: 1 }, infoValue: { color: colors.ink, fontWeight: '800', flex: 1.5, textAlign: 'right' },
  certificate: { backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#e6ddff', ...shadow }, ribbon: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, ribbonText: { color: '#fff', fontWeight: '900' }, certificateLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginTop: 18 }, certificateCourse: { color: colors.ink, fontSize: 22, lineHeight: 29, fontWeight: '900', marginTop: 8 }, certificateStudent: { color: colors.muted, fontSize: 17, marginTop: 6, marginBottom: 12 }, revoked: { color: colors.danger, fontWeight: '900', textAlign: 'center', marginVertical: 10 },
  invalidBox: { backgroundColor: '#fee2e2', borderRadius: 16, padding: 16, marginTop: 16 }, invalidTitle: { color: colors.danger, fontWeight: '900' }, verifyCard: { borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1.5 }, verifyValid: { backgroundColor: '#f0fdf4', borderColor: '#86efac' }, verifyInvalid: { backgroundColor: '#fff1f2', borderColor: '#fda4af' }, verifyIcon: { color: colors.success, fontSize: 40, fontWeight: '900', textAlign: 'center' }, verifyTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
});
