import AsyncStorage from '@react-native-async-storage/async-storage';

const keyForUser = (userId: string) => `paywall_unlocked:${userId}`;

export async function isPaywallUnlockedForUser(userId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  return raw === '1';
}

export async function markPaywallUnlockedForUser(userId: string): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), '1');
}
