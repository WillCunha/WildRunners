import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Vibration, View } from 'react-native';

interface SwapEffectProps {
    allRacers: {
        id: string;
        x: number;
        color?: string;
        isPlayer?: boolean;
    }[];

    callerId: string;
    onTargetChange?: (targetId: string) => void;
    onSwapExecute: (targetId: string) => void;
}

export default function SwapEffect({ allRacers, callerId, onTargetChange, onSwapExecute }: SwapEffectProps) {
    const [currentTarget, setCurrentTarget] = useState<string | null>(null);
    const [phase, setPhase] = useState<'aiming' | 'animating' | 'done'>('aiming');

    // Valores para a animação do texto "SWAP" e dos personagens
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // FASE 1: A Mira Maluca (Dura 5 segundos, troca a cada 0.8s)
        let aimInterval: NodeJS.Timeout;
        let finishTimer: NodeJS.Timeout;

        if (phase === 'aiming') {
            aimInterval = setInterval(() => {

                const caller = allRacers.find(r => r.id === callerId);

                if (!caller) return;

                const possibleTargets = allRacers.filter(r => {
                    if (r.id === callerId) return false;

                    return r.x > caller.x;
                });

                if (possibleTargets.length === 0) return;

                const randomTarget =
                    possibleTargets[
                    Math.floor(Math.random() * possibleTargets.length)
                    ];

                setCurrentTarget(randomTarget.id);
                onTargetChange?.(randomTarget.id);


            }, 500);

            // TEMPO DE SELEÇÃO
            finishTimer = setTimeout(() => {
                setPhase('animating');
            }, 3000); // 3 segundos escolhendo alvo
        }

        return () => {
            clearInterval(aimInterval);
            clearTimeout(finishTimer);
        };
    }, [phase]);

    useEffect(() => {
        // FASE 2: A Animação e Execução
        if (phase === 'animating' && currentTarget) {
            Animated.sequence([
                // Aparece o texto SWAP e encolhe os personagens (1 para 0)
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 0, duration: 400, useNativeDriver: true })
                ]),

                // Dispara a função no mapa.tsx para inverter as coordenadas REAIS
                // Usamos um delay tático usando o hook, ou chamamos a prop aqui
            ]).start(() => {
                const caller = allRacers.find(r => r.id === callerId);
                const target = allRacers.find(r => r.id === currentTarget);

                if (!caller || !target) return;
                if (target.x <= caller.x) return;

                onSwapExecute(currentTarget);

                Vibration.vibrate(100);

                // Cresce os personagens de volta (0 para 1) e some o texto
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
                ]).start(() => {
                    setPhase('done');
                });
            });
        }
    }, [phase]);

    if (phase === 'done') return null;

    const minX = Math.min(...allRacers.map(r => r.x));
    const maxX = Math.max(...allRacers.map(r => r.x));
    const mapSpan = Math.max(2000, maxX - minX);

    const target = allRacers.find(r => r.id === currentTarget);

    const targetProgress = target
        ? (target.x - minX) / mapSpan
        : 0;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {currentTarget && (
                <View/>
            )}
            <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    textContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    swapText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#AF52DE',
        textShadowColor: '#FFF',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        fontStyle: 'italic',
    }
});