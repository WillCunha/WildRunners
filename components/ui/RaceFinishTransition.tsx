import React, {
    useEffect, useRef,
} from 'react';

import { Animated, Easing, StyleSheet, View } from 'react-native';

interface RaceFinishTransitionProps {
    visible: boolean;
    onFinished: () => void;
}

const CHECKER_COUNT = 18;
const PROGRESS_WIDTH = 280;

export default function RaceFinishTransition({
    visible,
    onFinished,
}: RaceFinishTransitionProps) {
    const backdropOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const titleOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const titleScale =
        useRef(
            new Animated.Value(0.72),
        ).current;

    const titleY =
        useRef(
            new Animated.Value(18),
        ).current;

    const subtitleOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const checkerOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    const progress =
        useRef(
            new Animated.Value(0),
        ).current;

    const blackoutOpacity =
        useRef(
            new Animated.Value(0),
        ).current;

    /**
     * Mantemos a callback atualizada
     * sem precisar reiniciar a animação
     * caso a função do pai mude.
     */
    const onFinishedRef =
        useRef(onFinished);

    useEffect(() => {
        onFinishedRef.current =
            onFinished;
    }, [onFinished]);

    useEffect(() => {
        if (!visible) {
            backdropOpacity.setValue(0);
            titleOpacity.setValue(0);
            titleScale.setValue(0.72);
            titleY.setValue(18);
            subtitleOpacity.setValue(0);
            checkerOpacity.setValue(0);
            progress.setValue(0);
            blackoutOpacity.setValue(0);

            return;
        }

        backdropOpacity.setValue(0);
        titleOpacity.setValue(0);
        titleScale.setValue(0.72);
        titleY.setValue(18);
        subtitleOpacity.setValue(0);
        checkerOpacity.setValue(0);
        progress.setValue(0);
        blackoutOpacity.setValue(0);

        /**
         * ================================
         * FASE 1
         * Escurece a corrida congelada.
         * ================================
         */
        const animation =
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(
                        backdropOpacity,
                        {
                            toValue: 0.72,
                            duration: 300,
                            easing:
                                Easing.out(
                                    Easing.quad,
                                ),
                            useNativeDriver: true,
                        },
                    ),

                    Animated.timing(
                        checkerOpacity,
                        {
                            toValue: 0.16,
                            duration: 350,
                            useNativeDriver: true,
                        },
                    ),

                    Animated.timing(
                        titleOpacity,
                        {
                            toValue: 1,
                            duration: 220,
                            useNativeDriver: true,
                        },
                    ),

                    Animated.spring(
                        titleScale,
                        {
                            toValue: 1,
                            friction: 5,
                            tension: 100,
                            useNativeDriver: true,
                        },
                    ),

                    Animated.spring(
                        titleY,
                        {
                            toValue: 0,
                            friction: 6,
                            tension: 80,
                            useNativeDriver: true,
                        },
                    ),
                ]),

                /**
                 * Pequena pausa.
                 */
                Animated.delay(180),

                /**
                 * ================================
                 * FASE 2
                 * Mostra processamento.
                 * ================================
                 */
                Animated.timing(
                    subtitleOpacity,
                    {
                        toValue: 1,
                        duration: 180,
                        useNativeDriver: true,
                    },
                ),

                /**
                 * ================================
                 * FASE 3
                 * Barra falsa de processamento.
                 * ================================
                 */
                Animated.timing(
                    progress,
                    {
                        toValue: 1,
                        duration: 800,
                        easing:
                            Easing.inOut(
                                Easing.cubic,
                            ),
                        useNativeDriver: false,
                    },
                ),

                Animated.delay(100),

                /**
                 * ================================
                 * FASE 4
                 * Fecha a tela em preto.
                 * ================================
                 */
                Animated.timing(
                    blackoutOpacity,
                    {
                        toValue: 1,
                        duration: 240,
                        easing:
                            Easing.in(
                                Easing.quad,
                            ),
                        useNativeDriver: true,
                    },
                ),
            ]);

        animation.start(
            ({ finished }) => {
                if (finished) {
                    onFinishedRef.current();
                }
            },
        );

        return () => {
            animation.stop();
        };
    }, [
        visible,
        backdropOpacity,
        titleOpacity,
        titleScale,
        titleY,
        subtitleOpacity,
        checkerOpacity,
        progress,
        blackoutOpacity,
    ]);

    if (!visible) {
        return null;
    }

    const progressWidth =
        progress.interpolate({
            inputRange: [0, 1],

            outputRange: [
                0,
                PROGRESS_WIDTH,
            ],
        });

    return (
        <View
            style={
                styles.container
            }
            pointerEvents="auto"
        >
            {/* FUNDO ESCURECENDO */}

            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,

                    styles.backdrop,

                    {
                        opacity:
                            backdropOpacity,
                    },
                ]}
            />

            {/* QUADRICULADO SUPERIOR */}

            <Animated.View
                style={[
                    styles.checkerTop,

                    {
                        opacity:
                            checkerOpacity,
                    },
                ]}
            >
                <CheckerStrip />
            </Animated.View>

            {/* QUADRICULADO INFERIOR */}

            <Animated.View
                style={[
                    styles.checkerBottom,

                    {
                        opacity:
                            checkerOpacity,
                    },
                ]}
            >
                <CheckerStrip reverse />
            </Animated.View>

            {/* CONTEÚDO */}

            <View
                style={
                    styles.centerContent
                }
            >
                <Animated.Text
                    style={[
                        styles.title,

                        {
                            opacity:
                                titleOpacity,

                            transform: [
                                {
                                    translateY:
                                        titleY,
                                },

                                {
                                    scale:
                                        titleScale,
                                },
                            ],
                        },
                    ]}
                >
                    FIM DE CORRIDA
                </Animated.Text>

                <View
                    style={
                        styles.divider
                    }
                />

                <Animated.Text
                    style={[
                        styles.subtitle,

                        {
                            opacity:
                                subtitleOpacity,
                        },
                    ]}
                >
                    CALCULANDO RESULTADO...
                </Animated.Text>

                <Animated.View
                    style={[
                        styles.progressTrack,

                        {
                            opacity:
                                subtitleOpacity,
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.progressFill,

                            {
                                width:
                                    progressWidth,
                            },
                        ]}
                    />
                </Animated.View>

                <Animated.Text
                    style={[
                        styles.waitText,

                        {
                            opacity:
                                subtitleOpacity,
                        },
                    ]}
                >
                    PREPARANDO SUAS RECOMPENSAS
                </Animated.Text>
            </View>

            {/* BLACKOUT FINAL */}

            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,

                    styles.blackout,

                    {
                        opacity:
                            blackoutOpacity,
                    },
                ]}
            />
        </View>
    );
}

function CheckerStrip({
    reverse = false,
}: {
    reverse?: boolean;
}) {
    return (
        <View
            style={
                styles.checkerStrip
            }
        >
            {Array.from({
                length: CHECKER_COUNT,
            }).map((_, index) => {
                const inverted =
                    reverse
                        ? index + 1
                        : index;

                return (
                    <View
                        key={index}
                        style={[
                            styles.checkerColumn,
                        ]}
                    >
                        <View
                            style={[
                                styles.checkerSquare,

                                inverted % 2 === 0
                                    ? styles.whiteSquare
                                    : styles.darkSquare,
                            ]}
                        />

                        <View
                            style={[
                                styles.checkerSquare,

                                inverted % 2 === 0
                                    ? styles.darkSquare
                                    : styles.whiteSquare,
                            ]}
                        />
                    </View>
                );
            })}
        </View>
    );
}

const styles =
    StyleSheet.create({
        container: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 99999,
            alignItems: 'center',
            justifyContent:
                'center',
        },

        backdrop: {
            backgroundColor:
                '#080A0E',
        },

        centerContent: {
            alignItems: 'center',
            justifyContent:
                'center',
            paddingHorizontal: 30,
        },

        title: {
            color: '#FFFFFF',
            fontSize: 46,
            fontWeight: '900',
            fontStyle: 'italic',
            letterSpacing: 3,
            textAlign: 'center',
            textShadowColor:
                'rgba(0,0,0,0.7)',
            textShadowOffset: {
                width: 3,
                height: 4,
            },
            textShadowRadius: 8,
        },

        divider: {
            width: 54,
            height: 4,
            borderRadius: 2,
            backgroundColor:
                '#FFFFFF',
            marginTop: 12,
            marginBottom: 16,
            opacity: 0.8,
        },

        subtitle: {
            color:
                'rgba(255,255,255,0.82)',
            fontSize: 13,
            fontWeight: '900',
            letterSpacing: 2.4,
            marginBottom: 13,
        },

        progressTrack: {
            width:
                PROGRESS_WIDTH,
            height: 7,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor:
                'rgba(255,255,255,0.13)',
            borderWidth: 1,
            borderColor:
                'rgba(255,255,255,0.18)',
        },

        progressFill: {
            height: '100%',
            borderRadius: 4,
            backgroundColor:
                '#FFFFFF',
        },

        waitText: {
            color:
                'rgba(255,255,255,0.38)',
            fontSize: 8,
            fontWeight: '800',
            letterSpacing: 2,
            marginTop: 10,
        },

        checkerTop: {
            position: 'absolute',
            top: -10,
            left: 0,
            right: 0,
            transform: [
                {
                    rotate: '-2deg',
                },
            ],
        },

        checkerBottom: {
            position: 'absolute',
            bottom: -10,
            left: 0,
            right: 0,
            transform: [
                {
                    rotate: '2deg',
                },
            ],
        },

        checkerStrip: {
            width: '100%',
            height: 52,
            flexDirection: 'row',
            overflow: 'hidden',
        },

        checkerColumn: {
            flex: 1,
            height: 52,
        },

        checkerSquare: {
            flex: 1,
        },

        whiteSquare: {
            backgroundColor:
                '#FFFFFF',
        },
        darkSquare: {
            backgroundColor:
                '#15171C',
        },

        blackout: {
            backgroundColor:
                '#080A0E',
            zIndex: 100,
        },
    });