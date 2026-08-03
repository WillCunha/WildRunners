import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export type DefenseVisualKind =
  | 'shield_activate'
  | 'shield_break'
  | 'armor_activate'
  | 'armor_hit'
  | 'repair'
  | 'ghost_activate'
  | 'ghost_evade'
  | 'second_chance_arm'
  | 'second_chance_revive';

export type DefenseVisualEvent = {
  id: number;
  type: DefenseVisualKind;
  amount?: number;
};

type DefenseCardVisualProps = {
  size: number;
  shieldCharges: number;
  armorCharges: number;
  isGhost: boolean;
  secondChanceReady: boolean;
  isInvincible: boolean;
  event?: DefenseVisualEvent;
  children: any;
};

const PARTICLE_ANGLES = [-70, -25, 25, 70];

export default function DefenseCardVisual({
  size,
  shieldCharges,
  armorCharges,
  isGhost,
  secondChanceReady,
  isInvincible,
  event,
  children,
}: DefenseCardVisualProps) {
  const shieldPulse = useRef(new Animated.Value(0)).current;
  const shieldBurst = useRef(new Animated.Value(0)).current;
  const armorPulse = useRef(new Animated.Value(0)).current;
  const armorImpact = useRef(new Animated.Value(0)).current;
  const repairProgress = useRef(new Animated.Value(0)).current;
  const ghostWave = useRef(new Animated.Value(0)).current;
  const secondChancePulse = useRef(new Animated.Value(0)).current;
  const reviveProgress = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shieldCharges <= 0) {
      shieldPulse.stopAnimation();
      shieldPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shieldPulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shieldPulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [shieldCharges, shieldPulse]);

  useEffect(() => {
    if (armorCharges <= 0) {
      armorPulse.stopAnimation();
      armorPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(armorPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(armorPulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [armorCharges, armorPulse]);

  useEffect(() => {
    if (!secondChanceReady) {
      secondChancePulse.stopAnimation();
      secondChancePulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(secondChancePulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(secondChancePulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [secondChanceReady, secondChancePulse]);

  useEffect(() => {
    if (!isInvincible) {
      blinkOpacity.stopAnimation();
      blinkOpacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0.28,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [blinkOpacity, isInvincible]);

  useEffect(() => {
    if (!event) return;

    switch (event.type) {
      case 'shield_activate':
        shieldBurst.setValue(0);
        Animated.sequence([
          Animated.spring(shieldBurst, {
            toValue: 0.52,
            speed: 18,
            bounciness: 11,
            useNativeDriver: true,
          }),
          Animated.timing(shieldBurst, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'shield_break':
        shieldBurst.setValue(0.55);
        Animated.timing(shieldBurst, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
        break;

      case 'armor_activate':
        armorImpact.setValue(0);
        Animated.sequence([
          Animated.spring(armorImpact, {
            toValue: 0.42,
            speed: 16,
            bounciness: 13,
            useNativeDriver: true,
          }),
          Animated.timing(armorImpact, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'armor_hit':
        armorImpact.setValue(0.45);
        Animated.sequence([
          Animated.timing(armorImpact, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(armorImpact, {
            toValue: 0,
            duration: 330,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'repair':
        repairProgress.setValue(0);
        Animated.timing(repairProgress, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        break;

      case 'ghost_activate':
      case 'ghost_evade':
        ghostWave.setValue(0);
        Animated.timing(ghostWave, {
          toValue: 1,
          duration: event.type === 'ghost_evade' ? 420 : 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        break;

      case 'second_chance_arm':
        reviveProgress.setValue(0);
        Animated.sequence([
          Animated.spring(reviveProgress, {
            toValue: 0.38,
            speed: 15,
            bounciness: 15,
            useNativeDriver: true,
          }),
          Animated.timing(reviveProgress, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'second_chance_revive':
        reviveProgress.setValue(0.4);
        Animated.sequence([
          Animated.timing(reviveProgress, {
            toValue: 0.72,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(reviveProgress, {
            toValue: 1,
            duration: 620,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  }, [armorImpact, event, ghostWave, repairProgress, reviveProgress, shieldBurst]);

  const shieldScale = shieldPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.09],
  });
  const shieldOpacity = shieldPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.52, 0.9],
  });
  const shieldBurstScale = shieldBurst.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0.25, 1, 1.7],
  });
  const shieldBurstOpacity = shieldBurst.interpolate({
    inputRange: [0, 0.5, 0.72, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  const armorScale = armorPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const armorOpacity = armorPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.58, 0.95],
  });
  const armorImpactScale = armorImpact.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.65, 1, 1.35],
  });
  const armorImpactOpacity = armorImpact.interpolate({
    inputRange: [0, 0.4, 0.75, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  const repairOpacity = repairProgress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });
  const repairGlowScale = repairProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.5, 1.12, 1.3],
  });

  const ghostWaveScale = ghostWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.8],
  });
  const ghostWaveOpacity = ghostWave.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.85, 0],
  });

  const secondChanceScale = secondChancePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });
  const reviveScale = reviveProgress.interpolate({
    inputRange: [0, 0.38, 0.72, 1],
    outputRange: [0.4, 1, 1.65, 2.2],
  });
  const reviveOpacity = reviveProgress.interpolate({
    inputRange: [0, 0.3, 0.68, 1],
    outputRange: [0, 1, 0.9, 0],
  });
  const reviveRotation = reviveProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-160deg', '200deg'],
  });

  const carBaseOpacity = isGhost ? 0.42 : 1;

  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      {isGhost && (
        <>
          <View
            style={[
              styles.ghostTrail,
              {
                width: size * 0.82,
                height: size * 0.52,
                left: -size * 0.42,
                top: size * 0.28,
                opacity: 0.14,
              },
            ]}
          />
          <View
            style={[
              styles.ghostTrail,
              {
                width: size * 0.72,
                height: size * 0.46,
                left: -size * 0.7,
                top: size * 0.31,
                opacity: 0.08,
              },
            ]}
          />
        </>
      )}

      {shieldCharges > 0 && (
        <Animated.View
          style={[
            styles.shield,
            {
              width: size + 18,
              height: size + 18,
              borderRadius: size,
              left: -9,
              top: -9,
              opacity: shieldOpacity,
              transform: [{ scale: shieldScale }],
            },
          ]}
        />
      )}

      {armorCharges > 0 && (
        <Animated.View
          style={[
            styles.armorContainer,
            {
              width: size + 14,
              height: size + 14,
              left: -7,
              top: -7,
              opacity: armorOpacity,
              transform: [{ scale: armorScale }],
            },
          ]}
        >
          <View style={[styles.armorPlate, styles.armorTop]} />
          <View style={[styles.armorPlate, styles.armorRight]} />
          {armorCharges > 1 && <View style={[styles.armorPlate, styles.armorBottom]} />}
          {armorCharges > 1 && <View style={[styles.armorPlate, styles.armorLeft]} />}
        </Animated.View>
      )}

      {secondChanceReady && (
        <Animated.View
          style={[
            styles.secondChanceBadge,
            {
              top: -size * 0.47,
              transform: [{ scale: secondChanceScale }],
            },
          ]}
        >
          <Text style={styles.secondChanceText}>↻</Text>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.carLayer,
          {
            opacity: Animated.multiply(blinkOpacity, carBaseOpacity),
          },
        ]}
      >
        {children}
      </Animated.View>

      <Animated.View
        style={[
          styles.eventRing,
          styles.shieldEvent,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: size,
            left: -10,
            top: -10,
            opacity: shieldBurstOpacity,
            transform: [{ scale: shieldBurstScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.eventRing,
          styles.armorEvent,
          {
            width: size + 12,
            height: size + 12,
            borderRadius: size,
            left: -6,
            top: -6,
            opacity: armorImpactOpacity,
            transform: [{ scale: armorImpactScale }, { rotate: '18deg' }],
          },
        ]}
      />

      {PARTICLE_ANGLES.map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const travel = repairProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, size * (0.65 + index * 0.08)],
        });

        return (
          <Animated.Text
            key={`repair-${angle}`}
            style={[
              styles.repairPlus,
              {
                left: size * 0.35,
                top: size * 0.3,
                opacity: repairOpacity,
                transform: [
                  { translateX: Animated.multiply(travel, Math.cos(radians)) },
                  { translateY: Animated.multiply(travel, Math.sin(radians)) },
                  { scale: repairGlowScale },
                ],
              },
            ]}
          >
            +
          </Animated.Text>
        );
      })}

      <Animated.View
        style={[
          styles.ghostWave,
          {
            width: size + 12,
            height: size + 12,
            borderRadius: size,
            left: -6,
            top: -6,
            opacity: ghostWaveOpacity,
            transform: [{ scale: ghostWaveScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.reviveFlash,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: size,
            left: -8,
            top: -8,
            opacity: reviveOpacity,
            transform: [{ scale: reviveScale }],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.reviveIcon,
          {
            left: size * 0.22,
            top: -size * 0.08,
            opacity: reviveOpacity,
            transform: [{ scale: reviveScale }, { rotate: reviveRotation }],
          },
        ]}
      >
        ↻
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  carLayer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  shield: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#5EEBFF',
    backgroundColor: 'rgba(0, 229, 255, 0.13)',
    zIndex: 2,
  },
  armorContainer: {
    position: 'absolute',
    zIndex: 3,
  },
  armorPlate: {
    position: 'absolute',
    width: 16,
    height: 7,
    borderRadius: 3,
    backgroundColor: '#FFD54A',
    borderWidth: 1,
    borderColor: '#FFF6B3',
  },
  armorTop: {
    top: -2,
    left: '38%',
  },
  armorRight: {
    right: -4,
    top: '42%',
    transform: [{ rotate: '90deg' }],
  },
  armorBottom: {
    bottom: -2,
    left: '38%',
  },
  armorLeft: {
    left: -4,
    top: '42%',
    transform: [{ rotate: '90deg' }],
  },
  secondChanceBadge: {
    position: 'absolute',
    zIndex: 8,
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: '#BFA7FF',
  },
  secondChanceText: {
    color: '#6F45C8',
    fontWeight: '900',
    fontSize: 17,
    lineHeight: 20,
  },
  eventRing: {
    position: 'absolute',
    zIndex: 7,
  },
  shieldEvent: {
    borderWidth: 5,
    borderColor: '#D8FBFF',
    backgroundColor: 'rgba(94,235,255,0.22)',
  },
  armorEvent: {
    borderWidth: 5,
    borderColor: '#FFF1A8',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,213,74,0.12)',
  },
  repairPlus: {
    position: 'absolute',
    zIndex: 9,
    color: '#66FF9A',
    fontWeight: '900',
    fontSize: 22,
    textShadowColor: '#0B5A2A',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ghostWave: {
    position: 'absolute',
    zIndex: 6,
    borderWidth: 4,
    borderColor: '#D8B9FF',
    backgroundColor: 'rgba(168, 104, 255, 0.16)',
  },
  ghostTrail: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#D8B9FF',
    backgroundColor: 'rgba(168, 104, 255, 0.10)',
  },
  reviveFlash: {
    position: 'absolute',
    zIndex: 10,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(199, 170, 255, 0.36)',
  },
  reviveIcon: {
    position: 'absolute',
    zIndex: 11,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    textShadowColor: '#6F45C8',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
