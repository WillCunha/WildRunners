export type RacePerformanceStats = {
  perfectStart: boolean;
  successfulAttacks: number;
  successfulDefenses: number;
  livesLost: number;
  worstPosition: number;
  survived: boolean;
};

export type XpBreakdown = {
  position: number;
  perfectStart: number;
  attacks: number;
  defenses: number;
  flawless: number;
  comeback: number;
  survived: number;
  total: number;
};

const POSITION_XP: Record<number, number> = {
  1: 60,
  2: 45,
  3: 35,
  4: 25,
  5: 18,
  6: 10,
};

export const XP_PER_SUCCESSFUL_ATTACK = 3;
export const MAX_ATTACK_XP = 15;
export const XP_PER_SUCCESSFUL_DEFENSE = 3;
export const MAX_DEFENSE_XP = 9;
export const PERFECT_START_XP = 8;
export const FLAWLESS_XP = 10;
export const COMEBACK_XP = 10;
export const SURVIVAL_XP = 5;

/**
 * XP TOTAL necessário para ENTRAR em determinado nível.
 *
 * N1 = 0
 * N2 = 100
 * N3 = 250
 * N4 = 450
 * N5 = 700
 * N6 = 1000
 */
export function getXpForLevel(level: number) {
  const safeLevel = Math.max(1, Math.floor(level));

  if (safeLevel <= 1) return 0;

  const n = safeLevel - 1;
  return n * 100 + 25 * n * (n - 1);
}

export function getPlayerLevel(totalXp: number) {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;

  while (getXpForLevel(level + 1) <= safeXp) {
    level += 1;
  }

  return level;
}

export function getLevelProgress(totalXp: number) {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const level = getPlayerLevel(safeXp);
  const levelStartXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = safeXp - levelStartXp;
  const xpForNextLevel = Math.max(1, nextLevelXp - levelStartXp);
  const progress = Math.max(0, Math.min(1, xpIntoLevel / xpForNextLevel));

  return {
    level,
    totalXp: safeXp,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    progress,
  };
}

export function calculateRaceXp(
  position: number,
  totalRacers: number,
  performance: RacePerformanceStats,
): XpBreakdown {
  const safeTotalRacers = Math.max(1, Math.floor(totalRacers));
  const safePosition = Math.max(1, Math.min(safeTotalRacers, Math.floor(position)));

  const positionXp = POSITION_XP[safePosition] ?? POSITION_XP[6];
  const attackXp = Math.min(
    MAX_ATTACK_XP,
    Math.max(0, Math.floor(performance.successfulAttacks)) * XP_PER_SUCCESSFUL_ATTACK,
  );
  const defenseXp = Math.min(
    MAX_DEFENSE_XP,
    Math.max(0, Math.floor(performance.successfulDefenses)) * XP_PER_SUCCESSFUL_DEFENSE,
  );
  const perfectStartXp = performance.perfectStart ? PERFECT_START_XP : 0;
  const flawlessXp = performance.survived && performance.livesLost === 0
    ? FLAWLESS_XP
    : 0;
  const comebackXp = performance.worstPosition >= 5 && safePosition <= 3
    ? COMEBACK_XP
    : 0;
  const survivalXp = performance.survived ? SURVIVAL_XP : 0;

  const total =
    positionXp +
    perfectStartXp +
    attackXp +
    defenseXp +
    flawlessXp +
    comebackXp +
    survivalXp;

  return {
    position: positionXp,
    perfectStart: perfectStartXp,
    attacks: attackXp,
    defenses: defenseXp,
    flawless: flawlessXp,
    comeback: comebackXp,
    survived: survivalXp,
    total,
  };
}

/**
 * Compatibilidade para telas antigas que chamavam a exigência de "levelRequired"
 * mas comparavam contra os antigos marcos de troféus 100/300/600.
 */
export function normalizeLegacyLevelRequirement(required: number) {
  const safe = Math.max(1, Math.floor(required));

  if (safe === 100) return 2;
  if (safe === 300) return 3;
  if (safe === 600) return 4;

  return safe;
}
