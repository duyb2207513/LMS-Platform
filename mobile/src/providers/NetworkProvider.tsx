import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, shadows, spacing, typography } from '../theme';

interface NetworkContextValue {
  isConnected: boolean;
  connectionKnown: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({ isConnected: true, connectionKnown: false });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setConnected] = useState(true);
  const [connectionKnown, setKnown] = useState(false);
  useEffect(() => NetInfo.addEventListener(state => {
    setKnown(true);
    setConnected(state.isConnected !== false && state.isInternetReachable !== false);
  }), []);
  const value = useMemo(() => ({ isConnected, connectionKnown }), [connectionKnown, isConnected]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function ConnectivityBanner() {
  const { isConnected, connectionKnown } = useNetwork();
  const insets = useSafeAreaInsets();
  if (!connectionKnown || isConnected) return null;
  return <View accessibilityLiveRegion="assertive" style={[styles.banner, { top: Math.max(insets.top, spacing.xs) }]}>
    <Ionicons name="cloud-offline-outline" size={19} color="#fff" />
    <View style={{ flex: 1 }}><Text style={styles.title}>Bạn đang ngoại tuyến</Text><Text style={styles.note}>Ứng dụng sẽ dùng dữ liệu đã lưu gần nhất.</Text></View>
  </View>;
}

export function useNetwork() { return useContext(NetworkContext); }

const styles = StyleSheet.create({
  banner: { position: 'absolute', zIndex: 100, left: spacing.md, right: spacing.md, minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: '#242836', ...shadows.elevated },
  title: { color: '#fff', ...typography.label },
  note: { color: '#c9ceda', ...typography.caption, marginTop: 1 },
});
