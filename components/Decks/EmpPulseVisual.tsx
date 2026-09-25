import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Visual 2.5D da interferência EMP, ancorado no carro.
 * A física determina quando montar/desmontar; as animações rodam no driver nativo,
 * sem setInterval, Math.random ou setState no game loop.
 */
type Props = { size?: number; paused?: boolean };

const BOLTS = [
  { x: 0.06, y: 0.19, deg: '-27deg', color: '#C6FFFF' },
  { x: 0.77, y: 0.16, deg: '26deg', color: '#F5B5FF' },
  { x: 0.12, y: 0.62, deg: '22deg', color: '#8EF9FF' },
  { x: 0.81, y: 0.62, deg: '-25deg', color: '#C9ABFF' },
] as const;

export default function EmpPulseVisual({ size = 50, paused = false }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const opacityAnim = useRef(new Animated.Value(0.75)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (paused) {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      spinAnim.stopAnimation();
      return;
    }

    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.08, duration: 180, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.94, duration: 220, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.55, duration: 130, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.85, duration: 170, useNativeDriver: true }),
        ]),
      ]),
    );
    const rotation = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1450, useNativeDriver: true }),
    );
    pulse.start();
    rotation.start();

    return () => {
      pulse.stop();
      rotation.stop();
    };
  }, [paused, opacityAnim, scaleAnim, spinAnim]);

  const diameter = size * 1.9;
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', zIndex: 30, overflow: 'visible',
        left: (size - diameter) / 2, top: (size - diameter) / 2,
        width: diameter, height: diameter,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }]}
      >
        <View style={[styles.outerRing, { width: diameter, height: diameter, borderRadius: diameter / 2 }]} />
        <View style={[styles.innerRing, {
          width: diameter * 0.74, height: diameter * 0.74,
          borderRadius: diameter * 0.37, left: diameter * 0.13, top: diameter * 0.13,
        }]} />
        {BOLTS.map((bolt, index) => (
          <View
            key={index}
            style={{
              position: 'absolute', left: diameter * bolt.x, top: diameter * bolt.y,
              transform: [{ rotate: bolt.deg }],
            }}
          >
            <View style={[styles.boltOne, { borderBottomColor: bolt.color }]} />
            <View style={[styles.boltTwo, { borderTopColor: bolt.color }]} />
          </View>
        ))}
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', width: diameter * 0.86, height: diameter * 0.86,
        borderWidth: 2, borderTopColor: '#D8FFFF', borderBottomColor: '#C788FF',
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderRadius: diameter * 0.43,
        transform: [{ rotate: spin }], opacity: opacityAnim,
      }} />
      <Text style={[styles.label, { top: -size * 0.02, fontSize: Math.max(9, size * 0.19) }]}>EMP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    position: 'absolute', borderWidth: 3, borderTopColor: '#AC65FF',
    borderBottomColor: '#86F6FF', borderLeftColor: 'rgba(172,101,255,0.5)',
    borderRightColor: 'rgba(134,246,255,0.55)',
    backgroundColor: 'rgba(143,78,255,0.055)',
  },
  innerRing: {
    position: 'absolute', borderWidth: 2, borderTopColor: '#85FAFF',
    borderBottomColor: '#D9A3FF', borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  boltOne: {
    width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 3,
    borderBottomWidth: 19, borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  boltTwo: {
    position: 'absolute', top: 12, left: 1, width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 2, borderTopWidth: 13,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  label: {
    position: 'absolute', color: '#E9FFFF', fontWeight: '900',
    textShadowColor: '#853CF8', textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 0 },
  },
});
