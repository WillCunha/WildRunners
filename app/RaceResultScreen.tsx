import Carro from '@/components/Carro';
import { useRaceResultStore } from '@/src/store/raceResultStore';
import { RaceResult, RewardRarity } from '@/src/types/raceTypes';
import { carMaps } from '@/src/utils/carMaps';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, } from 'react';
import { Animated, ImageSourcePropType, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';

type ResultTheme = {
    colors: [
        string,
        string,
        string,
    ];
    glow: string;
};

type RewardCounterProps = {
    icon: string;
    label: string;
    amount: number;
    delay?: number;
};

/**
 * TEMPORÁRIO.
 *
 * Depois conectaremos esta função
 * ao seu carMaps.tsx.
 *
 * Importante:
 * RaceResult continua guardando
 * somente carId.
 */
const getCarImageSource = (
    _carId: string,
): ImageSourcePropType | null => {
    return null;
};

const getHighestRarity = (
    result: RaceResult,
): RewardRarity | null => {
    const priority:
        Record<RewardRarity, number> =
    {
        common: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
    };

    let highest:
        RewardRarity | null =
        null;

    for (
        const unlock of
        result.unlocks
    ) {
        if (!unlock.rarity) {
            continue;
        }

        if (
            !highest ||
            priority[
            unlock.rarity
            ] >
            priority[highest]
        ) {
            highest =
                unlock.rarity;
        }
    }

    return highest;
};

const getResultTheme = (
    result: RaceResult,
): ResultTheme => {
    const rarity =
        getHighestRarity(
            result,
        );

    /**
     * Desbloqueios importantes
     * têm prioridade sobre colocação.
     */
    if (
        rarity === 'legendary'
    ) {
        return {
            colors: [
                '#FFB300',
                '#D85B00',
                '#151515',
            ],

            glow: '#FFB300',
        };
    }

    if (
        rarity === 'epic'
    ) {
        return {
            colors: [
                '#9B3CFF',
                '#D92EDB',
                '#151515',
            ],

            glow: '#B94CFF',
        };
    }

    if (
        rarity === 'rare'
    ) {
        return {
            colors: [
                '#5937D7',
                '#9429A8',
                '#151515',
            ],

            glow: '#8854FF',
        };
    }

    if (
        result.position === 1
    ) {
        return {
            colors: [
                '#FF8A00',
                '#9E3000',
                '#151515',
            ],

            glow: '#FF8A00',
        };
    }

    if (
        result.position === 2
    ) {
        return {
            colors: [
                '#168AFF',
                '#5636A8',
                '#151515',
            ],

            glow: '#4F8CFF',
        };
    }

    if (
        result.position === 3
    ) {
        return {
            colors: [
                '#27AF6A',
                '#087D83',
                '#151515',
            ],

            glow: '#3ACD84',
        };
    }

    return {
        colors: [
            '#343A40',
            '#1D2530',
            '#101010',
        ],

        glow: '#606A78',
    };
};

const getPositionLabel = (
    position: number,
) => {
    if (position === 1) {
        return 'VENCEDOR!';
    }

    return `${position}º LUGAR`;
};

const RewardCounter = ({
    icon,
    label,
    amount,
    delay = 0,
}: RewardCounterProps) => {
    const value =
        useRef(
            new Animated.Value(0),
        ).current;

    const opacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const scale =
        useRef(
            new Animated.Value(
                0.85,
            ),
        ).current;

    const [
        displayedValue,
        setDisplayedValue,
    ] = useState(0);

    useEffect(() => {
        value.setValue(0);
        opacity.setValue(0);
        scale.setValue(0.85);

        const listenerId =
            value.addListener(
                ({ value }) => {
                    setDisplayedValue(
                        Math.floor(value),
                    );
                },
            );

        Animated.sequence([
            Animated.delay(
                delay,
            ),

            Animated.parallel([
                Animated.timing(
                    opacity,
                    {
                        toValue: 1,

                        duration: 250,

                        useNativeDriver:
                            true,
                    },
                ),

                Animated.spring(
                    scale,
                    {
                        toValue: 1,

                        friction: 6,

                        tension: 80,

                        useNativeDriver:
                            true,
                    },
                ),
            ]),

            Animated.timing(
                value,
                {
                    toValue:
                        Math.max(
                            0,
                            amount,
                        ),

                    duration: 900,

                    useNativeDriver:
                        false,
                },
            ),
        ]).start();

        return () => {
            value.removeListener(
                listenerId,
            );
        };
    }, [
        amount,
        delay,
        opacity,
        scale,
        value,
    ]);

    return (
        <Animated.View
            style={[
                styles.rewardCard,

                {
                    opacity,

                    transform: [
                        {
                            scale,
                        },
                    ],
                },
            ]}
        >
            <Text
                style={
                    styles.rewardIcon
                }
            >
                {icon}
            </Text>

            <View>
                <Text
                    style={
                        styles.rewardLabel
                    }
                >
                    {label}
                </Text>

                <Text
                    style={
                        styles.rewardValue
                    }
                >
                    +
                    {displayedValue}
                </Text>
            </View>
        </Animated.View>
    );
};

export default function RaceResultScreen() {
    const result =
        useRaceResultStore(
            state =>
                state.result,
        );

    const clearResult =
        useRaceResultStore(
            state =>
                state.clearResult,
        );

    const titleOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const titleY =
        useRef(
            new Animated.Value(-20),
        ).current;

    const positionScale =
        useRef(
            new Animated.Value(
                0.6,
            ),
        ).current;

    const positionOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const carX =
        useRef(
            new Animated.Value(
                -500,
            ),
        ).current;

    const carScale =
        useRef(
            new Animated.Value(
                0.9,
            ),
        ).current;

    const carRotate =
        useRef(
            new Animated.Value(
                -3,
            ),
        ).current;

    const theme =
        useMemo(
            () =>
                result
                    ? getResultTheme(
                        result,
                    )
                    : null,

            [result],
        );

    useEffect(() => {
        if (!result) {
            return;
        }

        titleOpacity.setValue(
            0,
        );

        titleY.setValue(-20);

        positionScale.setValue(
            0.6,
        );

        positionOpacity.setValue(
            0,
        );

        carX.setValue(-500);
        carScale.setValue(0.9);
        carRotate.setValue(-3);

        /**
         * 1 - "CORRIDA CONCLUÍDA"
         */
        Animated.sequence([
            Animated.parallel([
                Animated.timing(
                    titleOpacity,
                    {
                        toValue: 1,

                        duration: 350,

                        useNativeDriver:
                            true,
                    },
                ),

                Animated.spring(
                    titleY,
                    {
                        toValue: 0,

                        friction: 7,

                        tension: 80,

                        useNativeDriver:
                            true,
                    },
                ),
            ]),

            /**
             * 2 - posição
             */
            Animated.parallel([
                Animated.timing(
                    positionOpacity,
                    {
                        toValue: 1,

                        duration: 250,

                        useNativeDriver:
                            true,
                    },
                ),

                Animated.spring(
                    positionScale,
                    {
                        toValue: 1,

                        friction: 5,

                        tension: 90,

                        useNativeDriver:
                            true,
                    },
                ),
            ]),

            Animated.delay(150),

            /**
             * 3 - carro entra.
             */
            Animated.parallel([
                Animated.spring(
                    carX,
                    {
                        toValue: 0,

                        friction: 7,

                        tension: 55,

                        useNativeDriver:
                            true,
                    },
                ),

                Animated.sequence([
                    Animated.timing(
                        carRotate,
                        {
                            toValue: 2,

                            duration: 350,

                            useNativeDriver:
                                true,
                        },
                    ),

                    Animated.spring(
                        carRotate,
                        {
                            toValue: 0,

                            friction: 5,

                            useNativeDriver:
                                true,
                        },
                    ),
                ]),
            ]),

            /**
             * 4 - BOUNCE.
             */
            Animated.sequence([
                Animated.spring(
                    carScale,
                    {
                        toValue: 1.13,

                        friction: 4,

                        tension: 100,

                        useNativeDriver:
                            true,
                    },
                ),

                Animated.spring(
                    carScale,
                    {
                        toValue: 1,

                        friction: 4,

                        tension: 100,

                        useNativeDriver:
                            true,
                    },
                ),
            ]),
        ]).start();
    }, [
        carRotate,
        carScale,
        carX,
        positionOpacity,
        positionScale,
        result,
        titleOpacity,
        titleY,
    ]);

    if (
        !result ||
        !theme
    ) {
        return (
            <View
                style={
                    styles.emptyContainer
                }
            >
                <Text
                    style={
                        styles.emptyTitle
                    }
                >
                    Nenhum resultado
                    disponível
                </Text>

                <TouchableOpacity
                    style={styles.continueButton} onPress={() => router.replace('/CarSelectionScreen')} >
                    <Text style={styles.buttonText} >
                        CONTINUAR
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const carImage =
        getCarImageSource(
            result.carId,
        );

    const rotation =
        carRotate.interpolate({
            inputRange: [
                -3,
                0,
                3,
            ],

            outputRange: [
                '-3deg',
                '0deg',
                '3deg',
            ],
        });

    const handleContinue =
        () => {
            clearResult();

            router.replace(
                '/CarSelectionScreen'
            );
        };

    const handleRaceAgain =
        () => {
            clearResult();

            /**
             * Ajustaremos esta rota
             * quando conectarmos com
             * o fluxo atual da corrida.
             */
            router.replace(
                '/mapa' as any,
            );
        };

    return (
        <LinearGradient
            colors={
                theme.colors
            }
            start={{
                x: 0,
                y: 0,
            }}
            end={{
                x: 1,
                y: 1,
            }}
            style={
                styles.container
            }
        >
            <SafeAreaView
                style={
                    styles.safeArea
                }
            >
                <View
                    style={
                        styles.backgroundGlow
                    }
                />

                <View
                    style={
                        styles.content
                    }
                >
                    {/* COLUNA ESQUERDA */}

                    <View
                        style={
                            styles.leftColumn
                        }
                    >
                        <Animated.Text
                            style={[
                                styles.completedText,

                                {
                                    opacity:
                                        titleOpacity,

                                    transform: [
                                        {
                                            translateY:
                                                titleY,
                                        },
                                    ],
                                },
                            ]}
                        >
                            CORRIDA
                            CONCLUÍDA
                        </Animated.Text>

                        <Animated.Text
                            style={[
                                styles.positionText,

                                {
                                    opacity:
                                        positionOpacity,

                                    transform: [
                                        {
                                            scale:
                                                positionScale,
                                        },
                                    ],
                                },
                            ]}
                        >
                            {getPositionLabel(
                                result.position,
                            )}
                        </Animated.Text>

                        <Animated.View
                            style={[
                                styles.carArea,

                                {
                                    transform: [
                                        {
                                            translateX:
                                                carX,
                                        },

                                        {
                                            scale:
                                                carScale,
                                        },

                                        {
                                            rotate:
                                                rotation,
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.carArea,
                                    {
                                        transform: [
                                            { translateX: carX, },
                                            { scale: carScale, },
                                            { rotate: rotation, },
                                        ],
                                    },
                                ]}
                            >
                                <Carro
                                    speed={0}
                                    carType={result.carId as keyof typeof carMaps}
                                    carColorFront={result.carVisual.colorFront}
                                    carColorBack={result.carVisual.colorBack}
                                    renderWidth={330}
                                />
                            </Animated.View>
                        </Animated.View>

                        {result.isNewRecord && (
                            <View
                                style={
                                    styles.recordBadge
                                }
                            >
                                <Text
                                    style={
                                        styles.recordText
                                    }
                                >
                                    ✨ NOVO
                                    RECORDE!
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* COLUNA DIREITA */}

                    <View style={styles.rightColumn} >
                        <Text style={styles.sectionTitle}>
                            RECOMPENSAS
                        </Text>

                        <View style={styles.rewardsGrid}>
                            <RewardCounter
                                icon="⚙️"
                                label="ENGRENAGENS"
                                amount={result.rewards.engrenagem}
                                delay={1700}
                            />

                            <RewardCounter
                                icon="🏆"
                                label="TROFÉUS"
                                amount={result.rewards.trophies}
                                delay={1950}
                            />

                            <RewardCounter
                                icon="🔧"
                                label="MOTOR"
                                amount={result.rewards.motor}
                                delay={2200}
                            />

                            <RewardCounter
                                icon="🎨"
                                label="SPRAY"
                                amount={result.rewards.spray}
                                delay={2450}
                            />
                        </View>

                        {result.progress && (
                            <View style={styles.progressBox}>
                                <Text style={styles.progressLabel}>
                                    PROGRESSO
                                </Text>

                                <Text style={styles.progressValue}>
                                    {result.progress.trophiesBefore}
                                    {'  →  '}
                                    {result.progress.trophiesAfter}
                                    {' 🏆'}
                                </Text>
                            </View>
                        )}

                        {result.unlocks.length >
                            0 && (
                                <View
                                    style={
                                        styles.unlockArea
                                    }
                                >
                                    <Text
                                        style={
                                            styles.unlockTitle
                                        }
                                    >
                                        🔓 NOVO
                                        DESBLOQUEIO
                                    </Text>

                                    {result.unlocks.map(
                                        unlock => (
                                            <View
                                                key={
                                                    unlock.id
                                                }
                                                style={
                                                    styles.unlockCard
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.unlockName
                                                    }
                                                >
                                                    {
                                                        unlock.name
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.unlockType
                                                    }
                                                >
                                                    {unlock.type.toUpperCase()}
                                                </Text>
                                            </View>
                                        ),
                                    )}
                                </View>
                            )}

                        <View
                            style={
                                styles.actions
                            }
                        >
                            <TouchableOpacity
                                style={
                                    styles.secondaryButton
                                }
                                onPress={
                                    handleRaceAgain
                                }
                            >
                                <Text style={styles.secondaryButtonText} >
                                    CORRER NOVAMENTE
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={
                                    styles.continueButton
                                }
                                onPress={
                                    handleContinue
                                }
                            >
                                <Text
                                    style={
                                        styles.buttonText
                                    }
                                >
                                    CONTINUAR →
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles =
    StyleSheet.create({
        container: {
            flex: 1,
        },
        safeArea: {
            flex: 1,
        },
        backgroundGlow: {
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: 210,
            backgroundColor: 'rgba(255,255,255,0.035)',
            left: -120,
            top: -160,
        },
        content: {
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: 42,
            paddingVertical: 24,
            gap: 34,
        },
        leftColumn: {
            flex: 1.05,
            alignItems: 'center',
            justifyContent: 'center',
            borderRightWidth: 1,
            borderRightColor: 'rgba(255,255,255,0.16)',
            paddingRight: 32,
        },
        rightColumn: {
            flex: 1,
            justifyContent: 'center',
        },
        completedText: {
            color: 'rgba(255,255,255,0.72)',
            fontSize: 16,
            fontWeight: '900',
            letterSpacing: 4,
        },

        positionText: {
            color: '#FFFFFF',
            fontSize: 48,
            fontWeight: '900',
            marginTop: 4,
            letterSpacing: 1,
        },
        carArea: {
            width: '100%',
            height: 170,
            marginTop: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        carImage: {
            width: '90%',
            height: '100%',
        },
        carFallback: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        carEmoji: {
            fontSize: 92,
        },
        carName: {
            color: 'rgba(255,255,255,0.82)',
            fontSize: 15,
            fontWeight: '900',
            letterSpacing: 3,
            marginTop: -4,
        },
        recordBadge: {
            marginTop: 4,
            paddingHorizontal: 15,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.26)',
        },
        recordText: {
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: 12,
            letterSpacing: 1.2,
        },
        sectionTitle: {
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontWeight: '900',
            letterSpacing: 3,
            marginBottom: 12,
        },
        rewardsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 9,
        },
        rewardCard: {
            width: '48%',
            minHeight: 68,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(8,8,12,0.32)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.13)',
        },
        rewardIcon: {
            fontSize: 27,
            marginRight: 10,
        },
        rewardLabel: {
            color: 'rgba(255,255,255,0.58)',
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 1,
        },
        rewardValue: {
            color: '#FFFFFF',
            fontSize: 21,
            fontWeight: '900',
        },
        progressBox: {
            marginTop: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: 'rgba(0,0,0,0.22)',
            borderRadius: 10,
        },
        progressLabel: {
            color: 'rgba(255,255,255,0.5)',
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 2,
        },
        progressValue: {
            color: '#FFFFFF',
            fontSize: 17,
            fontWeight: '900',
            marginTop: 3,
        },
        unlockArea: {
            marginTop: 12,
        },
        unlockTitle: {
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: 12,
            letterSpacing: 1.4,
            marginBottom: 7,
        },
        unlockCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.11)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.22)',
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 10,
            marginBottom: 6,
        },
        unlockName: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '900',
        },
        unlockType: {
            color: 'rgba(255,255,255,0.55)',
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 1,
        },
        actions: {
            flexDirection: 'row',
            gap: 9,
            marginTop: 16,
        },
        secondaryButton: {
            flex: 1,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            backgroundColor: 'rgba(0,0,0,0.18)',
        },
        secondaryButtonText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '900',
            letterSpacing: 1,
        },
        continueButton: {
            flex: 1,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
        },
        buttonText: {
            color: '#171717',
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 1,
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#181818',
            padding: 30,
        },
        emptyTitle: {
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '900',
            marginBottom: 20,
        },
    });