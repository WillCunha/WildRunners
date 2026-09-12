import { carMaps } from '@/src/utils/carMaps';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import SkiaCarBody from './Game/SkiaCarBody';

type CarKey = keyof typeof carMaps;

interface CarroProps {
  speed: number;
  skin?: string;
  carType?: CarKey;
  carColorFront?: string;
  carColorBack?: string;
  renderWidth?: number;
}

export default function Carro({
  speed,
  skin = 'default',
  carType = 'fusca',
  carColorFront = '#cc0000',
  carColorBack = '#000',
  renderWidth = 180
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
  const WHEEL_DIAMETER = car.wheels.mapa.size.width; // Assuming the wheel is circular, we can use width as diameter

  const RENDER_WIDTH = renderWidth;
  const RENDER_HEIGHT = RENDER_WIDTH * (BASE_HEIGHT / BASE_WIDTH);

  const scaleX = RENDER_WIDTH / BASE_WIDTH;
  const scaleY = RENDER_HEIGHT / BASE_HEIGHT;

  const frontOffsetX = (car.wheels.mapa.rodaFrente.x || 0) * scaleX;
  const frontOffsetY = (car.wheels.mapa.rodaFrente.y || 0) * scaleY;

  const rearOffsetX = (car.wheels.mapa.rodaTras.x || 0) * scaleX;
  const rearOffsetY = (car.wheels.mapa.rodaTras.y || 0) * scaleY;

  return (
    <View style={[styles.carWrapper, { width: RENDER_WIDTH, height: RENDER_HEIGHT }]}>

      {/* Corpo 2.5D recolorido via Skia; componentes/vidros ficam intactos. */}
      <SkiaCarBody
        carId={carType}
        width={RENDER_WIDTH}
        primaryColor={carColorFront}
        secondaryColor={carColorBack}
        style={styles.carBase}
      />

      {/* Roda Traseira */}
      <Animated.Image
        source={car.wheelImage}
        style={[
          styles.wheel,
          {
            width: WHEEL_DIAMETER * scaleX,
            height: WHEEL_DIAMETER * scaleY,
            left: (car.wheels.mapa.rodaTras.x * scaleX) + rearOffsetX - ((WHEEL_DIAMETER * scaleX) / 2),
            bottom: (car.wheels.mapa.rodaTras.y * scaleY) + rearOffsetY - ((WHEEL_DIAMETER * scaleY) / 2),
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
            left: (car.wheels.mapa.rodaFrente.x * scaleX) + frontOffsetX - ((WHEEL_DIAMETER * scaleX) / 2),
            bottom: (car.wheels.mapa.rodaFrente.y * scaleY) + frontOffsetY - ((WHEEL_DIAMETER * scaleY) / 2),
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
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 10,
  },
  wheel: {
    width: 55,
    height: 55,
    position: 'absolute',
    zIndex: 30
  },
});