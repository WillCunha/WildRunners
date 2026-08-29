import { useLanguage } from '@/context/LanguageContext';
import type { SupportedLanguage } from '@/src/i18n';

import { router, useLocalSearchParams } from 'expo-router';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const ACCENT = '#FFD60A';

export default function LanguageSelectionScreen() {
  const { width, height } = useWindowDimensions();

  const isCompactLandscape = height < 430;

  const params =
    useLocalSearchParams<{
      next?: string;
    }>();

  const {
    language,
    setLanguage,
    isLoading,
    t,
  } = useLanguage();

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState<SupportedLanguage>(
    language,
  );

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  async function handleContinue() {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await setLanguage(
        selectedLanguage,
      );

      const nextScreen =
        params.next ===
          '/CarSelectionScreen'
          ? '/CarSelectionScreen'
          : '/RegistrationScreen';

      router.replace({
        pathname: '/LoadingScreen',

        params: {
          next: nextScreen,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={ACCENT}
        />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require(
        '@/assets/images/components/background/start_screen.png'
      )}
      resizeMode="cover"
      style={styles.background}
    >
      <View
        style={styles.backgroundOverlay}
      />

      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={[
            styles.container,

            isCompactLandscape &&
            styles.containerCompact,
          ]}
        >
          {/* CABEÇALHO */}
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.eyebrow,

                  isCompactLandscape &&
                  styles.eyebrowCompact,
                ]}
              >
                WILD RUNNERS
              </Text>

              <Text
                style={[
                  styles.headerTitle,

                  isCompactLandscape &&
                  styles.headerTitleCompact,
                ]}
              >
                {t('language.title')}
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                {t('language.subtitle')}
              </Text>
            </View>

            <View
              style={
                styles.headerLogoBox
              }
            >
              <Image
                source={require(
                  '@/assets/images/logo1024v1.png'
                )}
                resizeMode="contain"
                style={styles.headerLogo}
              />
            </View>
          </View>

          {/* CONTEÚDO */}
          <View style={styles.mainRow}>
            {/* PAINEL ESQUERDO */}
            <View
              style={styles.introPane}
            >
              <View
                style={
                  styles.decorativeLineOne
                }
              />

              <View
                style={
                  styles.decorativeLineTwo
                }
              />

              <View
                style={styles.introContent}
              >
                <Image
                  source={require(
                    '@/assets/images/gameLogoV5.png'
                  )}
                  resizeMode="contain"
                  style={[
                    styles.gameLogo,

                    isCompactLandscape &&
                    styles.gameLogoCompact,
                  ]}
                />

                <View
                  style={
                    styles.introSeparator
                  }
                />

                <Text
                  style={
                    styles.introLabel
                  }
                >
                  LANGUAGE SETUP
                </Text>

                <Text
                  style={
                    styles.introDescription
                  }
                >
                  WILD RUNNERS
                </Text>

                <View
                  style={styles.languageMarks}
                >
                  <View
                    style={
                      styles.languageMark
                    }
                  >
                    <Text
                      style={
                        styles.languageMarkText
                      }
                    >
                      PT-BR
                    </Text>
                  </View>

                  <View
                    style={
                      styles.languageMark
                    }
                  >
                    <Text
                      style={
                        styles.languageMarkText
                      }
                    >
                      EN
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PAINEL DIREITO */}
            <View
              style={styles.selectionPane}
            >
              <View
                style={styles.selectionHeader}
              >
                <View>
                  <Text
                    style={
                      styles.selectionEyebrow
                    }
                  >
                    PLAYER SETUP
                  </Text>

                  <Text
                    style={
                      styles.selectionTitle
                    }
                  >
                    {t('language.title')}
                  </Text>
                </View>

                <View
                  style={styles.stepBadge}
                >
                  <Text
                    style={
                      styles.stepBadgeLabel
                    }
                  >
                    STEP
                  </Text>

                  <Text
                    style={
                      styles.stepBadgeValue
                    }
                  >
                    01
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.languages
                }
              >
                <LanguageOption
                  flag="🇧🇷"
                  code="PT-BR"
                  label={t(
                    'language.portuguese',
                  )}
                  selected={
                    selectedLanguage ===
                    'pt-BR'
                  }
                  compact={
                    isCompactLandscape
                  }
                  onPress={() =>
                    setSelectedLanguage(
                      'pt-BR',
                    )
                  }
                />

                <LanguageOption
                  flag="🇺🇸"
                  code="EN"
                  label={t(
                    'language.english',
                  )}
                  selected={
                    selectedLanguage ===
                    'en'
                  }
                  compact={
                    isCompactLandscape
                  }
                  onPress={() =>
                    setSelectedLanguage(
                      'en',
                    )
                  }
                />

                <LanguageOption
                  flag="🇪🇸"
                  code="ES"
                  label={t(
                    'language.spanish',
                  )}
                  selected={
                    selectedLanguage === 'es'
                  }
                  compact={
                    isCompactLandscape
                  }
                  onPress={() =>
                    setSelectedLanguage('es')
                  }
                />
              </View>

              <View style={styles.infoBox}>
                <View
                  style={styles.infoDot}
                />

                <Text
                  style={styles.infoText}
                >
                  {t(
                    'language.subtitle',
                  )}
                </Text>
              </View>

              <Pressable
                onPress={handleContinue}
                disabled={saving}
                style={({
                  pressed,
                }) => [
                    styles.continueButton,

                    saving &&
                    styles.continueButtonDisabled,

                    pressed &&
                    !saving &&
                    styles.buttonPressed,
                  ]}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#111113"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.continueText
                      }
                    >
                      {t(
                        'language.continue',
                      )}
                    </Text>

                    <Text
                      style={
                        styles.continueArrow
                      }
                    >
                      →
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

interface LanguageOptionProps {
  flag: string;
  code: string;
  label: string;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
}

function LanguageOption({
  flag,
  code,
  label,
  selected,
  compact,
  onPress,
}: LanguageOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageOption,

        compact &&
        styles.languageOptionCompact,

        selected &&
        styles.languageOptionSelected,

        pressed &&
        styles.buttonPressed,
      ]}
    >
      <View
        style={[
          styles.languageAccent,

          !selected &&
          styles.languageAccentInactive,
        ]}
      />

      <View style={styles.flagBox}>
        <Text style={styles.flag}>
          {flag}
        </Text>
      </View>

      <View
        style={
          styles.languageInfo
        }
      >
        <Text
          style={[
            styles.languageName,

            selected &&
            styles.languageNameSelected,
          ]}
        >
          {label}
        </Text>

        <Text
          style={
            styles.languageCode
          }
        >
          {code}
        </Text>
      </View>

      <View
        style={[
          styles.radio,

          selected &&
          styles.radioSelected,
        ]}
      >
        {selected && (
          <View
            style={styles.radioDot}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    background: {
      flex: 1,
      width: '100%',
      height: '100%',
    },

    backgroundOverlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(10,10,12,0.88)',
    },

    safeArea: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,

      backgroundColor: '#171719',

      alignItems: 'center',
      justifyContent: 'center',
    },

    container: {
      flex: 1,

      paddingHorizontal: 18,
      paddingVertical: 12,
    },

    containerCompact: {
      paddingVertical: 8,
    },

    /*
     * HEADER
     */

    header: {
      minHeight: 72,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'space-between',

      marginBottom: 10,

      paddingHorizontal: 5,
    },

    eyebrow: {
      color: ACCENT,

      fontSize: 10,
      fontWeight: '900',

      letterSpacing: 2.2,
    },

    eyebrowCompact: {
      fontSize: 8,
    },

    headerTitle: {
      color: '#FFFFFF',

      fontSize: 29,
      fontWeight: '900',
      fontStyle: 'italic',

      letterSpacing: 1,

      marginTop: -1,
    },

    headerTitleCompact: {
      fontSize: 23,
    },

    headerSubtitle: {
      color: '#8D8D94',

      fontSize: 10,
      fontWeight: '800',

      marginTop: 2,

      letterSpacing: 0.5,
    },

    headerLogoBox: {
      width: 52,
      height: 52,

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        'rgba(255,214,10,0.35)',

      backgroundColor:
        'rgba(255,214,10,0.06)',

      alignItems: 'center',
      justifyContent: 'center',
    },

    headerLogo: {
      width: 38,
      height: 38,
    },

    /*
     * CONTEÚDO
     */

    mainRow: {
      flex: 1,

      minHeight: 0,

      flexDirection: 'row',

      borderRadius: 18,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        'rgba(255,255,255,0.32)',

      backgroundColor:
        'rgba(23,23,25,0.96)',

      overflow: 'hidden',
    },

    /*
     * ESQUERDA
     */

    introPane: {
      flex: 5.7,

      minWidth: 0,

      alignItems: 'center',
      justifyContent: 'center',

      position: 'relative',

      overflow: 'hidden',

      borderRightWidth:
        StyleSheet.hairlineWidth,

      borderRightColor:
        'rgba(255,255,255,0.28)',

      backgroundColor: '#202024',
    },

    decorativeLineOne: {
      position: 'absolute',

      width: '110%',
      height: 1,

      backgroundColor:
        'rgba(255,255,255,0.07)',

      top: '34%',
      left: '-5%',

      transform: [
        {
          rotate: '-12deg',
        },
      ],
    },

    decorativeLineTwo: {
      position: 'absolute',

      width: '110%',
      height: 1,

      backgroundColor:
        'rgba(255,255,255,0.05)',

      top: '62%',
      left: '-5%',

      transform: [
        {
          rotate: '9deg',
        },
      ],
    },

    introContent: {
      width: '78%',

      alignItems: 'center',
    },

    gameLogo: {
      width: '100%',
      maxWidth: 430,

      height: 150,
    },

    gameLogoCompact: {
      height: 105,
    },

    introSeparator: {
      width: 80,
      height: 3,

      borderRadius: 99,

      backgroundColor: ACCENT,

      marginTop: 8,
      marginBottom: 14,
    },

    introLabel: {
      color:
        'rgba(255,255,255,0.55)',

      fontSize: 9,
      fontWeight: '900',

      letterSpacing: 2,
    },

    introDescription: {
      color: '#FFFFFF',

      fontSize: 17,
      fontWeight: '900',
      fontStyle: 'italic',

      letterSpacing: 1,

      marginTop: 3,
    },

    languageMarks: {
      flexDirection: 'row',

      gap: 7,

      marginTop: 14,
    },

    languageMark: {
      paddingHorizontal: 9,
      paddingVertical: 4,

      borderRadius: 7,

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.16)',

      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    languageMarkText: {
      color:
        'rgba(255,255,255,0.68)',

      fontSize: 7,
      fontWeight: '900',

      letterSpacing: 0.8,
    },

    /*
     * DIREITA
     */

    selectionPane: {
      flex: 4.3,

      minWidth: 0,

      paddingHorizontal: 22,
      paddingVertical: 18,

      justifyContent: 'center',

      backgroundColor:
        'rgba(18,18,20,0.96)',
    },

    selectionHeader: {
      flexDirection: 'row',

      alignItems: 'flex-start',
      justifyContent:
        'space-between',

      marginBottom: 16,
    },

    selectionEyebrow: {
      color: '#85858C',

      fontSize: 8,
      fontWeight: '900',

      letterSpacing: 1.5,
    },

    selectionTitle: {
      color: '#FFFFFF',

      fontSize: 21,
      fontWeight: '900',
      fontStyle: 'italic',

      marginTop: 1,
    },

    stepBadge: {
      minWidth: 46,

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 8,

      borderWidth: 1,

      borderColor:
        'rgba(255,214,10,0.4)',

      backgroundColor:
        'rgba(255,214,10,0.07)',

      alignItems: 'center',
    },

    stepBadgeLabel: {
      color: '#8D8D94',

      fontSize: 6,
      fontWeight: '900',

      letterSpacing: 0.7,
    },

    stepBadgeValue: {
      color: ACCENT,

      fontSize: 13,
      fontWeight: '900',

      marginTop: -1,
    },

    languages: {
      gap: 10,
    },

    languageOption: {
      minHeight: 78,

      flexDirection: 'row',

      alignItems: 'center',

      position: 'relative',

      overflow: 'hidden',

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.14)',

      backgroundColor: '#29292D',

      paddingHorizontal: 13,
      paddingVertical: 10,
    },

    languageOptionCompact: {
      minHeight: 62,

      paddingVertical: 7,
    },

    languageOptionSelected: {
      borderWidth: 2,

      borderColor: ACCENT,

      backgroundColor:
        'rgba(255,214,10,0.09)',
    },

    languageAccent: {
      position: 'absolute',

      left: 0,
      top: 0,
      bottom: 0,

      width: 4,

      backgroundColor: ACCENT,
    },

    languageAccentInactive: {
      opacity: 0.16,
    },

    flagBox: {
      width: 48,
      height: 48,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.11)',

      backgroundColor:
        'rgba(0,0,0,0.17)',

      alignItems: 'center',
      justifyContent: 'center',

      marginRight: 12,
    },

    flag: {
      fontSize: 27,
    },

    languageInfo: {
      flex: 1,

      minWidth: 0,
    },

    languageName: {
      color: '#F4F4F5',

      fontSize: 16,
      fontWeight: '900',
    },

    languageNameSelected: {
      color: ACCENT,
    },

    languageCode: {
      color: '#77777F',

      fontSize: 8,
      fontWeight: '900',

      letterSpacing: 1.2,

      marginTop: 2,
    },

    radio: {
      width: 24,
      height: 24,

      borderRadius: 12,

      borderWidth: 2,

      borderColor: '#63636B',

      alignItems: 'center',
      justifyContent: 'center',

      marginLeft: 10,
    },

    radioSelected: {
      borderColor: ACCENT,
    },

    radioDot: {
      width: 12,
      height: 12,

      borderRadius: 6,

      backgroundColor: ACCENT,
    },

    infoBox: {
      minHeight: 38,

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 12,

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 9,

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.09)',

      backgroundColor:
        'rgba(255,255,255,0.035)',
    },

    infoDot: {
      width: 6,
      height: 6,

      borderRadius: 3,

      backgroundColor: ACCENT,

      marginRight: 8,
    },

    infoText: {
      flex: 1,

      color: '#85858C',

      fontSize: 8,
      fontWeight: '700',

      lineHeight: 11,
    },

    /*
     * CONTINUAR
     */

    continueButton: {
      minHeight: 48,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: 11,

      borderWidth: 2,
      borderColor: ACCENT,

      backgroundColor: ACCENT,

      marginTop: 14,

      paddingHorizontal: 16,
    },

    continueButtonDisabled: {
      opacity: 0.7,
    },

    continueText: {
      color: '#111113',

      fontSize: 11,
      fontWeight: '900',
      fontStyle: 'italic',

      letterSpacing: 0.8,
    },

    continueArrow: {
      position: 'absolute',
      right: 18,

      color: '#111113',

      fontSize: 19,
      fontWeight: '900',
    },

    buttonPressed: {
      opacity: 0.78,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },
  });