import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Vibration, View } from 'react-native';

interface ChainsEffectProps {
    allRacers: {
        id: string;
        x: number;
        color?: string;
        isPlayer?: boolean;
    }[];
    callerId: string;
    onChainsExecute: (targetId: string) => void;
}

export default function ChainsEffect({ allRacers, callerId, onChainsExecute }: ChainsEffectProps) {
    const [currentTarget, setCurrentTarget] = useState<string | null>(null);
    const [phase, setPhase] = useState<'animating' | 'done'>('animating');
    const tensionAnim = useRef(new Animated.Value(0)).current;

    // Usando PNGs estilizados ou texto animado (mantendo texto para seguir o Swap)
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (phase === 'animating') {
            const caller = allRacers.find(r => r.id === callerId);
            
            if (!caller) {
                setPhase('done');
                return;
            }

            // Filtra quem está na frente e pega o mais próximo
            const aheadRacers = allRacers
                .filter(r => r.id !== callerId && r.x > caller.x)
                .sort((a, b) => a.x - b.x); // Ordena do mais perto pro mais longe

            if (aheadRacers.length === 0) {
                // Ninguém na frente, não faz nada
                setPhase('done');
                return;
            }

            const target = aheadRacers[0];
            setCurrentTarget(target.id);

            // Animação: Aparece o "CHAINS!" grande na tela
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.spring(scaleAnim, { toValue: 1.2, friction: 4, useNativeDriver: true })
                ]),
                Animated.delay(300), // Tempo que a tela fica travada lendo o poder
            ]).start(() => {
                // Executa o efeito real no mapa
                onChainsExecute(target.id);
                Vibration.vibrate(100);

                // Some com a animação
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
    chainsText: {
        fontSize: 54,
        fontWeight: '900',
        color: '#FF9500', // Laranjão para diferenciar do Swap
        textShadowColor: '#000',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 5,
        fontStyle: 'italic',
    }
});