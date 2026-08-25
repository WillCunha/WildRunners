import {
  CarStat,
  CarUpgrades,
  MatchRewards,
  PartCategory,
  PlayerProfile,
  PlayerUnlocks,
} from '@/src/types/playerTypes';

import { getPlayerLevel } from '@/src/utils/progression';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

type RaceRewardStatus =
  | 'applied'
  | 'already_processed'
  | 'no_profile'
  | 'invalid_race';



type UnlockCategory = keyof PlayerUnlocks;

type PlayerState = {
  profile: PlayerProfile | null;

  /**
   * Controle LOCAL para impedir que a mesma corrida
   * entregue recompensas mais de uma vez.
   *
   * Futuramente isso será responsabilidade do servidor.
   */
  processedRaceIds: string[];

  resetProfile: () => void;

  createProfile: (username: string) => void;

  addTrophies: (amount: number) => void;

  addParts: (
    motor: number,
    spray: number,
    engrenagem: number,
  ) => void;

  /**
   * Mantido para compatibilidade com o código atual.
   */
  addMatchRewards: (rewards: MatchRewards) => void;

  /**
   * Método novo.
   *
   * Esse será usado pela nova tela/serviço
   * de resultado da corrida.
   */
  applyMatchRewardsOnce: (
    raceId: string,
    rewards: MatchRewards,
  ) => RaceRewardStatus;

  unlockItem: (
    category: UnlockCategory,
    itemId: string,
  ) => boolean;

  buyCar: (
    carId: string,
    requiredTier: number,
    cost: number,
  ) => boolean;

  upgradeCar: (
    carId: string,
    partCategory: PartCategory,
    stat: CarStat,
    cost: number,
  ) => boolean;
};

const createBaseGarageCar = (): CarUpgrades => ({
  motor: {
    speedLevel: 1,
    accelerationLevel: 1,
    jumpPowerLevel: 1,
  },

  spray: {
    rarityLevel: 1,
    unlockedSkins: ['default'],
  },

  engrenagem: {
    defenseLevel: 1,
  },
});

const createBaseUnlocks = (): PlayerUnlocks => ({
  maps: [],
  cards: [],
  achievements: [],
});

const sanitizeReward = (value: number) =>
  Math.max(0, Math.floor(value));

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profile: null,

      processedRaceIds: [],

      createProfile: username => {
        const now = Date.now();

        set({
          profile: {
            id: Math.random()
              .toString(36)
              .substring(2, 15),

            username,

            trophies: 0,
            xp: 0,

            parts: {
              motor: 100,
              spray: 100,
              engrenagem: 100,
            },

            garage: {
              // Continua sendo o veículo inicial.
              buggy: createBaseGarageCar(),
            },

            unlocks: createBaseUnlocks(),

            createdAt: now,
            updatedAt: now,
          },

          processedRaceIds: [],
        });
      },

      resetProfile: () => {
        const currentProfile =
          get().profile;

        const now = Date.now();

        set({
          profile: {
            id:
              currentProfile?.id ??
              Math.random()
                .toString(36)
                .substring(2, 15),

            username:
              currentProfile?.username ??
              'PLAYER',

            trophies: 0,
            xp: 0,

            parts: {
              motor: 100,
              spray: 100,
              engrenagem: 100,
            },

            garage: {
              buggy:
                createBaseGarageCar(),
            },

            unlocks:
              createBaseUnlocks(),

            createdAt: now,
            updatedAt: now,
          },

          processedRaceIds: [],
        });
      },

      addTrophies: amount =>
        set(state => {
          if (!state.profile) return state;

          return {
            profile: {
              ...state.profile,

              trophies: Math.max(
                0,
                state.profile.trophies +
                Math.floor(amount),
              ),

              updatedAt: Date.now(),
            },
          };
        }),

      addParts: (
        motor,
        spray,
        engrenagem,
      ) =>
        set(state => {
          if (!state.profile) return state;

          return {
            profile: {
              ...state.profile,

              parts: {
                motor: Math.max(
                  0,
                  state.profile.parts.motor +
                  Math.floor(motor),
                ),

                spray: Math.max(
                  0,
                  state.profile.parts.spray +
                  Math.floor(spray),
                ),

                engrenagem: Math.max(
                  0,
                  state.profile.parts.engrenagem +
                  Math.floor(engrenagem),
                ),
              },

              updatedAt: Date.now(),
            },
          };
        }),

      /**
       * MÉTODO LEGADO.
       *
       * Continua existindo para não quebrar
       * código que já utiliza addMatchRewards().
       */
      addMatchRewards: rewards =>
        set(state => {
          if (!state.profile) return state;

          const safeMotor =
            sanitizeReward(rewards.motor);

          const safeSpray =
            sanitizeReward(rewards.spray);

          const safeEngrenagem =
            sanitizeReward(rewards.engrenagem);

          const safeTrophies =
            sanitizeReward(rewards.trophies);

          const safeXp =
            sanitizeReward(rewards.xp ?? 0);

          return {
            profile: {
              ...state.profile,

              trophies:
                state.profile.trophies +
                safeTrophies,

              xp:
                (state.profile.xp ?? 0) +
                safeXp,

              parts: {
                motor:
                  state.profile.parts.motor +
                  safeMotor,

                spray:
                  state.profile.parts.spray +
                  safeSpray,

                engrenagem:
                  state.profile.parts.engrenagem +
                  safeEngrenagem,
              },

              updatedAt: Date.now(),
            },
          };
        }),

      /**
       * NOVO MÉTODO.
       *
       * Recompensa uma corrida apenas uma vez.
       */
      applyMatchRewardsOnce: (
        raceId,
        rewards,
      ) => {
        const safeRaceId = raceId.trim();

        if (!safeRaceId) {
          return 'invalid_race';
        }

        const {
          profile,
          processedRaceIds,
        } = get();

        if (!profile) {
          return 'no_profile';
        }

        if (
          processedRaceIds.includes(
            safeRaceId,
          )
        ) {
          return 'already_processed';
        }

        const safeMotor =
          sanitizeReward(rewards.motor);

        const safeSpray =
          sanitizeReward(rewards.spray);

        const safeEngrenagem =
          sanitizeReward(
            rewards.engrenagem,
          );

        const safeTrophies =
          sanitizeReward(
            rewards.trophies,
          );

        const safeXp =
          sanitizeReward(
            rewards.xp ?? 0,
          );

        set(state => {
          if (!state.profile) {
            return state;
          }

          /**
           * Revalidação.
           */
          if (
            state.processedRaceIds.includes(
              safeRaceId,
            )
          ) {
            return state;
          }

          return {
            profile: {
              ...state.profile,

              trophies:
                state.profile.trophies +
                safeTrophies,

              xp:
                (state.profile.xp ?? 0) +
                safeXp,

              parts: {
                motor:
                  state.profile.parts.motor +
                  safeMotor,

                spray:
                  state.profile.parts.spray +
                  safeSpray,

                engrenagem:
                  state.profile.parts
                    .engrenagem +
                  safeEngrenagem,
              },

              updatedAt: Date.now(),
            },

            processedRaceIds: [
              ...state.processedRaceIds,
              safeRaceId,
            ].slice(-500),
          };
        });

        return 'applied';
      },

      unlockItem: (
        category,
        itemId,
      ) => {
        const safeId = itemId.trim();

        if (!safeId) return false;

        const { profile } = get();

        if (!profile) return false;

        const currentItems =
          profile.unlocks?.[category] ?? [];

        if (
          currentItems.includes(safeId)
        ) {
          return false;
        }

        set(state => {
          if (!state.profile) {
            return state;
          }

          const items =
            state.profile.unlocks?.[
            category
            ] ?? [];

          if (items.includes(safeId)) {
            return state;
          }

          return {
            profile: {
              ...state.profile,

              unlocks: {
                ...state.profile.unlocks,

                [category]: [
                  ...items,
                  safeId,
                ],
              },

              updatedAt: Date.now(),
            },
          };
        });

        return true;
      },

      buyCar: (
        carId,
        requiredTier,
        cost,
      ) => {
        const { profile } = get();

        if (!profile) return false;

        const safeCost =
          Math.max(
            0,
            Math.floor(cost),
          );

        const safeRequiredTier =
          Math.max(
            1,
            Math.floor(requiredTier),
          );

        const playerTier =
          getPlayerLevel(
            profile.xp ?? 0,
          );

        const isAlreadyOwned =
          profile.garage?.[carId] !==
          undefined;

        if (isAlreadyOwned) {
          return false;
        }

        if (
          safeRequiredTier >
          playerTier
        ) {
          return false;
        }

        if (
          profile.parts.engrenagem <
          safeCost
        ) {
          return false;
        }

        set(state => {
          if (!state.profile) {
            return state;
          }

          if (
            state.profile.garage?.[
            carId
            ] !== undefined
          ) {
            return state;
          }

          if (
            state.profile.parts
              .engrenagem <
            safeCost
          ) {
            return state;
          }

          return {
            profile: {
              ...state.profile,

              parts: {
                ...state.profile.parts,

                engrenagem:
                  state.profile.parts
                    .engrenagem -
                  safeCost,
              },

              garage: {
                ...state.profile.garage,

                [carId]:
                  createBaseGarageCar(),
              },

              updatedAt: Date.now(),
            },
          };
        });

        return true;
      },

      upgradeCar: (
        carId,
        partCategory,
        stat,
        cost,
      ) => {
        const { profile } = get();

        if (!profile) return false;

        const car =
          profile.garage?.[carId];

        const safeCost =
          Math.max(
            0,
            Math.floor(cost),
          );

        if (!car) return false;

        /**
         * Proteção contra combinações
         * inválidas de categoria/stat.
         */
        const validStat =
          partCategory === 'motor'
            ? [
              'speedLevel',
              'accelerationLevel',
              'jumpPowerLevel',
            ].includes(stat)
            : partCategory ===
              'engrenagem'
              ? stat ===
              'defenseLevel'
              : stat ===
              'rarityLevel';

        if (!validStat) {
          return false;
        }

        if (
          profile.parts[
          partCategory
          ] < safeCost
        ) {
          return false;
        }

        set(state => {
          if (!state.profile) {
            return state;
          }

          const currentCar =
            state.profile.garage?.[
            carId
            ];

          if (!currentCar) {
            return state;
          }

          const currentBalance =
            state.profile.parts[
            partCategory
            ];

          /**
           * Revalida o saldo dentro
           * do próprio set().
           */
          if (
            currentBalance <
            safeCost
          ) {
            return state;
          }

          const updatedCar:
            CarUpgrades =
            JSON.parse(
              JSON.stringify(
                currentCar,
              ),
            );

          if (
            partCategory === 'motor'
          ) {
            const motorStat =
              stat as
              | 'speedLevel'
              | 'accelerationLevel'
              | 'jumpPowerLevel';

            updatedCar.motor[
              motorStat
            ] += 1;
          }

          if (
            partCategory ===
            'engrenagem'
          ) {
            updatedCar.engrenagem
              .defenseLevel += 1;
          }

          if (
            partCategory === 'spray'
          ) {
            updatedCar.spray
              .rarityLevel += 1;
          }

          return {
            profile: {
              ...state.profile,

              parts: {
                ...state.profile.parts,

                [partCategory]:
                  currentBalance -
                  safeCost,
              },

              garage: {
                ...state.profile.garage,

                [carId]:
                  updatedCar,
              },

              updatedAt: Date.now(),
            },
          };
        });

        return true;
      },
    }),

    {
      name:
        'wild-runners-player-storage',

      /**
       * Começamos a versionar o save.
       */
      version: 3,

      storage:
        createJSONStorage(
          () => AsyncStorage,
        ),

      /**
       * Faz saves antigos continuarem funcionando.
       */
      migrate: (
        persistedState: any,
        version,
      ) => {
        if (!persistedState) {
          return persistedState;
        }

        const profile =
          persistedState.profile;

        if (!profile) {
          return {
            ...persistedState,

            processedRaceIds:
              persistedState
                .processedRaceIds ??
              [],
          };
        }

        const now = Date.now();

        return {
          ...persistedState,

          profile: {
            ...profile,

            xp: Math.max(
              0,
              Math.floor(profile.xp ?? 0),
            ),

            unlocks: {
              maps:
                profile.unlocks
                  ?.maps ?? [],

              cards:
                profile.unlocks
                  ?.cards ?? [],

              achievements:
                profile.unlocks
                  ?.achievements ??
                [],
            },

            createdAt:
              profile.createdAt ??
              now,

            updatedAt:
              profile.updatedAt ??
              now,
          },

          processedRaceIds:
            persistedState
              .processedRaceIds ??
            [],
        };
      },
    },
  ),
);