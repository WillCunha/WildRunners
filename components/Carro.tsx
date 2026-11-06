
import type { EquippedCarEquipment, PaintFinishId } from '@/src/types/playerTypes';
import { carMaps } from '@/src/utils/carMaps';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import CarEquipmentLayers from './Game/CarEquipmentLayers';
import SkiaCarBody from './Game/SkiaCarBody';

// Evita refazer a árvore Skia/equipamentos quando apenas a faixa das rodas muda.
// As cores, acabamentos, peças e decalques continuam reativos.
const MemoSkiaCarBody = memo(SkiaCarBody);
const MemoCarEquipmentLayers = memo(CarEquipmentLayers);

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

  // Estilos das rodas mantêm a MESMA geometria atual. Atualizam somente se
  // modelo/largura mudarem, não em cada atualização de velocidade/estado.
  const wheelStyles = useMemo(() => {
    const wheelWidth = WHEEL_DIAMETER * scaleX;
    const wheelHeight = WHEEL_DIAMETER * scaleY;
    const makeWheelStyle = (position: { x: number; y: number }) => ({
      width: wheelWidth,
      height: wheelHeight,
      left: position.x * scaleX * 2 - wheelWidth / 2,
      bottom: position.y * scaleY * 2 - wheelHeight / 2,
      transform: [{ rotate: spin }],
    });
    return {
      rear: [styles.wheel, makeWheelStyle(car.wheels.mapa.rodaTras)],
      front: [styles.wheel, makeWheelStyle(car.wheels.mapa.rodaFrente)],
    };
  }, [car, scaleX, scaleY, WHEEL_DIAMETER, spin]);

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
      <MemoSkiaCarBody
        carId={carType}
        width={RENDER_WIDTH}
        primaryColor={carColorFront}
        secondaryColor={carColorBack}
        finishId={paintFinishId}
        style={styles.carBase}
      />

      <MemoCarEquipmentLayers
        carId={carType}
        width={RENDER_WIDTH}
        height={RENDER_HEIGHT}
        equipped={equipment}
        style={styles.carComponents}
      />

      <Animated.Image
        source={car.wheelImage}
        resizeMode="contain"
        style={wheelStyles.rear}
      />

      <Animated.Image
        source={car.wheelImage}
        resizeMode="contain"
        style={wheelStyles.front}
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
    prev.equipment?.decalque === next.equipment?.decalque &&
    prev.equipment?.decalColor === next.equipment?.decalColor &&
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
