import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, Vibration, View } from 'react-native';

interface GuidedBulletEffectProps {
    allRacers: { id: string; x: number; }[];
    callerId: string;
    onBulletExecute: (targetId: string) => void;
}

export default function GuidedBulletEffect({ allRacers, callerId, onBulletExecute }: GuidedBulletEffectProps) {
    const [phase, setPhase] = useState<'animating' | 'done'>('animating');
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (phase === 'animating') {
            const caller = allRacers.find(r => r.id === callerId);
            if (!caller) { setPhase('done'); return; }

            // Pega o cara logo à frente
            const aheadRacers = allRacers
                .filter(r => r.id !== callerId && r.x > caller.x)
                .sort((a, b) => a.x - b.x);

            if (aheadRacers.length === 0) {
                setPhase('done');
                return;
            }

            const target = aheadRacers[0];

            Animated.sequence([
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.spring(scaleAnim, { toValue: 1.2, friction: 4, useNativeDriver: true })
                ]),
                Animated.delay(300), 
            ]).start(() => {
                onBulletExecute(target.id); // Dispara o míssil fisicamente
                Vibration.vibrate(100);

                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
                    Animated.timing(textOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
                ]).start(() => setPhase('done'));
            });
        }
    }, [phase]);

    if (phase === 'done') return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.bulletText}>MÍSSIL GUIADO!</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    textContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    bulletText: {
        fontSize: 54,
        fontWeight: '900',
        color: '#FF3B30', // Vermelho para o míssil
        textShadowColor: '#000',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 5,
        fontStyle: 'italic',
    }
});