import EntryAssetPreloader from '@/components/EntryAssetPreloader';
import { useLanguage } from '@/context/LanguageContext';
import { waitForAuthReady } from '@/src/services/firebase/firebaseAuth';
import { loadCurrentPlayerCloudSave } from '@/src/services/firebase/playerCloud';
import {
  pendingRaceClaimCount,
  replayPendingRaceClaimsLocally,
} from '@/src/services/sync/offlineOutbox';
import { isWildOnline } from '@/src/services/sync/networkState';
import {
  flushWildOutbox,
  startWildSyncCoordinator,
} from '@/src/services/sync/syncCoordinator';
import { usePlayerStore } from '@/src/store/playerStore';
import { useTutorialStore } from '@/src/store/tutorialStore';
import {
  getRandomLoadingTipKey,
  LOADING_TIP_KEYS,
  type LoadingTipKey,
} from '@/src/utils/loadingTips';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ACCENT = '#FFD60A';

type Phase =
  | 'connecting'
  | 'syncing'
  | 'ready'
  | 'offline_ready'
  | 'registration_required'
  | 'missing_save'
  | 'error';

const COPY = {
  pt: {
    network: 'WILD NETWORK',
    connecting: 'Conectando-se ao servidor da WF...',
    syncing: 'Sincronizando progresso pendente...',
    ready: 'Dados recuperados!',
    offline_ready: 'MODO OFFLINE • progresso salvo neste dispositivo',
    registration_required: 'Faça login para continuar.',
    missing_save: 'Esta conta não possui um save no Wild.',
    error: 'Não foi possível consultar o servidor.',
    firstOffline: 'Este aparelho ainda não possui um save local desta conta. Conecte-se à internet uma vez para baixar seu progresso.',
    retry: 'TENTAR NOVAMENTE',
    pending: (count: number) => `${count} corrida${count === 1 ? '' : 's'} aguardando sincronização`,
    offlinePendingDetail: 'O progresso das corridas está seguro neste dispositivo e será enviado automaticamente quando a internet voltar.',
    preparing: 'Preparando corrida...',
  },
  en: {
    network: 'WILD NETWORK',
    connecting: "Connecting to WF's server...",
    syncing: 'Syncing pending progress...',
    ready: 'Player data restored!',
    offline_ready: 'OFFLINE MODE • progress saved on this device',
    registration_required: 'Sign in to continue.',
    missing_save: 'This account has no Wild save.',
    error: 'Could not reach the server.',
    firstOffline: 'This device does not have a local save for this account yet. Connect once to download your progress.',
    retry: 'TRY AGAIN',
    pending: (count: number) => `${count} race${count === 1 ? '' : 's'} waiting to sync`,
    offlinePendingDetail: 'Race progress is safe on this device and will be sent automatically when the internet returns.',
    preparing: 'Preparing your race...',
  },
  es: {
    network: 'WILD NETWORK',
    connecting: 'Conectando con el servidor de WF...',
    syncing: 'Sincronizando progreso pendiente...',
    ready: '¡Datos recuperados!',
    offline_ready: 'MODO OFFLINE • progreso guardado en este dispositivo',
    registration_required: 'Inicia sesión para continuar.',
    missing_save: 'Esta cuenta no tiene una partida de Wild.',
    error: 'No se pudo consultar el servidor.',
    firstOffline: 'Este dispositivo todavía no tiene una partida local de esta cuenta. Conéctate una vez para descargar tu progreso.',
    retry: 'REINTENTAR',
    pending: (count: number) => `${count} carrera${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} de sincronización`,
    offlinePendingDetail: 'El progreso de las carreras está seguro en este dispositivo y se enviará automáticamente cuando vuelva internet.',
    preparing: 'Preparando carrera...',
  },
} as const;

export default function LoadingScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const copy = COPY[String(language).startsWith('en') ? 'en' : String(language).startsWith('es') ? 'es' : 'pt'];
  const tutorialCompleted = useTutorialStore(state => state.completed);
  const tutorialHydrated = useTutorialStore(state => state.hydrated);

  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [tipKey, setTipKey] = useState<LoadingTipKey>(LOADING_TIP_KEYS[0]);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [message, setMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [cloudRetry, setCloudRetry] = useState(0);

  const mountedRef = useRef(false);
  const navigationStartedRef = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  const animateProgress = useCallback((value: number) => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleProgress = useCallback((loadedCount: number, totalCount: number) => {
    setCompleted(loadedCount);
    setTotal(totalCount);
    animateProgress(totalCount > 0 ? loadedCount / totalCount : 0);
  }, [animateProgress]);

  const handleReady = useCallback(() => {
    setFailed(0);
    setAssetsReady(true);
    progress.stopAnimation();
    progress.setValue(1);
  }, [progress]);

  const handleFailed = useCallback((failedCount: number, totalCount: number) => {
    setFailed(failedCount);
    setTotal(totalCount);
    setAssetsReady(false);
  }, []);

  const retryPreload = useCallback(() => {
    navigationStartedRef.current = false;
    setCompleted(0);
    setTotal(0);
    setFailed(0);
    setAssetsReady(false);
    setTipKey(getRandomLoadingTipKey());
    progress.stopAnimation();
    progress.setValue(0);
    setPreloadAttempt(current => current + 1);
  }, [progress]);

  useEffect(() => {
    mountedRef.current = true;
    setTipKey(getRandomLoadingTipKey());
    startWildSyncCoordinator();

    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 720, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.35, duration: 720, useNativeDriver: true }),
    ]));
    animation.start();

    return () => {
      mountedRef.current = false;
      animation.stop();
    };
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setMessage(null);
      setPhase('connecting');

      try {
        if (!usePlayerStore.persist.hasHydrated()) {
          await usePlayerStore.persist.rehydrate();
        }

        const user = await waitForAuthReady();
        if (cancelled) return;

        if (!user) {
          setPhase('registration_required');
          return;
        }

        // Restore any claim that reached AsyncStorage just before a crash but was
        // not yet reflected in Zustand.
        await replayPendingRaceClaimsLocally(user.uid);
        if (cancelled) return;

        setPendingCount(await pendingRaceClaimCount(user.uid));

        const online = await isWildOnline();
        if (cancelled) return;

        if (!online) {
          const local = usePlayerStore.getState().profile;
          if (local?.id === user.uid) {
            setPhase('offline_ready');
            return;
          }

          setMessage(copy.firstOffline);
          setPhase('error');
          return;
        }

        setPhase('syncing');
        const flush = await flushWildOutbox();
        if (cancelled) return;
        setPendingCount(flush.pending);

        // If some race claims could not be confirmed, do not overwrite their
        // local rewards with an older cloud snapshot. Enter offline-capable mode.
        if (flush.pending > 0) {
          const local = usePlayerStore.getState().profile;
          if (local?.id === user.uid) {
            setPhase('offline_ready');
            return;
          }
        }

        const loaded = await loadCurrentPlayerCloudSave();
        if (cancelled) return;

        if (loaded.status === 'missing') {
          setPhase('missing_save');
          return;
        }

        setPhase('ready');
      } catch (error) {
        console.warn('[WILD LOADING] Cloud bootstrap postponed:', error);
        if (cancelled) return;

        const user = await waitForAuthReady().catch(() => null);
        const local = usePlayerStore.getState().profile;

        if (user && local?.id === user.uid) {
          setPendingCount(await pendingRaceClaimCount(user.uid).catch(() => 0));
          setPhase('offline_ready');
          return;
        }

        setMessage(error instanceof Error ? error.message : String(error));
        setPhase('error');
      }
    }

    void run();
    return () => { cancelled = true; };
  }, [cloudRetry, copy.firstOffline]);

  useEffect(() => {
    if (navigationStartedRef.current) return;

    if (phase === 'registration_required') {
      navigationStartedRef.current = true;
      router.replace('/RegistrationScreen');
      return;
    }

    if (
      (phase !== 'ready' && phase !== 'offline_ready') ||
      !assetsReady ||
      failed > 0 ||
      !tutorialHydrated
    ) return;

    navigationStartedRef.current = true;
    const frameId = requestAnimationFrame(() => {
      router.replace(tutorialCompleted ? '/CarSelectionScreen' : '/TutorialRaceEntry');
    });

    return () => {
      cancelAnimationFrame(frameId);
      navigationStartedRef.current = false;
    };
  }, [phase, assetsReady, failed, tutorialHydrated, tutorialCompleted, router]);

  const retryCloud = useCallback(() => {
    navigationStartedRef.current = false;
    setMessage(null);
    setPhase('connecting');
    setCloudRetry(current => current + 1);
  }, []);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const unresolved = phase === 'error' || phase === 'missing_save';

  const phaseStatus = phase === 'connecting'
    ? copy.connecting
    : phase === 'syncing'
      ? copy.syncing
      : phase === 'ready'
        ? (assetsReady ? copy.ready : copy.preparing)
        : phase === 'offline_ready'
          ? copy.offline_ready
          : phase === 'registration_required'
            ? copy.registration_required
            : phase === 'missing_save'
              ? copy.missing_save
              : copy.error;

  const statusText = pendingCount > 0 && phase === 'offline_ready'
    ? `${phaseStatus} • ${copy.pending(pendingCount)}`
    : phaseStatus;

  const statusColor = phase === 'ready'
    ? '#63E6A0'
    : phase === 'offline_ready'
      ? '#FFB84D'
      : unresolved
        ? '#FF7676'
        : ACCENT;

  return (
    <View style={styles.container}>
      <EntryAssetPreloader
        key={`entry-preload-${preloadAttempt}`}
        onProgress={handleProgress}
        onReady={handleReady}
        onFailed={handleFailed}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.eyebrow}>WILD RUNNERS</Text>
          <Text style={styles.title}>{t('loading.title')}</Text>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>{t(tipKey)}</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: widthInterpolate }]} />
          </View>
          <Text style={styles.progressText}>{percentage}%</Text>

          {phase === 'offline_ready' && pendingCount > 0 && (
            <View style={styles.cloudNotice}>
              <Text style={styles.cloudNoticeTitle}>OFFLINE MODE</Text>
              <Text style={styles.cloudNoticeText}>{copy.pending(pendingCount)}</Text>
              <Text style={styles.cloudNoticeText}>
                {copy.offlinePendingDetail}
              </Text>
            </View>
          )}

          {unresolved && (
            <View style={styles.cloudNotice}>
              <Text style={styles.cloudNoticeTitle}>{phaseStatus}</Text>
              {!!message && <Text selectable style={styles.cloudNoticeText}>{message}</Text>}
              <TouchableOpacity style={styles.cloudAction} activeOpacity={0.85} onPress={retryCloud}>
                <Text style={styles.cloudActionText}>{copy.retry}</Text>
              </TouchableOpacity>
            </View>
          )}

          {failed > 0 && (
            <View style={styles.errorArea}>
              <Text style={styles.errorText}>⚠ {failed}/{total}</Text>
              <TouchableOpacity activeOpacity={0.85} style={styles.retryButton} onPress={retryPreload}>
                <Text style={styles.retryButtonText}>{t('loading.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.networkPanel}>
          <Animated.View style={[styles.networkDot, { backgroundColor: statusColor, opacity: pulse }]} />
          <View style={styles.networkTextArea}>
            <Text style={styles.networkEyebrow}>{copy.network}</Text>
            <Text style={styles.networkStatus} numberOfLines={2}>{statusText}</Text>
          </View>
        </View>
        <Image source={require('@/assets/images/logo1024v1.png')} style={styles.wfLogo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#080A0E', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28,
  },
  scrollArea: { width: '100%', flex: 1 },
  scrollBody: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 18, paddingBottom: 80 },
  content: { width: '100%', maxWidth: 700, alignItems: 'center' },
  eyebrow: { color: ACCENT, fontSize: 13, fontWeight: '900', letterSpacing: 5, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  tipBox: {
    width: '100%', minHeight: 64, justifyContent: 'center', marginTop: 28, marginBottom: 22,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,214,10,0.18)',
  },
  tipText: { color: '#C7CBD3', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  progressBarBackground: {
    width: '100%', height: 12, borderRadius: 999, overflow: 'hidden',
    backgroundColor: '#1B1F27', borderWidth: 1, borderColor: '#2A303A',
  },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: ACCENT },
  progressText: { marginTop: 10, color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cloudNotice: {
    marginTop: 20, padding: 15, width: '100%', maxWidth: 520, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,214,10,0.35)', backgroundColor: 'rgba(18,21,28,0.96)',
  },
  cloudNoticeTitle: { color: ACCENT, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8, textAlign: 'center' },
  cloudNoticeText: { color: '#D7DAE0', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 10 },
  cloudAction: { backgroundColor: ACCENT, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  cloudActionText: { color: '#0B0D10', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  errorArea: { alignItems: 'center', marginTop: 20 },
  errorText: { color: '#FF7676', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  retryButton: {
    minWidth: 150, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT,
  },
  retryButtonText: { color: '#0B0D10', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  footer: {
    position: 'absolute', bottom: 14, left: 18, right: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
  },
  networkPanel: {
    flexShrink: 1, minWidth: 0, maxWidth: 300, minHeight: 44, paddingHorizontal: 11, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 9,
    borderWidth: 1, borderColor: 'rgba(255,214,10,0.18)', backgroundColor: 'rgba(255,255,255,0.045)',
  },
  networkDot: { width: 7, height: 7, borderRadius: 4 },
  networkTextArea: { flexShrink: 1 },
  networkEyebrow: { color: ACCENT, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  networkStatus: { color: '#DBDEE5', fontSize: 10, lineHeight: 13, fontWeight: '700' },
  wfLogo: { width: 50, height: 50, opacity: 0.9 },
});
