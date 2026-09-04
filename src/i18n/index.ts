import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './translations/enUS';
import es from './translations/es';
import ptBR from './translations/ptBR';

export const SUPPORTED_LANGUAGES = [
  'pt-BR',
  'en',
  'es',
] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE:
  SupportedLanguage = 'pt-BR';

export const i18n = new I18n({
  'pt-BR': ptBR,

  pt: ptBR,

  en,

  es,
});

i18n.defaultLocale =
  DEFAULT_LANGUAGE;

i18n.enableFallback = true;

export function detectDeviceLanguage():
  SupportedLanguage {
  const locale =
    getLocales()[0];

  const languageCode =
    locale?.languageCode;

  if (languageCode === 'pt') {
    return 'pt-BR';
  }

  if (languageCode === 'es') {
    return 'es';
  }

  return 'en';
}

export function setI18nLanguage(
  language: SupportedLanguage,
) {
  i18n.locale = language;
}

export function isSupportedLanguage(
  value: string | null,
): value is SupportedLanguage {
  if (!value) {
    return false;
  }

  return SUPPORTED_LANGUAGES.includes(
    value as SupportedLanguage,
  );
}