
import type { EquippedCarEquipment, PaintFinishId } from '@/src/types/playerTypes';
import { carMaps } from '@/src/utils/carMaps';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import CarEquipmentLayers from './Game/CarEquipmentLayers';
import SkiaCarBody from './Game/SkiaCarBody';

type CarKey = keyof typeof carMaps;

interface CarroProps {
  speed: number;
  skin?: string;
  carType?: CarKey;
  carColorFront?: string;
  carColorBack?: string;
  paintFinishId?: PaintFinishId;
  equipment?: EquippedCarEquipment;
  renderWidth?: number;
}

/**
 * Evita reiniciar a animação das rodas a cada pequena alteração da velocidade.
 * A física pode variar continuamente, mas visualmente 4 faixas são suficientes.
 */
function getSpeedBand(speed: number) {
  if (speed <= 0.15) return 0;
  if (speed < 6) return 1;
  if (speed < 12) return 2;
  return 3;
}

function Carro({
  speed,
  skin = 'default',
  carType = 'fusca',
  carColorFront = '#cc0000',
  carColorBack = '#000000',
  paintFinishId = 'solid',
  equipment,
  renderWidth = 180,
}: CarroProps) {
  const car = carMaps[carType];
  const spinRef = useRef<Animated.Value | null>(null);
  if (spinRef.current === null) spinRef.current = new Animated.Value(0);
  const spinAnim = spinRef.current;
  const speedBand = getSpeedBand(speed);

  useEffect(() => {
    spinAnim.stopAnimation();

    if (speedBand === 0) {
      spinAnim.setValue(0);
      return;
    }

    const duration =
      speedBand === 1 ? 650 :
      speedBand === 2 ? 420 :
      260;

    spinAnim.setValue(0);

    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    loop.start();
    return () => {
      loop.stop();
      spinAnim.stopAnimation();
    };
  }, [speedBand, spinAnim]);

  const spin = useMemo(
    () =>
      spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spinAnim],
  );

  const BASE_WIDTH = car.baseSize.width;
  const BASE_HEIGHT = car.baseSize.height;
  const WHEEL_DIAMETER = car.wheels.mapa.size.width;

  const RENDER_WIDTH = renderWidth;
  const RENDER_HEIGHT = RENDER_WIDTH * (BASE_HEIGHT / BASE_WIDTH);

  const scaleX = RENDER_WIDTH / BASE_WIDTH;
  const scaleY = RENDER_HEIGHT / BASE_HEIGHT;

  // Mantemos exatamente a geometria usada atualmente no Mapa para não deslocar as rodas.
  const frontOffsetX = (car.wheels.mapa.rodaFrente.x || 0) * scaleX;
  const frontOffsetY = (car.wheels.mapa.rodaFrente.y || 0) * scaleY;
  const rearOffsetX = (car.wheels.mapa.rodaTras.x || 0) * scaleX;
  const rearOffsetY = (car.wheels.mapa.rodaTras.y || 0) * scaleY;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.carWrapper,
        {
          width: RENDER_WIDTH,
          height: RENDER_HEIGHT,
        },
      ]}
    >
      {/*
        Skia preserva a luminância da arte grayscale.
        Sombras e highlights continuam visíveis depois da recoloração.
      */}
      <SkiaCarBody
        carId={carType}
        width={RENDER_WIDTH}
        primaryColor={carColorFront}
        secondaryColor={carColorBack}
        finishId={paintFinishId}
        style={styles.carBase}
      />

      <CarEquipmentLayers
        carId={carType}
        width={RENDER_WIDTH}
        height={RENDER_HEIGHT}
        equipped={equipment}
        style={styles.carComponents}
      />

      <Animated.Image
        source={car.wheelImage}
        resizeMode="contain"
        style={[
          styles.wheel,
          {
            width: WHEEL_DIAMETER * scaleX,
            height: WHEEL_DIAMETER * scaleY,
            left:
              car.wheels.mapa.rodaTras.x * scaleX +
              rearOffsetX -
              (WHEEL_DIAMETER * scaleX) / 2,
            bottom:
              car.wheels.mapa.rodaTras.y * scaleY +
              rearOffsetY -
              (WHEEL_DIAMETER * scaleY) / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      <Animated.Image
        source={car.wheelImage}
        resizeMode="contain"
        style={[
          styles.wheel,
          {
            width: WHEEL_DIAMETER * scaleX,
            height: WHEEL_DIAMETER * scaleY,
            left:
              car.wheels.mapa.rodaFrente.x * scaleX +
              frontOffsetX -
              (WHEEL_DIAMETER * scaleX) / 2,
            bottom:
              car.wheels.mapa.rodaFrente.y * scaleY +
              frontOffsetY -
              (WHEEL_DIAMETER * scaleY) / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
}

function arePropsEqual(prev: CarroProps, next: CarroProps) {
  return (
    prev.carType === next.carType &&
    prev.skin === next.skin &&
    prev.carColorFront === next.carColorFront &&
    prev.carColorBack === next.carColorBack &&
    prev.paintFinishId === next.paintFinishId &&
    prev.equipment?.frontBumper === next.equipment?.frontBumper &&
    prev.equipment?.rearBumper === next.equipment?.rearBumper &&
    prev.equipment?.spoiler === next.equipment?.spoiler &&
    prev.equipment?.sideSkirt === next.equipment?.sideSkirt &&
    prev.renderWidth === next.renderWidth &&
    getSpeedBand(prev.speed) === getSpeedBand(next.speed)
  );
}

export default memo(Carro, arePropsEqual);

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
  carComponents: {
    zIndex: 1,
  },
  wheel: {
    position: 'absolute',
    zIndex: 11,
  },
});
