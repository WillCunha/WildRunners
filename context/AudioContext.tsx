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
}

export const AudioContext = createContext<AudioContextProps>({
  playMusic: () => {},
  pauseMusic: () => {},
  stopMusic: () => {},
  playBeep: () => {},
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

  const contextValue = useMemo(
    () => ({
      playMusic,
      pauseMusic,
      stopMusic,
      playBeep,
    }),
    [playMusic, pauseMusic, stopMusic, playBeep]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};