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
  const WHEEL_DIAMETER = 70;

  const RENDER_WIDTH = 180;
  const RENDER_HEIGHT = RENDER_WIDTH * (BASE_HEIGHT / BASE_WIDTH);

  const scaleX = RENDER_WIDTH / BASE_WIDTH;
  const scaleY = RENDER_HEIGHT / BASE_HEIGHT;

  const frontOffsetX = (car.offset?.frente?.x || 0) * scaleX;
  const frontOffsetY = (car.offset?.frente?.y || 0) * scaleX;

  const rearOffsetX = (car.offset?.tras?.x || 0) * scaleX;
  const rearOffsetY = (car.offset?.tras?.y || 0) * scaleX;

  return (
    <View style={[styles.carWrapper, { width: RENDER_WIDTH, height: RENDER_HEIGHT }]}>

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
            width: WHEEL_DIAMETER * scaleX,
            height: WHEEL_DIAMETER * scaleY,
            left: (car.rodaTras.x * scaleX) + rearOffsetX - ((WHEEL_DIAMETER * scaleX) / 2),
            bottom: (car.rodaTras.y * scaleY) + rearOffsetY - ((WHEEL_DIAMETER * scaleY) / 2),
            transform: [{ rotate: spin }]
          }
        ]}
        resizeMode="contain" // "contain" agora funciona perfeitamente pois o container tem o tamanho exato da roda
      />

      {/* Roda Dianteira */}
      <Animated.Image
        source={car.wheelImage}
        style={[
          styles.wheel,
          {
            width: WHEEL_DIAMETER * scaleX,
            height: WHEEL_DIAMETER * scaleY,
            left: (car.rodaFrente.x * scaleX) + frontOffsetX - ((WHEEL_DIAMETER * scaleX) / 2),
            bottom: (car.rodaFrente.y * scaleY) + frontOffsetY - ((WHEEL_DIAMETER * scaleY) / 2),
            transform: [{ rotate: spin }]
          }
        ]}
        resizeMode="contain"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  carWrapper: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
  },
  carBase: {
    width: '100%',
    height: '100%',
    bottom: 0,
    position: 'absolute',
    zIndex: 10,
  },
  carOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  wheel: {
    width: 55,
    height: 55,
    position: 'absolute',
  },
});