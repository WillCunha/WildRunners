import type { ImageSourcePropType } from 'react-native';

export type EquipmentCategory =
  | 'frontBumpers'
  | 'rearBumpers'
  | 'spoilers'
  | 'sideSkirts';

export type EquipmentSlot =
  | 'frontBumper'
  | 'rearBumper'
  | 'spoiler'
  | 'sideSkirt';

export type CarEquipment = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  requiredLevel: number;
  price: number;
};

export type CarEquipmentSet = Partial<Record<EquipmentCategory, CarEquipment[]>>;

/**
 * Catálogo estático. Pode faltar carro, categoria ou item sem causar erro.
 * Adicione os requires conforme os assets forem sendo criados.
 */
export const CAR_EQUIPMENTS: Partial<Record<string, CarEquipmentSet>> = {
  buggy: {
    frontBumpers: [
      {
        id: 'buggy_front_sport_01',
        name: 'Sport I',
        image: require('@/assets/images/cars/carroceria/buggy/frontBumper/front_sport_01.png'),
        requiredLevel: 1,
        price: 100,
      },
    ],
    rearBumpers: [
      {
        id: 'buggy_rear_sport_01',
        name: 'Sport I',
        image: require('@/assets/images/cars/carroceria/buggy/rearBumper/rear_sport_01.png'),
        requiredLevel: 1,
        price: 100,
      },
    ],
    spoilers: [{
      id: 'buggy_spoiler_sport_01',
      name: 'Sport I',
      image: require('@/assets/images/cars/carroceria/buggy/spoiler/buggy_spoiler_sport_01.png'),
      requiredLevel: 1,
      price: 100,
    },],
    sideSkirts: [],
  },
  fusca: {
    frontBumpers: [
      {
        id: 'fusca_front_sport_01',
        name: 'Sport I',
        image: require('@/assets/images/cars/carroceria/fusca/frontBumpers/front_sport_01.png'),
        requiredLevel: 3,
        price: 180,
      },
    ],
    rearBumpers: [],
    spoilers: [],
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
  return undefined;
};
