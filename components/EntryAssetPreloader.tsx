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

/*
 * Assets necessários ANTES de entrar no fluxo principal do jogo.
 *
 * Este preloader cobre:
 * - UI dos menus;
 * - imagens dos carros;
 * - cartas exibidas no DeckSelection;
 * - ícones exibidos no MapSelection.
 *
 * Ele NÃO carrega:
 * - cenário da corrida;
 * - frames de explosão/tornado;
 * - assets exclusivos de gameplay.
 *
 * Esses assets pertencem ao futuro PreRaceLoadingScreen.
 */

const UI_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/components/background/background_home.png'),
  require('@/assets/images/components/background/start_screen.png'),
  require('@/assets/images/gameLogoV5.png'),
  require('@/assets/images/logo1024v1.png'),
];

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

const PRELOAD_BATCH_SIZE = 6;
const MAX_AUTO_RETRIES = 2;

function isImageSource(value: unknown): value is ImageSourcePropType {
  if (typeof value === 'number') return true;

  return (
    typeof value === 'object' &&
    value !== null &&
    ('uri' in value || Array.isArray(value))
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
      `entry-asset-${index}-${String(source)}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function buildEntrySources(): ImageSourcePropType[] {
  return uniqueSources([
    ...UI_IMAGES,
    ...getCarImages(),
    ...CARD_IMAGES,
    ...getMapImages(),
  ]);
}

type EntryAssetPreloaderProps = {
  onProgress: (
    completed: number,
    total: number,
  ) => void;
  onReady: () => void;
  onFailed: (
    failed: number,
    total: number,
  ) => void;
};

type PreloadImageProps = {
  index: number;
  source: ImageSourcePropType;
  onLoaded: (index: number) => void;
  onFailed: (
    index: number,
    error: unknown,
  ) => void;
};

function PreloadImage({
  index,
  source,
  onLoaded,
  onFailed,
}: PreloadImageProps) {
  const [attempt, setAttempt] =
    useState(0);

  const finishedRef = useRef(false);

  return (
    <Image
      key={`entry-${index}-attempt-${attempt}`}
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
            `[EntryAssetPreload] Asset ${index + 1} falhou. Retry ${attempt + 1}/${MAX_AUTO_RETRIES}.`,
            event.nativeEvent.error,
          );

          setAttempt(current => current + 1);
          return;
        }

        finishedRef.current = true;

        onFailed(
          index,
          event.nativeEvent.error,
        );
      }}
    />
  );
}

export default function EntryAssetPreloader({
  onProgress,
  onReady,
  onFailed,
}: EntryAssetPreloaderProps) {
  const sources = useMemo(
    () => buildEntrySources(),
    [],
  );

  const total = sources.length;

  const [batchStart, setBatchStart] =
    useState(0);

  const loadedRef =
    useRef<Set<number>>(new Set());

  const failedRef =
    useRef<Set<number>>(new Set());

  const settledRef =
    useRef<Set<number>>(new Set());

  const finishedRef = useRef(false);

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
    loadedRef.current = new Set();
    failedRef.current = new Set();
    settledRef.current = new Set();
    finishedRef.current = false;

    setBatchStart(0);
    onProgress(0, total);

    if (total === 0) {
      finishedRef.current = true;
      onReady();
    }
  }, [total, onProgress, onReady]);

  const finishBatchIfPossible =
    useCallback(() => {
      if (finishedRef.current) return;

      // settledRef usa os índices globais.
      // Quando seu tamanho chega a batchEnd,
      // todos os assets até o final deste lote
      // já terminaram (sucesso ou falha).
      if (
        settledRef.current.size < batchEnd
      ) {
        return;
      }

      if (batchEnd < total) {
        setBatchStart(batchEnd);
        return;
      }

      const failed =
        failedRef.current.size;

      const completed =
        loadedRef.current.size;

      onProgress(completed, total);

      if (
        failed === 0 &&
        completed === total
      ) {
        finishedRef.current = true;

        console.log(
          `[EntryAssetPreload] ${completed}/${total} assets carregados.`,
        );

        onReady();
        return;
      }

      finishedRef.current = true;

      console.warn(
        `[EntryAssetPreload] Finalizado com ${failed} falha(s).`,
      );

      onFailed(failed, total);
    }, [
      batchEnd,
      total,
      onProgress,
      onReady,
      onFailed,
    ]);

  const markLoaded = useCallback(
    (index: number) => {
      if (finishedRef.current) return;
      if (settledRef.current.has(index)) {
        return;
      }

      failedRef.current.delete(index);
      loadedRef.current.add(index);
      settledRef.current.add(index);

      const completed =
        loadedRef.current.size;

      onProgress(completed, total);

      console.log(
        `[EntryAssetPreload] ${completed}/${total}`,
      );

      finishBatchIfPossible();
    }, [
      total,
      onProgress,
      finishBatchIfPossible,
    ],
  );

  const markFailed = useCallback(
    (
      index: number,
      error: unknown,
    ) => {
      if (finishedRef.current) return;
      if (settledRef.current.has(index)) {
        return;
      }

      failedRef.current.add(index);
      settledRef.current.add(index);

      const resolved =
        Image.resolveAssetSource(
          sources[index],
        );

      console.warn(
        `[EntryAssetPreload] Falha definitiva ${index + 1}/${total}`,
        resolved?.uri ?? sources[index],
        error,
      );

      finishBatchIfPossible();
    }, [
      sources,
      total,
      finishBatchIfPossible,
    ],
  );

  if (total === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={styles.preloadHost}
      collapsable={false}
    >
      {currentBatch.map(
        ({ source, index }) => (
          <PreloadImage
            key={`entry-preload-${index}`}
            index={index}
            source={source}
            onLoaded={markLoaded}
            onFailed={markFailed}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
