import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';

import { ensureSignedIn } from '@/src/services/firebase/auth';
import { getFirebaseServices } from '@/src/services/firebase/config';
import { trySyncPendingProfile } from '@/src/services/firebase/profileSync';
import { readPendingGoogleRegistration } from '@/src/services/firebase/registrationGoogleAuth';
import { getNativeGoogle, readGoogleStatusCodes } from '@/src/services/firebase/nativeGoogle';
import { usePlayerStore } from '@/src/store/playerStore';

type AccountStatus = {
  uid: string;
  googleLinked: boolean;
  email: string | null;
  emailVerified: boolean;
};

type SavedBinding = { localProfileId: string; firebaseUid: string };
const BINDING_KEY = '@wild/firebase/linked-local-profile-v1';
const ACCENT = '#61E7FF';
let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    throw new Error('Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID com o Client ID OAuth do tipo Web.');
  }
  const { GoogleSignin } = getNativeGoogle();
  GoogleSignin.configure({ webClientId });
  googleConfigured = true;
}

function readableGoogleError(error: unknown): { cancelled: boolean; message: string } {
  const code = (error as { code?: string } | null)?.code;
  const statusCodes = readGoogleStatusCodes();
  if (statusCodes && code === statusCodes.SIGN_IN_CANCELLED) {
    return { cancelled: true, message: 'Seleção de conta cancelada.' };
  }
  if (code === 'auth/credential-already-in-use' ||
      code === 'auth/email-already-in-use' ||
      code === 'auth/account-exists-with-different-credential') {
    return {
      cancelled: false,
      message: 'Esta conta Google já pertence a outro UID. Não trocamos a conta nem substituímos o save local. A recuperação será ativada após a migração segura do progresso.',
    };
  }
  if (code === 'auth/operation-not-allowed' || code === 'DEVELOPER_ERROR' || code === '10') {
    return { cancelled: false, message: 'Confira Google habilitado no Firebase, Web Client ID, pacote Android e SHA-1 deste build.' };
  }
  if (statusCodes && code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return { cancelled: false, message: 'Google Play Services indisponível ou desatualizado.' };
  }
  if (statusCodes && code === statusCodes.IN_PROGRESS) {
    return { cancelled: false, message: 'Já existe uma autenticação Google em andamento.' };
  }
  return {
    cancelled: false,
    message: error instanceof Error ? error.message : 'Não foi possível conectar a conta Google.',
  };
}

/** Confirma que o UID remoto corresponde ao save local antes da vinculação. */
async function assertSamePlayer(uid: string): Promise<SavedBinding> {
  if (!usePlayerStore.persist.hasHydrated()) {
    await usePlayerStore.persist.rehydrate();
  }
  const local = usePlayerStore.getState().profile;
  if (!local) {
    throw new Error('Nenhum perfil local encontrado. Conclua o cadastro antes de vincular Google.');
  }

  const raw = await AsyncStorage.getItem(BINDING_KEY);
  if (raw) {
    let binding: SavedBinding;
    try {
      binding = JSON.parse(raw) as SavedBinding;
    } catch {
      throw new Error('Vínculo local inválido. Não alteramos a conta para proteger o save.');
    }
    if (binding.localProfileId !== local.id || binding.firebaseUid !== uid) {
      throw new Error('O save local está associado a outra identidade. Nenhuma conta foi alterada.');
    }
  }

  // Se o registro deixou uma sincronização pendente, tenta concluí-la primeiro.
  try {
    await trySyncPendingProfile();
  } catch (error) {
    console.warn('[Wild Account] Sincronização pendente:', error);
  }

  const { db } = getFirebaseServices();
  let remote;
  try {
    remote = await getDocFromServer(doc(db, 'players', uid));
  } catch {
    throw new Error('Conecte-se à internet para validar o perfil antes de vincular Google.');
  }
  if (!remote.exists()) {
    throw new Error('O perfil ainda não está no Firestore. Sincronize o cadastro antes de vincular Google.');
  }
  const data = remote.data();
  if (data.nickname !== local.username) {
    throw new Error('O nome do perfil no Firestore não corresponde ao save local. Vinculação interrompida.');
  }
  const remoteEmail = typeof data.registrationEmail === 'string'
    ? data.registrationEmail
    : typeof data.email === 'string'
      ? data.email
      : null;
  if (remoteEmail && remoteEmail.trim().toLowerCase() !== local.email.trim().toLowerCase()) {
    throw new Error('O e-mail do perfil remoto não corresponde ao save local. Vinculação interrompida.');
  }
  return { localProfileId: local.id, firebaseUid: uid };
}

async function storeBinding(binding: SavedBinding): Promise<void> {
  try {
    await AsyncStorage.setItem(BINDING_KEY, JSON.stringify(binding));
  } catch (error) {
    // A vinculação no Firebase pode já ter sido concluída. Não alegar falha de login.
    console.warn('[Wild Account] Google vinculado; metadado local pendente:', error);
  }
}

export default function AccountScreen() {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const user = await ensureSignedIn();
      // Reaproveita o leitor da nova registrationGoogleAuth (sem criar cadastro).
      const google = await readPendingGoogleRegistration();
      setStatus({
        uid: user.uid,
        googleLinked: !!google,
        email: google?.email ?? null,
        emailVerified: google?.emailVerified ?? false,
      });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a conta.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function connectGoogle() {
    if (busyRef.current || !status || status.googleLinked) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    try {
      const user = await ensureSignedIn();
      const originalUid = user.uid;
      const binding = await assertSamePlayer(originalUid);

      // Pode ter sido vinculado durante outra tentativa / reinicialização.
      if (user.providerData.some(provider => provider.providerId === 'google.com')) {
        await storeBinding(binding);
        await refresh();
        Alert.alert('Conta já vinculada', 'Sua conta Google já está conectada ao jogador atual.');
        return;
      }

      configureGoogle();
      const { GoogleSignin } = getNativeGoogle();
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        throw new Error('Google não retornou ID Token. Confira o Web Client ID e o OAuth.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const linked = await linkWithCredential(user, credential);
      if (linked.user.uid !== originalUid) {
        throw new Error('UID alterado inesperadamente. Verifique a conta antes de prosseguir.');
      }

      await storeBinding(binding);
      await refresh();
      Alert.alert('Conta protegida!', `Google vinculado ao UID ${originalUid}. Seu progresso local não foi alterado.`);
    } catch (cause) {
      const result = readableGoogleError(cause);
      if (!result.cancelled) {
        setError(result.message);
        Alert.alert('Não foi possível conectar', result.message);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const googleLinked = status?.googleLinked ?? false;

  return (
    <SafeAreaView style={styles.root}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <Text style={styles.backText}>‹ VOLTAR</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.panel}>
          <Text style={styles.kicker}>WF // PLAYER ACCOUNT</Text>
          <Text style={styles.title}>PROTEJA SUA CONTA</Text>
          <Text style={styles.caption}>
            Vincule sua conta Google ao piloto atual, preservando o UID e o progresso local.
          </Text>

          <Text style={styles.label}>UID FIREBASE</Text>
          <Text selectable style={styles.uid}>{status?.uid ?? 'Carregando...'}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={googleLinked ? 'Conta Google vinculada' : 'Conectar conta Google'}
            disabled={busy || !status || googleLinked}
            onPress={() => void connectGoogle()}
            style={[styles.googleButton, (busy || !status || googleLinked) && styles.disabled]}
          >
            {busy ? <ActivityIndicator color="#4285F4" /> : (
              <Svg width={20} height={20} viewBox="0 0 48 48">
                <SvgPath fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <SvgPath fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55z" />
                <SvgPath fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                <SvgPath fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </Svg>
            )}
            <Text style={styles.googleText}>
              {busy ? 'CONECTANDO...' : googleLinked ? '✓ GOOGLE VINCULADO' : 'CONECTAR COM GOOGLE'}
            </Text>
          </Pressable>

          {googleLinked && status?.email ? (
            <Text style={styles.hint}>
              {status.emailVerified ? 'E-mail verificado: ' : 'E-mail da conta Google: '}
              {status.email}
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.warning}>
            A vinculação protege a identidade, mas ainda não restaura garagem, moedas e XP em outro aparelho.
            Não desinstale o Wild para testar recuperação antes da migração validada do save.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101216', paddingHorizontal: 22, paddingTop: 12 },
  back: { paddingVertical: 10, alignSelf: 'flex-start' },
  backText: { color: ACCENT, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  panel: { maxWidth: 500, width: '100%', alignSelf: 'center', gap: 14 },
  kicker: { color: ACCENT, fontWeight: '900', letterSpacing: 2, fontSize: 11 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  caption: { color: '#C0C4CA', lineHeight: 20 },
  label: { color: '#899199', letterSpacing: 1, fontWeight: '900', fontSize: 10 },
  uid: { color: '#FFFFFF', fontSize: 12 },
  googleButton: {
    minHeight: 51, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#DADCE0', borderRadius: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 12,
  },
  googleText: { color: '#202124', fontWeight: '900', letterSpacing: 0.5 },
  disabled: { opacity: 0.65 },
  hint: { color: ACCENT, fontSize: 11 },
  error: { color: '#FF817B', fontSize: 12 },
  warning: { color: '#D7AD52', lineHeight: 18, fontSize: 11 },
});
