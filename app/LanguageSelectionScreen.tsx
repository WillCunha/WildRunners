import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLanguage } from '@/context/LanguageContext';

import type { SupportedLanguage } from '@/src/i18n';

export default function LanguageSelectionScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const { language, setLanguage, isLoading, t } = useLanguage();

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>(language);

  const [saving, setSaving] =
    useState(false);

  /*
   * Quando o LanguageContext terminar de
   * detectar o idioma do aparelho,
   * atualizamos a opção pré-selecionada.
   */
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  async function handleContinue() {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await setLanguage(selectedLanguage);

      const nextScreen =
        params.next === '/CarSelectionScreen'
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.logo}>
          WILD RUNNERS
        </Text>

        <Text style={styles.title}>
          {t('language.title')}
        </Text>

        <Text style={styles.subtitle}>
          {t('language.subtitle')}
        </Text>

        <View style={styles.languages}>

          <LanguageOption
            flag="🇧🇷"
            label="Português"
            selected={
              selectedLanguage === 'pt-BR'
            }
            onPress={() =>
              setSelectedLanguage('pt-BR')
            }
          />

          <LanguageOption
            flag="🇺🇸"
            label="English"
            selected={
              selectedLanguage === 'en'
            }
            onPress={() =>
              setSelectedLanguage('en')
            }
          />

        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.continueText}>
              {t('language.continue')}
            </Text>
          )}
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

interface LanguageOptionProps {
  flag: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function LanguageOption({
  flag,
  label,
  selected,
  onPress,
}: LanguageOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageOption,

        selected &&
        styles.languageOptionSelected,

        pressed &&
        styles.buttonPressed,
      ]}
    >
      <Text style={styles.flag}>
        {flag}
      </Text>

      <Text style={styles.languageName}>
        {label}
      </Text>

      <View
        style={[
          styles.radio,

          selected &&
          styles.radioSelected,
        ]}
      >
        {selected && (
          <View style={styles.radioDot} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 28,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 48,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: '#B8C0CC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 32,
  },

  languages: {
    gap: 14,
  },

  languageOption: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#394150',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#1F2937',
  },

  languageOptionSelected: {
    borderColor: '#FFFFFF',
  },

  flag: {
    fontSize: 30,
    marginRight: 16,
  },

  languageName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8A94A3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioSelected: {
    borderColor: '#FFFFFF',
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },

  continueButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },

  continueText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});