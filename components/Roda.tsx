import React, { useEffect, useRef } from 'react';
import { Animated, View, Image, StyleSheet } from 'react-native';

interface RodaProps {
  wheelImage: any; // require() da imagem
  size: { width: number; height: number };
  position: { x: number; y: number }; // Posição relativa ao carro
  rotation: number; // Rotação em graus (0-360)
}

export const Roda: React.FC<RodaProps> = ({ wheelImage, size, position, rotation }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Anima a rotação continuamente
    rotationAnim.setValue(rotation);
  }, [rotation, rotationAnim]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.wheel,
        {
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          transform: [{ rotate: spin }],
        },
      ]}
    >
      <Image
        source={wheelImage}
        style={{
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wheel: {
    position: 'absolute',
  },
});
