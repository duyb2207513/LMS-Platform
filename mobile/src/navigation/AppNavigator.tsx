import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import type { MainTabParamList, RootStackParamList } from '../types';
import { colors, shadows, typography } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import { CoursesScreen, CourseDetailScreen } from '../screens/CourseScreens';
import { ChangePasswordScreen, DashboardScreen, ProfileScreen } from '../screens/AccountScreens';
import { AdminCategoriesScreen } from '../screens/AdminCategoriesScreen';
import { CourseFormScreen, InstructorCoursesScreen } from '../screens/InstructorScreens';
import { CourseBuilderScreen } from '../screens/CourseBuilderScreen';
import { LearningScreen, MyCoursesScreen } from '../screens/LearningScreens';
import { QuizBuilderScreen, QuizResultScreen, QuizScreen } from '../screens/QuizScreens';
import { CertificatesScreen, CheckoutScreen, MockPaymentScreen, OrdersScreen, PaymentResultScreen, VerifyCertificateScreen } from '../screens/PaymentScreens';
import { NotificationsScreen, SearchScreen } from '../screens/MainTabScreens';
import { AssignmentDetailScreen, AssignmentManagerScreen, AssignmentsScreen, AssignmentSubmissionsScreen, SubmissionDetailScreen } from '../screens/AssignmentScreens';
import { AnnouncementsScreen } from '../screens/CommunicationScreens';
import { AnalyticsScreen } from '../screens/AnalyticsScreens';
import { AdminCouponsScreen, AdminPayoutsScreen, AdminRefundsScreen, RefundsScreen, RevenueScreen } from '../screens/CommerceScreens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const navigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: '#fff', text: colors.ink, border: colors.border } };

const tabConfig: Record<keyof MainTabParamList, { label: string; active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { label: 'Trang chủ', active: 'home', inactive: 'home-outline' }, CoursesTab: { label: 'Khóa học', active: 'library', inactive: 'library-outline' },
  SearchTab: { label: 'Tìm kiếm', active: 'search', inactive: 'search-outline' }, NotificationsTab: { label: 'Thông báo', active: 'notifications', inactive: 'notifications-outline' }, AccountTab: { label: 'Cá nhân', active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs.Navigator backBehavior="history" screenOptions={({ route }) => ({
    headerShown: false, tabBarHideOnKeyboard: true, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#8b91a0',
    tabBarLabel: tabConfig[route.name].label, tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2 },
    tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? tabConfig[route.name].active : tabConfig[route.name].inactive} size={Math.max(22, size)} color={color} />,
    tabBarStyle: { height: 62 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(7, insets.bottom), borderTopWidth: 0, backgroundColor: colors.surface, ...shadows.elevated },
  })}>
    <Tabs.Screen name="HomeTab" component={HomeScreen} />
    <Tabs.Screen name="CoursesTab" component={CoursesScreen} />
    <Tabs.Screen name="SearchTab" component={SearchScreen} />
    <Tabs.Screen name="NotificationsTab" component={NotificationsScreen} />
    <Tabs.Screen name="AccountTab" component={DashboardScreen} />
  </Tabs.Navigator>;
}

export function AppNavigator() {
  const { isBooting } = useAuth();
  if (isBooting) return <View style={styles.boot}><View style={styles.logo}><Ionicons name="book-outline" size={34} color="#fff" /></View><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loading}>Đang chuẩn bị LMS...</Text></View>;
  return <NavigationContainer theme={navigationTheme}>
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface }, headerTitleAlign: 'center', headerTitleStyle: typography.title, headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right', gestureEnabled: true }}>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập', presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký', presentation: 'modal' }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Chi tiết khóa học' }} />
      <Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} options={{ title: 'Xác minh chứng chỉ' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: 'Khóa học của tôi' }} />
      <Stack.Screen name="Learning" component={LearningScreen} options={{ title: 'Học tập' }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Làm bài quiz' }} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: 'Kết quả quiz' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Đơn hàng' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh toán' }} />
      <Stack.Screen name="MockPayment" component={MockPaymentScreen} options={{ title: 'Cổng thanh toán' }} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ title: 'Kết quả thanh toán', headerBackVisible: false }} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Chứng chỉ' }} />
      <Stack.Screen name="InstructorCourses" component={InstructorCoursesScreen} options={{ title: 'Quản lý khóa học' }} />
      <Stack.Screen name="CourseForm" component={CourseFormScreen} options={{ title: 'Thông tin khóa học' }} />
      <Stack.Screen name="CourseBuilder" component={CourseBuilderScreen} options={{ title: 'Xây dựng nội dung' }} />
      <Stack.Screen name="QuizBuilder" component={QuizBuilderScreen} options={{ title: 'Quiz builder' }} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} options={{ title: 'Quản lý danh mục' }} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AssignmentManager" component={AssignmentManagerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Refunds" component={RefundsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRefunds" component={AdminRefundsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Revenue" component={RevenueScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminPayouts" component={AdminPayoutsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  </NavigationContainer>;
}

const styles = StyleSheet.create({ boot: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 18 }, logo: { width: 70, height: 70, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, loading: { color: colors.muted, fontWeight: '700' } });
