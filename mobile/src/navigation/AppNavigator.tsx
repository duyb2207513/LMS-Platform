import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../types';
import { colors } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import { CoursesScreen, CourseDetailScreen } from '../screens/CourseScreens';
import { ChangePasswordScreen, DashboardScreen, ProfileScreen } from '../screens/AccountScreens';
import { AdminCategoriesScreen } from '../screens/AdminCategoriesScreen';
import { CourseFormScreen, InstructorCoursesScreen } from '../screens/InstructorScreens';
import { CourseBuilderScreen } from '../screens/CourseBuilderScreen';
import { LearningScreen, MyCoursesScreen } from '../screens/LearningScreens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: '#fff', text: colors.ink, border: colors.border } };

export function AppNavigator() {
  const { user, isBooting } = useAuth();
  if (isBooting) return <View style={styles.boot}><View style={styles.logo}><Text style={styles.logoText}>▤</Text></View><ActivityIndicator size="large" color={colors.primary} /></View>;
  return <NavigationContainer theme={navigationTheme}>
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { fontWeight: '800' }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Courses" component={CoursesScreen} options={{ title: 'Khóa học' }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Chi tiết khóa học' }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tài khoản' }} />
      {!user ? <>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
      </> : <>
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }} />
        {user.role === 'STUDENT' && <>
          <Stack.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: 'Khóa học của tôi' }} />
          <Stack.Screen name="Learning" component={LearningScreen} options={{ title: 'Học tập' }} />
        </>}
        {(user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && <>
          <Stack.Screen name="InstructorCourses" component={InstructorCoursesScreen} options={{ title: 'Quản lý khóa học' }} />
          <Stack.Screen name="CourseForm" component={CourseFormScreen} options={{ title: 'Thông tin khóa học' }} />
          <Stack.Screen name="CourseBuilder" component={CourseBuilderScreen} options={{ title: 'Xây dựng nội dung' }} />
        </>}
        {user.role === 'ADMIN' && <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} options={{ title: 'Quản lý danh mục' }} />}
      </>}
    </Stack.Navigator>
  </NavigationContainer>;
}
const styles = StyleSheet.create({ boot: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 22 }, logo: { width: 70, height: 70, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#fff', fontSize: 37 } });
