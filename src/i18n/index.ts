import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from '@/src/i18n/translations/enUS';
import ptBR from '@/src/i18n/translations/ptBR';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en'] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR';

export const i18n = new I18n({
  'pt-BR': ptBR,

  // Permite fallback para português mesmo
  // quando o sistema retornar apenas "pt"
  pt: ptBR,

  en,
});

i18n.defaultLocale = DEFAULT_LANGUAGE;
i18n.enableFallback = true;

/**
 * Detecta qual idioma devemos deixar
 * pré-selecionado na primeira abertura.
 *
 * A escolha ainda será confirmada pelo usuário.
 */
export function detectDeviceLanguage(): SupportedLanguage {
  const locale = getLocales()[0];

  const languageCode = locale?.languageCode;

  if (languageCode === 'pt') {
    return 'pt-BR';
  }

  return 'en';
}

/**
 * Altera o idioma usado pelo i18n.
 */
export function setI18nLanguage(
  language: SupportedLanguage
) {
  i18n.locale = language;
}

/**
 * Verifica se um valor salvo é um idioma válido.
 */
export function isSupportedLanguage(
  value: string | null
): value is SupportedLanguage {
  if (!value) {
    return false;
  }

  return SUPPORTED_LANGUAGES.includes(
    value as SupportedLanguage
  );
}