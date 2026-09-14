import { carMaps } from '@/src/utils/carMaps';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

const CARD_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/cards/chains.png'),
  require('@/assets/images/cards/tnt.png'),
  require('@/assets/images/cards/swap.png'),
  require('@/assets/images/cards/slow_slow.png'),
  require('@/assets/images/cards/blind.png'),
  require('@/assets/images/cards/bullet.png'),
  require('@/assets/images/cards/tornado.png'),
  require('@/assets/images/cards/bubble_lift.png'),
  require('@/assets/images/cards/nitro_power.png'),
  require('@/assets/images/cards/shield.png'),
  require('@/assets/images/cards/armor.png'),
  require('@/assets/images/cards/repair_quick.png'),
  require('@/assets/images/cards/ghost.png'),
  require('@/assets/images/cards/second_chance.png'),
];

const EFFECT_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/animation/explosion/img_0.png'),
  require('@/assets/images/animation/explosion/img_1.png'),
  require('@/assets/images/animation/explosion/img_2.png'),
  require('@/assets/images/animation/explosion/img_3.png'),
  require('@/assets/images/animation/explosion/img_4.png'),
  require('@/assets/images/animation/explosion/img_5.png'),
  require('@/assets/images/animation/explosion/img_6.png'),
  require('@/assets/images/animation/explosion/img_7.png'),

  require('@/assets/images/animation/tornado/img_0.png'),
  require('@/assets/images/animation/tornado/img_1.png'),
  require('@/assets/images/animation/tornado/img_2.png'),
  require('@/assets/images/animation/tornado/img_3.png'),
  require('@/assets/images/animation/tornado/img_4.png'),
  require('@/assets/images/animation/tornado/img_5.png'),
  require('@/assets/images/animation/tornado/img_6.png'),
  require('@/assets/images/animation/tornado/img_7.png'),
];

const UI_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/components/background/background_home.png'),
  require('@/assets/images/components/background/start_screen.png'),
  require('@/assets/images/gameLogoV5.png'),
  require('@/assets/images/logo1024v1.png'),
];

const EMPTY_EXTRA_SOURCES: ImageSourcePropType[] = [];

// Evita pedir ao Android para decodificar dezenas de PNGs pesados ao mesmo tempo.
const PRELOAD_BATCH_SIZE = 6;

// Cada imagem ganha até 2 novas tentativas antes de ser considerada falha real.
const MAX_AUTO_RETRIES = 2;

export type PreloadMode = 'carSelection' | 'race';

function isImageSource(value: unknown): value is ImageSourcePropType {
  if (typeof value === 'number') return true;

  return (
    typeof value === 'object' &&
    value !== null &&
    'uri' in value
  );
}

function getCarImages(): ImageSourcePropType[] {
  return Object.values(carMaps)
    .flatMap(car => [
      car.corpoBrancoFrente,
      car.corpoBrancoTras,
      car.corpoTransparente,
      car.wheelImage,
      car.icone,
    ])
    .filter(isImageSource);
}

function getMapImages(): ImageSourcePropType[] {
  return CITY_MAPS
    .flatMap(map => [
      map.icon,
      map.iconGRAY,
    ])
    .filter(isImageSource);
}

function uniqueSources(
  sources: ImageSourcePropType[],
): ImageSourcePropType[] {
  const seen = new Set<string>();

  return sources.filter((source, index) => {
    const resolved = Image.resolveAssetSource(source);

    const key =
      resolved?.uri ??
      `asset-${index}-${String(source)}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function buildSources(
  mode: PreloadMode,
  extraSources: ImageSourcePropType[],
): ImageSourcePropType[] {
  if (mode === 'carSelection') {
    // Na abertura do jogo a próxima tela é a garagem/seletor.
    // Não precisamos decodificar cartas, explosões, tornado e mapas aqui.
    return uniqueSources([
      ...UI_IMAGES,
      ...getCarImages(),
      ...extraSources,
    ]);
  }

  // Pré-corrida: aqui os assets de gameplay fazem sentido.
  return uniqueSources([
    ...CARD_IMAGES,
    ...EFFECT_IMAGES,
    ...getCarImages(),
    ...getMapImages(),
    ...extraSources,
  ]);
}

export type PreRaceAssetPreloaderProps = {
  enabled?: boolean;
  mode?: PreloadMode;
  onReady: () => void;
  onProgress?: (completed: number, total: number) => void;
  onError?: (failed: number, total: number) => void;
  extraSources?: ImageSourcePropType[];
};

type PreloadImageProps = {
  index: number;
  source: ImageSourcePropType;
  onLoaded: (index: number) => void;
  onFailed: (index: number, error: unknown) => void;
};

function PreloadImage({
  index,
  source,
  onLoaded,
  onFailed,
}: PreloadImageProps) {
  const [attempt, setAttempt] = useState(0);
  const finishedRef = useRef(false);

  return (
    <Image
      key={`asset-${index}-attempt-${attempt}`}
      source={source}
      style={styles.preloadImage}
      resizeMode="contain"
      fadeDuration={0}
      onLoad={() => {
        if (finishedRef.current) return;

        finishedRef.current = true;
        onLoaded(index);
      }}
      onError={event => {
        if (finishedRef.current) return;

        if (attempt < MAX_AUTO_RETRIES) {
          console.warn(
            `[AssetPreload] Asset ${index + 1} falhou. Tentando novamente (${attempt + 1}/${MAX_AUTO_RETRIES})...`,
            event.nativeEvent.error,
          );

          setAttempt(current => current + 1);
          return;
        }

        finishedRef.current = true;
        onFailed(index, event.nativeEvent.error);
      }}
    />
  );
}

export default function PreRaceAssetPreloader({
  enabled = true,
  mode = 'race',
  onReady,
  onProgress,
  onError,
  extraSources = EMPTY_EXTRA_SOURCES,
}: PreRaceAssetPreloaderProps) {
  const sources = useMemo(
    () => buildSources(mode, extraSources),
    [mode, extraSources],
  );

  // Detecta troca real das fontes mesmo quando a quantidade permanece igual
  // (ex.: trocar São Paulo por Rio, ambos com 4 camadas).
  const sourcesKey = useMemo(
    () =>
      sources
        .map((source, index) =>
          Image.resolveAssetSource(source)?.uri ??
          `asset-${index}-${String(source)}`,
        )
        .join('|'),
    [sources],
  );

  const [batchStart, setBatchStart] = useState(0);

  const completedRef = useRef<Set<number>>(new Set());
  const failedRef = useRef<Set<number>>(new Set());
  const settledRef = useRef<Set<number>>(new Set());
  const readySentRef = useRef(false);

  const total = sources.length;
  const batchEnd = Math.min(
    batchStart + PRELOAD_BATCH_SIZE,
    total,
  );

  const currentBatch = useMemo(
    () =>
      sources
        .slice(batchStart, batchEnd)
        .map((source, offset) => ({
          source,
          index: batchStart + offset,
        })),
    [sources, batchStart, batchEnd],
  );

  useEffect(() => {
    completedRef.current = new Set();
    failedRef.current = new Set();
    settledRef.current = new Set();
    readySentRef.current = false;
    setBatchStart(0);

    onProgress?.(0, enabled ? total : 0);
    onError?.(0, enabled ? total : 0);

    if (!enabled || total === 0) {
      readySentRef.current = true;
      onReady();
    }
  }, [
    enabled,
    total,
    mode,
    sourcesKey,
    onProgress,
    onError,
    onReady,
  ]);

  const finishIfPossible = useCallback(() => {
    if (readySentRef.current) return;

    const settled = settledRef.current.size;

    // O lote atual ainda possui imagens trabalhando.
    if (settled < batchEnd) return;

    // Ainda existem outros lotes.
    if (batchEnd < total) {
      setBatchStart(batchEnd);
      return;
    }

    const failed = failedRef.current.size;
    const completed = completedRef.current.size;

    onError?.(failed, total);
    onProgress?.(completed, total);

    if (failed === 0 && completed === total) {
      readySentRef.current = true;

      console.log(
        `[AssetPreload] ${completed}/${total} assets carregados com sucesso.`,
      );

      onReady();
      return;
    }

    console.warn(
      `[AssetPreload] Preload concluído com ${failed} falha(s) real(is) após retry automático.`,
    );
  }, [batchEnd, total, onError, onProgress, onReady]);

  const markLoaded = useCallback(
    (index: number) => {
      if (!enabled || readySentRef.current) return;
      if (settledRef.current.has(index)) return;

      failedRef.current.delete(index);
      completedRef.current.add(index);
      settledRef.current.add(index);

      const completed = completedRef.current.size;
      const failed = failedRef.current.size;

      // IMPORTANTE: também sincroniza a redução das falhas.
      onProgress?.(completed, total);
      onError?.(failed, total);

      console.log(
        `[AssetPreload] ${completed}/${total} carregados | ${failed} falhas`,
      );

      finishIfPossible();
    },
    [enabled, total, onProgress, onError, finishIfPossible],
  );

  const markFailed = useCallback(
    (index: number, error: unknown) => {
      if (!enabled || readySentRef.current) return;
      if (settledRef.current.has(index)) return;

      failedRef.current.add(index);
      settledRef.current.add(index);

      const resolved = Image.resolveAssetSource(sources[index]);
      const failed = failedRef.current.size;

      console.warn(
        `[AssetPreload] Falha definitiva no asset ${index + 1}/${total}`,
        resolved?.uri ?? sources[index],
        error,
      );

      onError?.(failed, total);
      finishIfPossible();
    },
    [enabled, sources, total, onError, finishIfPossible],
  );

  if (!enabled || total === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={styles.preloadHost}
      collapsable={false}
    >
      {currentBatch.map(({ source, index }) => (
        <PreloadImage
          key={`preload-${index}`}
          index={index}
          source={source}
          onLoaded={markLoaded}
          onFailed={markFailed}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Fora da área visível, mas montado de verdade.
  // Não usar display: 'none': precisamos acionar o pipeline nativo de Image.
  preloadHost: {
    position: 'absolute',
    left: -1000,
    top: -1000,
    width: 8,
    height: 8,
    overflow: 'hidden',
    opacity: 0.01,
  },

  preloadImage: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
});
