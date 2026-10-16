/**
 * ALPHA 7 — cálculo de leitura dos atributos REAIS do Wild.
 * Usa diretamente o carMaps do aplicativo, sem duplicar a tabela de carros.
 * IMPORTANTE: o servidor Alpha 6 ainda usa outros valores experimentais.
 * Este helper NÃO envia atributos do cliente como dados oficiais da partida.
 */
import { carMaps } from '@/src/utils/carMaps';

export type WildCarId = keyof typeof carMaps;

export const WILD_CAR_IDS = [
  'buggy', 'kombi', 'uno', 'fusca', 'astor',
  'caravana', 'ferrari', 'lamborghini', 'monster',
] as const satisfies readonly WildCarId[];

export const MAX_WILD_MOTOR_LEVEL = 10;
export const KMH_PER_PHYSICS_UNIT = 18;

export function sanitizeMotorLevel(input: unknown): number {
  const n = Number(input);
  return Number.isFinite(n)
    ? Math.max(1, Math.min(MAX_WILD_MOTOR_LEVEL, Math.trunc(n)))
    : 1;
}

export function getWildLocalMotorStats(
  carId: WildCarId,
  speedLevel: unknown = 1,
  accelerationLevel: unknown = 1,
) {
  const definition = carMaps[carId];
  const speedProgress = (sanitizeMotorLevel(speedLevel) - 1) / (MAX_WILD_MOTOR_LEVEL - 1);
  const accelerationProgress = (sanitizeMotorLevel(accelerationLevel) - 1) / (MAX_WILD_MOTOR_LEVEL - 1);
  const topSpeedKmh = definition.stats.speed.base +
    (definition.stats.speed.maxUpgrade - definition.stats.speed.base) * speedProgress;
  const accelerationStat = definition.stats.acceleration.base +
    (definition.stats.acceleration.maxUpgrade - definition.stats.acceleration.base) * accelerationProgress;
  const accelerationPerTick = 0.02 + Math.min(1, accelerationStat / 220) * 0.06;
  return {
    tier: definition.tier,
    topSpeedKmh,
    accelerationStat,
    accelerationPerTick,
    initialPhysicsSpeed: (topSpeedKmh / KMH_PER_PHYSICS_UNIT) * 0.55,
    minPhysicsSpeed: (topSpeedKmh / KMH_PER_PHYSICS_UNIT) * 0.35,
  };
}
