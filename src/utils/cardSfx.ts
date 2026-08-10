import { useAudioPlayer } from 'expo-audio';
import { useCallback, useMemo } from 'react';

/**
 * Todos os efeitos sonoros de cartas do Wild Runners.
 *
 * Quando criarmos uma carta nova, basta:
 * 1. adicionar o nome aqui;
 * 2. criar o player;
 * 3. colocar no objeto players;
 * 4. definir o volume padrão.
 */
export type CardSfx =
  | 'swap'
  | 'tntExplosion'
  | 'tntFuse'
  | 'nitro'
  | 'slow'
  | 'tornado'
  | 'chainsLaunch'
  | 'chainsHit';

export type CardSfxOptions = {
  /**
   * Volume específico desta reprodução.
   * 0 = mudo
   * 1 = máximo
   */
  volume?: number;

  /**
   * Reinicia o áudio desde o começo.
   *
   * Para SFX de cartas normalmente queremos true.
   */
  restart?: boolean;
};

/**
 * Volume padrão individual de cada efeito.
 *
 * Assim podemos balancear os sons sem precisar
 * editar cada lugar que chama playCardSfx().
 */
const DEFAULT_VOLUMES: Record<CardSfx, number> = {
  swap: 0.8,

  tntExplosion: 1,
  tntFuse: 0.65,

  nitro: 0.85,
  slow: 0.75,

  tornado: 0.8,

  chainsLaunch: 0.8,
  chainsHit: 0.9,
};

const clampVolume = (volume: number) => {
  return Math.max(0, Math.min(1, volume));
};

export function useCardSfx() {
  /*
   * Cada SFX possui seu próprio player.
   *
   * Não reutilizamos o player da música.
   * Música e efeitos precisam ser independentes.
   */

  const swapPlayer = useAudioPlayer(
    require('@/assets/audio/cards/swap.mp3')
  );

  const tntExplosionPlayer = useAudioPlayer(
    require('@/assets/audio/cards/tnt_explosion.mp3')
  );

//   const tntFusePlayer = useAudioPlayer(
//     require('@/assets/audio/cards/tnt_fuse.mp3')
//   );

  const nitroPlayer = useAudioPlayer(
    require('@/assets/audio/cards/nitro.mp3')
  );

  const slowPlayer = useAudioPlayer(
    require('@/assets/audio/cards/slow.mp3')
  );

  const tornadoPlayer = useAudioPlayer(
    require('@/assets/audio/cards/tornado.mp3')
  );

  const chainsLaunchPlayer = useAudioPlayer(
    require('@/assets/audio/cards/chains_launch.mp3')
  );

//   const chainsHitPlayer = useAudioPlayer(
//     require('@/assets/audio/cards/chains_hit.mp3')
//   );

  /*
   * Mapeia o nome lógico da carta para o player.
   *
   * A partir daqui, quem usa o sistema não precisa
   * saber onde está o arquivo MP3 nem qual player existe.
   */
  const players = useMemo(
    () => ({
      swap: swapPlayer,

      tntExplosion: tntExplosionPlayer,
    //   tntFuse: tntFusePlayer,

      nitro: nitroPlayer,
      slow: slowPlayer,

      tornado: tornadoPlayer,

      chainsLaunch: chainsLaunchPlayer,
    //   chainsHit: chainsHitPlayer,
    }),
    [
      swapPlayer,
      tntExplosionPlayer,
    //   tntFusePlayer,
      nitroPlayer,
      slowPlayer,
      tornadoPlayer,
      chainsLaunchPlayer,
    //   chainsHitPlayer,
    ]
  );

  /**
   * Reproduz qualquer SFX de carta.
   *
   * Exemplo:
   *
   * playCardSfx('swap');
   * playCardSfx('nitro');
   * playCardSfx('tntExplosion', { volume: 1 });
   */
  const playCardSfx = useCallback(
    (
      sfx: CardSfx,
      options: CardSfxOptions = {}
    ) => {
      const player = players[sfx];

      if (!player) {
        console.warn(
          `[cardSfx] Player não encontrado para: ${sfx}`
        );

        return;
      }

      const {
        volume = DEFAULT_VOLUMES[sfx],
        restart = true,
      } = options;

      player.volume = clampVolume(volume);

      /*
       * Para SFX normalmente queremos começar sempre
       * desde o primeiro frame do áudio.
       */
      if (restart) {
        void player
          .seekTo(0)
          .then(() => {
            player.play();
          })
          .catch((error) => {
            console.warn(
              `[cardSfx] Falha ao tocar "${sfx}":`,
              error
            );
          });

        return;
      }

      try {
        player.play();
      } catch (error) {
        console.warn(
          `[cardSfx] Falha ao tocar "${sfx}":`,
          error
        );
      }
    },
    [players]
  );

  /**
   * Para um efeito específico.
   */
  const stopCardSfx = useCallback(
    (sfx: CardSfx) => {
      const player = players[sfx];

      if (!player) return;

      try {
        player.pause();

        void player.seekTo(0).catch(() => {});
      } catch (error) {
        console.warn(
          `[cardSfx] Falha ao parar "${sfx}":`,
          error
        );
      }
    },
    [players]
  );

  /**
   * Para todos os efeitos.
   *
   * Pode ser útil no Game Over,
   * saída da corrida etc.
   */
  const stopAllCardSfx = useCallback(() => {
    Object.values(players).forEach((player) => {
      try {
        player.pause();

        void player.seekTo(0).catch(() => {});
      } catch {
        // Ignora player que já esteja indisponível.
      }
    });
  }, [players]);

  return {
    playCardSfx,
    stopCardSfx,
    stopAllCardSfx,
  };
}