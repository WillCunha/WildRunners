import { useAudioPlayer } from 'expo-audio';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';

const DASHBOARD_MUSIC = require(
  '@/assets/audio/dashboard/audio_one.mp3'
);

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
   * A fonte passada ao hook nunca muda.
   * As outras músicas são carregadas com replace().
   */
  const musicPlayer = useAudioPlayer(DASHBOARD_MUSIC);

  const currentMusicSourceRef = useRef<any>(DASHBOARD_MUSIC);
  const isMusicPlayingRef = useRef(false);

  const beepPlayer1 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );
  const beepPlayer2 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );
  const beepPlayer3 = useAudioPlayer(
    require('@/assets/audio/beep.mp3')
  );

  const beepPlayers = useMemo(
    () => [beepPlayer1, beepPlayer2, beepPlayer3],
    [beepPlayer1, beepPlayer2, beepPlayer3]
  );

  const nextBeepRef = useRef(0);

  const playMusic = useCallback(
    (source: any, options: MusicOptions = {}) => {
      const {
        volume = 0.15,
        loop = true,
        restart = false,
      } = options;

      const sourceChanged =
        currentMusicSourceRef.current !== source;

      /*
       * replace() já interrompe a fonte anterior.
       * Não chamamos pause() antes da troca.
       */
      if (sourceChanged) {
        musicPlayer.replace(source);
        currentMusicSourceRef.current = source;
      }

      musicPlayer.volume = volume;
      musicPlayer.loop = loop;

      if (restart && !sourceChanged) {
        void musicPlayer
          .seekTo(0)
          .then(() => {
            musicPlayer.play();
            isMusicPlayingRef.current = true;
          })
          .catch((error) => {
            console.warn(
              '[AudioContext] Falha ao reiniciar música:',
              error
            );
          });

        return;
      }

      musicPlayer.play();
      isMusicPlayingRef.current = true;
    },
    [musicPlayer]
  );

  const pauseMusic = useCallback(() => {
    /*
     * Impede duas chamadas seguidas de pause().
     * Isso também protege a desmontagem das telas.
     */
    if (!isMusicPlayingRef.current) return;

    isMusicPlayingRef.current = false;
    musicPlayer.pause();
  }, [musicPlayer]);

  const stopMusic = useCallback(() => {
    if (isMusicPlayingRef.current) {
      isMusicPlayingRef.current = false;
      musicPlayer.pause();
    }

    void musicPlayer.seekTo(0).catch((error) => {
      console.warn(
        '[AudioContext] Falha ao retornar música ao início:',
        error
      );
    });
  }, [musicPlayer]);

  const playBeep = useCallback(() => {
    const activePlayer =
      beepPlayers[nextBeepRef.current];

    nextBeepRef.current =
      (nextBeepRef.current + 1) % beepPlayers.length;

    void activePlayer
      .seekTo(0)
      .then(() => activePlayer.play())
      .catch((error) => {
        console.warn(
          '[AudioContext] Falha ao tocar bipe:',
          error
        );
      });
  }, [beepPlayers]);

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
