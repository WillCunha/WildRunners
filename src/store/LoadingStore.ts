import {
  getRandomLoadingTipKey,
  LOADING_TIP_KEYS,
  LoadingTipKey,
} from '@/src/utils/loadingTips';

import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;

  tipKey: LoadingTipKey;

  showLoading: (
    tipKey?: LoadingTipKey
  ) => void;

  hideLoading: () => void;
}

export const useLoadingStore =
  create<LoadingState>((set) => ({
    isLoading: true,

    tipKey: LOADING_TIP_KEYS[0],

    showLoading: (tipKey) =>
      set({
        isLoading: true,

        tipKey:
          tipKey ??
          getRandomLoadingTipKey(),
      }),

    hideLoading: () =>
      set({
        isLoading: false,
      }),
  }));