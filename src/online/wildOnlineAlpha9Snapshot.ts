/** A read-only projection of the state received from AWS. Never simulates physics. */
export type Alpha9Phase = 'waiting' | 'countdown' | 'racing' | 'paused' | 'finished';
export type Alpha9Player = {
  sessionId: string;
  slot: number;
  name: string;
  carId: string;
  connected: boolean;
  ready: boolean;
  rank: number;
  x: number;
  speed: number;
  maxSpeed: number;
  nitroCharges: number;
  nitroRemaining: number;
  nitroCooldown: number;
};
export type Alpha9Snapshot = {
  phase: Alpha9Phase;
  countdown: number;
  raceTime: number;
  finishDistance: number;
  winnerSessionId: string;
  finishReason: string;
  players: Alpha9Player[];
};
export const EMPTY_ALPHA9_SNAPSHOT: Alpha9Snapshot = {
  phase: 'waiting', countdown: 0, raceTime: 0, finishDistance: 6000,
  winnerSessionId: '', finishReason: '', players: [],
};
const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type StateLike = {
  racePhase?: Alpha9Phase;
  countdown?: number;
  raceTime?: number;
  finishDistance?: number;
  winnerSessionId?: string;
  finishReason?: string;
  players?: { forEach(cb: (player: Record<string, unknown>, sessionId: string) => void): void };
};

export function readWildAlpha9Snapshot(state: StateLike | null | undefined): Alpha9Snapshot {
  const players: Alpha9Player[] = [];
  state?.players?.forEach((player, sessionId) => {
    players.push({
      sessionId,
      name: String(player.name ?? 'Player'),
      carId: String(player.carId ?? 'fusca'),
      slot: toNumber(player.slot),
      connected: player.connected !== false,
      ready: player.ready === true,
      rank: toNumber(player.rank),
      x: Math.max(0, toNumber(player.x)),
      speed: Math.max(0, toNumber(player.speed)),
      maxSpeed: Math.max(0, toNumber(player.maxSpeed)),
      nitroCharges: Math.max(0, toNumber(player.nitroCharges)),
      nitroRemaining: Math.max(0, toNumber(player.nitroRemaining)),
      nitroCooldown: Math.max(0, toNumber(player.nitroCooldown)),
    });
  });
  players.sort((a, b) => a.slot - b.slot || a.sessionId.localeCompare(b.sessionId));
  const phase = state?.racePhase;
  const validPhase: Alpha9Phase = phase === 'countdown' || phase === 'racing' ||
    phase === 'paused' || phase === 'finished' ? phase : 'waiting';
  return {
    phase: validPhase,
    countdown: Math.max(0, toNumber(state?.countdown)),
    raceTime: Math.max(0, toNumber(state?.raceTime)),
    finishDistance: Math.max(1, toNumber(state?.finishDistance) || 6000),
    winnerSessionId: String(state?.winnerSessionId ?? ''),
    finishReason: String(state?.finishReason ?? ''),
    players,
  };
}
