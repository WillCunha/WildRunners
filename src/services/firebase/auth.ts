import { signInAnonymously, type User } from 'firebase/auth';
import { getFirebaseServices } from './config';

let pendingSignIn: Promise<User> | null = null;

/**
 * Restaura a sessão persistida ou cria um UID anônimo.
 * A Promise compartilhada evita dois logins concorrentes.
 */
export function ensureSignedIn(): Promise<User> {
  if (pendingSignIn) return pendingSignIn;

  pendingSignIn = (async () => {
    const { auth } = getFirebaseServices();
    await auth.authStateReady();

    if (auth.currentUser) return auth.currentUser;

    const credential = await signInAnonymously(auth);
    return credential.user;
  })().finally(() => {
    pendingSignIn = null;
  });

  return pendingSignIn;
}
