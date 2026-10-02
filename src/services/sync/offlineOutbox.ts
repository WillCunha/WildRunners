import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from '@/src/store/playerStore';

export type PendingRaceRewards = {
  motor: number;
  spray: number;
  engrenagem: number;
  chips: number;
  trophies: number;
  xp: number;
};

export type PendingUnlock = {
  type: 'map' | 'card' | 'achievement';
  itemId: string;
};

export type PendingRaceClaim = {
  type: 'race_reward';
  uid: string;
  raceId: string;
  rewards: PendingRaceRewards;
  unlocks: PendingUnlock[];
  createdAt: number;
};

const keyForUid = (uid: string) => `@wild/sync-outbox:${uid}`;

const sanitizeInt = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;

const normalizeClaim = (value: unknown): PendingRaceClaim | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as any;
  if (raw.type !== 'race_reward') return null;
  if (typeof raw.uid !== 'string' || !raw.uid.trim()) return null;
  if (typeof raw.raceId !== 'string' || !raw.raceId.trim() || raw.raceId.includes('/')) return null;

  return {
    type: 'race_reward',
    uid: raw.uid.trim(),
    raceId: raw.raceId.trim(),
    rewards: {
      motor: sanitizeInt(raw.rewards?.motor),
      spray: sanitizeInt(raw.rewards?.spray),
      engrenagem: sanitizeInt(raw.rewards?.engrenagem),
      chips: sanitizeInt(raw.rewards?.chips),
      trophies: sanitizeInt(raw.rewards?.trophies),
      xp: sanitizeInt(raw.rewards?.xp),
    },
    unlocks: Array.isArray(raw.unlocks)
      ? raw.unlocks
          .filter((item: any) =>
            item &&
            ['map', 'card', 'achievement'].includes(item.type) &&
            typeof item.itemId === 'string' &&
            !!item.itemId.trim(),
          )
          .map((item: any) => ({ type: item.type, itemId: item.itemId.trim() }))
      : [],
    createdAt: sanitizeInt(raw.createdAt) || Date.now(),
  };
};

let mutationChain: Promise<void> = Promise.resolve();

function serializeMutation<T>(work: () => Promise<T>): Promise<T> {
  const run = mutationChain.then(work, work);
  mutationChain = run.then(() => undefined, () => undefined);
  return run;
}

async function readUnsafe(uid: string): Promise<PendingRaceClaim[]> {
  const raw = await AsyncStorage.getItem(keyForUid(uid));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeClaim)
      .filter((claim): claim is PendingRaceClaim => !!claim && claim.uid === uid);
  } catch {
    return [];
  }
}

async function writeUnsafe(uid: string, claims: PendingRaceClaim[]): Promise<void> {
  await AsyncStorage.setItem(keyForUid(uid), JSON.stringify(claims));
}

export async function listPendingRaceClaims(uid: string): Promise<PendingRaceClaim[]> {
  return readUnsafe(uid);
}

export async function pendingRaceClaimCount(uid: string): Promise<number> {
  return (await readUnsafe(uid)).length;
}

export async function enqueueRaceClaim(claim: PendingRaceClaim): Promise<'queued' | 'already_queued'> {
  const normalized = normalizeClaim(claim);
  if (!normalized) throw new Error('WILD_OUTBOX_INVALID_CLAIM');

  return serializeMutation(async () => {
    const claims = await readUnsafe(normalized.uid);
    if (claims.some(item => item.raceId === normalized.raceId)) return 'already_queued';
    await writeUnsafe(normalized.uid, [...claims, normalized]);
    return 'queued';
  });
}

export async function removeRaceClaim(uid: string, raceId: string): Promise<void> {
  await serializeMutation(async () => {
    const claims = await readUnsafe(uid);
    const next = claims.filter(item => item.raceId !== raceId);
    if (next.length !== claims.length) await writeUnsafe(uid, next);
  });
}

function applyUnlocksLocally(unlocks: PendingUnlock[]) {
  const store = usePlayerStore.getState();
  for (const unlock of unlocks) {
    if (unlock.type === 'map') store.unlockItem('maps', unlock.itemId);
    if (unlock.type === 'card') store.unlockItem('cards', unlock.itemId);
    if (unlock.type === 'achievement') store.unlockItem('achievements', unlock.itemId);
  }
}

/**
 * Crash safety: if the outbox write completed but the app died before the local
 * reward was applied, replay the still-pending claims into Zustand exactly once.
 */
export async function replayPendingRaceClaimsLocally(uid: string): Promise<number> {
  const claims = await readUnsafe(uid);
  let applied = 0;

  for (const claim of claims) {
    const state = usePlayerStore.getState();
    if (state.profile?.id !== uid) break;
    if (state.processedRaceIds.includes(claim.raceId)) continue;

    const status = state.applyMatchRewardsOnce(claim.raceId, claim.rewards as any);
    if (status === 'applied') {
      applyUnlocksLocally(claim.unlocks);
      applied += 1;
    }
  }

  return applied;
}
