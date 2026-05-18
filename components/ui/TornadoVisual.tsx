import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface Racer {
    id: string;
    x: number;
}

interface TornadoVisualProps {
    callerX: number;
    victims: Racer[];
    onHitVictim: (targetId: string) => void;
    onComplete: () => void;
}

export default function TornadoVisual({ callerX, victims, onHitVictim, onComplete }: TornadoVisualProps) {
    const positionX = useRef(new Animated.Value(callerX)).current;
    const rotation = useRef(new Animated.Value(0)).current;

    // Velocidade do tornado em pixels por segundo (ajuste conforme a escala do seu jogo)
    const TORNADO_SPEED = 600; 

    useEffect(() => {
        // Encontra quão longe o tornado precisa ir (o último alvo + uma margem para sair da tela)
        const furthestVictimX = victims.length > 0 ? victims[victims.length - 1].x : callerX;
        const targetDestinationX = furthestVictimX + 500; 
        
        const totalDistance = targetDestinationX - callerX;
        const duration = (totalDistance / TORNADO_SPEED) * 1000;

        // 1. Programa os hits (baseado no tempo que leva pra chegar em cada vítima)
        victims.forEach(victim => {
            const distanceToVictim = victim.x - callerX;
            const timeToHit = (distanceToVictim / TORNADO_SPEED) * 1000;
            
            setTimeout(() => {
                onHitVictim(victim.id);
            }, timeToHit);
        });

        // 2. Animação de Rotação (loop infinito enquanto durar)
        Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 400, // Quão rápido ele gira
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Animação de Movimento (ir para frente)
        Animated.timing(positionX, {
            toValue: targetDestinationX,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => {
            // Quando terminar de andar o mapa inteiro, limpa o componente
            onComplete();
        });

    }, []);

    const spin = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View style={[
            styles.tornadoContainer, 
            { transform: [{ translateX: positionX }, { rotate: spin }] }
        ]}>
            {/* Você pode trocar esse emoji por uma <Image source={...} /> da sprite do tornado */}
            <Animated.Text style={styles.tornadoSprite}>🌪️</Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    tornadoContainer: {
        position: 'absolute',
        bottom: 50, // Ajuste para ficar na pista do seu palco
        zIndex: 50,
    },
    tornadoSprite: {
        fontSize: 60,
    }
});