export const LOADING_TIP_KEYS = [
  'loading.tips.cardsTiming',
  'loading.tips.raceStrategy',
  'loading.tips.preparingRace',
  'loading.tips.tightTurns',
  'loading.tips.saveYourCards',
  'loading.tips.defendYourself',
  'loading.tips.watchYourRivals',
  'loading.tips.finalSeconds',
  'loading.tips.comeback',
] as const;

export type LoadingTipKey =
  (typeof LOADING_TIP_KEYS)[number];

export function getRandomLoadingTipKey(): LoadingTipKey {
  return LOADING_TIP_KEYS[
    Math.floor(
      Math.random() * LOADING_TIP_KEYS.length
    )
  ];
}