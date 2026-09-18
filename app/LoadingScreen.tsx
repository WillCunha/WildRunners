import EntryAssetPreloader from '@/components/EntryAssetPreloader';
import { useLanguage } from '@/context/LanguageContext';
import { useTutorialStore } from '@/src/store/tutorialStore';
import {
  getRandomLoadingTipKey,
  LOADING_TIP_KEYS,
  LoadingTipKey,
} from '@/src/utils/loadingTips';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ACCENT = '#FFD60A';

export default function LoadingScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const tutorialCompleted = useTutorialStore(
    state => state.completed,
  );
  const tutorialHydrated = useTutorialStore(
    state => state.hydrated,
  );

  const [completed, setCompleted] =
    useState(0);

  const [total, setTotal] =
    useState(0);

  const [failed, setFailed] =
    useState(0);

  const [assetsReady, setAssetsReady] =
    useState(false);

  const [preloadAttempt, setPreloadAttempt] =
    useState(0);

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
        duration: 120,
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

  const handleReady = useCallback(() => {
    setFailed(0);
    setAssetsReady(true);

    // 100% aqui é real: EntryAssetPreloader
    // confirmou que todos os assets dispararam onLoad.
    progress.stopAnimation();
    progress.setValue(1);
  }, [progress]);

  const handleFailed = useCallback(
    (
      failedCount: number,
      totalCount: number,
    ) => {
      setFailed(failedCount);
      setTotal(totalCount);
      setAssetsReady(false);
    },
    [],
  );

  const retryPreload = useCallback(() => {
    navigationStartedRef.current = false;

    setCompleted(0);
    setTotal(0);
    setFailed(0);
    setAssetsReady(false);

    setTipKey(
      getRandomLoadingTipKey(),
    );

    progress.stopAnimation();
    progress.setValue(0);

    // Remonta o EntryAssetPreloader do zero.
    setPreloadAttempt(
      current => current + 1,
    );
  }, [progress]);

  useEffect(() => {
    setTipKey(
      getRandomLoadingTipKey(),
    );
  }, []);

  useEffect(() => {
    if (!assetsReady) return;
    if (failed > 0) return;
    if (!tutorialHydrated) return;
    if (navigationStartedRef.current) {
      return;
    }

    navigationStartedRef.current = true;

    // Não existe timer artificial.
    // Apenas deixamos o React pintar o frame de 100%
    // e então entramos na raiz interna do jogo.
    const frameId = requestAnimationFrame(
      () => {
        router.replace(
          tutorialCompleted
            ? '/CarSelectionScreen'
            : '/TutorialRaceEntry',
        );
      },
    );

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    assetsReady,
    failed,
    tutorialHydrated,
    tutorialCompleted,
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
      : 0;

  return (
    <View style={styles.container}>
      <EntryAssetPreloader
        key={`entry-preload-${preloadAttempt}`}
        onProgress={handleProgress}
        onReady={handleReady}
        onFailed={handleFailed}
      />

      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          WILD RUNNERS
        </Text>

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
                width: widthInterpolate,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {total > 0
            ? `${percentage}%`
            : '0%'}
        </Text>

        {failed > 0 && (
          <View style={styles.errorArea}>
            <Text style={styles.errorText}>
              ⚠ {failed}/{total}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.retryButton}
              onPress={retryPreload}
            >
              <Text
                style={styles.retryButtonText}
              >
                {t('loading.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  content: {
    width: '100%',
    maxWidth: 700,
    alignItems: 'center',
  },

  eyebrow: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  tipBox: {
    width: '100%',
    minHeight: 64,
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.18)',
  },

  tipText: {
    color: '#C7CBD3',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1B1F27',
    borderWidth: 1,
    borderColor: '#2A303A',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },

  progressText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  errorArea: {
    alignItems: 'center',
    marginTop: 20,
  },

  errorText: {
    color: '#FF7676',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },

  retryButton: {
    minWidth: 150,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },

  retryButtonText: {
    color: '#0B0D10',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
