import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SlowSlowVisualProps = {
  variant: 'racer' | 'screen';
  size?: number;
};

const SLOW_ICON = require('@/assets/images/cards/slow_slow.png');

export default function SlowSlowVisual({
  variant,
  size = 50,
}: SlowSlowVisualProps) {
  const impact = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant !== 'screen') return;

    impact.setValue(0);

    Animated.sequence([
      Animated.timing(impact, {
        toValue: 1,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(impact, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [impact, variant]);

  if (variant === 'screen') {
    return (
      <View pointerEvents="none" style={styles.screenRoot}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.impactFlash,
            { opacity: impact },
          ]}
        />

        <View style={styles.screenBorder} />

        <View style={styles.warningBadge}>
          <Image source={SLOW_ICON} style={styles.warningIcon} resizeMode="contain" />
          <Text style={styles.warningText}>SLOW!</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.racerRoot,
        {
          width: size * 2.6,
          height: size * 1.5,
          left: -size * 1.7,
          top: -size * 0.35,
        },
      ]}
    >
      <View style={[styles.dragLine, styles.dragLineTop]} />
      <View style={[styles.dragLine, styles.dragLineMiddle]} />
      <View style={[styles.dragLine, styles.dragLineBottom]} />

      <View style={styles.racerBadge}>
        <Image source={SLOW_ICON} style={styles.racerIcon} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 16,
  },

  impactFlash: {
    backgroundColor: 'rgba(255, 149, 0, 0.24)',
  },

  screenBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 7,
    borderColor: 'rgba(255, 149, 0, 0.55)',
    backgroundColor: 'rgba(255, 149, 0, 0.035)',
  },

  warningBadge: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF9500',
    backgroundColor: 'rgba(15, 15, 18, 0.88)',
  },

  warningIcon: {
    width: 24,
    height: 24,
  },

  warningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.7,
  },

  racerRoot: {
    position: 'absolute',
    zIndex: 20,
    justifyContent: 'center',
  },

  dragLine: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 149, 0, 0.75)',
  },

  dragLineTop: {
    top: '22%',
    width: '58%',
  },

  dragLineMiddle: {
    top: '46%',
    width: '76%',
  },

  dragLineBottom: {
    top: '70%',
    width: '48%',
  },

  racerBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF9500',
    backgroundColor: 'rgba(10, 10, 12, 0.88)',
  },

  racerIcon: {
    width: 18,
    height: 18,
  },
});
