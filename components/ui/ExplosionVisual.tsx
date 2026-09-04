import { EXPLOSION_FRAMES } from '@/src/utils/explosionMap';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet
} from 'react-native';

interface ExplosionVisualProps {
  x: number;
  y: number;
}

const TNT_SIZE = 50;
const DISPLAY_SIZE = 210;
const FRAME_DURATION_MS = 60;

export default function ExplosionVisual({ x, y }: ExplosionVisualProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  const scale = useRef(new Animated.Value(0.45)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(-0.04)).current;

  useEffect(() => {
    let currentFrame = 0;

    const frameTimer = setInterval(() => {
      currentFrame += 1;

      if (currentFrame >= EXPLOSION_FRAMES.length) {
        clearInterval(frameTimer);
        return;
      }

      setFrameIndex(currentFrame);
    }, FRAME_DURATION_MS);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.08,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.22,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotation, {
        toValue: 0.04,
        duration: FRAME_DURATION_MS * EXPLOSION_FRAMES.length,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 170,
        delay: FRAME_DURATION_MS * 6,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      clearInterval(frameTimer);
      scale.stopAnimation();
      opacity.stopAnimation();
      rotation.stopAnimation();
    };
  }, [opacity, rotation, scale]);

  const rotate = rotation.interpolate({
    inputRange: [-0.04, 0.04],
    outputRange: ['-4deg', '4deg'],
  });

  return (
    <Animated.Image
      pointerEvents="none"
      source={EXPLOSION_FRAMES[frameIndex]}
      resizeMode="contain"
      style={[
        styles.image,
        {
          left: x + TNT_SIZE / 2 - DISPLAY_SIZE / 2,
          top: y + TNT_SIZE / 2 - DISPLAY_SIZE / 2,
          opacity,
          transform: [{ scale }, { rotate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    zIndex: 20,
  },
});
