import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationsApi } from '../api/services';

const DEVICE_ID_KEY = 'lms.pushDeviceId';
const PUSH_TOKEN_KEY = 'lms.expoPushToken';

export async function savePushDevice(deviceId: string, token: string) {
  await AsyncStorage.multiSet([[DEVICE_ID_KEY, deviceId], [PUSH_TOKEN_KEY, token]]);
}

export async function unregisterCurrentPushDevice() {
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (deviceId) await notificationsApi.unregisterDevice(deviceId).catch(() => undefined);
  await AsyncStorage.multiRemove([DEVICE_ID_KEY, PUSH_TOKEN_KEY]);
}

export async function getSavedPushToken() { return AsyncStorage.getItem(PUSH_TOKEN_KEY); }
