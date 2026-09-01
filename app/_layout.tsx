import LoadingOverlay from '@/components/LoadingOverlay';
import { AudioProvider } from '@/context/AudioContext';
import { CarProvider } from '@/context/CarContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useLoadingStore } from '@/src/store/LoadingStore';

import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { useCallback, useEffect } from 'react';

import {
  AppState,
  Platform,
} from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const isLoading = useLoadingStore(
    state => state.isLoading
  );

  const [fontsLoaded, error] = useFonts({
    'Fredoka-Regular':
      require('@/assets/fonts/Fredoka-Regular.ttf'),

    'Fredoka-Medium':
      require('@/assets/fonts/Fredoka-Medium.ttf'),

    'Fredoka-Semibold':
      require('@/assets/fonts/Fredoka_SemiExpanded-Bold.ttf'),

    'Fredoka-Bold':
      require('@/assets/fonts/Fredoka-Bold.ttf'),
  });

  /*
   * FULLSCREEN IMERSIVO
   *
   * Reaplicamos quando o app:
   * - inicia;
   * - volta do background;
   * - retorna de outro aplicativo.
   */
  const enterImmersiveMode =
    useCallback(async () => {
      if (Platform.OS !== 'android') {
        return;
      }

      try {
        await NavigationBar.setVisibilityAsync(
          'hidden'
        );
      } catch (error) {
        console.warn(
          '[NavigationBar] Não foi possível ocultar a barra:',
          error
        );
      }
    }, []);

  useEffect(() => {
    enterImmersiveMode();

    const subscription =
      AppState.addEventListener(
        'change',
        state => {
          if (state === 'active') {
            enterImmersiveMode();
          }
        }
      );

    return () => {
      subscription.remove();
    };
  }, [enterImmersiveMode]);

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <LanguageProvider>
      <AudioProvider>
        <CarProvider>

          {/* Barra superior Android/iOS escondida */}
          <StatusBar hidden />

          <Stack
            screenOptions={{
              headerShown: false,

              /*
               * Permitimos gesto de voltar por padrão.
               * As telas especiais sobrescrevem abaixo.
               */
              gestureEnabled: true,
            }}
          >

            {/* Entrada: nunca deve receber swipe-back */}
            <Stack.Screen
              name="index"
              options={{
                gestureEnabled: false,
              }}
            />

            {/* HOME DO GAME */}
            <Stack.Screen
              name="CarSelectionScreen"
              options={{
                gestureEnabled: false,
              }}
            />

            {/* CORRIDA: completamente bloqueada */}
            <Stack.Screen
              name="mapa"
              options={{
                gestureEnabled: false,
              }}
            />

            {/* Resultado também não volta para corrida */}
            <Stack.Screen
              name="RaceResultScreen"
              options={{
                gestureEnabled: false,
              }}
            />

          </Stack>

          {isLoading && <LoadingOverlay />}

        </CarProvider>
      </AudioProvider>
    </LanguageProvider>
  );
}