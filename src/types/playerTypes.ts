export interface PlayerParts {
  motor: number;
  spray: number;
  engrenagem: number;
}

export type PaintFinishId = 'solid' | 'metallic' | 'matte' | 'pearlescent';

export type EquippedCarEquipment = {
  frontBumper: string | null;
  rearBumper: string | null;
  spoiler: string | null;
  sideSkirt: string | null;
};

export type CarPaintConfiguration = {
  primaryColor: string;
  secondaryColor: string;
  finishId: PaintFinishId;
};

export type CarCustomization = {
  paint: CarPaintConfiguration;
  equipment: EquippedCarEquipment;
  ownedEquipment: string[];
};

export interface CarUpgrades {
  motor: {
    speedLevel: number;
    accelerationLevel: number;
    jumpPowerLevel: number;
  };

  /**
   * Mantido temporariamente para compatibilidade com saves antigos.
   * rarityLevel deixa de ser usado pela Oficina 2.0.
   */
  spray: {
    rarityLevel: number;
    unlockedSkins: string[];
  };

  engrenagem: {
    defenseLevel: number;
  };

  customization: CarCustomization;
}

export interface PlayerUnlocks {
  maps: string[];
  cards: string[];
  achievements: string[];
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  trophies: number;
  xp: number;
  parts: PlayerParts;
  garage: Record<string, CarUpgrades>;
  unlocks: PlayerUnlocks;
  createdAt: number;
  updatedAt: number;
}

export type CarStat =
  | 'speedLevel'
  | 'accelerationLevel'
  | 'jumpPowerLevel'
  | 'defenseLevel'
  | 'rarityLevel';

export type PartCategory = 'motor' | 'spray' | 'engrenagem';

export type EquipmentSlot = keyof EquippedCarEquipment;

export type CustomizationPurchaseResult =
  | 'success'
  | 'equipped'
  | 'no_profile'
  | 'car_not_owned'
  | 'level_locked'
  | 'insufficient_spray'
  | 'invalid';

export type MatchRewards = {
  motor: number;
  spray: number;
  engrenagem: number;
  trophies: number;
  xp?: number;
};
