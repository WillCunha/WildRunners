import Carro from '@/components/Carro';
import { useLanguage } from '@/context/LanguageContext';
import { useRaceResultSfx } from '@/src/audio/raceSfx';
import { useRaceResultStore } from '@/src/store/raceResultStore';
import { RaceResult, RewardRarity } from '@/src/types/raceTypes';
import { carMaps } from '@/src/utils/carMaps';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import {
    getLevelProgress,
    getXpForLevel,
    normalizeLegacyLevelRequirement,
} from '@/src/utils/progression';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, } from 'react';
import { Animated, ImageSourcePropType, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';


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
    onTick?: () => void;
    onComplete?: () => void;
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

const getEnglishOrdinalSuffix = (
    value: number,
) => {
    const mod100 = value % 100;

    if (mod100 >= 11 && mod100 <= 13) {
        return 'TH';
    }

    switch (value % 10) {
        case 1:
            return 'ST';

        case 2:
            return 'ND';

        case 3:
            return 'RD';

        default:
            return 'TH';
    }
};

type ProgressionTargetItem = {
    type: 'CARRO' | 'PISTA';
    icon: string;
    name: string;
    level: number;
};

const getNextProgressionTarget = (
    currentLevel: number,
) => {
    const carTargets: ProgressionTargetItem[] =
        Object.entries(carMaps).map(
            ([carId, carData]) => ({
                type: 'CARRO',
                icon: '🚗',
                name: carId.toUpperCase(),
                level: Math.max(
                    1,
                    Math.floor(carData.tier ?? 1),
                ),
            }),
        );

    const mapTargets: ProgressionTargetItem[] =
        CITY_MAPS.map(map => ({
            type: 'PISTA',
            icon: '🗺️',
            name: map.city.toUpperCase(),
            level: normalizeLegacyLevelRequirement(
                map.levelRequired,
            ),
        }));

    const candidates = [
        ...carTargets,
        ...mapTargets,
    ]
        .filter(item => item.level > currentLevel)
        .sort((a, b) =>
            a.level === b.level
                ? a.name.localeCompare(b.name)
                : a.level - b.level,
        );

    if (candidates.length === 0) {
        return null;
    }

    const targetLevel = candidates[0].level;

    return {
        level: targetLevel,
        items: candidates
            .filter(item => item.level === targetLevel)
            .slice(0, 2),
    };
};

const RewardCounter = ({
    icon,
    label,
    amount,
    delay = 0,
    onTick,
    onComplete,
}: RewardCounterProps) => {
    const lastAudioTickRef =
        useRef(0);

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

                    /*
                     * Não tocamos um áudio
                     * para cada número.
                     *
                     * O Animated pode atualizar
                     * cerca de 60 vezes/s.
                     */
                    if (
                        value > 0 &&
                        amount > 0 &&
                        onTick
                    ) {
                        const now =
                            Date.now();

                        if (
                            now -
                            lastAudioTickRef
                                .current >=
                            70
                        ) {
                            lastAudioTickRef
                                .current =
                                now;

                            onTick();
                        }
                    }
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
        ]).start(
            ({ finished }) => {
                if (
                    finished &&
                    amount > 0
                ) {
                    onComplete?.();
                }
            },
        );

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


type XpProgressPanelProps = {
    result: RaceResult;
    onTick?: () => void;
};

const XpProgressPanel = ({
    result,
    onTick,
}: XpProgressPanelProps) => {
    const { t } = useLanguage();

    const xpValue = useRef(
        new Animated.Value(
            result.progress.xpBefore,
        ),
    ).current;

    const lastAudioTickRef = useRef(0);
    const previousLevelRef = useRef(
        result.progress.levelBefore,
    );

    const [displayedXp, setDisplayedXp] =
        useState(result.progress.xpBefore);
    const [showLevelUp, setShowLevelUp] =
        useState(false);

    useEffect(() => {
        xpValue.stopAnimation();
        xpValue.setValue(result.progress.xpBefore);
        setDisplayedXp(result.progress.xpBefore);
        setShowLevelUp(false);
        previousLevelRef.current =
            result.progress.levelBefore;

        const listenerId = xpValue.addListener(
            ({ value }) => {
                const safeXp = Math.max(
                    0,
                    Math.floor(value),
                );

                setDisplayedXp(safeXp);

                const currentLevel =
                    getLevelProgress(safeXp).level;

                if (
                    currentLevel >
                    previousLevelRef.current
                ) {
                    previousLevelRef.current =
                        currentLevel;
                    setShowLevelUp(true);
                }

                if (value > result.progress.xpBefore && onTick) {
                    const now = Date.now();

                    if (
                        now - lastAudioTickRef.current >=
                        90
                    ) {
                        lastAudioTickRef.current = now;
                        onTick();
                    }
                }
            },
        );

        Animated.sequence([
            Animated.delay(2850),
            Animated.timing(xpValue, {
                toValue: result.progress.xpAfter,
                duration: 1800,
                useNativeDriver: false,
            }),
        ]).start();

        return () => {
            xpValue.stopAnimation();
            xpValue.removeListener(listenerId);
        };
    }, [
        onTick,
        result.progress.levelBefore,
        result.progress.xpAfter,
        result.progress.xpBefore,
        xpValue,
    ]);

    const progress = getLevelProgress(displayedXp);
    const breakdown = result.xpBreakdown;
    const objectives = result.objectives ?? [];
    const nextTarget = getNextProgressionTarget(
        progress.level,
    );
    const nextTargetXp = nextTarget
        ? getXpForLevel(nextTarget.level)
        : progress.nextLevelXp;
    const xpRemaining = Math.max(
        0,
        nextTargetXp - displayedXp,
    );

    const bonusPills = [
        {
            key: 'position',
            label: t(
                'raceResult.xpBonus.position',
            ),
            value: breakdown.position,
        },
        {
            key: 'start',
            label: t(
                'raceResult.xpBonus.perfectStart',
            ),
            value: breakdown.perfectStart,
        },
        {
            key: 'attack',
            label: t(
                'raceResult.xpBonus.attacks',
            ),
            value: breakdown.attacks,
        },
        {
            key: 'defense',
            label: t(
                'raceResult.xpBonus.defenses',
            ),
            value: breakdown.defenses,
        },
        {
            key: 'flawless',
            label: t(
                'raceResult.xpBonus.flawless',
            ),
            value: breakdown.flawless,
        },
        {
            key: 'comeback',
            label: t(
                'raceResult.xpBonus.comeback',
            ),
            value: breakdown.comeback,
        },
        {
            key: 'survival',
            label: t(
                'raceResult.xpBonus.survived',
            ),
            value: breakdown.survived,
        },
    ].filter(item => item.value > 0);

    return (
        <View style={styles.xpPanel}>
            <View style={styles.xpHeaderRow}>
                <Text style={styles.xpTitle}>
                    {t('raceResult.raceXp')}
                </Text>

                <Text style={styles.xpEarned}>
                    +{result.rewards.xp} XP
                </Text>
            </View>

            {objectives.length > 0 && (
                <View style={styles.objectivesResultRow}>
                    {objectives.map(objective => (
                        <View
                            key={objective.id}
                            style={[
                                styles.objectiveResultCard,
                                objective.completed &&
                                    styles.objectiveResultCardDone,
                            ]}
                        >
                            <Text style={styles.objectiveResultIcon}>
                                {objective.completed ? '✓' : '•'}
                                {' '}
                                {objective.icon}
                            </Text>

                            <View style={styles.objectiveResultTextArea}>
                                <Text
                                    style={styles.objectiveResultLabel}
                                    numberOfLines={1}
                                >
                                    {t(`raceObjectives.${objective.id}`)}
                                </Text>
                                <Text style={styles.objectiveResultProgress}>
                                    {objective.id === 'top3'
                                        ? `#${result.position}`
                                        : `${objective.current}/${objective.target}`}
                                </Text>
                            </View>

                            <Text
                                style={[
                                    styles.objectiveResultXp,
                                    !objective.completed &&
                                        styles.objectiveResultXpMissed,
                                ]}
                            >
                                {objective.completed
                                    ? `+${objective.xpReward}`
                                    : '—'}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.xpLevelRow}>
                <Text style={styles.xpLevelText}>
                    {t('raceResult.level')} {progress.level}
                </Text>

                <Text style={styles.xpValueText}>
                    {progress.xpIntoLevel}
                    {' / '}
                    {progress.xpForNextLevel} XP
                </Text>
            </View>

            <View style={styles.xpTrack}>
                <View
                    style={[
                        styles.xpFill,
                        {
                            width: `${Math.max(
                                2,
                                progress.progress * 100,
                            )}%`,
                        },
                    ]}
                />
            </View>

            {showLevelUp && (
                <Text style={styles.levelUpText}>
                    {t('raceResult.levelUp', {
                        level: progress.level,
                    })}
                </Text>
            )}

            <View style={styles.nextTargetBox}>
                <View style={styles.nextTargetHeader}>
                    <Text style={styles.nextTargetEyebrow}>
                        {t('raceResult.nextTarget')}
                    </Text>
                    <Text style={styles.nextTargetDistance}>
                        {t('raceResult.xpRemaining', { xp: xpRemaining })}
                    </Text>
                </View>

                {nextTarget ? (
                    <>
                        <Text style={styles.nextTargetLevel}>
                            {t('raceResult.targetLevel', { level: nextTarget.level })}
                        </Text>
                        <Text
                            style={styles.nextTargetReward}
                            numberOfLines={1}
                        >
                            {nextTarget.items
                                .map(
                                    item =>
                                        `${item.icon} ${item.name}`,
                                )
                                .join('  •  ')}
                        </Text>
                    </>
                ) : (
                    <Text style={styles.nextTargetReward}>
                        ⭐ {t('raceResult.targetLevel', { level: progress.level + 1 })}
                    </Text>
                )}
            </View>

            <View style={styles.xpBreakdownRow}>
                {bonusPills.map(item => (
                    <View
                        key={item.key}
                        style={styles.xpPill}
                    >
                        <Text style={styles.xpPillLabel}>
                            {item.label}
                        </Text>
                        <Text style={styles.xpPillValue}>
                            +{item.value}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function RaceResultScreen() {
    const { t, language, } = useLanguage();


    const { playCarArrival, playRewardTick, playRewardComplete, playRareUnlock, playVictory } = useRaceResultSfx();

    const [showUnlocks, setShowUnlocks] = useState(false);

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
        setShowUnlocks(false);

        if (
            !result ||
            result.unlocks.length === 0
        ) {
            return;
        }

        /*
         * O último RewardCounter começa
         * em 2450ms e dura aproximadamente
         * 900ms.
         *
         * 4900ms deixa a animação de XP terminar primeiro.
         */
        const timer =
            setTimeout(() => {
                setShowUnlocks(true);

                const hasSpecialUnlock =
                    result.unlocks.some(
                        unlock =>
                            unlock.rarity ===
                            'rare' ||
                            unlock.rarity ===
                            'epic' ||
                            unlock.rarity ===
                            'legendary',
                    );

                if (
                    hasSpecialUnlock
                ) {
                    playRareUnlock();
                }
            }, 4900);

        return () =>
            clearTimeout(timer);
    }, [
        result,
        playRareUnlock,
    ]);

    useEffect(() => {
        if (
            !result ||
            result.position !== 1
        ) {
            return;
        }

        const timer =
            setTimeout(() => {
                playVictory();
            }, 420);

        return () =>
            clearTimeout(timer);
    }, [
        result,
        playVictory,
    ]);

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
         * O som acompanha o momento em que o carro começa a entrar.
         * 350ms (título) + 250ms (posição) + 150ms de pausa ≈ 750ms.
         */
        const carArrivalTimer = setTimeout(() => {
            playCarArrival();
        }, 750);

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

        return () => {
            clearTimeout(carArrivalTimer);
        };
    }, [
        carRotate,
        carScale,
        carX,
        positionOpacity,
        positionScale,
        result,
        titleOpacity,
        titleY,
        playCarArrival,
    ]);

    const getUnlockTypeLabel = (
        type: string,
    ) => {
        switch (type) {
            case 'card':
                return t(
                    'raceResult.unlockTypes.card',
                );

            case 'car':
                return t(
                    'raceResult.unlockTypes.car',
                );

            case 'map':
                return t(
                    'raceResult.unlockTypes.map',
                );

            default:
                return type.toUpperCase();
        }
    };

    if (!result || !theme) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                    {t('raceResult.noResult')}
                </Text>

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() =>
                        router.replace(
                            '/CarSelectionScreen',
                        )
                    }
                >
                    <Text style={styles.buttonText}>
                        {t(
                            'raceResult.continueSimple',
                        )}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const positionLabel =
        result.position === 1
            ? t('raceResult.winner')
            : language === 'en'
                ? t(
                    'raceResult.positionPlace',
                    {
                        position:
                            result.position,

                        suffix:
                            getEnglishOrdinalSuffix(
                                result.position,
                            ),
                    },
                )
                : t(
                    'raceResult.positionPlace',
                    {
                        position:
                            result.position,
                    },
                );

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
                            {t('raceResult.raceCompleted')}
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
                            {positionLabel}
                        </Animated.Text>

                        <Animated.View
                            style={[
                                styles.carArea,
                                {
                                    transform: [
                                        { translateX: carX },
                                        { scale: carScale },
                                        { rotate: rotation },
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
                                    {t('raceResult.newRecord')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* COLUNA DIREITA */}

                    <ScrollView
                        style={styles.rightColumn}
                        contentContainerStyle={styles.rightColumnContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <Text style={styles.sectionTitle}>
                            {t('raceResult.rewards')}
                        </Text>

                        <View style={styles.rewardsGrid}>
                            <RewardCounter
                                icon="⚙️"
                                label={t('raceResult.gears')}
                                amount={result.rewards.engrenagem}
                                delay={1700}
                                onTick={playRewardTick}
                                onComplete={playRewardComplete}
                            />

                            <RewardCounter
                                icon="🏆"
                                label={t('raceResult.trophies')}
                                amount={result.rewards.trophies}
                                delay={1950}
                                onTick={playRewardTick}
                                onComplete={playRewardComplete}
                            />

                            <RewardCounter
                                icon="🔧"
                                label={t('raceResult.engine')}
                                amount={result.rewards.motor}
                                delay={2200}
                                onTick={playRewardTick}
                                onComplete={playRewardComplete}
                            />

                            <RewardCounter
                                icon="🎨"
                                label={t('raceResult.spray')}
                                amount={result.rewards.spray}
                                delay={2450}
                                onTick={playRewardTick}
                                onComplete={playRewardComplete}
                            />
                        </View>

                        {result.progress && result.xpBreakdown && (
                            <XpProgressPanel
                                result={result}
                                onTick={playRewardTick}
                            />
                        )}

                        {showUnlocks && result.unlocks.length > 0 && (
                            <View style={styles.unlockArea}>
                                <Text style={styles.unlockTitle}>
                                    {t('raceResult.newUnlock')}
                                </Text>

                                {result.unlocks.map(unlock => (
                                    <View
                                        key={unlock.id}
                                        style={styles.unlockCard}
                                    >
                                        <Text style={styles.unlockName}>
                                            {unlock.name}
                                        </Text>

                                        <Text style={styles.unlockType}>
                                            {getUnlockTypeLabel(unlock.type)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleRaceAgain}
                            >
                                <Text style={styles.buttonText}>
                                    ⚡ {t('raceResult.raceAgain')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleContinue}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {t('raceResult.continue')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
            minHeight: 0,
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
            minWidth: 0,
            minHeight: 0,
        },
        rightColumnContent: {
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: 8,
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
        xpPanel: {
            marginTop: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: 'rgba(0,0,0,0.28)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
        },
        xpHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        xpTitle: {
            color: 'rgba(255,255,255,0.68)',
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 1.6,
        },
        xpEarned: {
            color: '#FFD60A',
            fontSize: 14,
            fontWeight: '900',
        },
        objectivesResultRow: {
            flexDirection: 'row',
            gap: 5,
            marginTop: 7,
        },
        objectiveResultCard: {
            flex: 1,
            minWidth: 0,
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
        },
        objectiveResultCardDone: {
            backgroundColor: 'rgba(0,208,132,0.16)',
            borderColor: 'rgba(0,208,132,0.5)',
        },
        objectiveResultIcon: {
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: '900',
            marginRight: 4,
        },
        objectiveResultTextArea: {
            flex: 1,
            minWidth: 0,
        },
        objectiveResultLabel: {
            color: '#FFFFFF',
            fontSize: 7,
            fontWeight: '900',
            letterSpacing: 0.3,
        },
        objectiveResultProgress: {
            color: 'rgba(255,255,255,0.55)',
            fontSize: 7,
            fontWeight: '800',
            marginTop: 1,
        },
        objectiveResultXp: {
            color: '#00D084',
            fontSize: 8,
            fontWeight: '900',
            marginLeft: 3,
        },
        objectiveResultXpMissed: {
            color: 'rgba(255,255,255,0.3)',
        },
        xpLevelRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
        },
        xpLevelText: {
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: '900',
            letterSpacing: 0.8,
        },
        xpValueText: {
            color: 'rgba(255,255,255,0.72)',
            fontSize: 10,
            fontWeight: '800',
        },
        xpTrack: {
            height: 10,
            marginTop: 6,
            overflow: 'hidden',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.12)',
        },
        xpFill: {
            height: '100%',
            borderRadius: 999,
            backgroundColor: '#FFD60A',
        },
        levelUpText: {
            color: '#FFD60A',
            fontSize: 11,
            fontWeight: '900',
            letterSpacing: 1,
            marginTop: 6,
            textAlign: 'center',
        },
        nextTargetBox: {
            marginTop: 7,
            paddingHorizontal: 9,
            paddingVertical: 6,
            borderRadius: 9,
            backgroundColor: 'rgba(255,214,10,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255,214,10,0.28)',
        },
        nextTargetHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        nextTargetEyebrow: {
            color: '#FFD60A',
            fontSize: 7,
            fontWeight: '900',
            letterSpacing: 1,
        },
        nextTargetDistance: {
            color: '#FFD60A',
            fontSize: 8,
            fontWeight: '900',
        },
        nextTargetLevel: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '900',
            marginTop: 2,
        },
        nextTargetReward: {
            color: 'rgba(255,255,255,0.76)',
            fontSize: 8,
            fontWeight: '900',
            marginTop: 1,
        },
        xpBreakdownRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 5,
            marginTop: 7,
        },
        xpPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 7,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.08)',
        },
        xpPillLabel: {
            color: 'rgba(255,255,255,0.62)',
            fontSize: 7,
            fontWeight: '900',
            letterSpacing: 0.4,
        },
        xpPillValue: {
            color: '#FFFFFF',
            fontSize: 8,
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