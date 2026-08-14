import { Platform } from 'react-native';

const developmentHost = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  ios: 'http://localhost:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || developmentHost;
