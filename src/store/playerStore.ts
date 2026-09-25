import {
  CarPaintConfiguration,
  CarStat,
  CarUpgrades,
  CustomizationPurchaseResult,
  EquipmentSlot,
  MatchRewards,
  PartCategory,
  PlayerProfile,
  PlayerUnlocks,
} from '@/src/types/playerTypes';

import { MAX_DECK_SIZE, STARTER_CARD_IDS, getCardDefinition } from '@/src/utils/cardMap';
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



export type CardPurchaseResult =
  | 'purchased'
  | 'no_profile'
  | 'invalid_card'
  | 'already_owned'
  | 'level_locked'
  | 'insufficient_chips';

// Os CHIPS pertencem à carteira do perfil, sem mudar os tipos de peças/
// upgrades já utilizados no restante do jogo. A próxima revisão de playerTypes
// pode incorporar `chips: number` diretamente em PlayerParts.
type PlayerProfileWithChips = PlayerProfile & {
  parts: PlayerProfile['parts'] & { chips: number };
};

const STARTER_CHIPS = 100;
const normalizeChips = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
    : fallback;

type UnlockCategory = keyof PlayerUnlocks;

type PlayerState = {
  profile: PlayerProfileWithChips | null;

  /**
   * Controle LOCAL para impedir que a mesma corrida
   * entregue recompensas mais de uma vez.
   *
   * Futuramente isso será responsabilidade do servidor.
   */
  processedRaceIds: string[];

  // Inventário de cartas: profile.unlocks.cards. Este campo guarda só os IDs equipados.
  equippedDeck: string[];

  unlockCard: (cardId: string) => boolean;
  purchaseCard: (cardId: string) => CardPurchaseResult;
  addChips: (amount: number) => void;
  setEquippedDeck: (cardIds: string[]) => boolean;

  resetProfile: () => void;

  createProfile: (username: string, email: string) => void;

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

  applyCarPaint: (
    carId: string,
    paint: CarPaintConfiguration,
    requiredLevel: number,
    cost: number,
  ) => CustomizationPurchaseResult;

  purchaseAndEquipEquipment: (
    carId: string,
    slot: EquipmentSlot,
    itemId: string,
    requiredLevel: number,
    cost: number,
  ) => CustomizationPurchaseResult;

  setEquippedEquipment: (
    carId: string,
    slot: EquipmentSlot,
    itemId: string | null,
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

  customization: {
    paint: {
      primaryColor: '#FF3B30',
      secondaryColor: '#FF3B30',
      finishId: 'solid',
    },
    equipment: {
      frontBumper: null,
      rearBumper: null,
      spoiler: null,
      sideSkirt: null,
    },
    ownedEquipment: [],
  },
});

const createBaseUnlocks = (): PlayerUnlocks => ({
  maps: [],
  cards: [...STARTER_CARD_IDS],
  achievements: [],
});

/** Consolida cartas iniciais e desbloqueios legados, sem duplicar IDs. */
const normalizeOwnedCards = (value: unknown): string[] => {
  const saved = Array.isArray(value) ? value : [];
  return [...new Set([
    ...STARTER_CARD_IDS,
    ...saved.filter((id): id is string => typeof id === 'string' && !!getCardDefinition(id)),
  ])];
};

/** Um deck equipado nunca pode incluir IDs inválidos ou cartas não possuídas. */
const normalizeEquippedDeck = (value: unknown, ownedCards: readonly string[]): string[] => {
  const proposed = Array.isArray(value) ? value : [];
  const unique = [...new Set(proposed)];
  if (
    unique.length !== MAX_DECK_SIZE ||
    unique.some(id => typeof id !== 'string' || !ownedCards.includes(id) || !getCardDefinition(id))
  ) return [...STARTER_CARD_IDS];
  return unique;
};

const sanitizeReward = (value: number) =>
  Math.max(0, Math.floor(value));


const isValidHexColor = (value: string) =>
  /^#[0-9A-Fa-f]{6}$/.test(value);

const normalizeCustomization = (car: any): CarUpgrades => ({
  ...car,
  spray: {
    rarityLevel: Math.max(1, Math.floor(car?.spray?.rarityLevel ?? 1)),
    unlockedSkins: Array.isArray(car?.spray?.unlockedSkins)
      ? car.spray.unlockedSkins
      : ['default'],
  },
  customization: {
    paint: {
      primaryColor: isValidHexColor(car?.customization?.paint?.primaryColor)
        ? car.customization.paint.primaryColor.toUpperCase()
        : '#FF3B30',
      secondaryColor: isValidHexColor(car?.customization?.paint?.secondaryColor)
        ? car.customization.paint.secondaryColor.toUpperCase()
        : '#FF3B30',
      finishId: ['solid', 'metallic', 'matte', 'pearlescent'].includes(
        car?.customization?.paint?.finishId,
      )
        ? car.customization.paint.finishId
        : 'solid',
    },
    equipment: {
      frontBumper: car?.customization?.equipment?.frontBumper ?? null,
      rearBumper: car?.customization?.equipment?.rearBumper ?? null,
      spoiler: car?.customization?.equipment?.spoiler ?? null,
      sideSkirt: car?.customization?.equipment?.sideSkirt ?? null,
    },
    ownedEquipment: Array.isArray(car?.customization?.ownedEquipment)
      ? car.customization.ownedEquipment
      : [],
  },
});

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profile: null,

      processedRaceIds: [],
      equippedDeck: [],

      createProfile: (username, email) => {
        const now = Date.now();

        const safeUsername = username.trim();
        const safeEmail = email.trim().toLowerCase();

        set({
          profile: {
            id: Math.random()
              .toString(36)
              .substring(2, 15),

            username: safeUsername,
            email: safeEmail,

            trophies: 0,
            xp: 0,

            parts: {
              motor: 100,
              spray: 100,
              engrenagem: 100,
              chips: STARTER_CHIPS,
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
          equippedDeck: [...STARTER_CARD_IDS],
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

            email:
              currentProfile?.email ??
              '',

            trophies: 0,
            xp: 0,

            parts: {
              motor: 100,
              spray: 100,
              engrenagem: 100,
              chips: STARTER_CHIPS,
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
          equippedDeck: [...STARTER_CARD_IDS],
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
                ...state.profile.parts, // preserva CHIPS nas operações legadas
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
                ...state.profile.parts, // preserva CHIPS nas operações legadas
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
                ...state.profile.parts, // preserva CHIPS nas operações legadas
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

      // Crédito de CHIPS (ex.: recompensa de corrida, missão, evento).
      // A fonte que concede a recompensa deve validá-la; em online, servidor.
      addChips: amount => {
        if (!Number.isFinite(amount)) return;
        const credit = Math.floor(amount);
        if (credit <= 0) return;
        set(state => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              parts: {
                ...state.profile.parts,
                chips: Math.min(Number.MAX_SAFE_INTEGER, normalizeChips(state.profile.parts.chips) + credit),
              },
              updatedAt: Date.now(),
            },
          };
        });
      },

      // Transação local síncrona: saldo + desbloqueio mudam no mesmo set().
      // Não recebe preço/nível da interface: consulta valores oficiais do cardMap.
      purchaseCard: cardId => {
        let result: CardPurchaseResult = 'invalid_card';
        const definition = getCardDefinition(cardId);
        if (!definition) return result;

        set(state => {
          const profile = state.profile;
          if (!profile) {
            result = 'no_profile';
            return state;
          }
          const owned = profile.unlocks?.cards ?? [];
          if (owned.includes(cardId)) {
            result = 'already_owned';
            return state;
          }
          if (getPlayerLevel(profile.xp ?? 0) < definition.requiredLevel) {
            result = 'level_locked';
            return state;
          }
          const balance = normalizeChips(profile.parts?.chips);
          if (balance < definition.purchasePrice) {
            result = 'insufficient_chips';
            return state;
          }
          result = 'purchased';
          return {
            profile: {
              ...profile,
              parts: {
                ...profile.parts,
                chips: balance - definition.purchasePrice,
              },
              unlocks: {
                ...profile.unlocks,
                cards: [...owned, cardId],
              },
              updatedAt: Date.now(),
            },
          };
        });
        return result;
      },

      unlockCard: (cardId) => {
        if (!getCardDefinition(cardId)) return false;
        return get().unlockItem('cards', cardId);
      },

      setEquippedDeck: (cardIds) => {
        const profile = get().profile;
        if (!profile || !Array.isArray(cardIds)) return false;
        const owned = new Set(profile.unlocks?.cards ?? []);
        if (
          cardIds.length !== MAX_DECK_SIZE ||
          new Set(cardIds).size !== MAX_DECK_SIZE ||
          cardIds.some(id => typeof id !== 'string' || !getCardDefinition(id) || !owned.has(id))
        ) return false;
        set(state => {
          const currentOwned = new Set(state.profile?.unlocks?.cards ?? []);
          if (
            !state.profile ||
            cardIds.some(id => !currentOwned.has(id))
          ) return state;
          return { equippedDeck: [...cardIds] };
        });
        return true;
      },

      unlockItem: (
        category,
        itemId,
      ) => {
        const safeId = itemId.trim();

        if (!safeId) return false;
        if (category === 'cards' && !getCardDefinition(safeId)) return false;

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

      applyCarPaint: (carId, paint, requiredLevel, cost) => {
        const { profile } = get();
        if (!profile) return 'no_profile';

        const car = profile.garage?.[carId];
        if (!car) return 'car_not_owned';

        if (!isValidHexColor(paint.primaryColor) || !isValidHexColor(paint.secondaryColor)) {
          return 'invalid';
        }

        const safeRequiredLevel = Math.max(1, Math.floor(requiredLevel));
        if (getPlayerLevel(profile.xp ?? 0) < safeRequiredLevel) {
          return 'level_locked';
        }

        const safeCost = Math.max(0, Math.floor(cost));
        const previous = normalizeCustomization(car).customization.paint;
        const normalizedPaint: CarPaintConfiguration = {
          primaryColor: paint.primaryColor.toUpperCase(),
          secondaryColor: paint.secondaryColor.toUpperCase(),
          finishId: paint.finishId,
        };

        if (
          previous.primaryColor === normalizedPaint.primaryColor &&
          previous.secondaryColor === normalizedPaint.secondaryColor &&
          previous.finishId === normalizedPaint.finishId
        ) {
          return 'equipped';
        }

        if (profile.parts.spray < safeCost) return 'insufficient_spray';

        set(state => {
          if (!state.profile) return state;
          const current = state.profile.garage?.[carId];
          if (!current || state.profile.parts.spray < safeCost) return state;
          const normalized = normalizeCustomization(current);

          return {
            profile: {
              ...state.profile,
              parts: {
                ...state.profile.parts,
                spray: state.profile.parts.spray - safeCost,
              },
              garage: {
                ...state.profile.garage,
                [carId]: {
                  ...normalized,
                  customization: {
                    ...normalized.customization,
                    paint: normalizedPaint,
                  },
                },
              },
              updatedAt: Date.now(),
            },
          };
        });

        return 'success';
      },

      purchaseAndEquipEquipment: (carId, slot, itemId, requiredLevel, cost) => {
        const { profile } = get();
        if (!profile) return 'no_profile';
        const car = profile.garage?.[carId];
        if (!car || !itemId.trim()) return car ? 'invalid' : 'car_not_owned';

        const safeRequiredLevel = Math.max(1, Math.floor(requiredLevel));
        if (getPlayerLevel(profile.xp ?? 0) < safeRequiredLevel) return 'level_locked';

        const normalized = normalizeCustomization(car);
        const alreadyOwned = normalized.customization.ownedEquipment.includes(itemId);
        const safeCost = alreadyOwned ? 0 : Math.max(0, Math.floor(cost));
        if (profile.parts.spray < safeCost) return 'insufficient_spray';

        set(state => {
          if (!state.profile) return state;
          const current = state.profile.garage?.[carId];
          if (!current || state.profile.parts.spray < safeCost) return state;
          const nextCar = normalizeCustomization(current);
          const owned = nextCar.customization.ownedEquipment.includes(itemId)
            ? nextCar.customization.ownedEquipment
            : [...nextCar.customization.ownedEquipment, itemId];

          return {
            profile: {
              ...state.profile,
              parts: {
                ...state.profile.parts,
                spray: state.profile.parts.spray - safeCost,
              },
              garage: {
                ...state.profile.garage,
                [carId]: {
                  ...nextCar,
                  customization: {
                    ...nextCar.customization,
                    ownedEquipment: owned,
                    equipment: {
                      ...nextCar.customization.equipment,
                      [slot]: itemId,
                    },
                  },
                },
              },
              updatedAt: Date.now(),
            },
          };
        });

        return alreadyOwned ? 'equipped' : 'success';
      },

      setEquippedEquipment: (carId, slot, itemId) => {
        const { profile } = get();
        if (!profile) return false;
        const car = profile.garage?.[carId];
        if (!car) return false;
        const normalized = normalizeCustomization(car);
        if (itemId && !normalized.customization.ownedEquipment.includes(itemId)) return false;

        set(state => {
          if (!state.profile) return state;
          const current = state.profile.garage?.[carId];
          if (!current) return state;
          const nextCar = normalizeCustomization(current);
          return {
            profile: {
              ...state.profile,
              garage: {
                ...state.profile.garage,
                [carId]: {
                  ...nextCar,
                  customization: {
                    ...nextCar.customization,
                    equipment: {
                      ...nextCar.customization.equipment,
                      [slot]: itemId,
                    },
                  },
                },
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
      version: 8,

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
            equippedDeck: [],
            processedRaceIds: persistedState.processedRaceIds ?? [],
          };
        }

        const ownedCards = normalizeOwnedCards(profile.unlocks?.cards);
        const now = Date.now();

        return {
          ...persistedState,

          equippedDeck: normalizeEquippedDeck(persistedState.equippedDeck, ownedCards),

          profile: {
            ...profile,

            email:
              typeof profile.email === 'string'
                ? profile.email.trim().toLowerCase()
                : '',

            xp: Math.max(
              0,
              Math.floor(profile.xp ?? 0),
            ),

            // Perfil anterior à v8: recebe 100 CHIPS iniciais uma única vez.
            // Saldo de engrenagens é preservado, sem conversão ou desconto.
            parts: {
              ...profile.parts,
              chips: normalizeChips(profile.parts?.chips, STARTER_CHIPS),
            },

            garage: Object.fromEntries(
              Object.entries(profile.garage ?? {}).map(([carId, car]) => [
                carId,
                normalizeCustomization(car),
              ]),
            ),

            unlocks: {
              maps:
                profile.unlocks
                  ?.maps ?? [],

              cards: ownedCards,

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