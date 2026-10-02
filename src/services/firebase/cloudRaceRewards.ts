import {
  normalizePlayerSaveSnapshot,
  type PlayerSaveSnapshot,
} from '@/src/store/playerStore';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { PendingRaceClaim, PendingUnlock } from '@/src/services/sync/offlineOutbox';
import { auth, db } from './firebaseClient';
import { PLAYER_SAVE_SCHEMA_VERSION } from './playerCloud';

export type CloudRaceClaimResult =
  | { status: 'applied'; snapshot: PlayerSaveSnapshot }
  | { status: 'already_processed'; snapshot: PlayerSaveSnapshot };

const sanitizeInt = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;

function appendUnique(values: unknown, itemId: string): string[] {
  const current = Array.isArray(values)
    ? values.filter((value): value is string => typeof value === 'string')
    : [];
  return current.includes(itemId) ? current : [...current, itemId];
}

function applyUnlocksToProfile(profile: any, unlocks: PendingUnlock[]) {
  let maps = Array.isArray(profile.unlocks?.maps) ? [...profile.unlocks.maps] : [];
  let cards = Array.isArray(profile.unlocks?.cards) ? [...profile.unlocks.cards] : [];
  let achievements = Array.isArray(profile.unlocks?.achievements)
    ? [...profile.unlocks.achievements]
    : [];

  for (const unlock of unlocks) {
    if (unlock.type === 'map') maps = appendUnique(maps, unlock.itemId);
    if (unlock.type === 'card') cards = appendUnique(cards, unlock.itemId);
    if (unlock.type === 'achievement') achievements = appendUnique(achievements, unlock.itemId);
  }

  return {
    ...profile.unlocks,
    maps,
    cards,
    achievements,
  };
}

export async function claimRaceRewardsInCloud(
  claim: PendingRaceClaim,
): Promise<CloudRaceClaimResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('WILD_AUTH_REQUIRED');
  if (claim.uid !== user.uid) throw new Error('WILD_RACE_UID_MISMATCH');
  if (!claim.raceId || claim.raceId.includes('/') || claim.raceId.length > 160) {
    throw new Error('WILD_RACE_ID_INVALID');
  }

  const saveRef = doc(db, 'playerSaves', user.uid);
  const claimRef = doc(db, 'playerSaves', user.uid, 'raceClaims', claim.raceId);

  return runTransaction(db, async transaction => {
    // Firestore requires every read before the first write in a transaction.
    const claimDoc = await transaction.get(claimRef);
    const saveDoc = await transaction.get(saveRef);

    if (!saveDoc.exists()) throw new Error('WILD_SAVE_MISSING');
    const data = saveDoc.data();
    if (data.ownerUid !== user.uid) throw new Error('WILD_SAVE_OWNER_MISMATCH');

    const current = normalizePlayerSaveSnapshot({
      profile: data.profile,
      equippedDeck: data.equippedDeck,
      processedRaceIds: data.processedRaceIds,
    });
    if (!current) throw new Error('WILD_SAVE_INVALID');

    if (claimDoc.exists()) {
      return { status: 'already_processed', snapshot: current } as const;
    }

    const rewards = {
      motor: sanitizeInt(claim.rewards.motor),
      spray: sanitizeInt(claim.rewards.spray),
      engrenagem: sanitizeInt(claim.rewards.engrenagem),
      chips: sanitizeInt(claim.rewards.chips),
      trophies: sanitizeInt(claim.rewards.trophies),
      xp: sanitizeInt(claim.rewards.xp),
    };

    const nextUpdatedAt = Math.max(
      Date.now(),
      sanitizeInt(current.profile.updatedAt) + 1,
    );

    const nextSnapshot = normalizePlayerSaveSnapshot({
      profile: {
        ...current.profile,
        trophies: current.profile.trophies + rewards.trophies,
        xp: current.profile.xp + rewards.xp,
        parts: {
          ...current.profile.parts,
          motor: current.profile.parts.motor + rewards.motor,
          spray: current.profile.parts.spray + rewards.spray,
          engrenagem: current.profile.parts.engrenagem + rewards.engrenagem,
          chips: current.profile.parts.chips + rewards.chips,
        },
        unlocks: applyUnlocksToProfile(current.profile, claim.unlocks),
        updatedAt: nextUpdatedAt,
      },
      equippedDeck: current.equippedDeck,
      processedRaceIds: current.processedRaceIds.includes(claim.raceId)
        ? current.processedRaceIds
        : [...current.processedRaceIds, claim.raceId].slice(-500),
    });

    if (!nextSnapshot) throw new Error('WILD_RACE_RESULT_INVALID');

    transaction.set(claimRef, {
      ownerUid: user.uid,
      raceId: claim.raceId,
      rewards,
      unlocks: claim.unlocks,
      createdAt: serverTimestamp(),
    });

    transaction.update(saveRef, {
      ownerUid: user.uid,
      schemaVersion: PLAYER_SAVE_SCHEMA_VERSION,
      profile: nextSnapshot.profile,
      equippedDeck: nextSnapshot.equippedDeck,
      processedRaceIds: nextSnapshot.processedRaceIds,
      updatedAt: serverTimestamp(),
    });

    return { status: 'applied', snapshot: nextSnapshot } as const;
  });
}
