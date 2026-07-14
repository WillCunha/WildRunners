import { useAudioPlayer } from 'expo-audio';
import React, { createContext, ReactNode, useEffect, useRef, useState } from 'react';

interface AudioContextProps {
  playMusic: (source: any) => void;
  pauseMusic: () => void;
  playBeep: () => void;
  //playGo: () => void;
}

export const AudioContext = createContext<AudioContextProps>({
  playMusic: () => {},
  pauseMusic: () => {},
  playBeep: () => {},
  //playGo: () => {},
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [musicSource, setMusicSource] = useState<any>(null);
  const bgMusic = useAudioPlayer(musicSource);
  
  // 1. POOL DE BIPES: Criamos 3 players independentes apontando para o mesmo arquivo
  const beepPlayer1 = useAudioPlayer(require('@/assets/audio/beep.mp3'));
  const beepPlayer2 = useAudioPlayer(require('@/assets/audio/beep.mp3'));
  const beepPlayer3 = useAudioPlayer(require('@/assets/audio/beep.mp3'));
  
  //const goSound = useAudioPlayer(require('@/assets/audio/go.mp3'));

  const nextBeepRef = useRef(1);

  useEffect(() => {
    if (bgMusic && musicSource) {
      bgMusic.loop = true;
      bgMusic.volume = 0.15;
      bgMusic.play();
    }
  }, [bgMusic, musicSource]);

  const playMusic = (source: any) => {
    if (musicSource === source) {
      if (bgMusic) bgMusic.play();
      return;
    }
    if (bgMusic) {
      bgMusic.pause();
    }
    setMusicSource(source);
  };

  const pauseMusic = () => {
    if (bgMusic) {
      bgMusic.pause();
    }
  };

  const playBeep = () => {
    let activePlayer;

    if (nextBeepRef.current === 1) {
      activePlayer = beepPlayer1;
      nextBeepRef.current = 2;
    } else if (nextBeepRef.current === 2) {
      activePlayer = beepPlayer2;
      nextBeepRef.current = 3;
    } else {
      activePlayer = beepPlayer3;
      nextBeepRef.current = 1; 
    }

    if (activePlayer) {
      activePlayer.seekTo(0); 
      activePlayer.play();    
    }
  };

  // const playGo = () => {
  //   if (goSound) {
  //     goSound.seekTo(0);
  //     goSound.play();
  //   }
  // };

  return (
    <AudioContext.Provider value={{ playMusic, pauseMusic, playBeep }}>
      {children}
    </AudioContext.Provider>
  );
};