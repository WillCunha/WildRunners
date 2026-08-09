import { CardSfx, CardSfxOptions, useCardSfx } from '@/src/utils/cardSfx';
import { useAudioPlayer } from 'expo-audio';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';

type MusicOptions = {
  volume?: number;
  loop?: boolean;
  restart?: boolean;
};

interface AudioContextProps {
  playMusic: (source: any, options?: MusicOptions) => void;
  pauseMusic: () => void;
  stopMusic: () => void;
  playBeep: () => void;
  playCardSfx: (
    sfx: CardSfx,
    options?: CardSfxOptions
  ) => void;

  stopCardSfx: (
    sfx: CardSfx
  ) => void;

  stopAllCardSfx: () => void;
}

export const AudioContext = createContext<AudioContextProps>({
  playMusic: () => { },
  pauseMusic: () => { },
  stopMusic: () => { },
  playBeep: () => { },
  playCardSfx: () => { },
  stopCardSfx: () => { },
  stopAllCardSfx: () => { },
});

export const AudioProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  /*
   * Existe apenas um player para todas as músicas:
   * dashboard, corrida, menus etc.
   */
  const musicPlayer = useAudioPlayer(null);

  const musicPlayerRef = useRef(musicPlayer);
  musicPlayerRef.current = musicPlayer;

  const currentMusicSourceRef = useRef<any>(null);

  const {
    playCardSfx,
    stopCardSfx,
    stopAllCardSfx,
  } = useCardSfx();

  // Bipes da largada.
  const beepPlayer1 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );

  const beepPlayer2 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );

  const beepPlayer3 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );

  const beepPlayersRef = useRef([
    beepPlayer1,
    beepPlayer2,
    beepPlayer3,
  ]);

  beepPlayersRef.current = [
    beepPlayer1,
    beepPlayer2,
    beepPlayer3,
  ];

  const nextBeepRef = useRef(0);

  const swapPlayer = useAudioPlayer(
    require('@/assets/audio/cards/swap.mp3')
  );

  const swapPlayerRef = useRef(swapPlayer);
  swapPlayerRef.current = swapPlayer;

  const playMusic = useCallback(
    (source: any, options: MusicOptions = {}) => {
      const player = musicPlayerRef.current;

      const {
        volume = 0.15,
        loop = true,
        restart = false,
      } = options;

      const isNewSource =
        currentMusicSourceRef.current !== source;

      if (isNewSource) {
        player.pause();
        player.replace(source);

        currentMusicSourceRef.current = source;
      } else if (restart) {
        void player.seekTo(0);
      }

      player.loop = loop;
      player.volume = volume;
      player.play();
    },
    []
  );

  const pauseMusic = useCallback(() => {
    musicPlayerRef.current.pause();
  }, []);

  const stopMusic = useCallback(() => {
    const player = musicPlayerRef.current;

    player.pause();
    void player.seekTo(0);
  }, []);

  const playBeep = useCallback(() => {
    const players = beepPlayersRef.current;
    const activePlayer = players[nextBeepRef.current];

    nextBeepRef.current =
      (nextBeepRef.current + 1) % players.length;

    void activePlayer.seekTo(0);
    activePlayer.play();
  }, []);

  const playSwap = useCallback(() => {
    const player = swapPlayerRef.current;

    /*
     * Sempre reinicia no começo para que cada uso da carta
     * tenha o "suction whoosh" completo.
     */
    void player.seekTo(0)
      .then(() => {
        player.volume = 0.8;
        player.play();
      })
      .catch((error) => {
        console.warn(
          '[AudioContext] Falha ao tocar SFX do Swap:',
          error
        );
      });
  }, []);

  const contextValue = useMemo(
    () => ({
      playMusic,
      pauseMusic,
      stopMusic,
      playBeep,

      playCardSfx,
      stopCardSfx,
      stopAllCardSfx,
    }),
    [
      playMusic,
      pauseMusic,
      stopMusic,
      playBeep,

      playCardSfx,
      stopCardSfx,
      stopAllCardSfx,
    ]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};
