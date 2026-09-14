import { create } from 'zustand';

type ShowLoadingOptions = {
  tip?: string;
  completed?: number;
  total?: number;
};

interface LoadingState {
  isLoading: boolean;
  tip: string;

  completed: number;
  total: number;
  progress: number;
  hasMeasuredProgress: boolean;

  showLoading: (
    options?: string | ShowLoadingOptions,
  ) => void;

  setLoadingProgress: (
    completed: number,
    total: number,
  ) => void;

  hideLoading: () => void;
}

const TIPS = [
  'Use suas cartas no momento certo para virar a corrida!',
  'Sobreviva até o fim para manter os recursos coletados.',
  'Engrenagens ajudam a desbloquear e melhorar veículos.',
  'Cada corrida pode exigir uma estratégia diferente.',
];

function clampProgress(
  completed: number,
  total: number,
) {
  if (total <= 0) return 0;

  return Math.max(
    0,
    Math.min(1, completed / total),
  );
}

export const useLoadingStore =
  create<LoadingState>((set) => ({
    isLoading: true,
    tip: TIPS[0],

    completed: 0,
    total: 0,
    progress: 0,
    hasMeasuredProgress: false,

    showLoading: options =>
      set(() => {
        const parsedOptions =
          typeof options === 'string'
            ? { tip: options }
            : options ?? {};

        const completed = Math.max(
          0,
          parsedOptions.completed ?? 0,
        );

        const total = Math.max(
          0,
          parsedOptions.total ?? 0,
        );

        return {
          isLoading: true,

          tip:
            parsedOptions.tip ??
            TIPS[
              Math.floor(
                Math.random() * TIPS.length,
              )
            ],

          completed,
          total,

          progress: clampProgress(
            completed,
            total,
          ),

          hasMeasuredProgress: total > 0,
        };
      }),

    setLoadingProgress: (
      completed,
      total,
    ) =>
      set({
        completed: Math.max(0, completed),
        total: Math.max(0, total),

        progress: clampProgress(
          completed,
          total,
        ),

        hasMeasuredProgress: total > 0,
      }),

    // Não força 100%.
    // Quem carrega os arquivos é responsável por informar 100% real.
    hideLoading: () =>
      set({
        isLoading: false,
      }),
  }));
