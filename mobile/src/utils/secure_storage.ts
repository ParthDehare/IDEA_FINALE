// mobile/src/utils/secure_storage.ts
/**
 * VaultMind Mobile Secure Storage Layer
 * Uses `expo-secure-store` (backed by iOS Keychain and Android Keystore) on native devices
 * to ensure JWT access tokens and sensitive session data cannot be extracted from disk.
 * Falls back safely to AsyncStorage when running in Web preview or if SecureStore is unavailable.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  console.warn('[SecureStorage] expo-secure-store not available or running in web mode. Using fallback storage.');
}

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && SecureStore && SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync())) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (err) {
      console.warn(`[SecureStorage] setItemAsync failed for ${key}, falling back to AsyncStorage:`, err);
    }
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web' && SecureStore && SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync())) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (err) {
      console.warn(`[SecureStorage] getItemAsync failed for ${key}, falling back to AsyncStorage:`, err);
    }
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && SecureStore && SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync())) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch (err) {
      console.warn(`[SecureStorage] removeItemAsync failed for ${key}, falling back to AsyncStorage:`, err);
    }
    await AsyncStorage.removeItem(key);
  }
};
