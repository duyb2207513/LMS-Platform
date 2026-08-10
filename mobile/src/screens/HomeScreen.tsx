import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  return <LinearGradient colors={['#5535ff', '#b10cff', '#472ec4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>▤</Text></View><Text style={styles.brandText}>LMS Platform</Text></View>
      <View style={styles.hero}>
        <View style={styles.pill}><View style={styles.dot} /><Text style={styles.pillText}>Nền tảng học trực tuyến hàng đầu</Text></View>
        <Text style={styles.heading}>Nâng tầm kiến thức</Text>
        <Text style={styles.highlight}>với LMS Platform</Text>
        <Text style={styles.copy}>Khám phá những khóa học chất lượng cao. Học mọi lúc, mọi nơi với trải nghiệm học tập hiện đại.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.navigate('Courses')}><Text style={styles.primaryText}>Khám phá khóa học  →</Text></Pressable>
        <Pressable style={styles.secondary} onPress={() => navigation.navigate(user ? 'Dashboard' : 'Register')}><Text style={styles.secondaryText}>{user ? 'Vào trang của tôi' : 'Bắt đầu miễn phí'}</Text></Pressable>
        <Pressable style={styles.verify} onPress={() => navigation.navigate('VerifyCertificate')}><Text style={styles.verifyText}>Xác minh chứng chỉ</Text></Pressable>
      </View>
      <View style={styles.stats}><Stat value="100+" label="Khóa học" /><Stat value="50+" label="Giảng viên" /><Stat value="1K+" label="Học viên" /></View>
    </SafeAreaView>
  </LinearGradient>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  fill: { flex: 1 }, safe: { flex: 1, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  logo: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#6335f5', fontSize: 24, fontWeight: '800' }, brandText: { color: '#fff', fontSize: 21, fontWeight: '800', marginLeft: 11 },
  hero: { flex: 1, justifyContent: 'center' },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ffffff55', backgroundColor: '#ffffff18', borderRadius: 24, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#16e0a6', marginRight: 8 }, pillText: { color: '#fff', fontWeight: '600' },
  heading: { color: '#fff', fontSize: 40, lineHeight: 47, fontWeight: '900', marginTop: 26 },
  highlight: { color: '#ffbf20', fontSize: 40, lineHeight: 47, fontWeight: '900', marginTop: 3 },
  copy: { color: '#eeeaff', fontSize: 17, lineHeight: 27, marginTop: 23 },
  primary: { backgroundColor: '#fff', borderRadius: 15, padding: 17, alignItems: 'center', marginTop: 28 }, primaryText: { color: '#4f35de', fontWeight: '800', fontSize: 16 },
  secondary: { borderRadius: 15, borderWidth: 1, borderColor: '#ffffff55', padding: 15, alignItems: 'center', marginTop: 12 }, secondaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  verify: { alignItems: 'center', padding: 12, marginTop: 4 }, verifyText: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 26 }, statValue: { color: '#fff', fontSize: 25, fontWeight: '900' }, statLabel: { color: '#ddd5ff', marginTop: 3 },
});
