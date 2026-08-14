import { API_URL } from './clientConfig';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const UPLOAD_PATH = '/uploads/';

function apiOrigin(): string {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }
}

function isLocalDevelopmentHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2') return true;
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true;

  const match = /^172\.(\d{1,2})\./.exec(hostname);
  return !!match && Number(match[1]) >= 16 && Number(match[1]) <= 31;
}

/** Resolve uploaded development assets through the API host currently used by the phone. */
export function resolveMediaUrl(value: string): string {
  const uploadIndex = value.indexOf(UPLOAD_PATH);
  if (uploadIndex < 0) return value;
  if (value.startsWith(UPLOAD_PATH)) return `${apiOrigin()}${value}`;

  try {
    const parsed = new URL(value);
    return isLocalDevelopmentHost(parsed.hostname)
      ? `${apiOrigin()}${value.slice(uploadIndex)}`
      : value;
  } catch {
    return `${apiOrigin()}${value.slice(uploadIndex)}`;
  }
}

export function normalizeMediaUrls<T>(value: T): T {
  if (typeof value === 'string') return resolveMediaUrl(value) as T;
  if (Array.isArray(value)) return value.map(item => normalizeMediaUrls(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeMediaUrls(item)]),
    ) as T;
  }
  return value;
}

export interface MobileUploadFile {
  uri: string;
  name: string;
  type: string;
}

export async function imageUploadFile(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
  fallbackName: string,
): Promise<MobileUploadFile> {
  const converted = await manipulateAsync(asset.uri, [], {
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  return {
    uri: converted.uri,
    name: `${fallbackName}.jpg`,
    type: 'image/jpeg',
  };
}
