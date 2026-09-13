import { carMaps } from '@/src/utils/carMaps';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import { Asset } from 'expo-asset';
import { useEffect, useMemo, useRef } from 'react';

type AssetModule = number;

const CARD_IMAGES: AssetModule[] = [
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

const EFFECT_IMAGES: AssetModule[] = [
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

const UI_IMAGES: AssetModule[] = [
  require('@/assets/images/components/background/background_home.png'),
  require('@/assets/images/components/background/start_screen.png'),
  require('@/assets/images/gameLogoV5.png'),
  require('@/assets/images/logo1024v1.png'),
];

const isAssetModule = (value: unknown): value is AssetModule =>
  typeof value === 'number';

function getCarImages(): AssetModule[] {
  return Object.values(carMaps)
    .flatMap(car => [
      car.corpoBrancoFrente,
      car.corpoBrancoTras,
      car.corpoTransparente,
      car.wheelImage,
      car.icone,
    ])
    .filter(isAssetModule);
}

function getMapImages(): AssetModule[] {
  return CITY_MAPS
    .flatMap(map => [
      map.icon,
      map.iconGRAY,
    ])
    .filter(isAssetModule);
}

export type PreRaceAssetPreloaderProps = {
  enabled?: boolean;
  onReady: () => void;
  onTimeout?: (completed: number, total: number) => void;
};

export default function PreRaceAssetPreloader({
  enabled = true,
  onReady,
  onTimeout,
}: PreRaceAssetPreloaderProps) {

  const modules = useMemo(
    () =>
      Array.from(
        new Set<AssetModule>([
          ...UI_IMAGES,
          ...CARD_IMAGES,
          ...EFFECT_IMAGES,
          ...getCarImages(),
          ...getMapImages(),
        ]),
      ),
    [],
  );

  const completedRef = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled) {
      onReady();
      return;
    }

    let cancelled = false;

    completedRef.current = new Set();

    const safetyTimer = setTimeout(() => {
      if (cancelled) return;

      console.warn(
        `[AssetPreload] Timeout: ${completedRef.current.size}/${modules.length} assets concluídos.`,
      );

      onTimeout?.(
        completedRef.current.size,
        modules.length,
      );
    }, 5000);

    const preload = async () => {
      await Promise.allSettled(
        modules.map(async (moduleId, index) => {
          try {
            const asset = Asset.fromModule(moduleId);

            await asset.downloadAsync();

            if (cancelled) return;

            completedRef.current.add(index);

            console.log(
              `[AssetPreload] ${completedRef.current.size}/${modules.length}`,
            );
          } catch (error) {
            console.warn(
              '[AssetPreload] Falha no asset:',
              moduleId,
              error,
            );
          }
        }),
      );

      if (cancelled) return;

      if (completedRef.current.size === modules.length) {
        clearTimeout(safetyTimer);

        console.log(
          `[AssetPreload] Todos os ${modules.length} assets estão disponíveis.`,
        );

        onReady();
      }
    };

    preload();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [
    enabled,
    modules,
    onReady,
    onTimeout,
  ]);

  return null;
}