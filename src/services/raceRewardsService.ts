import {
    RaceResult,
    RaceUnlock,
    RaceUnlockType,
} from '@/src/types/raceTypes';

import { usePlayerStore } from '@/src/store/playerStore';
import { useRaceResultStore } from '@/src/store/raceResultStore';

type CompleteRaceStatus =
  | 'completed'
  | 'already_processed'
  | 'no_profile'
  | 'invalid_race';

interface CompleteRaceResponse {
  status: CompleteRaceStatus;

  result: RaceResult | null;

  newlyUnlocked: RaceUnlock[];
}

/**
 * Converte os tipos utilizados pela corrida
 * para as categorias existentes no PlayerStore.
 */
const getUnlockCategory = (
  type: RaceUnlockType,
) => {
  switch (type) {
    case 'map':
      return 'maps' as const;

    case 'card':
      return 'cards' as const;

    case 'achievement':
      return 'achievements' as const;
  }
};

const completeRace = (
  raceResult: RaceResult,
): CompleteRaceResponse => {
  const raceId =
    raceResult.raceId.trim();

  if (!raceId) {
    return {
      status: 'invalid_race',
      result: null,
      newlyUnlocked: [],
    };
  }

  const playerStore =
    usePlayerStore.getState();

  if (!playerStore.profile) {
    return {
      status: 'no_profile',
      result: null,
      newlyUnlocked: [],
    };
  }

  /**
   * Guardamos a quantidade ANTES da recompensa.
   *
   * Isso será usado pela UI para animar:
   *
   * 295 -> 313 troféus
   */
  const trophiesBefore =
    playerStore.profile.trophies;

  /**
   * Esta operação é idempotente.
   *
   * Se raceId já tiver sido processado,
   * a recompensa não entra novamente.
   */
  const rewardStatus =
    playerStore.applyMatchRewardsOnce(
      raceId,
      raceResult.rewards,
    );

  if (
    rewardStatus ===
    'no_profile'
  ) {
    return {
      status: 'no_profile',
      result: null,
      newlyUnlocked: [],
    };
  }

  if (
    rewardStatus ===
    'invalid_race'
  ) {
    return {
      status: 'invalid_race',
      result: null,
      newlyUnlocked: [],
    };
  }

  /**
   * Desbloqueios também são idempotentes.
   *
   * unlockItem() retorna false quando
   * o item já está desbloqueado.
   */
  const newlyUnlocked:
    RaceUnlock[] = [];

  for (
    const unlock of
    raceResult.unlocks ?? []
  ) {
    const category =
      getUnlockCategory(
        unlock.type,
      );

    const wasUnlocked =
      usePlayerStore
        .getState()
        .unlockItem(
          category,
          unlock.itemId,
        );

    if (wasUnlocked) {
      newlyUnlocked.push(
        unlock,
      );
    }
  }

  const updatedProfile =
    usePlayerStore.getState()
      .profile;

  const trophiesAfter =
    updatedProfile?.trophies ??
    trophiesBefore;

  const completedResult:
    RaceResult = {
    ...raceResult,

    /**
     * Exibimos somente desbloqueios
     * realmente novos.
     *
     * Se a tela abrir novamente,
     * não vai fingir que desbloqueou
     * a mesma coisa outra vez.
     */
    unlocks:
      rewardStatus === 'applied'
        ? newlyUnlocked
        : [],

    progress: {
      trophiesBefore:
        rewardStatus === 'applied'
          ? trophiesBefore
          : trophiesAfter,

      trophiesAfter,
    },
  };

  /**
   * Entrega o resultado pronto
   * para a RaceResultScreen.
   */
  useRaceResultStore
    .getState()
    .setResult(
      completedResult,
    );

  return {
    status:
      rewardStatus ===
      'already_processed'
        ? 'already_processed'
        : 'completed',

    result: completedResult,

    newlyUnlocked,
  };
};

export const raceRewardsService = {
  completeRace,
};