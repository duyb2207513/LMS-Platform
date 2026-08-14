import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConnectivityBanner, NetworkProvider } from './src/providers/NetworkProvider';
import { ThemeProvider, useAppTheme } from './src/providers/ThemeProvider';

function AppContent() {
  const { isDark } = useAppTheme();
  return <AuthProvider>
    <NetworkProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
      <ConnectivityBanner />
    </NetworkProvider>
  </AuthProvider>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider><AppContent /></ThemeProvider>
    </SafeAreaProvider>
  );
}
