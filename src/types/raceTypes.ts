import type { MatchRewards } from '@/src/types/playerTypes';
import type { RaceObjectiveResult, XpBreakdown } from '@/src/utils/progression';

export type RewardRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary';

export type RaceUnlock = {
  id: string;
  itemId: string;
  type: 'map' | 'card' | 'achievement' | 'car' | string;
  name: string;
  rarity?: RewardRarity;
};

export type RaceProgress = {
  trophiesBefore: number;
  trophiesAfter: number;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
};

export type RaceResult = {
  raceId: string;
  position: number;
  totalRacers: number;
  carId: string;
  mapId?: string;
  carVisual: {
    colorFront: string;
    colorBack: string;
  };
  rewards: MatchRewards & { xp: number };
  xpBreakdown: XpBreakdown;
  objectives?: RaceObjectiveResult[];
  unlocks: RaceUnlock[];
  finishedAt: number;
  isNewRecord: boolean;
  progress: RaceProgress;
};
