import { useLanguage } from '@/context/LanguageContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
  const { height } = useWindowDimensions();
  const { t } = useLanguage();

  const createProfile = usePlayerStore(
    state => state.createProfile,
  );

  const isCompactLandscape = height < 430;

  const [username, setUsername] =
    useState('');
  const [email, setEmail] =
    useState('');

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
    usernameIsValid && emailIsValid;

  const handleRegister = () => {
    setUsernameTouched(true);
    setEmailTouched(true);

    if (!formIsValid) {
      return;
    }

    createProfile(
      safeUsername,
      safeEmail,
    );

    router.replace(
      '/CarSelectionScreen',
    );
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
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isCompactLandscape &&
                styles.scrollContentCompact,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.hero,
                isCompactLandscape &&
                  styles.heroCompact,
              ]}
            >
              <Image
                source={require(
                  '@/assets/images/gameLogoV5.png'
                )}
                resizeMode="contain"
                style={[
                  styles.logo,
                  isCompactLandscape &&
                    styles.logoCompact,
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
                {t('registration.heroTitle')}
              </Text>

              <Text style={styles.heroText}>
                {t('registration.heroText')}
              </Text>

              <View style={styles.heroStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {t('registration.localProfile')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.formPanel,
                isCompactLandscape &&
                  styles.formPanelCompact,
              ]}
            >
              <View style={styles.panelAccent} />

              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelEyebrow}>
                    {t('registration.newDriver')}
                  </Text>

                  <Text style={styles.panelTitle}>
                    {t('registration.createIdentity')}
                  </Text>
                </View>

                <View style={styles.driverBadge}>
                  <Text style={styles.driverBadgeTop}>
                    WR
                  </Text>
                  <Text style={styles.driverBadgeBottom}>
                    01
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

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
                    onChangeText={setEmail}
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
                    onSubmitEditing={
                      handleRegister
                    }
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

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleRegister}
                style={[
                  styles.submitButton,
                  !formIsValid &&
                    styles.submitButtonInactive,
                ]}
              >
                <View style={styles.submitCornerLeft} />
                <View style={styles.submitCornerRight} />

                <Text style={styles.submitKicker}>
                  {t('registration.driverReady')}
                </Text>
                <Text style={styles.submitText}>
                  {t('registration.startAdventure')}
                </Text>

                <Text style={styles.submitArrow}>
                  ››
                </Text>
              </TouchableOpacity>

              <Text style={styles.localNote}>
                {t('registration.localNote')}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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

  scrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 42,
    paddingVertical: 24,
    gap: 38,
  },

  scrollContentCompact: {
    paddingHorizontal: 26,
    paddingVertical: 14,
    gap: 24,
  },

  hero: {
    flex: 0.9,
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
    flex: 1,
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
});
