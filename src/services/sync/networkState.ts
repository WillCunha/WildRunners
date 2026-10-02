import * as Network from 'expo-network';

export type WildNetworkStatus = 'online' | 'offline' | 'unknown';

export async function getWildNetworkStatus(): Promise<WildNetworkStatus> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false || state.isInternetReachable === false) return 'offline';
    if (state.isConnected === true && state.isInternetReachable !== false) return 'online';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function isWildOnline(): Promise<boolean> {
  return (await getWildNetworkStatus()) === 'online';
}

export function subscribeWildNetwork(
  listener: (status: WildNetworkStatus) => void,
): () => void {
  const subscription = Network.addNetworkStateListener(state => {
    if (state.isConnected === false || state.isInternetReachable === false) {
      listener('offline');
      return;
    }
    if (state.isConnected === true && state.isInternetReachable !== false) {
      listener('online');
      return;
    }
    listener('unknown');
  });

  return () => subscription.remove();
}
