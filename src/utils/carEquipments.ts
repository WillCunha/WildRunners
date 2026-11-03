import type { ImageSourcePropType } from 'react-native';

export type EquipmentCategory =
  | 'frontBumpers'
  | 'rearBumpers'
  | 'spoilers'
  | 'decalques'
  | 'sideSkirts';

export type EquipmentSlot =
  | 'frontBumper'
  | 'rearBumper'
  | 'spoiler'
  | 'decalque'
  | 'sideSkirt';

export type CarEquipment = {
  id: string;
  name: string;
  icon: ImageSourcePropType;
  image: ImageSourcePropType;
  requiredLevel: number;
  price: number;
};

export type CarEquipmentSet = Partial<Record<EquipmentCategory, CarEquipment[]>>;

/**
 * Catálogo estático. Pode faltar carro, categoria ou item sem causar erro.
 * Adicione os requires conforme os assets forem sendo criados.
 */
// Somente require() com caminhos estáticos: Metro precisa encontrar os PNGs na build.
// Os ícones usam temporariamente os mesmos arquivos das camadas.
const BUGGY_DECAL_IMAGES = {
  wild_claws: require('@/assets/images/cars/carroceria/buggy/decalque/wild_claws.png') as ImageSourcePropType,
  desert_storm: require('@/assets/images/cars/carroceria/buggy/decalque/desert_storm.png') as ImageSourcePropType,
  toxic_mud: require('@/assets/images/cars/carroceria/buggy/decalque/toxic_mud.png') as ImageSourcePropType,
  skull_rider: require('@/assets/images/cars/carroceria/buggy/decalque/skull_rider.png') as ImageSourcePropType,
  dune_racer: require('@/assets/images/cars/carroceria/buggy/decalque/dune_racer.png') as ImageSourcePropType,
  wf_soft: require('@/assets/images/cars/carroceria/buggy/decalque/wf_soft.png') as ImageSourcePropType,
  wild_runners: require('@/assets/images/cars/carroceria/buggy/decalque/wild_runners.png') as ImageSourcePropType,
} as const;

// Os IDs legados só são usados para desenhar saves antigos; não aparecem na loja.
const LEGACY_BUGGY_DECALS: CarEquipment[] = [
  {
    id: 'buggy_decal_sport_01', name: 'Sport I',
    icon: require('@/assets/images/cars/carroceria/buggy/decalque/wild_claws.png'),
    image: require('@/assets/images/cars/carroceria/buggy/decalque/wild_claws.png'),
    requiredLevel: 3, price: 150
  },
  {
    id: 'buggy_decal_sport_02', name: 'Sport II',
    icon: require('@/assets/images/cars/carroceria/buggy/decalque/desert_storm.png'),
    image: require('@/assets/images/cars/carroceria/buggy/decalque/desert_storm.png'),
    requiredLevel: 5, price: 400
  },
  {
    id: 'buggy_decal_sport_03', name: 'Sport III',
    icon: require('@/assets/images/cars/carroceria/buggy/decalque/toxic_mud.png'),
    image: require('@/assets/images/cars/carroceria/buggy/decalque/toxic_mud.png'),
    requiredLevel: 8, price: 700
  },
];

export const CAR_EQUIPMENTS: Partial<Record<string, CarEquipmentSet>> = {
  buggy: {
    frontBumpers: [
      {
        id: 'buggy_front_sport_01',
        name: 'Sport I',
        icon: require('@/assets/images/components/componentsIcons/buggy/frontBumpers/front_sport_01.png'),
        image: require('@/assets/images/cars/carroceria/buggy/frontBumper/front_sport_01.png'),
        requiredLevel: 2,
        price: 150,
      },
      {
        id: 'buggy_front_sport_02',
        name: 'Sport II',
        icon: require('@/assets/images/components/componentsIcons/buggy/frontBumpers/front_sport_02.png'),
        image: require('@/assets/images/cars/carroceria/buggy/frontBumper/front_sport_02.png'),
        requiredLevel: 5,
        price: 300,
      },
      {
        id: 'buggy_front_sport_03',
        name: 'Sport III',
        icon: require('@/assets/images/components/componentsIcons/buggy/frontBumpers/front_sport_03.png'),
        image: require('@/assets/images/cars/carroceria/buggy/frontBumper/front_sport_03.png'),
        requiredLevel: 7,
        price: 400,
      },
    ],
    rearBumpers: [
      {
        id: 'buggy_rear_sport_01',
        name: 'Sport I',
        icon: require('@/assets/images/components/componentsIcons/buggy/rearBumpers/rear_sport_01.png'),
        image: require('@/assets/images/cars/carroceria/buggy/rearBumper/rear_sport_01.png'),
        requiredLevel: 2,
        price: 150,
      },
      {
        id: 'buggy_rear_sport_02',
        name: 'Sport II',
        icon: require('@/assets/images/components/componentsIcons/buggy/rearBumpers/rear_sport_02.png'),
        image: require('@/assets/images/cars/carroceria/buggy/rearBumper/rear_sport_02.png'),
        requiredLevel: 5,
        price: 0,
      },
      {
        id: 'buggy_rear_sport_03',
        name: 'Sport III',
        icon: require('@/assets/images/components/componentsIcons/buggy/rearBumpers/rear_sport_03.png'),
        image: require('@/assets/images/cars/carroceria/buggy/rearBumper/rear_sport_03.png'),
        requiredLevel: 7,
        price: 400,
      },
    ],
    spoilers: [
      {
        id: 'buggy_spoiler_sport_01',
        name: 'Sport I',
        icon: require('@/assets/images/components/componentsIcons/buggy/spoilers/buggy_spoiler_sport_01.png'),
        image: require('@/assets/images/cars/carroceria/buggy/spoiler/buggy_spoiler_sport_01.png'),
        requiredLevel: 2,
        price: 150,
      },
      {
        id: 'buggy_spoiler_sport_02',
        name: 'Sport II',
        icon: require('@/assets/images/components/componentsIcons/buggy/spoilers/buggy_spoiler_sport_02.png'),
        image: require('@/assets/images/cars/carroceria/buggy/spoiler/buggy_spoiler_sport_02.png'),
        requiredLevel: 5,
        price: 300,
      },
      {
        id: 'buggy_spoiler_sport_03',
        name: 'Sport III',
        icon: require('@/assets/images/components/componentsIcons/buggy/spoilers/buggy_spoiler_sport_03.png'),
        image: require('@/assets/images/cars/carroceria/buggy/spoiler/buggy_spoiler_sport_03.png'),
        requiredLevel: 7,
        price: 400,
      },
    ],
    // Decalques NOVOS do Buggy: price = custo em SPRAY (não chips/engrenagens).
    decalques: [
      {
        id: 'buggy_wild_claws',
        name: 'Wild Claws',
        icon: BUGGY_DECAL_IMAGES.wild_claws,
        image: BUGGY_DECAL_IMAGES.wild_claws,
        requiredLevel: 3,
        price: 30
      },
      {
        id: 'buggy_desert_storm',
        name: 'Desert Storm',
        icon: BUGGY_DECAL_IMAGES.desert_storm,
        image: BUGGY_DECAL_IMAGES.desert_storm,
        requiredLevel: 4,
        price: 45
      },
      {
        id: 'buggy_toxic_mud',
        name: 'Toxic Mud',
        icon: BUGGY_DECAL_IMAGES.toxic_mud,
        image: BUGGY_DECAL_IMAGES.toxic_mud,
        requiredLevel: 6,
        price: 60
      },
      {
        id: 'buggy_skull_rider',
        name: 'Skull Rider',
        icon: BUGGY_DECAL_IMAGES.skull_rider,
        image: BUGGY_DECAL_IMAGES.skull_rider,
        requiredLevel: 9,
        price: 75
      },
      {
        id: 'buggy_dune_racer',
        name: 'Dune Racer',
        icon: BUGGY_DECAL_IMAGES.dune_racer,
        image: BUGGY_DECAL_IMAGES.dune_racer,
        requiredLevel: 11,
        price: 90
      },

    ],
    sideSkirts: [],
  },
  fusca: {
    frontBumpers: [],
    rearBumpers: [],
    spoilers: [],
    decalques: [],
    sideSkirts: [],
  },
  kombi: {},
  uno: {},
};

export const EQUIPMENT_CATEGORIES: Array<{
  key: EquipmentCategory;
  slot: EquipmentSlot;
  label: string;
}> = [
    { key: 'frontBumpers', slot: 'frontBumper', label: 'Para-choque dianteiro' },
    { key: 'rearBumpers', slot: 'rearBumper', label: 'Para-choque traseiro' },
    { key: 'spoilers', slot: 'spoiler', label: 'Aerofólio' },
    { key: 'decalques', slot: 'decalque', label: 'Decalques' },
    { key: 'sideSkirts', slot: 'sideSkirt', label: 'Saias laterais' },
  ];

export const getAvailableEquipmentCategories = (carId: string) => {
  const carEquipment = CAR_EQUIPMENTS[carId];
  if (!carEquipment) return [];

  return EQUIPMENT_CATEGORIES
    .map(category => ({
      ...category,
      items: carEquipment[category.key] ?? [],
    }))
    .filter(category => category.items.length > 0);
};

export const hasCarEquipments = (carId: string) =>
  getAvailableEquipmentCategories(carId).length > 0;

export const getEquipmentById = (carId: string, itemId?: string | null) => {
  if (!itemId) return undefined;
  const categories = getAvailableEquipmentCategories(carId);
  for (const category of categories) {
    const item = category.items.find(candidate => candidate.id === itemId);
    if (item) return item;
  }
  // Compatibilidade com adesivos do Alpha anterior já equipados no Firestore.
  if (carId === 'buggy') return LEGACY_BUGGY_DECALS.find(item => item.id === itemId);
  return undefined;
};
