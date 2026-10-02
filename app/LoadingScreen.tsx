import EntryAssetPreloader from '@/components/EntryAssetPreloader';
import { useLanguage } from '@/context/LanguageContext';
import { waitForAuthReady } from '@/src/services/firebase/firebaseAuth';
import { loadCurrentPlayerCloudSave } from '@/src/services/firebase/playerCloud';
import { usePlayerStore } from '@/src/store/playerStore';
import { useTutorialStore } from '@/src/store/tutorialStore';
import {
  getRandomLoadingTipKey,
  LOADING_TIP_KEYS,
  LoadingTipKey,
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
  | 'auth_required'
  | 'checking'
  | 'recovering'
  | 'ready'
  | 'missing_save'
  | 'error';

type LanguageCopy = {
  network: string;
  stages: Record<Phase, string>;
  readyAssets: string;
  missingTitle: string;
  missingText: string;
  errorTitle: string;
  errorText: string;
  retry: string;
  login: string;
};

const COPY: Record<'pt' | 'en' | 'es', LanguageCopy> = {
  pt: {
    network: 'WILD NETWORK',
    stages: {
      connecting: 'Conectando-se ao servidor da WF...',
      auth_required: 'Aguardando autenticação...',
      checking: 'Verificando sua conta WF...',
      recovering: 'Recuperando dados do piloto...',
      ready: 'Dados recuperados!',
      missing_save: 'Conta autenticada sem save do Wild.',
      error: 'Não foi possível se conectar ao servidor da WF.',
    },
    readyAssets: 'Preparando corrida...',
    missingTitle: 'SAVE NÃO ENCONTRADO',
    missingText: 'O login foi confirmado, mas este UID não possui playerSaves. Nenhum save foi criado, importado ou sobrescrito automaticamente.',
    errorTitle: 'FALHA DE CONEXÃO',
    errorText: 'Não foi possível validar seu save no Firestore. Seu armazenamento local não foi apagado.',
    retry: 'TENTAR NOVAMENTE',
    login: 'VOLTAR AO LOGIN',
  },
  en: {
    network: 'WILD NETWORK',
    stages: {
      connecting: "Connecting to WF's server...",
      auth_required: 'Waiting for authentication...',
      checking: 'Checking your WF account...',
      recovering: 'Restoring driver data...',
      ready: 'Player data restored!',
      missing_save: 'Authenticated account has no Wild save.',
      error: "It was not possible to connect to WF's server.",
    },
    readyAssets: 'Preparing your race...',
    missingTitle: 'SAVE NOT FOUND',
    missingText: 'Sign-in succeeded, but this UID has no playerSaves document. No save was created, imported, or overwritten automatically.',
    errorTitle: 'CONNECTION FAILED',
    errorText: 'Your Firestore save could not be validated. Local storage was not erased.',
    retry: 'TRY AGAIN',
    login: 'BACK TO LOGIN',
  },
  es: {
    network: 'WILD NETWORK',
    stages: {
      connecting: 'Conectando con el servidor de WF...',
      auth_required: 'Esperando autenticación...',
      checking: 'Verificando tu cuenta WF...',
      recovering: 'Recuperando datos del piloto...',
      ready: '¡Datos recuperados!',
      missing_save: 'La cuenta autenticada no tiene partida de Wild.',
      error: 'No se puede conectar con el servidor de WF.',
    },
    readyAssets: 'Preparando carrera...',
    missingTitle: 'PARTIDA NO ENCONTRADA',
    missingText: 'El acceso fue confirmado, pero este UID no tiene playerSaves. No se creó, importó ni sobrescribió ninguna partida automáticamente.',
    errorTitle: 'FALLO DE CONEXIÓN',
    errorText: 'No se pudo validar tu partida en Firestore. El almacenamiento local no fue borrado.',
    retry: 'REINTENTAR',
    login: 'VOLVER AL LOGIN',
  },
};

function getLanguageCopy(language: string): LanguageCopy {
  return COPY[language.startsWith('en') ? 'en' : language.startsWith('es') ? 'es' : 'pt'];
}

export default function LoadingScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const copy = getLanguageCopy(String(language));
  const tutorialCompleted = useTutorialStore(state => state.completed);
  const tutorialHydrated = useTutorialStore(state => state.hydrated);

  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [tipKey, setTipKey] = useState<LoadingTipKey>(LOADING_TIP_KEYS[0]);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [cloudAttempt, setCloudAttempt] = useState(0);

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

  const retryCloud = useCallback(() => {
    navigationStartedRef.current = false;
    setPhase('connecting');
    setCloudAttempt(current => current + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setTipKey(getRandomLoadingTipKey());

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

    async function runCloudBootstrap() {
      setPhase('connecting');

      try {
        // Keep Zustand/AsyncStorage as the explicit local cache. Do not erase it
        // before the server has successfully returned the authenticated save.
        if (!usePlayerStore.persist.hasHydrated()) {
          await usePlayerStore.persist.rehydrate();
        }
        if (cancelled) return;

        const user = await waitForAuthReady();
        if (cancelled) return;

        if (!user) {
          setPhase('auth_required');
          return;
        }

        setPhase('checking');
        const result = await loadCurrentPlayerCloudSave();
        if (cancelled) return;

        if (result.status === 'missing') {
          setPhase('missing_save');
          return;
        }

        setPhase('recovering');
        // loadCurrentPlayerCloudSave already validated and installed the snapshot.
        setPhase('ready');
      } catch (error) {
        console.warn('[Wild Firebase] Bootstrap failed:', error);
        if (!cancelled) setPhase('error');
      }
    }

    void runCloudBootstrap();
    return () => { cancelled = true; };
  }, [cloudAttempt]);

  useEffect(() => {
    if (navigationStartedRef.current) return;

    if (phase === 'auth_required') {
      navigationStartedRef.current = true;
      router.replace('/RegistrationScreen');
      return;
    }

    if (phase !== 'ready' || !assetsReady || failed > 0 || !tutorialHydrated) return;

    navigationStartedRef.current = true;
    const frameId = requestAnimationFrame(() => {
      router.replace(tutorialCompleted ? '/CarSelectionScreen' : '/TutorialRaceEntry');
    });

    return () => {
      cancelAnimationFrame(frameId);
      navigationStartedRef.current = false;
    };
  }, [phase, assetsReady, failed, tutorialHydrated, tutorialCompleted, router]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const unresolved = phase === 'missing_save' || phase === 'error';
  const statusText = phase === 'ready' && !assetsReady
    ? copy.readyAssets
    : copy.stages[phase];
  const statusColor = phase === 'ready'
    ? '#63E6A0'
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

          {phase === 'missing_save' && (
            <View style={styles.cloudNotice}>
              <Text style={styles.cloudNoticeTitle}>{copy.missingTitle}</Text>
              <Text style={styles.cloudNoticeText}>{copy.missingText}</Text>
              <TouchableOpacity style={styles.cloudAction} activeOpacity={0.85} onPress={retryCloud}>
                <Text style={styles.cloudActionText}>{copy.retry}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recoveryAction} activeOpacity={0.85} onPress={() => router.replace('/RegistrationScreen')}>
                <Text style={styles.cloudActionText}>{copy.login}</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.cloudNotice}>
              <Text style={styles.cloudNoticeTitle}>{copy.errorTitle}</Text>
              <Text style={styles.cloudNoticeText}>{copy.errorText}</Text>
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
  recoveryArea: { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,214,10,0.22)', paddingTop: 12 },
  recoveryAction: { backgroundColor: '#61E7FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  recoveryConfirmed: { textAlign: 'center', color: '#63E6A0', fontSize: 11, lineHeight: 18, fontWeight: '800', marginBottom: 10 },
  recoveryError: { textAlign: 'center', color: '#FF7676', fontSize: 11, lineHeight: 17, marginBottom: 10 },
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
    flexShrink: 1, minWidth: 0, maxWidth: 240, minHeight: 44, paddingHorizontal: 11, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 9,
    borderWidth: 1, borderColor: 'rgba(255,214,10,0.18)', backgroundColor: 'rgba(255,255,255,0.045)',
  },
  networkDot: { width: 7, height: 7, borderRadius: 4 },
  networkTextArea: { flexShrink: 1 },
  networkEyebrow: { color: ACCENT, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  networkStatus: { color: '#DBDEE5', fontSize: 10, lineHeight: 13, fontWeight: '700' },
  wfLogo: { width: 50, height: 50, opacity: 0.9 },
});
