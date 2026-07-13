import LoadingOverlay from '@/components/LoadingOverlay';
import { AudioProvider } from '@/context/AudioContext';
import { CarProvider } from '@/context/CarContext';
import { useLoadingStore } from '@/src/store/LoadingStore';
import { useFonts } from 'expo-font'; // Hook oficial para carregar fontes
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  const [fontsLoaded, error] = useFonts({
    'Fredoka-Regular': require('@/assets/fonts/Fredoka-Regular.ttf'),
    'Fredoka-Medium': require('@/assets/fonts/Fredoka-Medium.ttf'),
    'Fredoka-Semibold': require('@/assets/fonts/Fredoka_SemiExpanded-Bold.ttf'),
    'Fredoka-Bold': require('@/assets/fonts/Fredoka-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <AudioProvider>
      <CarProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {isLoading && <LoadingOverlay />}
      </CarProvider>
    </AudioProvider>
  );
}