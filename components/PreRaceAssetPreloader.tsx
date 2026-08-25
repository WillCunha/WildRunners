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

// Frames rasterizados usados durante a corrida.
// Eles continuam sendo renderizados depois pelos componentes originais;
// aqui nós apenas aquecemos o pipeline do React Native Image.
const EFFECT_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/animation/explosion/img_0.png'),
  require('@/assets/images/animation/explosion/img_1.png'),
  require('@/assets/images/animation/explosion/img_2.png'),
  require('@/assets/images/animation/explosion/img_3.png'),
  require('@/assets/images/animation/explosion/img_4.png'),
  require('@/assets/images/animation/explosion/img_5.png'),
  require('@/assets/images/animation/explosion/img_6.png'),
  require('@/assets/images/animation/explosion/img_7.png'),
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

function getCarImages(): ImageSourcePropType[] {
  return Object.values(carMaps).flatMap(car => [
    car.corpoBrancoFrente,
    car.corpoBrancoTras,
    car.corpoTransparente,
    car.wheelImage,
    car.icone,
  ] as ImageSourcePropType[]);
}

function getMapImages(): ImageSourcePropType[] {
  return CITY_MAPS.flatMap(map => [
    map.icon,
    map.iconGRAY,
  ] as ImageSourcePropType[]);
}

function uniqueSources(sources: ImageSourcePropType[]) {
  const seen = new Set<string>();

  return sources.filter((source, index) => {
    const resolved = Image.resolveAssetSource(source);
    const key = resolved?.uri ?? `asset-${index}-${String(source)}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type PreRaceAssetPreloaderProps = {
  enabled?: boolean;
  onReady: () => void;
};

/**
 * Preload seguro para assets locais.
 *
 * IMPORTANTE: não usa expo-asset/Asset.loadAsync().
 * O mesmo React Native <Image source={require(...)} /> usado no app é montado
 * fora da tela. Assim não trocamos o require por URI/localUri e evitamos a
 * classe de falhas silenciosas do expo-asset em assets Android locais.
 */
export default function PreRaceAssetPreloader({
  enabled = true,
  onReady,
}: PreRaceAssetPreloaderProps) {
  const sources = useMemo(
    () => uniqueSources([
      ...UI_IMAGES,
      ...CARD_IMAGES,
      ...EFFECT_IMAGES,
      ...getCarImages(),
      ...getMapImages(),
    ]),
    [],
  );

  const completedRef = useRef<Set<number>>(new Set());
  const readySentRef = useRef(false);

  useEffect(() => {
    completedRef.current = new Set();
    readySentRef.current = false;

    if (!enabled || sources.length === 0) {
      readySentRef.current = true;
      onReady();
    }
  }, [enabled, onReady, sources.length]);

  const markFinished = (index: number) => {
    if (!enabled || readySentRef.current) return;

    completedRef.current.add(index);

    if (completedRef.current.size >= sources.length) {
      readySentRef.current = true;
      onReady();
    }
  };

  if (!enabled) return null;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={styles.preloadContainer}
    >
      {sources.map((source, index) => (
        <Image
          key={`preload-${index}`}
          source={source}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.preloadImage}
          onLoadEnd={() => markFinished(index)}
          onError={event => {
            const resolved = Image.resolveAssetSource(source);
            console.warn(
              '[AssetPreload] Falha ao montar imagem local:',
              resolved?.uri ?? index,
              event.nativeEvent.error,
            );
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  preloadContainer: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 2,
    height: 2,
    overflow: 'hidden',
    opacity: 0.01,
  },
  preloadImage: {
    position: 'absolute',
    width: 2,
    height: 2,
  },
});
