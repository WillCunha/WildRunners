// store/usePlayerStore.ts
import { PlayerProfile } from '@/src/types/playerTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CarStat = 'speedLevel' | 'accelerationLevel' | 'jumpPowerLevel' | 'defenseLevel' | 'rarityLevel';

interface PlayerState {
    buyCar: any;
    profile: PlayerProfile | null;

    // Ações do Banco Interno
    createProfile: (username: string) => void;
    addTrophies: (amount: number) => void;
    addParts: (motor: number, spray: number, engrenagem: number) => void;
    upgradeCar: (carId: string, partCategory: 'motor' | 'spray' | 'engrenagem', stat: CarStat, cost: number) => boolean;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            profile: null,

            createProfile: (username) => set({
                profile: {
                    id: Math.random().toString(36).substring(2, 15), // Gerador simples de ID local
                    username,
                    trophies: 0,
                    parts: {
                        motor: 100,
                        spray: 100,
                        engrenagem: 100
                    },
                    garage: {
                        // Inicia com o carrinho de Nível 1 desbloqueado
                        buggy: {
                            motor: { speedLevel: 1, accelerationLevel: 1, jumpPowerLevel: 1 },
                            spray: { rarityLevel: 1, unlockedSkins: ['default'] },
                            engrenagem: { defenseLevel: 1 }
                        }
                    }
                }
            }),

            addTrophies: (amount) => set((state) => {
                if (!state.profile) return state;
                return {
                    profile: { ...state.profile, trophies: state.profile.trophies + amount }
                };
            }),

            addParts: (motor, spray, engrenagem) => set((state) => {
                if (!state.profile) return state;
                return {
                    profile: {
                        ...state.profile,
                        parts: {
                            motor: state.profile.parts.motor + motor,
                            spray: state.profile.parts.spray + spray,
                            engrenagem: state.profile.parts.engrenagem + engrenagem,
                        }
                    }
                };
            }),

            buyCar: (carId: string, tier: number, cost: number) => {
                const { profile } = get();

                // Verifica se tem perfil e se tem peças suficientes (ex: engrenagem)
                if (!profile || profile.parts.engrenagem < cost) return false;

                set((state) => {
                    const prevProfile = state.profile!;

                    return {
                        profile: {
                            ...prevProfile,
                            parts: {
                                ...prevProfile.parts,
                                engrenagem: prevProfile.parts.engrenagem - cost // Debita o valor
                            },
                            garage: {
                                ...prevProfile.garage,
                                [carId]: {
                                    // INICIALIZA OS STATUS DO CARRO NOVO AQUI
                                    motor: { speedLevel: 1, accelerationLevel: 1, jumpPowerLevel: 1 },
                                    spray: { rarityLevel: 1, unlockedSkins: ['default'] },
                                    engrenagem: { defenseLevel: 1 }
                                }
                            }
                        }
                    };
                });
                return true;
            },

            upgradeCar: (carId, partCategory, stat, cost) => {
                const { profile } = get();
                if (!profile) return false;

                const currentBalance = profile.parts[partCategory];

                if (currentBalance >= cost) {
                    set((state) => {
                        const prevProfile = state.profile!;
                        const car = prevProfile.garage[carId];

                        // Copia o carro para não mutar o estado diretamente
                        const updatedCar = JSON.parse(JSON.stringify(car));

                        // Aplica o +1 no status correto
                        if (partCategory === 'motor') updatedCar.motor[stat] += 1;
                        if (partCategory === 'engrenagem') updatedCar.engrenagem[stat] += 1;
                        if (partCategory === 'spray') updatedCar.spray[stat] += 1;

                        return {
                            profile: {
                                ...prevProfile,
                                parts: {
                                    ...prevProfile.parts,
                                    [partCategory]: currentBalance - cost // Deduz o valor
                                },
                                garage: {
                                    ...prevProfile.garage,
                                    [carId]: updatedCar
                                }
                            }
                        };
                    });
                    return true;
                }
                return false;
            }
        }),

        {
            name: 'wild-runners-player-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);