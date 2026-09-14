import { getCenarioPreloadSources, type CenarioId } from '@/components/Cenarios/CenarioBackground';
import PreRaceAssetPreloader, { type PreloadMode } from '@/components/PreRaceAssetPreloader';
import { useLanguage } from '@/context/LanguageContext';
import {
  getRandomLoadingTipKey,
  LOADING_TIP_KEYS,
  LoadingTipKey,
} from '@/src/utils/loadingTips';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoadingScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const params =
    useLocalSearchParams<{
      next?: string;
      deck?: string;
      mapImage?: string;
    }>();

  const nextRoute = Array.isArray(
    params.next,
  )
    ? params.next[0]
    : params.next;

  const shouldPreloadAssets =
    nextRoute === '/CarSelectionScreen' ||
    nextRoute === '/mapa';

  const preloadMode: PreloadMode =
    nextRoute === '/mapa'
      ? 'race'
      : 'carSelection';

  const extraSources = useMemo(() => {
    if (
      nextRoute !== '/mapa' ||
      !params.mapImage
    ) {
      return [];
    }

    return getCenarioPreloadSources(
      params.mapImage as CenarioId,
      'day',
    );
  }, [nextRoute, params.mapImage]);

  const [
    assetsReady,
    setAssetsReady,
  ] = useState(
    !shouldPreloadAssets,
  );

  const [
    completed,
    setCompleted,
  ] = useState(0);

  const [total, setTotal] =
    useState(0);

  const [failed, setFailed] =
    useState(0);

  const [
    preloadAttempt,
    setPreloadAttempt,
  ] = useState(0);

  const [tipKey, setTipKey] =
    useState<LoadingTipKey>(
      LOADING_TIP_KEYS[0],
    );

  const progress = useRef(
    new Animated.Value(0),
  ).current;

  const navigationStartedRef =
    useRef(false);

  const animateProgress = useCallback(
    (value: number) => {
      Animated.timing(progress, {
        toValue: Math.max(
          0,
          Math.min(1, value),
        ),
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    },
    [progress],
  );

  const handleProgress = useCallback(
    (
      loadedCount: number,
      totalCount: number,
    ) => {
      setCompleted(loadedCount);
      setTotal(totalCount);

      const realProgress =
        totalCount > 0
          ? loadedCount / totalCount
          : 0;

      animateProgress(realProgress);
    },
    [animateProgress],
  );

  const handleAssetsReady =
    useCallback(() => {
      // Se houve um onError transitório que se recuperou no retry,
      // garantimos que a tela não fique presa com um valor antigo.
      setFailed(0);
      setAssetsReady(true);

      // 100% somente depois que o preloader confirmou
      // que todos os assets necessários carregaram.
      animateProgress(1);
    }, [animateProgress]);

  const handlePreloadError =
    useCallback(
      (
        failedCount: number,
        totalCount: number,
      ) => {
        // O preloader agora envia 0 novamente quando um asset
        // que havia falhado se recupera no retry automático.
        setFailed(failedCount);
        setTotal(totalCount);
      },
      [],
    );

  const retryPreload = useCallback(() => {
    setCompleted(0);
    setTotal(0);
    setFailed(0);
    setAssetsReady(false);

    navigationStartedRef.current =
      false;

    progress.stopAnimation();
    progress.setValue(0);

    setPreloadAttempt(
      current => current + 1,
    );
  }, [progress]);

  useEffect(() => {
    setTipKey(
      getRandomLoadingTipKey(),
    );

    setCompleted(0);
    setTotal(0);
    setFailed(0);

    navigationStartedRef.current =
      false;

    progress.stopAnimation();
    progress.setValue(0);

    if (shouldPreloadAssets) {
      setAssetsReady(false);
      return;
    }

    // Essa rota não tem lote de imagens para pré-carregar.
    // Não inventamos uma porcentagem intermediária.
    setAssetsReady(true);
    animateProgress(1);
  }, [
    animateProgress,
    nextRoute,
    progress,
    shouldPreloadAssets,
  ]);

  useEffect(() => {
    if (!assetsReady) return;
    if (failed > 0) return;

    if (
      navigationStartedRef.current
    ) {
      return;
    }

    navigationStartedRef.current =
      true;

    // Pequena suavização visual para o usuário enxergar
    // a barra chegando ao 100% real antes da troca de tela.
    const finishAnimation =
      Animated.timing(progress, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(
          Easing.quad,
        ),
        useNativeDriver: false,
      });

    finishAnimation.start(
      ({ finished }) => {
        if (!finished) return;

        if (nextRoute === '/mapa') {
          router.replace({
            pathname: '/mapa',
            params: {
              deck: params.deck,
              mapImage: params.mapImage,
            },
          } as any);

          return;
        }

        router.replace(
          nextRoute
            ? (nextRoute as any)
            : '/',
        );
      },
    );

    return () => {
      finishAnimation.stop();
    };
  }, [
    assetsReady,
    failed,
    nextRoute,
    params.deck,
    params.mapImage,
    progress,
    router,
  ]);

  const widthInterpolate =
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

  const percentage =
    total > 0
      ? Math.round(
          (completed / total) * 100,
        )
      : assetsReady
        ? 100
        : 0;

  return (
    <View style={styles.container}>
      <PreRaceAssetPreloader
        key={`preload-${preloadAttempt}`}
        enabled={shouldPreloadAssets}
        mode={preloadMode}
        onProgress={handleProgress}
        onReady={handleAssetsReady}
        onError={handlePreloadError}
        extraSources={extraSources}
      />

      <View style={styles.cardContainer}>
        <Text style={styles.title}>
          {t('loading.title')}
        </Text>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            {t(tipKey)}
          </Text>
        </View>

        <View
          style={
            styles.progressBarBackground
          }
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width:
                  widthInterpolate,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {total > 0
            ? `${percentage}%  •  ${completed}/${total}`
            : `${percentage}%`}
        </Text>

        {failed > 0 && (
          <View style={styles.errorBox}>
            <Text
              style={styles.errorText}
            >
              {failed}{' '}
              recurso
              {failed > 1 ? 's' : ''}{' '}
              não carregou
              {failed > 1 ? 'aram' : ''}.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryPreload}
              activeOpacity={0.85}
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                {t('loading.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    borderColor: '#000',
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

  progressText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
  },

  errorBox: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },

  errorText: {
    color: '#ffb4b4',
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'Fredoka-Medium',
  },

  retryButton: {
    backgroundColor: '#FFF275',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },

  retryButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Fredoka-Bold',
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
