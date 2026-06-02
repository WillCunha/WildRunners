import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Vibration, View } from 'react-native';

interface Racer {
    id: string;
    x: number;
    color?: string;
    isPlayer?: boolean;
}

interface TornadoEffectProps {
    allRacers: Racer[];
    callerId: string;
    onTornadoAnnounced: (victims: Racer[], callerX: number) => void;
}

export default function TornadoEffect({ allRacers, callerId, onTornadoAnnounced }: TornadoEffectProps) {
    const [phase, setPhase] = useState<'animating' | 'done'>('animating');

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (phase === 'animating') {
            const caller = allRacers.find(r => r.id === callerId);
            
            if (!caller) {
                setPhase('done');
                return;
            }

            // Pega TODOS os corredores que estão na frente do chamador
            const aheadRacers = allRacers
                .filter(r => r.id !== callerId && r.x > caller.x)
                .sort((a, b) => a.x - b.x); 

            // Animação: Aparece o "TORNADO!" grande na tela
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.spring(scaleAnim, { toValue: 1.2, friction: 4, useNativeDriver: true })
                ]),
                Animated.delay(400), 
            ]).start(() => {
                // Ao invés de executar o dano, passamos para o Mapa quem vai sofrer e de onde sai
                onTornadoAnnounced(aheadRacers, caller.x);
                Vibration.vibrate(150);

                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
                    Animated.timing(textOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
                ]).start(() => {
                    setPhase('done');
                });
            });
        }
    }, [phase]);

    if (phase === 'done') return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ scale: scaleAnim }] }]}>
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
    tornadoText: {
        fontSize: 54,
        fontWeight: '900',
        color: '#00E5FF', // Um azul/ciano para dar a vibe de vento
        textShadowColor: '#000',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 5,
        fontStyle: 'italic',
    }
});