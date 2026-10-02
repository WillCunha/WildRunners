import {
  getCurrentLocalPlayerSnapshot,
  saveCurrentPlayerCloudSnapshot,
} from '@/src/services/firebase/playerCloud';
import {
  installPlayerSnapshot,
  type PlayerSaveSnapshot,
} from '@/src/store/playerStore';
import { isWildOnline } from './networkState';
import { flushWildOutbox } from './syncCoordinator';

export type OnlineMutationStart =
  | { online: false }
  | { online: true; before: PlayerSaveSnapshot };

export async function beginOnlinePlayerMutation(): Promise<OnlineMutationStart> {
  if (!(await isWildOnline())) return { online: false };

  // Never write a whole snapshot while an additive race claim is pending, or the
  // race could be present in the snapshot and then added again by its claim.
  const flush = await flushWildOutbox();
  if (flush.pending > 0 || flush.status === 'offline' || flush.status === 'not_authenticated') {
    return { online: false };
  }

  return { online: true, before: getCurrentLocalPlayerSnapshot() };
}

/**
 * If the server confirmation fails, restore the pre-action snapshot locally.
 * A later Loading refresh still wins if the server actually committed before
 * the response was lost, so we never invent a second recovery save.
 */
export async function confirmOnlinePlayerMutation(
  before: PlayerSaveSnapshot,
): Promise<boolean> {
  try {
    await saveCurrentPlayerCloudSnapshot();
    return true;
  } catch (error) {
    console.warn('[WILD SYNC] Online mutation not confirmed:', error);
    installPlayerSnapshot(before);
    return false;
  }
}
