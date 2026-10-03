import { useLanguage } from '@/context/LanguageContext';
import {
  createAccountWithEmailPassword,
  requestPasswordReset,
  signInWithEmailPassword,
  validAccountEmail,
  validAccountPassword,
} from '@/src/services/firebase/firebaseAuth';
import { createNewPlayerCloudSave } from '@/src/services/firebase/playerCloud';
import { useTutorialStore } from '@/src/store/tutorialStore';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const ACCENT = '#61E7FF';
type AuthMode = 'login' | 'register';

type FirebaseAuthErrorKey =
  | 'auth.errors.emailAlreadyInUse'
  | 'auth.errors.invalidEmail'
  | 'auth.errors.weakPassword'
  | 'auth.errors.invalidCredential'
  | 'auth.errors.wrongPassword'
  | 'auth.errors.userNotFound'
  | 'auth.errors.userDisabled'
  | 'auth.errors.tooManyRequests'
  | 'auth.errors.networkRequestFailed'
  | 'auth.errors.operationNotAllowed'
  | 'auth.errors.accountExistsWithDifferentCredential'
  | 'auth.errors.credentialAlreadyInUse'
  | 'auth.errors.requiresRecentLogin'
  | 'auth.errors.generic';

const getFirebaseAuthErrorKey = (error: unknown): FirebaseAuthErrorKey => {
  const firebaseError = error as { code?: unknown; message?: unknown };

  const code = String(firebaseError?.code ?? '').trim();
  const message = String(firebaseError?.message ?? '').trim();

  const raw = `${code} ${message}`.toLowerCase();

  if (
    raw.includes('auth/email-already-in-use') ||
    raw.includes('firebase-auth/email-exists') ||
    raw.includes('email_exists')
  ) {
    return 'auth.errors.emailAlreadyInUse';
  }

  if (
    raw.includes('auth/invalid-email') ||
    raw.includes('invalid_email')
  ) {
    return 'auth.errors.invalidEmail';
  }

  if (
    raw.includes('auth/weak-password') ||
    raw.includes('weak_password')
  ) {
    return 'auth.errors.weakPassword';
  }

  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('invalid_login_credentials')
  ) {
    return 'auth.errors.invalidCredential';
  }

  if (
    raw.includes('auth/wrong-password') ||
    raw.includes('invalid_password')
  ) {
    return 'auth.errors.wrongPassword';
  }

  if (
    raw.includes('auth/user-not-found') ||
    raw.includes('email_not_found')
  ) {
    return 'auth.errors.userNotFound';
  }

  if (
    raw.includes('auth/user-disabled') ||
    raw.includes('user_disabled')
  ) {
    return 'auth.errors.userDisabled';
  }

  if (
    raw.includes('auth/too-many-requests') ||
    raw.includes('too_many_attempts_try_later')
  ) {
    return 'auth.errors.tooManyRequests';
  }

  if (
    raw.includes('auth/network-request-failed') ||
    raw.includes('network-request-failed')
  ) {
    return 'auth.errors.networkRequestFailed';
  }

  if (
    raw.includes('auth/operation-not-allowed') ||
    raw.includes('operation_not_allowed')
  ) {
    return 'auth.errors.operationNotAllowed';
  }

  if (raw.includes('auth/account-exists-with-different-credential')) {
    return 'auth.errors.accountExistsWithDifferentCredential';
  }

  if (raw.includes('auth/credential-already-in-use')) {
    return 'auth.errors.credentialAlreadyInUse';
  }

  if (raw.includes('auth/requires-recent-login')) {
    return 'auth.errors.requiresRecentLogin';
  }

  return 'auth.errors.generic';
};


const AUTH_COPY = {
  pt: { login: 'ENTRAR', register: 'CRIAR CONTA', loginTitle: 'BEM-VINDO DE VOLTA', loginSubtitle: 'Acesse seu piloto com e-mail e senha.', loginEyebrow: 'PILOTO EXISTENTE', email: 'E-MAIL', password: 'SENHA', enter: 'ENTRAR NO WILD', entering: 'AUTENTICANDO...', reveal: 'MOSTRAR SENHA', hide: 'OCULTAR SENHA', forgot: 'ESQUECI MINHA SENHA', protect: 'PROTEGER A CONTA ATUAL', return: 'VOLTAR À LOADING', noSave: 'Login confirmado, mas este UID não possui playerSaves. Nenhum save foi criado ou transferido. Preserve a sessão e conclua a recuperação adequada.', invalid: 'Informe seu e-mail e senha.', resetTitle: 'REDEFINIR SENHA', resetConfirm: 'Enviaremos instruções ao endereço informado, caso tenha uma conta com senha.', cancel: 'CANCELAR', send: 'ENVIAR', resetSent: 'Se existir uma conta com senha para este e-mail, as instruções foram solicitadas.', mailHint: 'Use o mesmo e-mail da sua conta Wild para recuperar seu piloto em outro aparelho.' },
  en: { login: 'SIGN IN', register: 'CREATE ACCOUNT', loginTitle: 'WELCOME BACK', loginSubtitle: 'Access your driver with email and password.', loginEyebrow: 'RETURNING DRIVER', email: 'EMAIL', password: 'PASSWORD', enter: 'SIGN IN TO WILD', entering: 'SIGNING IN...', reveal: 'SHOW PASSWORD', hide: 'HIDE PASSWORD', forgot: 'FORGOT PASSWORD', protect: 'SECURE CURRENT ACCOUNT', return: 'BACK TO LOADING', noSave: 'Sign-in succeeded, but this UID has no playerSaves. No save was created or transferred. Keep this session and complete the appropriate recovery.', invalid: 'Enter a valid email and password.', resetTitle: 'RESET PASSWORD', resetConfirm: 'We will request reset instructions for this address if it has a password account.', cancel: 'CANCEL', send: 'SEND', resetSent: 'If this address has a password account, reset instructions have been requested.', mailHint: 'Use the same Wild account email to restore your driver on another device.' },
  es: { login: 'ENTRAR', register: 'CREAR CUENTA', loginTitle: 'BIENVENIDO DE NUEVO', loginSubtitle: 'Accede a tu piloto con correo y contraseña.', loginEyebrow: 'PILOTO EXISTENTE', email: 'CORREO', password: 'CONTRASEÑA', enter: 'ENTRAR AL WILD', entering: 'AUTENTICANDO...', reveal: 'MOSTRAR CONTRASEÑA', hide: 'OCULTAR CONTRASEÑA', forgot: 'OLVIDÉ MI CONTRASEÑA', protect: 'PROTEGER CUENTA ACTUAL', return: 'VOLVER A CARGA', noSave: 'Acceso confirmado, pero este UID no tiene playerSaves. No se creó ni transfirió una partida. Conserva la sesión y completa la recuperación adecuada.', invalid: 'Introduce un correo válido y una contraseña.', resetTitle: 'RESTABLECER CONTRASEÑA', resetConfirm: 'Solicitaremos instrucciones para esta dirección si tiene una cuenta con contraseña.', cancel: 'CANCELAR', send: 'ENVIAR', resetSent: 'Si existe una cuenta con contraseña, se han solicitado las instrucciones.', mailHint: 'Usa el mismo correo de tu cuenta Wild para recuperar tu piloto en otro dispositivo.' },
} as const;

const normalizeUsername = (value: string) =>
  value.trim();

const normalizeEmail = (value: string) =>
  value.trim().toLowerCase();

const isValidUsername = (value: string) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,12}$/.test(value);

const isValidEmail = (value: string) => {
  if (value.length > 254) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};

export default function RegistrationScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { t, language } = useLanguage();
  const registeringRef = useRef(false);
  const loginBusyRef = useRef(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginVisible, setLoginVisible] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const labels = AUTH_COPY[String(language).startsWith('en') ? 'en' : String(language).startsWith('es') ? 'es' : 'pt'];


  const resetTutorial = useTutorialStore(
    state => state.resetTutorial,
  );

  const isCompactLandscape = height < 430;
  const isNarrow = width < 760;

  const [username, setUsername] =
    useState('');
  const [email, setEmail] =
    useState('');
  const [registering, setRegistering] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordIsValid = validAccountPassword(password) && password === confirmPassword;

  const authBusy = loginBusy || registering;

  const [usernameTouched, setUsernameTouched] =
    useState(false);
  const [emailTouched, setEmailTouched] =
    useState(false);

  const [usernameFocused, setUsernameFocused] =
    useState(false);
  const [emailFocused, setEmailFocused] =
    useState(false);

  const safeUsername = useMemo(
    () => normalizeUsername(username),
    [username],
  );

  const safeEmail = useMemo(
    () => normalizeEmail(email),
    [email],
  );

  const usernameIsValid =
    isValidUsername(safeUsername);

  const emailIsValid =
    isValidEmail(safeEmail);

  const formIsValid =
    usernameIsValid && emailIsValid && passwordIsValid;

  const switchMode = (next: AuthMode) => {
    if (authBusy || mode === next) return;
    // Never use a registration password as a sign-in password or vice versa.
    setLoginPassword('');
    setPassword('');
    setConfirmPassword('');
    setLoginNotice(null);
    setLoginError(null);
    setRegisterError(null);
    setMode(next);
  };

  const handleLogin = async () => {
    if (loginBusyRef.current || registeringRef.current) return;

    setLoginError(null);
    setLoginNotice(null);

    if (!validAccountEmail(loginEmail.trim().toLowerCase()) || !loginPassword) {
      setLoginError(labels.invalid);
      return;
    }

    loginBusyRef.current = true;
    setLoginBusy(true);

    try {
      await signInWithEmailPassword(loginEmail, loginPassword);
      setLoginPassword('');
      router.replace('/LoadingScreen');
    } catch (error) {
      console.warn('[Wild Firebase] Login não concluído:', error);
      setLoginError(t(getFirebaseAuthErrorKey(error)));
    } finally {
      loginBusyRef.current = false;
      setLoginBusy(false);
    }
  };

  const handlePasswordReset = () => {
    if (loginBusyRef.current || registeringRef.current) return;
    if (!validAccountEmail(loginEmail.trim().toLowerCase())) {
      setLoginError(labels.invalid);
      setLoginNotice(null);
      return;
    }
    setLoginError(null);
    Alert.alert(labels.resetTitle, labels.resetConfirm, [
      { text: labels.cancel, style: 'cancel' },
      {
        text: labels.send, onPress: () => {
          void (async () => {
            loginBusyRef.current = true;
            setLoginBusy(true);
            setLoginNotice(null);
            try {
              await requestPasswordReset(loginEmail);
              setLoginNotice(labels.resetSent);
            } catch (error) {
              console.warn('[Wild Firebase] Redefinição de senha não concluída:', error);
              setLoginNotice(null);
              setLoginError(t(getFirebaseAuthErrorKey(error)));
            } finally {
              loginBusyRef.current = false;
              setLoginBusy(false);
            }
          })();
        }
      },
    ]);
  };

  const createConfirmedProfile = async () => {
    if (registeringRef.current) return;

    setUsernameTouched(true);
    setEmailTouched(true);
    if (!formIsValid) return;

    setRegisterError(null);
    registeringRef.current = true;
    setRegistering(true);

    try {
      // Auth creates (or resumes) the UID. Firestore then creates exactly one
      // playerSaves/{uid}. No queue, migration or automatic overwrite here.
      await createAccountWithEmailPassword(safeEmail, password);
      await createNewPlayerCloudSave(safeUsername, safeEmail);

      setPassword('');
      setConfirmPassword('');
      resetTutorial();
      router.replace('/LoadingScreen');
    } catch (error) {
      console.warn('[Wild Firebase] Cadastro não concluído:', error);
      setRegisterError(t(getFirebaseAuthErrorKey(error)));
    } finally {
      registeringRef.current = false;
      setRegistering(false);
    }
  };

  const handleRegister = () => {
    if (registeringRef.current) return;
    setRegisterError(null);
    setUsernameTouched(true);
    setEmailTouched(true);
    if (!formIsValid) return;
    Alert.alert('NOVO PILOTO — WILD',
      'Vamos criar uma conta Firebase e um save novo para este piloto. ' +
      'Se você já possui uma conta Wild, use ENTRAR para carregar o save existente.', [
      { text: 'CANCELAR', style: 'cancel' },
      { text: 'JÁ TENHO CONTA', onPress: () => switchMode('login') },
      { text: 'CRIAR NOVO PILOTO', onPress: () => void createConfirmedProfile() },
    ]);
  };

  return (
    <ImageBackground
      source={require(
        '@/assets/images/components/background/background_home.png'
      )}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundShade} />
      <View style={styles.cyanGlow} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View
            style={[
              styles.pageContent,
              isCompactLandscape && styles.pageContentCompact,
              isNarrow && styles.pageContentNarrow,
            ]}
          >
            <View
              style={[
                styles.hero,
                isCompactLandscape && styles.heroCompact,
                isNarrow && styles.heroNarrow,
              ]}
            >
              <Image
                source={require(
                  '@/assets/images/gameLogoV5.png'
                )}
                resizeMode="contain"
                style={[
                  styles.logo,
                  isCompactLandscape && styles.logoCompact,
                  isNarrow && styles.logoNarrow,
                ]}
              />

              <Text style={styles.heroEyebrow}>
                {t('registration.heroEyebrow')}
              </Text>

              <Text
                style={[
                  styles.heroTitle,
                  isCompactLandscape &&
                  styles.heroTitleCompact,
                ]}
              >
                {mode === 'login' ? labels.loginTitle : t('registration.heroTitle')}
              </Text>

              <Text style={styles.heroText}>
                {mode === 'login' ? labels.loginSubtitle : t('registration.heroText')}
              </Text>

              <View style={styles.heroStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {String(language).startsWith('en') ? 'CLOUD PROFILE' : String(language).startsWith('es') ? 'PERFIL EN LA NUBE' : 'PERFIL NA NUVEM'}
                </Text>
              </View>
            </View>

            <ScrollView
              style={[
                styles.formScroll,
                isNarrow && styles.formScrollNarrow,
              ]}
              contentContainerStyle={[
                styles.formScrollContent,
                isCompactLandscape && styles.formScrollContentCompact,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View
              style={[
                styles.formPanel,
                isCompactLandscape && styles.formPanelCompact,
                isNarrow && styles.formPanelNarrow,
              ]}
            >
              <View style={styles.panelAccent} />
              <View style={styles.authTabs}>
                <TouchableOpacity
                  accessibilityRole="tab" accessibilityState={{ selected: mode === 'login' }}
                  activeOpacity={0.85} disabled={authBusy} onPress={() => switchMode('login')}
                  style={[styles.authTab, mode === 'login' && styles.authTabSelected]}
                >
                  <Text style={[styles.authTabText, mode === 'login' && styles.authTabTextSelected]}>{labels.login}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="tab" accessibilityState={{ selected: mode === 'register' }}
                  activeOpacity={0.85} disabled={authBusy} onPress={() => switchMode('register')}
                  style={[styles.authTab, mode === 'register' && styles.authTabSelected]}
                >
                  <Text style={[styles.authTabText, mode === 'register' && styles.authTabTextSelected]}>{labels.register}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderText}>
                  <Text style={styles.panelEyebrow}>
                    {mode === 'login' ? labels.loginEyebrow : t('registration.newDriver')}
                  </Text>

                  <Text style={styles.panelTitle}>
                    {mode === 'login' ? labels.loginTitle : t('registration.createIdentity')}
                  </Text>
                </View>

                <View style={styles.panelBranding}>
                  <View style={styles.driverBadge}>
                    <Text style={styles.driverBadgeTop}>
                      WF
                    </Text>
                    <Text style={styles.driverBadgeBottom}>
                      ID
                    </Text>
                  </View>

                  <Image
                    source={require('@/assets/images/logo1024v1.png')}
                    resizeMode="contain"
                    style={styles.wfLogo}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {mode === 'login' ? (
                <View>
                  <Text style={styles.loginIntro}>{labels.loginSubtitle}</Text>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>{labels.email}</Text>
                    <TextInput value={loginEmail} onChangeText={value => { setLoginEmail(value); setLoginError(null); }}
                      style={[styles.inputShell, styles.authPasswordInput, styles.authInput]}
                      placeholder="email@exemplo.com" placeholderTextColor="rgba(255,255,255,0.35)"
                      keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                      textContentType="emailAddress" autoComplete="email" maxLength={254}
                      editable={!loginBusy} returnKeyType="next" />
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>{labels.password}</Text>
                    <TextInput value={loginPassword} onChangeText={value => { setLoginPassword(value); setLoginError(null); }}
                      style={[styles.inputShell, styles.authPasswordInput, styles.authInput]}
                      placeholder={labels.password} placeholderTextColor="rgba(255,255,255,0.35)"
                      secureTextEntry={!loginVisible} textContentType="password"
                      autoComplete="current-password" autoCapitalize="none" autoCorrect={false}
                      maxLength={128} editable={!loginBusy} returnKeyType="done"
                      onSubmitEditing={() => { void handleLogin(); }} />
                    <TouchableOpacity disabled={loginBusy} onPress={() => setLoginVisible(v => !v)} style={styles.loginInlineAction}>
                      <Text style={styles.loginLink}>{loginVisible ? labels.hide : labels.reveal}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity activeOpacity={0.88} disabled={loginBusy || !loginEmail.trim() || !loginPassword}
                    onPress={() => { void handleLogin(); }}
                    style={[styles.submitButton, (loginBusy || !loginEmail.trim() || !loginPassword) && styles.submitButtonInactive]}>
                    <Text style={styles.submitKicker}>WILD NETWORK</Text>
                    <Text style={styles.submitText}>{loginBusy ? labels.entering : labels.enter}</Text>
                  </TouchableOpacity>
                  {loginBusy && <ActivityIndicator color={ACCENT} style={styles.loginSpinner} />}
                  {loginError && (
                    <Text selectable style={styles.authErrorText}>
                      {loginError}
                    </Text>
                  )}
                  <TouchableOpacity disabled={loginBusy} onPress={handlePasswordReset} style={styles.loginInlineAction}>
                    <Text style={styles.loginLink}>{labels.forgot}</Text>
                  </TouchableOpacity>
                  {loginNotice && <Text selectable style={styles.loginNotice}>{loginNotice}</Text>}
                  <Text style={styles.loginSmallNote}>{labels.mailHint}</Text>
                  <TouchableOpacity disabled={loginBusy} onPress={() => router.replace('/LoadingScreen')} style={styles.loginInlineAction}>
                    <Text style={styles.loginLink}>{labels.return}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.fieldBlock}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>
                        {t('registration.usernameLabel')}
                      </Text>

                      <Text style={styles.fieldCounter}>
                        {username.length}/12
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.inputShell,
                        usernameFocused &&
                        styles.inputShellFocused,
                        usernameTouched &&
                        !usernameIsValid &&
                        styles.inputShellError,
                      ]}
                    >
                      <Text style={styles.inputPrefix}>
                        @
                      </Text>

                      <TextInput
                        value={username}
                        onChangeText={value => {
                          setUsername(
                            value.replace(/\s/g, ''),
                          );
                        }}
                        onFocus={() =>
                          setUsernameFocused(true)
                        }
                        onBlur={() => {
                          setUsernameFocused(false);
                          setUsernameTouched(true);
                        }}
                        placeholder={t('registration.usernamePlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.28)"
                        style={styles.input}
                        maxLength={12}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                    </View>

                    {usernameTouched &&
                      !usernameIsValid ? (
                      <Text style={styles.errorText}>
                        {t('registration.usernameError')}
                      </Text>
                    ) : (
                      <Text style={styles.hintText}>
                        {t('registration.usernameHint')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.fieldBlock}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>
                        {t('registration.emailLabel')}
                      </Text>

                      <Text
                        style={[
                          styles.validationState,
                          emailTouched &&
                            emailIsValid
                            ? styles.validationStateOk
                            : undefined,
                        ]}
                      >
                        {emailTouched &&
                          emailIsValid
                          ? t('registration.validated')
                          : t('registration.account')}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.inputShell,
                        emailFocused &&
                        styles.inputShellFocused,
                        emailTouched &&
                        !emailIsValid &&
                        styles.inputShellError,
                      ]}
                    >
                      <Text style={styles.mailIcon}>
                        ✉
                      </Text>

                      <TextInput
                        value={email}
                        onChangeText={value => { setEmail(value); setRegisterError(null); }}
                        onFocus={() =>
                          setEmailFocused(true)
                        }
                        onBlur={() => {
                          setEmailFocused(false);
                          setEmailTouched(true);
                        }}
                        placeholder={t('registration.emailPlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.28)"
                        style={styles.input}
                        maxLength={254}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        autoComplete="email"
                        returnKeyType="done"
                        onSubmitEditing={() => { }}
                      />
                    </View>

                    {emailTouched &&
                      !emailIsValid ? (
                      <Text style={styles.errorText}>
                        {t('registration.emailError')}
                      </Text>
                    ) : (
                      <Text style={styles.hintText}>
                        {t('registration.emailHint')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>SENHA · MÍNIMO 8 CARACTERES</Text>
                    <TextInput value={password} onChangeText={value => { setPassword(value); setRegisterError(null); }}
                      style={[styles.inputShell, styles.authPasswordInput]} placeholder="Crie sua senha"
                      placeholderTextColor="rgba(255,255,255,0.35)" secureTextEntry={!passwordVisible}
                      textContentType="newPassword" autoComplete="new-password" autoCapitalize="none"
                      autoCorrect={false} maxLength={128} />
                    <TouchableOpacity onPress={() => setPasswordVisible(x => !x)} accessibilityRole="button">
                      <Text style={styles.hintText}>{passwordVisible ? 'OCULTAR SENHA' : 'MOSTRAR SENHA'}</Text>
                    </TouchableOpacity>
                    <TextInput value={confirmPassword} onChangeText={value => { setConfirmPassword(value); setRegisterError(null); }}
                      style={[styles.inputShell, styles.authPasswordInput]} placeholder="Confirme a senha"
                      placeholderTextColor="rgba(255,255,255,0.35)" secureTextEntry={!passwordVisible}
                      textContentType="newPassword" autoComplete="new-password" autoCapitalize="none"
                      autoCorrect={false} maxLength={128} />
                    {confirmPassword.length > 0 && !passwordIsValid &&
                      <Text style={styles.errorText}>Senha mínima de 8 caracteres e confirmação idêntica.</Text>}
                    <Text style={styles.hintText}>A senha fica no Firebase Authentication; não é salva no Wild.</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleRegister}
                    disabled={!formIsValid || registering}
                    style={[
                      styles.submitButton,
                      (!formIsValid || registering) &&
                      styles.submitButtonInactive,
                    ]}
                  >
                    <View style={styles.submitCornerLeft} />
                    <View style={styles.submitCornerRight} />

                    <Text style={styles.submitKicker}>
                      {t('registration.driverReady')}
                    </Text>
                    <Text style={styles.submitText}>
                      {registering
                        ? (String(language).startsWith('en') ? 'SAVING...' : String(language).startsWith('es') ? 'GUARDANDO...' : 'SALVANDO...')
                        : t('registration.startAdventure')}
                    </Text>

                    <Text style={styles.submitArrow}>
                      ››
                    </Text>
                  </TouchableOpacity>

                  {registerError && (
                    <Text selectable style={styles.authErrorText}>
                      {registerError}
                    </Text>
                  )}

                  <Text style={{ color: '#FFD60A', fontSize: 11, lineHeight: 17, marginTop: 12, textAlign: 'center' }}>
                    Digite uma senha nova somente para NOVO piloto. O e-mail de um save anônimo antigo não transfere aquele UID.
                  </Text>
                  <Text style={styles.localNote}>
                    {String(language).startsWith('en')
                      ? 'Your profile is saved in the cloud before the race starts.'
                      : String(language).startsWith('es')
                        ? 'Tu perfil se guarda en la nube antes de empezar la carrera.'
                        : 'Seu perfil é salvo na nuvem antes de iniciar a corrida.'}
                  </Text>
                </>
              )}
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  authPasswordInput: { color: '#FFFFFF', fontSize: 15, paddingHorizontal: 15, paddingVertical: 12, marginTop: 9 },
  authInput: { width: '100%', minHeight: 48 },
  authTabs: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(97,231,255,0.24)', backgroundColor: 'rgba(0,0,0,0.23)', gap: 4, marginBottom: 20 },
  authTab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 43, paddingHorizontal: 10, borderRadius: 9 },
  authTabSelected: { backgroundColor: ACCENT },
  authTabText: { color: 'rgba(255,255,255,0.66)', fontSize: 12, letterSpacing: 0.8, fontWeight: '900' },
  authTabTextSelected: { color: '#07121B' },
  loginIntro: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 18, marginBottom: 20 },
  loginInlineAction: { alignItems: 'center', paddingVertical: 8 },
  loginLink: { color: ACCENT, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  loginSpinner: { marginTop: 12 },
  loginNotice: { color: '#FFD60A', fontSize: 12, lineHeight: 18, marginVertical: 10, textAlign: 'center' },
  authErrorText: { color: '#FF6B63', fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 10, marginBottom: 4, textAlign: 'center' },
  loginSmallNote: { color: 'rgba(255,255,255,0.56)', fontSize: 11, lineHeight: 16, textAlign: 'center', marginVertical: 10 },
  pageContentNarrow: { flexDirection: 'column', paddingHorizontal: 18, gap: 16 },
  heroNarrow: { flex: 0, width: '100%', minWidth: 0, alignItems: 'center' },
  logoNarrow: { alignSelf: 'center', marginLeft: 0, width: 250, height: 90 },
  formScrollNarrow: { width: '100%', minWidth: 0, maxWidth: undefined },
  formPanelNarrow: { width: '100%', minWidth: 0, maxWidth: undefined },
  background: {
    flex: 1,
  },

  backgroundShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,10,0.70)',
  },

  cyanGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    right: -160,
    top: -170,
    backgroundColor: 'rgba(97,231,255,0.08)',
  },

  safeArea: {
    flex: 1,
  },

  keyboardArea: {
    flex: 1,
  },

  pageContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 42,
    paddingVertical: 24,
    gap: 38,
  },

  pageContentCompact: {
    paddingHorizontal: 26,
    paddingVertical: 14,
    gap: 24,
  },

  formScroll: {
    flex: 1,
    maxWidth: 510,
    minWidth: 350,
  },

  formScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  formScrollContentCompact: {
    paddingBottom: 14,
  },

  hero: {
    flex: 0,
    width: '42%',
    maxWidth: 460,
    minWidth: 280,
    alignItems: 'flex-start',
  },

  heroCompact: {
    maxWidth: 390,
  },

  logo: {
    width: 330,
    height: 120,
    alignSelf: 'flex-start',
    marginLeft: -18,
    marginBottom: 4,
  },

  logoCompact: {
    width: 270,
    height: 92,
  },

  heroEyebrow: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    marginTop: 9,
  },

  heroTitleCompact: {
    fontSize: 30,
    lineHeight: 32,
  },

  heroText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    maxWidth: 370,
    marginTop: 12,
  },

  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 8,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  statusText: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  formPanel: {
    width: '100%',
    flex: 0,
    maxWidth: 510,
    minWidth: 350,
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(13,15,19,0.93)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },

  formPanelCompact: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  panelAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ACCENT,
  },

  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },

  panelHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  panelBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: 10,
  },

  panelEyebrow: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.2,
  },

  panelTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    marginTop: 4,
  },

  driverBadge: {
    width: 49,
    height: 49,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(97,231,255,0.42)',
    backgroundColor: 'rgba(97,231,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  driverBadgeTop: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  driverBadgeBottom: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: -1,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginVertical: 16,
  },

  fieldBlock: {
    marginBottom: 14,
  },

  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  fieldLabel: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  fieldCounter: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 9,
    fontWeight: '800',
  },

  validationState: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  validationStateOk: {
    color: ACCENT,
  },

  inputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },

  inputShellFocused: {
    borderColor: 'rgba(97,231,255,0.72)',
    backgroundColor: 'rgba(97,231,255,0.07)',
  },

  inputShellError: {
    borderColor: 'rgba(255,69,58,0.82)',
  },

  inputPrefix: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },

  mailIcon: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 10,
  },

  input: {
    flex: 1,
    paddingVertical: 0,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  hintText: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
    marginTop: 6,
  },

  errorText: {
    color: '#FF6B63',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    marginTop: 6,
  },

  submitButton: {
    minHeight: 58,
    marginTop: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(97,231,255,0.70)',
    backgroundColor: 'rgba(97,231,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  submitButtonInactive: {
    opacity: 0.48,
  },

  submitCornerLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 2,
    backgroundColor: ACCENT,
  },

  submitCornerRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 2,
    backgroundColor: ACCENT,
  },

  submitKicker: {
    color: ACCENT,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 2.1,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginTop: 2,
  },

  submitArrow: {
    position: 'absolute',
    right: 17,
    color: ACCENT,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -2,
  },

  localNote: {
    color: 'rgba(255,255,255,0.27)',
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 10,
  },
  wfLogo: { width: 58, height: 58, flexShrink: 0, opacity: 1 },
});
