import { Asset } from 'expo-asset';
import { carMaps } from '@/src/utils/carMaps';
import { CITY_MAPS } from '@/src/utils/cityMaps';

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

const UI_IMAGES: AssetModule[] = [
  require('@/assets/images/components/background/background_home.png'),
  require('@/assets/images/components/background/start_screen.png'),
  require('@/assets/images/gameLogoV5.png'),
  require('@/assets/images/logo1024v1.png'),
];

const isAssetModule = (value: unknown): value is AssetModule =>
  typeof value === 'number';

const getCarImages = (): AssetModule[] =>
  Object.values(carMaps)
    .flatMap((car) => [
      car.corpoBrancoFrente,
      car.corpoBrancoTras,
      car.corpoTransparente,
      car.wheelImage,
      car.icone,
    ])
    .filter(isAssetModule);

const getMapImages = (): AssetModule[] =>
  CITY_MAPS
    .flatMap((map) => [map.icon, map.iconGRAY])
    .filter(isAssetModule);

let preloadPromise: Promise<void> | null = null;

/**
 * Preloads the static images used from the garage through map selection.
 * The promise is cached so repeated calls do not restart the same work.
 */
export function preloadPreRaceAssets(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  const modules = Array.from(
    new Set<AssetModule>([
      ...UI_IMAGES,
      ...CARD_IMAGES,
      ...getCarImages(),
      ...getMapImages(),
    ]),
  );

  preloadPromise = Asset.loadAsync(modules)
    .then(() => undefined)
    .catch((error) => {
      // Allow a retry after a failed preload.
      preloadPromise = null;
      throw error;
    });

  return preloadPromise;
}
