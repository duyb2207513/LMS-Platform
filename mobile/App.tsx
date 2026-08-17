import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConnectivityBanner, NetworkProvider } from './src/providers/NetworkProvider';
import { ThemeProvider, useAppTheme } from './src/providers/ThemeProvider';
import { MessageProvider } from './src/messages/MessageContext';
import { NotificationProvider } from './src/notifications/NotificationContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, enabled: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN), tracesSampleRate: 0.1 });

function AppContent() {
  const { isDark } = useAppTheme();
  return <AuthProvider>
    <NotificationProvider><MessageProvider><NetworkProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
      <ConnectivityBanner />
    </NetworkProvider></MessageProvider></NotificationProvider>
  </AuthProvider>;
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider><AppContent /></ThemeProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
