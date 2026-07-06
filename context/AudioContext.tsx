import { useAudioPlayer } from 'expo-audio';
import React, { createContext, ReactNode } from 'react';

interface AudioContextProps {
  playMusic: () => void;
  pauseMusic: () => void;
}

export const AudioContext = createContext<AudioContextProps>({
  playMusic: () => {},
  pauseMusic: () => {},
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  // O expo-audio já carrega o asset local imediatamente
  const player = useAudioPlayer(require('@/assets/audio/wild_runners_main_title.mp3'));

  const playMusic = () => {
    if (player) {
      player.loop = true;
      player.volume = 0.4; // Ajuste o volume inicial aqui
      player.play();
    }
  };

  const pauseMusic = () => {
    if (player) {
      player.pause();
    }
  };

  return (
    <AudioContext.Provider value={{ playMusic, pauseMusic }}>
      {children}
    </AudioContext.Provider>
  );
};