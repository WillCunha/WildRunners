import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    detectDeviceLanguage,
    i18n,
    isSupportedLanguage,
    setI18nLanguage,
    SupportedLanguage,
} from '@/src/i18n';

const LANGUAGE_STORAGE_KEY =
  '@wild-runners:language';

interface LanguageContextData {
  language: SupportedLanguage;

  /**
   * true quando estamos lendo o idioma salvo
   * no AsyncStorage.
   */
  isLoading: boolean;

  /**
   * false significa que o jogador nunca
   * confirmou um idioma.
   */
  hasSelectedLanguage: boolean;

  /**
   * Salva e aplica um novo idioma.
   */
  setLanguage: (
    language: SupportedLanguage
  ) => Promise<void>;

  /**
   * Função utilizada pelas telas.
   *
   * Ex:
   * t('common.play')
   */
  t: (
    key: string,
    options?: Record<string, unknown>
  ) => string;
}

const LanguageContext =
  createContext<LanguageContextData | undefined>(
    undefined
  );

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguageState] =
    useState<SupportedLanguage>(() =>
      detectDeviceLanguage()
    );

  const [
    hasSelectedLanguage,
    setHasSelectedLanguage,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  async function loadLanguage() {
    try {
      const savedLanguage =
        await AsyncStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

      /*
       * O jogador já escolheu o idioma
       * anteriormente.
       */
      if (isSupportedLanguage(savedLanguage)) {
        setI18nLanguage(savedLanguage);
        setLanguageState(savedLanguage);
        setHasSelectedLanguage(true);

        return;
      }

      /*
       * Primeira abertura.
       *
       * Detectamos o idioma apenas para
       * pré-selecionar uma opção.
       *
       * NÃO salvamos ainda.
       */
      const deviceLanguage =
        detectDeviceLanguage();

      setI18nLanguage(deviceLanguage);
      setLanguageState(deviceLanguage);
      setHasSelectedLanguage(false);
    } catch (error) {
      console.error(
        'Erro ao carregar idioma:',
        error
      );

      const fallbackLanguage =
        detectDeviceLanguage();

      setI18nLanguage(fallbackLanguage);
      setLanguageState(fallbackLanguage);
      setHasSelectedLanguage(false);
    } finally {
      setIsLoading(false);
    }
  }

  const setLanguage = useCallback(
    async (
      newLanguage: SupportedLanguage
    ) => {
      try {
        await AsyncStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          newLanguage
        );

        setI18nLanguage(newLanguage);
        setLanguageState(newLanguage);
        setHasSelectedLanguage(true);
      } catch (error) {
        console.error(
          'Erro ao salvar idioma:',
          error
        );
      }
    },
    []
  );

  const t = useCallback(
    (
      key: string,
      options?: Record<string, unknown>
    ) => {
      return i18n.t(
        key,
        options as any
      );
    },

    [language]
  );

  const value =
    useMemo<LanguageContextData>(
      () => ({
        language,
        isLoading,
        hasSelectedLanguage,
        setLanguage,
        t,
      }),
      [
        language,
        isLoading,
        hasSelectedLanguage,
        setLanguage,
        t,
      ]
    );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage deve ser usado dentro de LanguageProvider'
    );
  }

  return context;
}