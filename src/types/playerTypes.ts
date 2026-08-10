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

export interface MatchRewards {
  motor: number;
  spray: number;
  engrenagem: number;
  trophies: number;
}

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

/**
 * Itens cuja propriedade não depende da garagem.
 *
 * Os carros continuam sendo considerados "owned"
 * quando existem dentro de profile.garage.
 *
 * Isso mantém compatibilidade com as telas atuais.
 */
export interface PlayerUnlocks {
  maps: string[];
  cards: string[];
  achievements: string[];
}

export interface PlayerProfile {
  id: string;
  username: string;

  trophies: number;

  parts: PlayerParts;

  /**
   * A presença do ID do carro aqui significa
   * que o jogador possui aquele veículo.
   */
  garage: Record<string, CarUpgrades>;

  unlocks: PlayerUnlocks;

  createdAt: number;
  updatedAt: number;
}