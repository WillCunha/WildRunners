import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type TravelProps = {
    variant: 'travel';
    x: number;
    y: number;
    size?: number;
};

type TrapProps = {
    variant: 'trap';
    x: number;
    y: number;
    targetSize: number;
    padding?: number;
    angle?: number;

};

type BubbleLiftVisualProps = TravelProps | TrapProps;

export default function BubbleLiftVisual(props: BubbleLiftVisualProps) {
    const pulse = useRef(new Animated.Value(1)).current;
    const glow = useRef(new Animated.Value(0.75)).current;
    const floatY = useRef(new Animated.Value(0)).current;
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.06,
                    duration: 650,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        const glowLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(glow, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(glow, {
                    toValue: 0.75,
                    duration: 700,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        const floatLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatY, {
                    toValue: -2,
                    duration: 900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatY, {
                    toValue: 2,
                    duration: 900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );

        pulseLoop.start();
        glowLoop.start();
        floatLoop.start();
        shimmerLoop.start();

        return () => {
            pulseLoop.stop();
            glowLoop.stop();
            floatLoop.stop();
            shimmerLoop.stop();
        };
    }, [pulse, glow, floatY, shimmer]);

    if (props.variant === 'travel') {
        const size = props.size ?? 40;

        return (
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.travelWrapper,
                    {
                        left: props.x - size / 2,
                        top: props.y - size / 2,
                        width: size,
                        height: size,
                        transform: [{ translateY: floatY }, { scale: pulse }],
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.outerGlow,
                        {
                            width: size + 10,
                            height: size + 10,
                            borderRadius: (size + 10) / 2,
                            opacity: glow,
                        },
                    ]}
                />

                <View
                    style={[
                        styles.mainBubble,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        },
                    ]}
                >
                    <View style={styles.highlightLarge} />
                    <View style={styles.highlightSmall} />

                    <Animated.View
                        style={[
                            styles.shimmer,
                            {
                                opacity: 0.22,
                                transform: [
                                    {
                                        translateX: shimmer.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-8, 8],
                                        }),
                                    },
                                    { rotate: '-18deg' },
                                ],
                            },
                        ]}
                    />
                </View>

                <View style={[styles.miniBubble, { top: -2, right: 1, width: 8, height: 8, borderRadius: 4 }]} />
                <View style={[styles.miniBubble, { bottom: 2, left: -1, width: 6, height: 6, borderRadius: 3 }]} />
            </Animated.View>
        );
    }

    const padding = props.padding ?? 10;
    const shellSize = props.targetSize + padding * 2;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.trapWrapper,
                {
                    left: props.x - padding,
                    top: props.y - padding,
                    width: shellSize,
                    height: shellSize,
                    transform: [
                        { rotate: `${props.angle ?? 0}deg` },
                        { scale: pulse },
                    ],
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.outerGlow,
                    {
                        width: shellSize + 12,
                        height: shellSize + 12,
                        borderRadius: (shellSize + 12) / 2,
                        opacity: glow,
                    },
                ]}
            />

            <Animated.View
                style={[
                    styles.trapBubble,
                    {
                        width: shellSize,
                        height: shellSize,
                        borderRadius: shellSize / 2,
                        transform: [{ translateY: floatY }],
                    },
                ]}
            >
                <View style={styles.highlightLargeTrap} />
                <View style={styles.highlightSmallTrap} />

                <Animated.View
                    style={[
                        styles.shimmerTrap,
                        {
                            opacity: 0.18,
                            transform: [
                                {
                                    translateX: shimmer.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-14, 14],
                                    }),
                                },
                                { rotate: '-18deg' },
                            ],
                        },
                    ]}
                />
            </Animated.View>

            <View style={[styles.miniBubble, { top: 3, right: 6, width: 10, height: 10, borderRadius: 5 }]} />
            <View style={[styles.miniBubble, { bottom: 8, left: 2, width: 8, height: 8, borderRadius: 4 }]} />
            <View style={[styles.miniBubble, { top: 18, left: -1, width: 6, height: 6, borderRadius: 3 }]} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    travelWrapper: {
        position: 'absolute',
        zIndex: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },

    trapWrapper: {
        position: 'absolute',
        zIndex: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    outerGlow: {
        position: 'absolute',
        backgroundColor: 'rgba(120,255,255,0.18)',
        borderWidth: 2,
        borderColor: 'rgba(210,255,255,0.28)',
    },

    mainBubble: {
        backgroundColor: 'rgba(110,255,255,0.20)',
        borderWidth: 3,
        borderColor: 'rgba(230,255,255,0.95)',
        overflow: 'hidden',
    },

    trapBubble: {
        backgroundColor: 'rgba(110,255,255,0.16)',
        borderWidth: 4,
        borderColor: 'rgba(230,255,255,0.96)',
        overflow: 'hidden',
    },

    highlightLarge: {
        position: 'absolute',
        top: 7,
        left: 8,
        width: 11,
        height: 14,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.48)',
    },

    highlightSmall: {
        position: 'absolute',
        top: 6,
        left: 19,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.75)',
    },

    highlightLargeTrap: {
        position: 'absolute',
        top: 10,
        left: 12,
        width: 18,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.42)',
    },

    highlightSmallTrap: {
        position: 'absolute',
        top: 12,
        left: 33,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.72)',
    },

    shimmer: {
        position: 'absolute',
        top: -6,
        left: 14,
        width: 10,
        height: 50,
        backgroundColor: '#FFFFFF',
    },

    shimmerTrap: {
        position: 'absolute',
        top: -10,
        left: 22,
        width: 14,
        height: 90,
        backgroundColor: '#FFFFFF',
    },

    miniBubble: {
        position: 'absolute',
        backgroundColor: 'rgba(200,255,255,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.95)',
    },
});