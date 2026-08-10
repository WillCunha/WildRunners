import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  tip: string;
  showLoading: (tip?: string) => void;
  hideLoading: () => void;
}

const TIPS = [
  "Use suas cartas de corrida no momento certo para virar o jogo!",
  "Gatos correm mais rápido, mas cachorros têm mais resistência?",
  "Preparando os motores e embaralhando o deck...",
  "Dica: Curvas fechadas exigem mais controle!",
];

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: true,
  tip: TIPS[0],
  showLoading: () => set({ 
    isLoading: true, 
    tip: TIPS[Math.floor(Math.random() * TIPS.length)] 
  }),
  hideLoading: () => set({ isLoading: false }),
}));