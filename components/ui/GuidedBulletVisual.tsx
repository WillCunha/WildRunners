import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface GuidedBulletVisualProps {
    x: number;
    y: number;
    angle: number;
}

export default function GuidedBulletVisual({ x, y, angle }: GuidedBulletVisualProps) {
    return (
        <View style={[
            styles.container,
            { left: x, top: y, transform: [{ rotate: `${angle}deg` }] }
        ]} pointerEvents="none">
            <Image
                source={require('@/assets/images/components/bullet/missil.png')}
                style={styles.bulletImage}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 100, // Acima dos carros
        width: 30,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderMissile: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FF3B30',
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    bulletImage: {
        width: '100%',
        height: '100%',
    }
});