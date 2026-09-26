import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ensureSignedIn } from './auth';
import { getFirebaseServices } from './config';

const PENDING_PROFILE_KEY = '@wild/firebase/pending-profile-v1';

export type CloudLanguage = 'pt-BR' | 'en' | 'es';

type PendingProfile = {
  nickname: string;
  registrationEmail: string,
  language: CloudLanguage;
};

const validNickname = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,12}$/.test(value);

const validLanguage = (value: unknown): value is CloudLanguage =>
  value === 'pt-BR' || value === 'en' || value === 'es';

/** Salva a intenção de sincronização, sem depender da internet. */
export async function queueCloudProfile(
  nickname: string,
  registrationEmail: string,
  language: CloudLanguage,
): Promise<void> {
  if (!validNickname(nickname) || !validLanguage(language)) {
    throw new Error('[Wild Firebase] Dados de perfil inválidos.');
  }

  const pending: PendingProfile = { nickname, registrationEmail, language };
  await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(pending));
}

let pendingSync: Promise<string | null> | null = null;

/**
 * Só cria o documento de perfil. Nunca copia saldo, inventário ou XP.
 * Em caso de falha, mantém a fila para tentar novamente.
 */
export function trySyncPendingProfile(): Promise<string | null> {
  if (pendingSync) return pendingSync;

  pendingSync = (async () => {
    const raw = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;

    const pending: PendingProfile = JSON.parse(raw);
    if (!validNickname(pending.nickname) || !validLanguage(pending.language)) {
      throw new Error('[Wild Firebase] Perfil pendente inválido.');
    }

    const user = await ensureSignedIn();
    const { db } = getFirebaseServices();
    const playerRef = doc(db, 'players', user.uid);

    await runTransaction(db, async transaction => {
      const current = await transaction.get(playerRef);
      if (current.exists()) {
        // Não sobrescreve o documento se o UID já tem outro perfil.
        if (current.data().nickname !== pending.nickname) {
          throw new Error('[Wild Firebase] UID associado a outro apelido.');
        }
        return;
      }

      transaction.set(playerRef, {
        nickname: pending.nickname,
        registrationEmail: pending.registrationEmail,
        language: pending.language,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
    return user.uid;
  })().finally(() => {
    pendingSync = null;
  });

  return pendingSync;
}
