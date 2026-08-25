import { usePlayerStore } from '@/src/store/playerStore';
import { useRaceResultStore } from '@/src/store/raceResultStore';
import type { MatchRewards } from '@/src/types/playerTypes';
import type { RaceResult, RaceUnlock } from '@/src/types/raceTypes';
import {
  calculateRaceXp,
  getPlayerLevel,
  type RacePerformanceStats,
} from '@/src/utils/progression';

type CompleteRaceInput = {
  raceId: string;
  position: number;
  totalRacers: number;
  carId: string;
  mapId?: string;
  carVisual?: {
    colorFront: string;
    colorBack: string;
  };
  rewards: MatchRewards;
  performance?: RacePerformanceStats;
  unlocks?: RaceUnlock[];
  finishedAt?: number;
  isNewRecord?: boolean;
};

type CompleteRaceResult = {
  status: 'applied' | 'already_processed' | 'no_profile' | 'invalid_race';
  result: RaceResult | null;
};

const getDefaultPerformance = (
  position: number,
): RacePerformanceStats => ({
  perfectStart: false,
  successfulAttacks: 0,
  successfulDefenses: 0,
  livesLost: 1,
  worstPosition: Math.max(1, Math.floor(position)),
  survived: true,
});

const applyUnlocks = (unlocks: RaceUnlock[]) => {
  const store = usePlayerStore.getState();

  unlocks.forEach(unlock => {
    if (unlock.type === 'map') {
      store.unlockItem('maps', unlock.itemId);
    }

    if (unlock.type === 'card') {
      store.unlockItem('cards', unlock.itemId);
    }

    if (unlock.type === 'achievement') {
      store.unlockItem('achievements', unlock.itemId);
    }
  });
};

export const raceRewardsService = {
  completeRace(input: CompleteRaceInput): CompleteRaceResult {
    const safeRaceId = input.raceId.trim();

    if (!safeRaceId) {
      return { status: 'invalid_race', result: null };
    }

    const beforeProfile = usePlayerStore.getState().profile;

    if (!beforeProfile) {
      return { status: 'no_profile', result: null };
    }

    const performance = input.performance ?? getDefaultPerformance(input.position);
    const xpBreakdown = calculateRaceXp(
      input.position,
      input.totalRacers,
      performance,
    );

    const rewards: MatchRewards & { xp: number } = {
      motor: input.rewards.motor,
      spray: input.rewards.spray,
      engrenagem: input.rewards.engrenagem,
      trophies: input.rewards.trophies,
      xp: xpBreakdown.total,
    };

    const rewardStatus = usePlayerStore
      .getState()
      .applyMatchRewardsOnce(safeRaceId, rewards);

    if (rewardStatus !== 'applied') {
      return {
        status: rewardStatus,
        result: null,
      };
    }

    const unlocks = input.unlocks ?? [];
    applyUnlocks(unlocks);

    const afterProfile = usePlayerStore.getState().profile;

    if (!afterProfile) {
      return { status: 'no_profile', result: null };
    }

    const xpBefore = Math.max(0, beforeProfile.xp ?? 0);
    const xpAfter = Math.max(0, afterProfile.xp ?? 0);

    const result: RaceResult = {
      raceId: safeRaceId,
      position: input.position,
      totalRacers: input.totalRacers,
      carId: input.carId,
      mapId: input.mapId,
      carVisual: input.carVisual ?? {
        colorFront: '#cc0000',
        colorBack: '#000000',
      },
      rewards,
      xpBreakdown,
      unlocks,
      finishedAt: input.finishedAt ?? Date.now(),
      isNewRecord: Boolean(input.isNewRecord),
      progress: {
        trophiesBefore: beforeProfile.trophies,
        trophiesAfter: afterProfile.trophies,
        xpBefore,
        xpAfter,
        levelBefore: getPlayerLevel(xpBefore),
        levelAfter: getPlayerLevel(xpAfter),
      },
    };

    useRaceResultStore.getState().setResult(result);

    return {
      status: 'applied',
      result,
    };
  },
};
