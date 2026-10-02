import {
  createInitialPlayerSnapshot,
  installPlayerSnapshot,
  normalizePlayerSaveSnapshot,
  usePlayerStore,
  type PlayerSaveSnapshot,
} from '@/src/store/playerStore';
import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseClient';

export const PLAYER_SAVE_SCHEMA_VERSION = 1;

type LoadPlayerResult =
  | { status: 'loaded'; snapshot: PlayerSaveSnapshot }
  | { status: 'missing' };

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('WILD_AUTH_REQUIRED');
  return user;
}

export async function createNewPlayerCloudSave(
  username: string,
  email: string,
): Promise<PlayerSaveSnapshot> {
  const user = requireUser();
  const saveRef = doc(db, 'playerSaves', user.uid);
  const snapshot = createInitialPlayerSnapshot(username, email, user.uid);

  await runTransaction(db, async transaction => {
    const existing = await transaction.get(saveRef);
    if (existing.exists()) throw new Error('WILD_SAVE_ALREADY_EXISTS');

    transaction.set(saveRef, {
      ownerUid: user.uid,
      schemaVersion: PLAYER_SAVE_SCHEMA_VERSION,
      profile: snapshot.profile,
      equippedDeck: snapshot.equippedDeck,
      processedRaceIds: snapshot.processedRaceIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  installPlayerSnapshot(snapshot);
  return snapshot;
}

export async function loadCurrentPlayerCloudSave(): Promise<LoadPlayerResult> {
  const user = requireUser();
  const saveRef = doc(db, 'playerSaves', user.uid);
  const remote = await getDocFromServer(saveRef);

  if (!remote.exists()) return { status: 'missing' };

  const data = remote.data();
  if (data.ownerUid !== user.uid) throw new Error('WILD_SAVE_OWNER_MISMATCH');

  const snapshot = normalizePlayerSaveSnapshot({
    profile: data.profile,
    equippedDeck: data.equippedDeck,
    processedRaceIds: data.processedRaceIds,
  });

  if (!snapshot) throw new Error('WILD_SAVE_INVALID');
  if (!installPlayerSnapshot(snapshot)) throw new Error('WILD_SAVE_INSTALL_FAILED');

  return { status: 'loaded', snapshot };
}

export async function currentPlayerCloudSaveExists(): Promise<boolean> {
  const user = requireUser();
  const remote = await getDocFromServer(doc(db, 'playerSaves', user.uid));
  return remote.exists();
}


function getCurrentLocalPlayerSnapshot(): PlayerSaveSnapshot {
  const state = usePlayerStore.getState();
  const snapshot = normalizePlayerSaveSnapshot({
    profile: state.profile,
    equippedDeck: state.equippedDeck,
    processedRaceIds: state.processedRaceIds,
  });

  if (!snapshot) throw new Error('WILD_LOCAL_SAVE_INVALID');
  return snapshot;
}

/**
 * Writes the current Zustand snapshot to the authenticated player's Firestore document.
 *
 * The write is transactional so an older local snapshot cannot silently overwrite a
 * newer cloud snapshot when two UI actions finish out of order.
 */
export async function saveCurrentPlayerCloudSnapshot(): Promise<PlayerSaveSnapshot> {
  const user = requireUser();
  const snapshot = getCurrentLocalPlayerSnapshot();

  if (snapshot.profile.id !== user.uid) {
    throw new Error('WILD_SAVE_PLAYER_MISMATCH');
  }

  const saveRef = doc(db, 'playerSaves', user.uid);

  await runTransaction(db, async transaction => {
    const existing = await transaction.get(saveRef);

    if (!existing.exists()) {
      throw new Error('WILD_SAVE_MISSING');
    }

    const remote = existing.data();

    if (remote.ownerUid !== user.uid) {
      throw new Error('WILD_SAVE_OWNER_MISMATCH');
    }

    const remoteProfileUpdatedAt =
      typeof remote.profile?.updatedAt === 'number' && Number.isFinite(remote.profile.updatedAt)
        ? Math.floor(remote.profile.updatedAt)
        : 0;

    if (remoteProfileUpdatedAt > snapshot.profile.updatedAt) {
      throw new Error('WILD_SAVE_STALE_LOCAL');
    }

    transaction.update(saveRef, {
      ownerUid: user.uid,
      schemaVersion: PLAYER_SAVE_SCHEMA_VERSION,
      profile: snapshot.profile,
      equippedDeck: snapshot.equippedDeck,
      processedRaceIds: snapshot.processedRaceIds,
      updatedAt: serverTimestamp(),
    });
  });

  return snapshot;
}
