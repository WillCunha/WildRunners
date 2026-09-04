export interface PlayerParts {
  motor: number;
  spray: number;
  engrenagem: number;
}

export interface CarUpgrades {
  motor: {
    speedLevel: number;
    accelerationLevel: number;
    jumpPowerLevel: number;
  };

  spray: {
    rarityLevel: number;
    unlockedSkins: string[];
  };

  engrenagem: {
    defenseLevel: number;
  };
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

export type PartCategory =
  | 'motor'
  | 'spray'
  | 'engrenagem';

export type MatchRewards = {
  motor: number;
  spray: number;
  engrenagem: number;
  trophies: number;

  /**
   * Opcional para manter chamadas legadas compilando.
   * O fluxo novo de corrida sempre envia XP calculado pelo raceRewardsService.
   */
  xp?: number;
};
