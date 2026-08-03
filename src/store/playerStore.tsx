import { PlayerProfile } from '@/src/types/playerTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CarStat =
  | 'speedLevel'
  | 'accelerationLevel'
  | 'jumpPowerLevel'
  | 'defenseLevel'
  | 'rarityLevel';

type PartCategory = 'motor' | 'spray' | 'engrenagem';

type MatchRewards = {
  motor: number;
  spray: number;
  engrenagem: number;
  trophies: number;
};

type GarageCar = {
  motor: {
    speedLevel: number;
    accelerationLevel: number;
    jumpPowerLevel: number;
  };
  spray: {
    rarityLevel: number;
    unlockedSkins: string[];
  };
  engrenagem: {
    defenseLevel: number;
  };
};

type PlayerState = {
  profile: PlayerProfile | null;
  createProfile: (username: string) => void;
  addTrophies: (amount: number) => void;
  addParts: (motor: number, spray: number, engrenagem: number) => void;
  addMatchRewards: (rewards: MatchRewards) => void;
  buyCar: (carId: string, requiredTier: number, cost: number) => boolean;
  upgradeCar: (
    carId: string,
    partCategory: PartCategory,
    stat: CarStat,
    cost: number,
  ) => boolean;
};

const createBaseGarageCar = (): GarageCar => ({
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

const getPlayerTier = (trophies: number) => {
  if (trophies >= 600) return 4;
  if (trophies >= 300) return 3;
  if (trophies >= 100) return 2;
  return 1;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profile: null,

      createProfile: username =>
        set({
          profile: {
            id: Math.random().toString(36).substring(2, 15),
            username,
            trophies: 0,
            parts: {
              motor: 100,
              spray: 100,
              engrenagem: 100,
            },
            garage: {
              // O Buggy continua sendo o veículo inicial do jogador.
              buggy: createBaseGarageCar(),
            },
          },
        }),

      addTrophies: amount =>
        set(state => {
          if (!state.profile) return state;

          return {
            profile: {
              ...state.profile,
              trophies: Math.max(0, state.profile.trophies + Math.floor(amount)),
            },
          };
        }),

      addParts: (motor, spray, engrenagem) =>
        set(state => {
          if (!state.profile) return state;

          return {
            profile: {
              ...state.profile,
              parts: {
                motor: Math.max(0, state.profile.parts.motor + Math.floor(motor)),
                spray: Math.max(0, state.profile.parts.spray + Math.floor(spray)),
                engrenagem: Math.max(
                  0,
                  state.profile.parts.engrenagem + Math.floor(engrenagem),
                ),
              },
            },
          };
        }),

      addMatchRewards: ({ motor, spray, engrenagem, trophies }) =>
        set(state => {
          if (!state.profile) return state;

          const safeMotor = Math.max(0, Math.floor(motor));
          const safeSpray = Math.max(0, Math.floor(spray));
          const safeEngrenagem = Math.max(0, Math.floor(engrenagem));
          const safeTrophies = Math.max(0, Math.floor(trophies));

          return {
            profile: {
              ...state.profile,
              trophies: state.profile.trophies + safeTrophies,
              parts: {
                motor: state.profile.parts.motor + safeMotor,
                spray: state.profile.parts.spray + safeSpray,
                engrenagem: state.profile.parts.engrenagem + safeEngrenagem,
              },
            },
          };
        }),

      buyCar: (carId, requiredTier, cost) => {
        const { profile } = get();
        if (!profile) return false;

        const safeCost = Math.max(0, Math.floor(cost));
        const safeRequiredTier = Math.max(1, Math.floor(requiredTier));
        const playerTier = getPlayerTier(profile.trophies);
        const isAlreadyOwned = profile.garage?.[carId] !== undefined;

        if (isAlreadyOwned) return false;
        if (safeRequiredTier > playerTier) return false;
        if (profile.parts.engrenagem < safeCost) return false;

        set(state => {
          if (!state.profile) return state;

          // Revalida dentro do set para evitar compras duplicadas em toques rápidos.
          if (state.profile.garage?.[carId] !== undefined) return state;
          if (state.profile.parts.engrenagem < safeCost) return state;

          return {
            profile: {
              ...state.profile,
              parts: {
                ...state.profile.parts,
                engrenagem: state.profile.parts.engrenagem - safeCost,
              },
              garage: {
                ...state.profile.garage,
                [carId]: createBaseGarageCar(),
              },
            },
          };
        });

        return true;
      },

      upgradeCar: (carId, partCategory, stat, cost) => {
        const { profile } = get();
        if (!profile) return false;

        const car = profile.garage?.[carId];
        const safeCost = Math.max(0, Math.floor(cost));
        const currentBalance = profile.parts[partCategory];

        if (!car || currentBalance < safeCost) return false;

        set(state => {
          if (!state.profile) return state;

          const currentCar = state.profile.garage?.[carId];
          if (!currentCar) return state;

          const updatedCar = JSON.parse(JSON.stringify(currentCar));

          if (partCategory === 'motor') updatedCar.motor[stat] += 1;
          if (partCategory === 'engrenagem') updatedCar.engrenagem[stat] += 1;
          if (partCategory === 'spray') updatedCar.spray[stat] += 1;

          return {
            profile: {
              ...state.profile,
              parts: {
                ...state.profile.parts,
                [partCategory]: currentBalance - safeCost,
              },
              garage: {
                ...state.profile.garage,
                [carId]: updatedCar,
              },
            },
          };
        });

        return true;
      },
    }),
    {
      name: 'wild-runners-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
