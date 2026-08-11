import { useAudioPlayer } from 'expo-audio';
import {
    useCallback,
    useRef,
} from 'react';

type SfxPlayer =
  ReturnType<typeof useAudioPlayer>;

const playFromStart = (
  player: SfxPlayer,
  volume = 1,
) => {
  void player
    .seekTo(0)
    .then(() => {
      player.volume = volume;
      player.play();
    })
    .catch(error => {
      console.warn(
        '[RaceSfx] Falha ao tocar áudio:',
        error,
      );
    });
};

/* =========================================================
   TRANSIÇÃO: MAPA -> RESULTADO
========================================================= */

export function useRaceFinishSfx() {
  const finishWhoosh =
    useAudioPlayer(
      require(
        '@/assets/audio/race/finish_whoosh.mp3',
      ),
    );

  const resultScan =
    useAudioPlayer(
      require(
        '@/assets/audio/race/result_scan.mp3',
      ),
    );

  const resultConfirm =
    useAudioPlayer(
      require(
        '@/assets/audio/race/result_confirm.mp3',
      ),
    );

  const playFinishWhoosh =
    useCallback(() => {
      playFromStart(
        finishWhoosh,
        0.85,
      );
    }, [finishWhoosh]);

  const playResultScan =
    useCallback(() => {
      playFromStart(
        resultScan,
        0.7,
      );
    }, [resultScan]);

  const playResultConfirm =
    useCallback(() => {
      playFromStart(
        resultConfirm,
        0.85,
      );
    }, [resultConfirm]);

  return {
    playFinishWhoosh,
    playResultScan,
    playResultConfirm,
  };
}

/* =========================================================
   TELA DE CONQUISTA
========================================================= */

export function useRaceResultSfx() {
  const carArrival =
    useAudioPlayer(
      require(
        '@/assets/audio/race/car_arrive.mp3',
      ),
    );

  /*
   * Pool de ticks.
   *
   * Como os contadores podem pedir sons
   * muito próximos, usamos 3 players.
   */
  const tick1 =
    useAudioPlayer(
      require(
        '@/assets/audio/race/reward_tick.mp3',
      ),
    );

  const tick2 =
    useAudioPlayer(
      require(
        '@/assets/audio/race/reward_tick.mp3',
      ),
    );

  const tick3 =
    useAudioPlayer(
      require(
        '@/assets/audio/race/reward_tick.mp3',
      ),
    );

  const rewardComplete =
    useAudioPlayer(
      require(
        '@/assets/audio/race/reward_complete.mp3',
      ),
    );

  const rareUnlock =
    useAudioPlayer(
      require(
        '@/assets/audio/race/unlock_rare.mp3',
      ),
    );

  const victory =
    useAudioPlayer(
      require(
        '@/assets/audio/race/victory_sting.mp3',
      ),
    );

  const tickPlayersRef =
    useRef([
      tick1,
      tick2,
      tick3,
    ]);

  tickPlayersRef.current = [
    tick1,
    tick2,
    tick3,
  ];

  const nextTickRef =
    useRef(0);

  /*
   * Evita uma metralhadora sonora
   * caso vários contadores atualizem
   * praticamente juntos.
   */
  const lastTickAtRef =
    useRef(0);

  const playCarArrival =
    useCallback(() => {
      playFromStart(
        carArrival,
        0.8,
      );
    }, [carArrival]);

  const playRewardTick =
    useCallback(() => {
      const now = Date.now();

      /*
       * Máximo de aproximadamente
       * 16 ticks por segundo.
       */
      if (
        now -
          lastTickAtRef.current <
        60
      ) {
        return;
      }

      lastTickAtRef.current =
        now;

      const players =
        tickPlayersRef.current;

      const player =
        players[
          nextTickRef.current
        ];

      nextTickRef.current =
        (
          nextTickRef.current +
          1
        ) %
        players.length;

      playFromStart(
        player,
        0.38,
      );
    }, []);

  const playRewardComplete =
    useCallback(() => {
      playFromStart(
        rewardComplete,
        0.7,
      );
    }, [rewardComplete]);

  const playRareUnlock =
    useCallback(() => {
      playFromStart(
        rareUnlock,
        0.9,
      );
    }, [rareUnlock]);

  const playVictory =
    useCallback(() => {
      playFromStart(
        victory,
        0.9,
      );
    }, [victory]);

  return {
    playCarArrival,

    playRewardTick,
    playRewardComplete,

    playRareUnlock,
    playVictory,
  };
}