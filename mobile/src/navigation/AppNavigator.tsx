import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CommonActions, NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { useMessages } from '../messages/MessageContext';
import type { MainTabParamList, RootStackParamList } from '../types';
import { colors, shadows, typography } from '../theme';
import { useAppTheme } from '../providers/ThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { ConfirmEmailChangeScreen, ForgotPasswordScreen, LoginScreen, RegisterScreen, ResetPasswordScreen, VerifyEmailScreen } from '../screens/AuthScreens';
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
import { SecurityScreen } from '../screens/SecurityScreen';
import { ChatScreen, MessagesScreen } from '../screens/MessageScreens';
import { useNotifications } from '../notifications/NotificationContext';
import { notificationDestination } from '../notifications/notificationNavigation';
import { GradebookScreen } from '../screens/GradebookScreen';
import { AdminControlCenterScreen } from '../screens/AdminControlCenterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const linking: LinkingOptions<RootStackParamList> = { prefixes: ['lmsplatform://'], config: { screens: { ResetPassword: 'reset-password', VerifyEmail: 'verify-email', ConfirmEmailChange: 'confirm-email-change' } } };
const tabConfig: Record<keyof MainTabParamList, { label: string; active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { label: 'Trang chủ', active: 'home', inactive: 'home-outline' }, CoursesTab: { label: 'Khóa học', active: 'library', inactive: 'library-outline' },
  SearchTab: { label: 'Tìm kiếm', active: 'search', inactive: 'search-outline' }, NotificationsTab: { label: 'Thông báo', active: 'notifications', inactive: 'notifications-outline' }, AccountTab: { label: 'Cá nhân', active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets(); const { palette } = useAppTheme();
  const { unreadCount } = useNotifications();
  return <Tabs.Navigator backBehavior="history" screenListeners={{ tabPress: () => { void Haptics.selectionAsync().catch(() => undefined); } }} screenOptions={({ route }) => ({
    headerShown: false, tabBarHideOnKeyboard: true, tabBarActiveTintColor: palette.primary, tabBarInactiveTintColor: palette.muted,
    tabBarLabel: tabConfig[route.name].label, tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2 },
    tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? tabConfig[route.name].active : tabConfig[route.name].inactive} size={Math.max(22, size)} color={color} />,
    tabBarBadge: route.name === 'NotificationsTab' && unreadCount ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
    tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#fff', fontSize: 9, fontWeight: '900' },
    tabBarStyle: { height: 62 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(7, insets.bottom), borderTopWidth: 0, backgroundColor: palette.surface, ...shadows.elevated },
  })}>
    <Tabs.Screen name="HomeTab" component={HomeScreen} /><Tabs.Screen name="CoursesTab" component={CoursesScreen} /><Tabs.Screen name="SearchTab" component={SearchScreen} /><Tabs.Screen name="NotificationsTab" component={NotificationsScreen} /><Tabs.Screen name="AccountTab" component={DashboardScreen} />
  </Tabs.Navigator>;
}

export function AppNavigator() {
  const { isBooting, user } = useAuth(); const { unreadCount } = useMessages(); const { palette, isDark } = useAppTheme();
  const { openRequest, consumeOpenRequest } = useNotifications();
  const navigationRef = useNavigationContainerRef<RootStackParamList>(); const [routeName, setRouteName] = useState<string>();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = { ...baseTheme, colors: { ...baseTheme.colors, primary: palette.primary, background: palette.background, card: palette.surface, text: palette.ink, border: palette.border } };
  useEffect(() => {
    if (!openRequest || !user || !navigationRef.isReady()) return;
    const destination = notificationDestination(openRequest.type, openRequest.data);
    navigationRef.dispatch(CommonActions.navigate({ name: destination.name, params: destination.params }));
    consumeOpenRequest();
  }, [consumeOpenRequest, navigationRef, openRequest, user]);
  if (isBooting) return <View style={[styles.boot, { backgroundColor: palette.background }]}><View style={[styles.logo, { backgroundColor: palette.primary }]}><Ionicons name="book-outline" size={34} color="#fff" /></View><ActivityIndicator size="large" color={palette.primary} /><Text style={[styles.loading, { color: palette.muted }]}>Đang chuẩn bị LMS...</Text></View>;
  return <NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme} onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name)} onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name)}>
    <Stack.Navigator screenOptions={{ headerTintColor: palette.primary, headerStyle: { backgroundColor: palette.surface }, headerTitleAlign: 'center', headerTitleStyle: { ...typography.title, color: palette.ink }, headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false, contentStyle: { backgroundColor: palette.background }, animation: 'slide_from_right', gestureEnabled: true }}>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập', presentation: 'modal' }} /><Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký', presentation: 'modal' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Quên mật khẩu', presentation: 'modal' }} /><Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Đặt lại mật khẩu' }} /><Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Xác minh email' }} /><Stack.Screen name="ConfirmEmailChange" component={ConfirmEmailChangeScreen} options={{ title: 'Xác nhận email mới' }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Bảo mật và thiết bị' }} /><Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} /><Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Chi tiết khóa học' }} /><Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} options={{ title: 'Xác minh chứng chỉ' }} /><Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ' }} /><Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: 'Khóa học của tôi' }} /><Stack.Screen name="Learning" component={LearningScreen} options={{ title: 'Học tập' }} /><Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Làm bài quiz' }} /><Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: 'Kết quả quiz' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Đơn hàng' }} /><Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh toán' }} /><Stack.Screen name="MockPayment" component={MockPaymentScreen} options={{ title: 'Cổng thanh toán' }} /><Stack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ title: 'Kết quả thanh toán', headerBackVisible: false }} /><Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Chứng chỉ' }} />
      <Stack.Screen name="InstructorCourses" component={InstructorCoursesScreen} options={{ title: 'Quản lý khóa học' }} /><Stack.Screen name="CourseForm" component={CourseFormScreen} options={{ title: 'Thông tin khóa học' }} /><Stack.Screen name="CourseBuilder" component={CourseBuilderScreen} options={{ title: 'Xây dựng nội dung' }} /><Stack.Screen name="QuizBuilder" component={QuizBuilderScreen} options={{ title: 'Quiz builder' }} /><Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} options={{ title: 'Quản lý danh mục' }} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ headerShown: false }} /><Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} options={{ headerShown: false }} /><Stack.Screen name="AssignmentManager" component={AssignmentManagerScreen} options={{ headerShown: false }} /><Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} options={{ headerShown: false }} /><Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Gradebook" component={GradebookScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ headerShown: false }} /><Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: false }} /><Stack.Screen name="Refunds" component={RefundsScreen} options={{ headerShown: false }} /><Stack.Screen name="AdminRefunds" component={AdminRefundsScreen} options={{ headerShown: false }} /><Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} options={{ headerShown: false }} /><Stack.Screen name="Revenue" component={RevenueScreen} options={{ headerShown: false }} /><Stack.Screen name="AdminPayouts" component={AdminPayoutsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminControlCenter" component={AdminControlCenterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
    {!!user && !['Messages', 'Chat', 'Login', 'Register'].includes(routeName || '') && <Pressable accessibilityRole="button" accessibilityLabel="Mở tin nhắn" onPress={() => navigationRef.navigate('Messages')} style={[styles.messageFab, { backgroundColor: palette.primary }]}><Ionicons name="chatbubble-ellipses" size={25} color="#fff" />{!!unreadCount && <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}</Pressable>}
  </NavigationContainer>;
}

const styles = StyleSheet.create({ boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }, logo: { width: 70, height: 70, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, loading: { fontWeight: '700' }, messageFab: { position: 'absolute', right: 17, bottom: 82, width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', ...shadows.elevated }, messageBadge: { position: 'absolute', right: -4, top: -5, minWidth: 21, height: 21, borderRadius: 11, paddingHorizontal: 4, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, messageBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' } });
