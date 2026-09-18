import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TutorialState = {
  completed: boolean;
  hydrated: boolean;
  markCompleted: () => void;
  resetTutorial: () => void;
  setHydrated: (value: boolean) => void;
};

export const useTutorialStore = create<TutorialState>()(
  persist(
    set => ({
      // Default TRUE evita forçar o tutorial em perfis antigos após uma atualização.
      // O RegistrationScreen chama resetTutorial() para todo perfil recém-criado.
      completed: true,
      hydrated: false,

      markCompleted: () =>
        set({ completed: true }),

      resetTutorial: () =>
        set({ completed: false }),

      setHydrated: value =>
        set({ hydrated: value }),
    }),
    {
      name: 'wild-runners-tutorial-storage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
    },
  ),
);
