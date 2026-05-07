import { carMaps } from '@/src/utils/carMaps';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

type CarKey = keyof typeof carMaps;

interface CarroProps {
  speed: number;
  skin?: string;
  carType?: CarKey;
  carColor?: string;
}

export default function Carro({
  speed,
  skin = 'default',
  carType = 'fusca',
  carColor = '#D32F2F'
}: CarroProps) {

  const car = carMaps[carType];

  // === ANIMAÇÃO DAS RODAS ===
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinAnim.setValue(0);

    if (speed > 0) {
      const duration = Math.max(100, 1000 - (speed * 50));

      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      );

      loop.start();

      return () => loop.stop();
    }
  }, [speed]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // === ESCALA ===
  const BASE_WIDTH = car.baseSize.width;
  const BASE_HEIGHT = car.baseSize.height;

  const RENDER_WIDTH = 300;
  const RENDER_HEIGHT = 250;

  const scaleX = RENDER_WIDTH / BASE_WIDTH;
  const scaleY = RENDER_HEIGHT / BASE_HEIGHT;

  const frontOffsetX = car.offset?.frente?.x || 0;
  const frontOffsetY = car.offset?.frente?.y || 0;

  const rearOffsetX = car.offset?.tras?.x || 0;
  const rearOffsetY = car.offset?.tras?.y || 0; 

  return (
    <View style={styles.carWrapper}>

      {/* Corpo */}
      <Image
        source={car.corpoBranco}
        style={[styles.carBase, { tintColor: carColor }]}
        resizeMode="contain"
      />

      {/* Overlay */}
      <Image
        source={car.corpoTransparente}
        style={styles.carOverlay}
        resizeMode="contain"
      />

      {/* Roda Traseira */}
      <Animated.Image
        source={car.wheelImage}
        style={[
          styles.wheel,
          {
            width: car.size.width * scaleX,
            height: car.size.height * scaleY,
            left: (car.rodaTras.x * scaleX) + rearOffsetX,
            bottom: (car.rodaTras.y * scaleY) + rearOffsetY,
            transform: [{ rotate: spin }]
          }
        ]}
        resizeMode="center"
      />

      {/* Roda Dianteira */}
      <Animated.Image
        source={car.wheelImage}
        style={[
          styles.wheel,
          {
            width: car.size.width * scaleX,
            height: car.size.height * scaleY,
            left: (car.rodaFrente.x * scaleX) + frontOffsetX,
            bottom: (car.rodaFrente.y * scaleY) + frontOffsetY,
            transform: [{ rotate: spin }]
          }
        ]}
        resizeMode="center"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  carWrapper: {
    width: 150,
    height: 100,
    position: 'relative', // ESSENCIAL
    justifyContent: 'center',
    alignItems: 'center',
  },
  carBase: {
    width: '100%',
    height: '100%',
  },
  carOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  wheel: {
    position: 'absolute',
    zIndex: 10,
  },
});