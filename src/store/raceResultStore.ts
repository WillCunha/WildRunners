import { create } from 'zustand';

import { RaceResult } from '@/src/types/raceTypes';

interface RaceResultState {
  result: RaceResult | null;

  setResult: (
    result: RaceResult,
  ) => void;

  clearResult: () => void;
}

export const useRaceResultStore =
  create<RaceResultState>(set => ({
    result: null,

    setResult: result =>
      set({
        result,
      }),

    clearResult: () =>
      set({
        result: null,
      }),
  }));