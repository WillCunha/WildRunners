import { carMaps } from '@/src/utils/carMaps';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import React, { useEffect, useMemo, useRef } from 'react';
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

const EMPTY_EXTRA_SOURCES: ImageSourcePropType[] = [];

const UI_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/components/background/background_home.png'),
  require('@/assets/images/components/background/start_screen.png'),
  require('@/assets/images/gameLogoV5.png'),
  require('@/assets/images/logo1024v1.png'),
];

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

export type PreRaceAssetPreloaderProps = {
  enabled?: boolean;
  onReady: () => void;
  onProgress?: (completed: number, total: number) => void;
  onError?: (failed: number, total: number) => void;
  extraSources?: ImageSourcePropType[];
};

export default function PreRaceAssetPreloader({
  enabled = true,
  onReady,
  onProgress,
  onError,
  extraSources = EMPTY_EXTRA_SOURCES,
}: PreRaceAssetPreloaderProps) {
  const sources = useMemo(
    () =>
      uniqueSources([
        ...UI_IMAGES,
        ...CARD_IMAGES,
        ...EFFECT_IMAGES,
        ...getCarImages(),
        ...getMapImages(),
        ...extraSources,
      ]),
    [extraSources],
  );

  const completedRef = useRef<Set<number>>(new Set());
  const failedRef = useRef<Set<number>>(new Set());
  const readySentRef = useRef(false);

  useEffect(() => {
    completedRef.current = new Set();
    failedRef.current = new Set();
    readySentRef.current = false;

    if (!enabled) {
      onProgress?.(0, 0);
      readySentRef.current = true;
      onReady();
      return;
    }

    onProgress?.(0, sources.length);

    if (sources.length === 0) {
      readySentRef.current = true;
      onReady();
    }
  }, [
    enabled,
    onProgress,
    onReady,
    sources.length,
  ]);

  const markLoaded = (index: number) => {
    if (!enabled || readySentRef.current) return;
    if (completedRef.current.has(index)) return;

    failedRef.current.delete(index);
    completedRef.current.add(index);

    const completed = completedRef.current.size;
    const total = sources.length;

    onProgress?.(completed, total);

    console.log(
      `[AssetPreload] ${completed}/${total} carregados`,
    );

    if (completed === total) {
      readySentRef.current = true;

      console.log(
        `[AssetPreload] Todos os ${total} assets foram realmente carregados pelo React Native Image.`,
      );

      onReady();
    }
  };

  const markFailed = (
    index: number,
    error: unknown,
  ) => {
    if (!enabled || readySentRef.current) return;
    if (failedRef.current.has(index)) return;

    failedRef.current.add(index);

    console.warn(
      `[AssetPreload] Falha no asset ${index + 1}/${sources.length}`,
      error,
    );

    onError?.(
      failedRef.current.size,
      sources.length,
    );
  };

  if (!enabled) return null;

  return (
    <View
      pointerEvents="none"
      style={styles.preloadHost}
      collapsable={false}
    >
      {sources.map((source, index) => (
        <Image
          key={`preload-${index}`}
          source={source}
          style={styles.preloadImage}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={() => markLoaded(index)}
          onError={event =>
            markFailed(
              index,
              event.nativeEvent.error,
            )
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Fora da área visível, mas ainda montado.
  // Não usar display: 'none', pois queremos forçar o pipeline do Image.
  preloadHost: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 64,
    height: 64,
    overflow: 'hidden',
    opacity: 0.01,
  },

  preloadImage: {
    position: 'absolute',
    width: 64,
    height: 64,
  },
});
