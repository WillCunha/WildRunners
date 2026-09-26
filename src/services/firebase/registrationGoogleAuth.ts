import {
  GoogleAuthProvider,
  linkWithCredential,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Platform } from 'react-native';
import { ensureSignedIn } from './auth';
import { getFirebaseServices } from './config';
import { getNativeGoogle, readGoogleStatusCodes } from './nativeGoogle';

export type GoogleRegistrationIdentity = {
  uid: string;
  suggestedUsername: string;
  email: string;
  emailVerified: boolean;
};

export class GoogleRegistrationError extends Error {
  constructor(
    readonly kind: 'cancelled' | 'conflict' | 'existing-profile' | 'config' | 'offline' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'GoogleRegistrationError';
  }
}

const validUsername = (value: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,12}$/.test(value);

export function suggestPilotName(displayName: string | null, email: string | null): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  const fromEmail = (email ?? '').split('@')[0] ?? '';
  for (const value of [first, fromEmail]) {
    const cleaned = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9_-]/g, '').slice(0, 12);
    if (validUsername(cleaned)) return cleaned;
  }
  return 'WildRacer';
}

function identityFromUser(user: User): GoogleRegistrationIdentity {
  const google = user.providerData.find(p => p.providerId === 'google.com');
  const email = (google?.email ?? user.email ?? '').trim().toLowerCase();
  return {
    uid: user.uid,
    suggestedUsername: suggestPilotName(google?.displayName ?? user.displayName, email),
    email,
    emailVerified: user.emailVerified,
  };
}

let configured = false;
function configureGoogle(): void {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    throw new GoogleRegistrationError('config', 'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID com o OAuth Client ID do tipo Web.');
  }
  const { GoogleSignin } = getNativeGoogle();
  GoogleSignin.configure({ webClientId });
  configured = true;
}

function readableError(error: unknown): GoogleRegistrationError {
  if (error instanceof GoogleRegistrationError) return error;
  const code = (error as { code?: string } | null)?.code;
  const statusCodes = readGoogleStatusCodes();
  if (statusCodes && code === statusCodes.SIGN_IN_CANCELLED) {
    return new GoogleRegistrationError('cancelled', 'Seleção de conta cancelada.');
  }
  if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use' || code === 'auth/account-exists-with-different-credential') {
    return new GoogleRegistrationError('conflict', 'Essa conta Google já pertence a outro cadastro. Para proteger o save local, não mudamos o UID. A recuperação do perfil será liberada depois da migração do progresso.');
  }
  if (code === 'auth/operation-not-allowed' || code === 'DEVELOPER_ERROR' || code === '10') {
    return new GoogleRegistrationError('config', 'Confira Google habilitado no Firebase, WEB_CLIENT_ID, pacote Android e SHA-1 do certificado deste build.');
  }
  if (statusCodes && code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return new GoogleRegistrationError('config', 'Google Play Services indisponível ou desatualizado.');
  }
  return new GoogleRegistrationError('unknown', error instanceof Error ? error.message : 'Não foi possível conectar ao Google.');
}

let inFlight: Promise<GoogleRegistrationIdentity> | null = null;

export function connectGoogleForRegistration(): Promise<GoogleRegistrationIdentity> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const user = await ensureSignedIn();
    const { db } = getFirebaseServices();
    let current;
    try {
      current = await getDocFromServer(doc(db, 'players', user.uid));
    } catch {
      throw new GoogleRegistrationError('offline', 'Conecte-se à internet para vincular a conta Google. O cadastro manual continua disponível.');
    }
    if (current.exists()) {
      throw new GoogleRegistrationError('existing-profile', 'Este UID já possui perfil no banco. Abra a conta existente; não iniciaremos outro cadastro sobre ela.');
    }

    if (user.providerData.some(p => p.providerId === 'google.com')) {
      return identityFromUser(user);
    }

    configureGoogle();
    const { GoogleSignin } = getNativeGoogle();
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();
    if (!idToken) {
      throw new GoogleRegistrationError('config', 'Google não retornou ID Token. Confira WEB_CLIENT_ID e a configuração OAuth.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const linked = await linkWithCredential(user, credential);
    if (linked.user.uid !== user.uid) {
      throw new GoogleRegistrationError('conflict', 'O UID mudou inesperadamente. Nenhum save será substituído.');
    }
    return identityFromUser(linked.user);
  })().catch(error => { throw readableError(error); }).finally(() => { inFlight = null; });
  return inFlight;
}

/** Retoma a tela caso o jogador já tenha vinculado Google mas não finalizado o nick. */
export async function readPendingGoogleRegistration(): Promise<GoogleRegistrationIdentity | null> {
  const user = await ensureSignedIn();
  return user.providerData.some(p => p.providerId === 'google.com')
    ? identityFromUser(user)
    : null;
}
