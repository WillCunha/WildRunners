import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

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

// Componente interno para construir o visual do tornado via código
function TornadoDesign() {
    const wobbleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Loop infinito para fazer as camadas balançarem de um lado para o outro rápido
        Animated.loop(
            Animated.sequence([
                Animated.timing(wobbleAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
                Animated.timing(wobbleAnim, { toValue: -1, duration: 140, useNativeDriver: true })
            ])
        ).start();
    }, []);

    // Interpolações cruzadas para criar o efeito de rotação/oscilação
    const wobbleLeft = wobbleAnim.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
    const wobbleRight = wobbleAnim.interpolate({ inputRange: [-1, 1], outputRange: [6, -6] });

    return (
        <View style={styles.designContainer}>
            {/* Camada Superior (Maior) */}
            <Animated.View style={[styles.disc, styles.top, { transform: [{ translateX: wobbleLeft }] }]} />
            
            {/* Camada Central */}
            <Animated.View style={[styles.disc, styles.middle, { transform: [{ translateX: wobbleRight }] }]} />
            
            {/* Camada Inferior (Base menor) */}
            <Animated.View style={[styles.disc, styles.bottom, { transform: [{ translateX: wobbleLeft }] }]} />
        </View>
    );
}

export default function TornadoVisual({ callerX, victims, onHitVictim, onComplete }: TornadoVisualProps) {
    const positionX = useRef(new Animated.Value(callerX)).current;
    
    // Velocidade de progressão do tornado pela pista (pixels por segundo)
    const TORNADO_SPEED = 700; 

    useEffect(() => {
        // Determina até onde o tornado deve viajar antes de sumir da tela
        const furthestVictimX = victims.length > 0 ? victims[victims.length - 1].x : callerX;
        const targetDestinationX = furthestVictimX + 550; 
        
        const totalDistance = targetDestinationX - callerX;
        const duration = (totalDistance / TORNADO_SPEED) * 1000;

        // Calcula o tempo exato de impacto para cada oponente na pista
        victims.forEach(victim => {
            const distanceToVictim = victim.x - callerX;
            const timeToHit = (distanceToVictim / TORNADO_SPEED) * 1000;
            
            setTimeout(() => {
                onHitVictim(victim.id);
            }, timeToHit);
        });

        // Executa a movimentação linear para a frente ao longo do mapa
        Animated.timing(positionX, {
            toValue: targetDestinationX,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => {
            // Remove o tornado do mapa assim que a trajetória terminar
            onComplete();
        });
    }, []);

    return (
        <Animated.View style={[
            styles.tornadoContainer, 
            { transform: [{ translateX: positionX }] }
        ]}>
            <TornadoDesign />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    tornadoContainer: {
        position: 'absolute',
        bottom: 100, // Alinhamento vertical com a linha de base da pista
        zIndex: 45,
    },
    designContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 85,
        width: 70,
    },
    disc: {
        backgroundColor: '#00E5FF', // Tom ciano sólido para o vento
        borderWidth: 3.5,           // Contorno espesso para destacar os elementos
        borderColor: '#1C1C1E',     // Cor escura de contraste
        borderRadius: 99,           // Formato oval achatado
        marginBottom: -11,          // Sobreposição intencional das camadas
    },
    top: {
        width: 64,
        height: 30,
        zIndex: 3,
    },
    middle: {
        width: 42,
        height: 22,
        zIndex: 2,
    },
    bottom: {
        width: 20,
        height: 12,
        zIndex: 1,
        marginBottom: 0,
    }
});