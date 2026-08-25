import PreRaceAssetPreloader from '@/components/PreRaceAssetPreloader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const TIPS = [
  'Use suas cartas de corrida no momento certo para virar o jogo!',
  'Gatos correm mais rápido, mas cachorros têm mais resistência?',
  'Preparando os motores e embaralhando o deck...',
  'Dica: Curvas fechadas exigem mais controle!',
];

export default function LoadingScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    next?: string;
  }>();

  const nextRoute = Array.isArray(params.next)
    ? params.next[0]
    : params.next;

  // O preload pesado só é necessário na entrada do fluxo pré-corrida.
  const shouldPreloadPreRace =
    nextRoute === '/CarSelectionScreen';

  const [assetsReady, setAssetsReady] = useState(
    !shouldPreloadPreRace,
  );
  const [minimumTimePassed, setMinimumTimePassed] =
    useState(false);
  const [tip, setTip] = useState('');

  const progress = useRef(
    new Animated.Value(0),
  ).current;

  // Impede duas navegações caso os dois estados mudem muito próximos.
  const navigationStartedRef = useRef(false);

  const handleAssetsReady = useCallback(() => {
    setAssetsReady(true);
  }, []);

  /*
   * FASE 1:
   * - escolhe a dica;
   * - reseta o preload;
   * - anima 0 -> 90%;
   * - garante no mínimo 2 segundos de LoadingScreen.
   *
   * Enquanto isso, PreRaceAssetPreloader está montado no JSX
   * e avisa via onReady quando as imagens terminaram.
   */
  useEffect(() => {
    const randomTip =
      TIPS[Math.floor(Math.random() * TIPS.length)];

    setTip(randomTip);
    setAssetsReady(!shouldPreloadPreRace);
    setMinimumTimePassed(false);
    navigationStartedRef.current = false;

    progress.stopAnimation();
    progress.setValue(0);

    const progressAnimation = Animated.timing(progress, {
      toValue: 0.9,
      duration: 2000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    progressAnimation.start();

    const minimumTimer = setTimeout(() => {
      setMinimumTimePassed(true);
    }, 2000);

    return () => {
      clearTimeout(minimumTimer);
      progressAnimation.stop();
    };
  }, [
    nextRoute,
    progress,
    shouldPreloadPreRace,
  ]);

  /*
   * FASE 2:
   * Só libera os últimos 10% quando:
   *
   * 1) o tempo mínimo passou;
   * 2) os assets necessários estão prontos.
   *
   * Se o destino não precisa de preload, assetsReady já começa true.
   */
  useEffect(() => {
    if (!minimumTimePassed) return;
    if (!assetsReady) return;
    if (navigationStartedRef.current) return;

    navigationStartedRef.current = true;

    let cancelled = false;

    const finishAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    finishAnimation.start(({ finished }) => {
      if (!finished || cancelled) return;

      router.replace(
        nextRoute
          ? (nextRoute as any)
          : '/',
      );
    });

    return () => {
      cancelled = true;
      finishAnimation.stop();
    };
  }, [
    assetsReady,
    minimumTimePassed,
    nextRoute,
    progress,
    router,
  ]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/*
        IMPORTANTE:
        É componente React. Não chame PreRaceAssetPreloader()
        dentro de Promise.all/useEffect.
      */}
      <PreRaceAssetPreloader
        enabled={shouldPreloadPreRace}
        onReady={handleAssetsReady}
      />

      <View style={styles.cardContainer}>
        <Text style={styles.title}>
          CARREGANDO...
        </Text>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            {tip}
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: widthInterpolate },
            ]}
          />
        </View>
      </View>

      <Image
        source={require(
          '@/assets/images/logo1024v1.png'
        )}
        style={styles.wfLogo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  cardContainer: {
    width: '90%',
    backgroundColor: '#333',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 2,
    fontFamily: 'Fredoka-Bold',
  },

  tipBox: {
    width: '100%',
    backgroundColor: '#FFF275',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },

  tipText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Fredoka-Medium',
  },

  progressBarBackground: {
    width: '100%',
    height: 24,
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },

  wfLogo: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    width: 50,
    height: 50,
    opacity: 0.9,
  },
});
