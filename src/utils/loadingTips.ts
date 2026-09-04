export const LOADING_TIP_KEYS = [
  'loading.tips.cardsTiming',
  'loading.tips.catsAndDogs',
  'loading.tips.preparingRace',
  'loading.tips.tightTurns',
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