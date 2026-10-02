import { auth } from '@/src/services/firebase/firebaseClient';
import { claimRaceRewardsInCloud } from '@/src/services/firebase/cloudRaceRewards';
import { loadCurrentPlayerCloudSave } from '@/src/services/firebase/playerCloud';
import {
  listPendingRaceClaims,
  removeRaceClaim,
  replayPendingRaceClaimsLocally,
} from './offlineOutbox';
import { isWildOnline, subscribeWildNetwork } from './networkState';

export type WildFlushResult = {
  status: 'synced' | 'offline' | 'not_authenticated' | 'partial';
  processed: number;
  pending: number;
};

let flushing: Promise<WildFlushResult> | null = null;
let stopWatcher: (() => void) | null = null;

export function flushWildOutbox(): Promise<WildFlushResult> {
  if (flushing) return flushing;

  flushing = (async () => {
    const user = auth.currentUser;
    if (!user) return { status: 'not_authenticated', processed: 0, pending: 0 };

    if (!(await isWildOnline())) {
      const pending = (await listPendingRaceClaims(user.uid)).length;
      return { status: 'offline', processed: 0, pending };
    }

    let processed = 0;

    // A few rounds allow claims appended while a flush is already running to join
    // the same reconnect cycle without creating an endless loop.
    for (let round = 0; round < 8; round += 1) {
      const claims = await listPendingRaceClaims(user.uid);
      if (claims.length === 0) break;

      let madeProgress = false;
      for (const claim of claims) {
        try {
          await claimRaceRewardsInCloud(claim);
          await removeRaceClaim(user.uid, claim.raceId);
          processed += 1;
          madeProgress = true;
        } catch (error) {
          console.warn('[WILD SYNC] Race claim postponed:', claim.raceId, error);
          const pending = (await listPendingRaceClaims(user.uid)).length;
          return { status: 'partial', processed, pending };
        }
      }

      if (!madeProgress) break;
    }

    const remaining = await listPendingRaceClaims(user.uid);

    if (remaining.length === 0 && processed > 0) {
      // Only refresh after this flush actually committed race claims. A plain
      // network reconnect with an empty outbox must not rewrite active game state.
      try {
        await loadCurrentPlayerCloudSave();
      } catch (error) {
        console.warn('[WILD SYNC] Final cloud refresh postponed:', error);
      }
    }

    // If a new claim arrived during the final refresh, put its reward back on top
    // of the refreshed snapshot rather than losing visible offline progress.
    await replayPendingRaceClaimsLocally(user.uid);

    const pending = (await listPendingRaceClaims(user.uid)).length;
    return {
      status: pending === 0 ? 'synced' : 'partial',
      processed,
      pending,
    };
  })().finally(() => {
    flushing = null;
  });

  return flushing;
}

export function startWildSyncCoordinator(): void {
  if (stopWatcher) return;

  stopWatcher = subscribeWildNetwork(status => {
    if (status === 'online') {
      void flushWildOutbox();
    }
  });
}

export function stopWildSyncCoordinator(): void {
  stopWatcher?.();
  stopWatcher = null;
}
