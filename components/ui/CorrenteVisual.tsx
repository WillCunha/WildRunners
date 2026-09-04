import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

interface CorrenteVisualProps {
    callerX: number;
    callerY: number;
    targetX: number;
    targetY: number;
}

const PLAYER_SIZE = 50;

function CorrenteVisual({ callerX, callerY, targetX, targetY }: CorrenteVisualProps) {
    // 1. Progresso do tiro (vai de 0 a 1)
    const shootProgress = useRef(new Animated.Value(0)).current;

    const x1 = callerX + PLAYER_SIZE / 2;
    const y1 = callerY + PLAYER_SIZE / 2;
    const x2 = targetX + PLAYER_SIZE / 2;
    const y2 = targetY + PLAYER_SIZE / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const midX = x1 + dx / 2;
    const midY = y1 + dy / 2;

    const CHAIN_LINK_SIZE = 18;
    const totalLinks = Math.floor(distance / CHAIN_LINK_SIZE);

    useEffect(() => {
        Animated.timing(shootProgress, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, []);

    const animatedWidth = shootProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, distance],
    });

    return (
        <View
            style={{
                position: 'absolute',
                left: midX - distance / 2,
                top: midY - 10,
                width: distance, // O container pai tem o tamanho exato da distância
                height: 20,
                transform: [{ rotate: `${angle}deg` }],
                zIndex: 1,
                // Removi o justifyContent: 'center' para ele começar colado no Caller
            }}
            pointerEvents="none"
        >
            {/* O container animado começa com 0 de largura e cresce para a direita */}
            <Animated.View style={[styles.chainContainer, { width: animatedWidth }]}>
                {Array.from({ length: totalLinks }).map((_, index) => (
                    <Image
                        key={index}
                        source={require('@/assets/images/components/chains/gomos.png')}
                        style={{
                            width: CHAIN_LINK_SIZE,
                            height: 12,
                        }}
                        resizeMode="contain"
                    />
                ))}

                <Image
                    source={require('@/assets/images/components/chains/gancho.png')}
                    style={styles.hook}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

export default React.memo(CorrenteVisual);

const styles = StyleSheet.create({
    chainContainer: {
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        // Mudei para 'visible' para o gancho não ter a pontinha cortada quando estica
        overflow: 'visible',
    },
    chainLinks: {
        flex: 1,
        height: 12,
    },
    hook: {
        width: 30,
        height: 30,
        position: 'absolute',
        // Puxa o gancho um pouco pra fora da linha invisível para ele dar o "bote" no alvo
        right: -15,
    }
});