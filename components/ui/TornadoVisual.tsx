import { TORNADO_FRAMES } from '@/src/utils/tornadoMaps';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

interface Racer {
    id: string;
    x: number;
    y: number;
}

interface TornadoVisualProps {
    callerX: number;
    callerY: number;
    victims: Racer[];
    onHitVictim: (victimId: string) => void;
    onComplete: () => void;
}


const DISPLAY_SIZE = 120;
const CAR_SIZE = 50;
const TRAVEL_SPEED_PX_PER_MS = 0.9;

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

export default function TornadoVisual({
    callerX,
    callerY,
    victims,
    onHitVictim,
    onComplete,
}: TornadoVisualProps) {
    const startX = callerX + CAR_SIZE - DISPLAY_SIZE * 0.35;
    const startY = callerY + CAR_SIZE - DISPLAY_SIZE;

    const translateX = useRef(new Animated.Value(startX)).current;
    const translateY = useRef(new Animated.Value(startY)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(0.35)).current;

    const [frame, setFrame] = useState(0);
    const [frameIndex, setFrameIndex] = useState(0);
    const cancelledRef = useRef(false);
    const hitCallbackRef = useRef(onHitVictim);
    const completeCallbackRef = useRef(onComplete);

    hitCallbackRef.current = onHitVictim;
    completeCallbackRef.current = onComplete;

    useEffect(() => {
        const frameTimer = setInterval(() => {
            setFrameIndex(current =>
                (current + 1) % TORNADO_FRAMES.length
            );
        }, 70);

        return () => clearInterval(frameTimer);
    }, []);

    useEffect(() => {
        cancelledRef.current = false;

        Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
        }).start();

        const orderedVictims = [...victims]
            .filter(victim => victim.x > callerX)
            .sort((a, b) => a.x - b.x);

        const finishTornado = (fromX: number, fromY: number) => {
            const exitX = Math.max(fromX + 420, callerX + 900);

            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: exitX,
                    duration: 420,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: fromY - 12,
                    duration: 420,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 260,
                    delay: 160,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.75,
                    duration: 420,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished && !cancelledRef.current) {
                    completeCallbackRef.current();
                }
            });
        };

        const moveToVictim = (index: number, fromX: number, fromY: number) => {
            if (cancelledRef.current) return;

            const victim = orderedVictims[index];
            if (!victim) {
                finishTornado(fromX, fromY);
                return;
            }

            const targetX = victim.x + CAR_SIZE / 2 - DISPLAY_SIZE / 2;
            const targetY = victim.y + CAR_SIZE - DISPLAY_SIZE;
            const distance = Math.hypot(targetX - fromX, targetY - fromY);
            const duration = clamp(distance / TRAVEL_SPEED_PX_PER_MS, 180, 760);

            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: targetX,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: targetY,
                    duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (!finished || cancelledRef.current) return;

                hitCallbackRef.current(victim.id);
                moveToVictim(index + 1, targetX, targetY);
            });
        };

        if (orderedVictims.length === 0) {
            finishTornado(startX, startY);
        } else {
            moveToVictim(0, startX, startY);
        }

        return () => {
            cancelledRef.current = true;
            translateX.stopAnimation();
            translateY.stopAnimation();
            opacity.stopAnimation();
            scale.stopAnimation();
        };
    }, [callerX, callerY, startX, startY, victims, opacity, scale, translateX, translateY]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.tornado,
                {
                    opacity,
                    transform: [{ translateX }, { translateY }, { scale }],
                },
            ]}
        >

            <Image
                source={TORNADO_FRAMES[frameIndex]}
                resizeMode="contain"
                fadeDuration={0}
                style={styles.image}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    tornado: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: DISPLAY_SIZE,
        height: DISPLAY_SIZE,
        zIndex: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },

});