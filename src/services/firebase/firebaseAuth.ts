import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebaseClient';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const validAccountEmail = (value: string) => {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

// Wild keeps a slightly stricter client-side rule than Firebase's basic minimum.
export const validAccountPassword = (value: string) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128;

export async function waitForAuthReady(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;

  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function createAccountWithEmailPassword(
  email: string,
  password: string,
): Promise<User> {
  const safeEmail = normalizeEmail(email);

  if (!validAccountEmail(safeEmail)) throw new Error('Informe um e-mail válido.');
  if (!validAccountPassword(password)) throw new Error('A senha deve ter entre 8 e 128 caracteres.');

  // If Auth was created but the Firestore write failed, allow the same
  // authenticated session to finish registration without creating another UID.
  const current = auth.currentUser;
  if (current && current.email?.toLowerCase() === safeEmail) return current;

  const credential = await createUserWithEmailAndPassword(auth, safeEmail, password);
  return credential.user;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<User> {
  const safeEmail = normalizeEmail(email);
  if (!validAccountEmail(safeEmail) || !password) {
    throw new Error('Informe seu e-mail e senha.');
  }

  const credential = await signInWithEmailAndPassword(auth, safeEmail, password);
  return credential.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const safeEmail = normalizeEmail(email);
  if (!validAccountEmail(safeEmail)) throw new Error('Informe um e-mail válido.');
  await sendPasswordResetEmail(auth, safeEmail);
}

export async function signOutWildAccount(): Promise<void> {
  await signOut(auth);
}
