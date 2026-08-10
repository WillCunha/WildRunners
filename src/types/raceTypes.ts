import { MatchRewards } from '@/src/types/playerTypes';

export type RaceUnlockType =
  | 'map'
  | 'card'
  | 'achievement';

export type RewardRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface RaceUnlock {
  /**
   * ID único deste evento de desbloqueio.
   *
   * Exemplo:
   * unlock_desert_map
   */
  id: string;

  /**
   * Item real desbloqueado.
   *
   * Exemplo:
   * desert
   * tnt
   * first_win
   */
  itemId: string;

  type: RaceUnlockType;

  name: string;

  rarity?: RewardRarity;
}

export interface RaceProgressSnapshot {
  trophiesBefore: number;
  trophiesAfter: number;
}

export interface RaceResult {
  /**
   * ID único da corrida.
   *
   * Fundamental para evitar recompensa duplicada.
   */
  raceId: string;

  position: number;

  totalRacers: number;

  /**
   * Apenas o ID.
   *
   * Nunca salvamos require() ou asset dentro
   * do resultado/persistência.
   */
  carId: string;

  mapId?: string;

  rewards: MatchRewards;

  unlocks: RaceUnlock[];

  finishedAt: number;

  isNewRecord?: boolean;

  /**
   * Preenchido pelo raceRewardsService.
   *
   * A tela usa isso para animar a progressão.
   */
  progress?: RaceProgressSnapshot;
}