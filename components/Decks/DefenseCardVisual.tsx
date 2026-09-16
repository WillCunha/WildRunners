import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  children: React.ReactNode;
};

type EventChannel = 'shield' | 'armor' | 'repair' | 'ghost' | 'revive';
const EVENT_CHANNELS: EventChannel[] = ['shield', 'armor', 'repair', 'ghost', 'revive'];
const PARTICLE_ANGLES = [-70, -25, 25, 70];

function useAnimationValue(initialValue = 0) {
  const ref = useRef<Animated.Value | null>(null);
  if (ref.current === null) ref.current = new Animated.Value(initialValue);
  return ref.current;
}

// Cada aura só existe enquanto sua proteção está ativa. O loop roda no driver
// nativo; não usa timers JS, setState por frame nem trava tarefas de interação.
function usePulse(duration: number) {
  const progress = useAnimationValue();
  useEffect(() => {
    progress.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(progress, {
        toValue: 1, duration, easing: Easing.inOut(Easing.sin),
        useNativeDriver: true, isInteraction: false,
      }),
      Animated.timing(progress, {
        toValue: 0, duration, easing: Easing.inOut(Easing.sin),
        useNativeDriver: true, isInteraction: false,
      }),
    ]));
    loop.start();
    return () => { loop.stop(); progress.stopAnimation(); };
  }, [duration, progress]);
  return progress;
}

const ShieldAura = memo(function ShieldAura({ size }: { size: number }) {
  const pulse = usePulse(650);
  const animatedStyle = useMemo(() => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.52, 0.9] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] }) }],
  }), [pulse]);
  return <Animated.View style={[styles.shield, {
    width: size + 18, height: size + 18, borderRadius: size, left: -9, top: -9,
  }, animatedStyle]} />;
});

const ArmorAura = memo(function ArmorAura({ size, charges }: { size: number; charges: number }) {
  const pulse = usePulse(850);
  const animatedStyle = useMemo(() => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.58, 0.95] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
  }), [pulse]);
  return (
    <Animated.View style={[styles.armorContainer, {
      width: size + 14, height: size + 14, left: -7, top: -7,
    }, animatedStyle]}>
      <View style={[styles.armorPlate, styles.armorTop]} />
      <View style={[styles.armorPlate, styles.armorRight]} />
      {charges > 1 && <View style={[styles.armorPlate, styles.armorBottom]} />}
      {charges > 1 && <View style={[styles.armorPlate, styles.armorLeft]} />}
    </Animated.View>
  );
});

const SecondChanceAura = memo(function SecondChanceAura({ size }: { size: number }) {
  const pulse = usePulse(700);
  const scale = useMemo(() => pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }), [pulse]);
  return (
    <Animated.View style={[styles.secondChanceBadge, { top: -size * 0.47, transform: [{ scale }] }]}>
      <Text style={styles.secondChanceText}>↻</Text>
    </Animated.View>
  );
});

const InvulnerabilityAura = memo(function InvulnerabilityAura({ size }: { size: number }) {
  const pulse = usePulse(220);
  const animatedStyle = useMemo(() => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }],
  }), [pulse]);
  // O halo pulsa; a carroceria mantém a opacidade. Ghost continua translúcido.
  return <Animated.View style={[styles.invulnerabilityRing, {
    width: size + 22, height: size + 14, borderRadius: size, left: -11, top: -7,
  }, animatedStyle]} />;
});

function getEventChannel(type: DefenseVisualKind): EventChannel {
  switch (type) {
    case 'shield_activate': case 'shield_break': return 'shield';
    case 'armor_activate': case 'armor_hit': return 'armor';
    case 'repair': return 'repair';
    case 'ghost_activate': case 'ghost_evade': return 'ghost';
    case 'second_chance_arm': case 'second_chance_revive': return 'revive';
  }
}

function createEventAnimation(type: DefenseVisualKind, progress: Animated.Value): Animated.CompositeAnimation {
  const timing = (toValue: number, duration: number, easing = Easing.inOut(Easing.ease)) =>
    Animated.timing(progress, { toValue, duration, easing, useNativeDriver: true, isInteraction: false });
  const spring = (toValue: number, speed: number, bounciness: number) =>
    Animated.spring(progress, { toValue, speed, bounciness, useNativeDriver: true, isInteraction: false });

  switch (type) {
    case 'shield_activate':
      return Animated.sequence([spring(0.52, 18, 11), timing(1, 280, Easing.out(Easing.quad))]);
    case 'shield_break': return timing(1, 360, Easing.out(Easing.quad));
    case 'armor_activate':
      return Animated.sequence([spring(0.42, 16, 13), timing(1, 300, Easing.out(Easing.quad))]);
    case 'armor_hit':
      return Animated.sequence([timing(1, 130), timing(0, 330, Easing.out(Easing.quad))]);
    case 'repair': return timing(1, 900, Easing.out(Easing.cubic));
    case 'ghost_activate': return timing(1, 720, Easing.out(Easing.cubic));
    case 'ghost_evade': return timing(1, 420, Easing.out(Easing.cubic));
    case 'second_chance_arm':
      return Animated.sequence([spring(0.38, 15, 15), timing(1, 360, Easing.out(Easing.quad))]);
    case 'second_chance_revive':
      return Animated.sequence([timing(0.72, 180, Easing.out(Easing.quad)), timing(1, 620, Easing.out(Easing.cubic))]);
  }
}

type BurstVisuals = {
  scale: Animated.AnimatedInterpolation<number>;
  opacity: Animated.AnimatedInterpolation<number>;
  rotation?: Animated.AnimatedInterpolation<string>;
  particles?: { angle: number; translateX: Animated.AnimatedInterpolation<number>; translateY: Animated.AnimatedInterpolation<number> }[];
};

function createBurstVisuals(channel: EventChannel, progress: Animated.Value, size: number): BurstVisuals {
  const interpolate = (inputRange: number[], outputRange: number[]) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
  switch (channel) {
    case 'shield': return {
      scale: interpolate([0, 0.52, 1], [0.25, 1, 1.7]),
      opacity: interpolate([0, 0.5, 0.72, 1], [0, 1, 0.85, 0]),
    };
    case 'armor': return {
      scale: interpolate([0, 0.45, 1], [0.65, 1, 1.35]),
      opacity: interpolate([0, 0.4, 0.75, 1], [0, 1, 0.9, 0]),
    };
    case 'repair': return {
      scale: interpolate([0, 0.35, 1], [0.5, 1.12, 1.3]),
      opacity: interpolate([0, 0.12, 0.72, 1], [0, 1, 1, 0]),
      particles: PARTICLE_ANGLES.map((angle, index) => {
        const radians = angle * Math.PI / 180;
        const travel = size * (0.65 + index * 0.08);
        return {
          angle,
          translateX: interpolate([0, 1], [0, travel * Math.cos(radians)]),
          translateY: interpolate([0, 1], [0, travel * Math.sin(radians)]),
        };
      }),
    };
    case 'ghost': return {
      scale: interpolate([0, 1], [0.6, 1.8]),
      opacity: interpolate([0, 0.2, 1], [0, 0.85, 0]),
    };
    case 'revive': return {
      scale: interpolate([0, 0.38, 0.72, 1], [0.4, 1, 1.65, 2.2]),
      opacity: interpolate([0, 0.3, 0.68, 1], [0, 1, 0.9, 0]),
      rotation: progress.interpolate({ inputRange: [0, 1], outputRange: ['-160deg', '200deg'], extrapolate: 'clamp' }),
    };
  }
}

const DefenseBurst = memo(function DefenseBurst({ size, event, onComplete }: {
  size: number;
  event: DefenseVisualEvent;
  onComplete: (channel: EventChannel, id: number) => void;
}) {
  const channel = getEventChannel(event.type);
  const initialValue = event.type === 'shield_break' ? 0.55 : event.type === 'armor_hit' ? 0.45 : event.type === 'second_chance_revive' ? 0.4 : 0;
  const progress = useAnimationValue(initialValue);
  const visuals = useMemo(() => createBurstVisuals(channel, progress, size), [channel, progress, size]);

  useEffect(() => {
    let disposed = false;
    progress.setValue(initialValue);
    const animation = createEventAnimation(event.type, progress);
    animation.start(({ finished }) => {
      if (finished && !disposed) onComplete(channel, event.id);
    });
    return () => {
      disposed = true;
      animation.stop();
      progress.stopAnimation();
    };
  }, [channel, event.id, event.type, initialValue, onComplete, progress]);

  if (channel === 'repair') {
    return <>{visuals.particles?.map(particle => (
      <Animated.Text key={particle.angle} style={[styles.repairPlus, {
        left: size * 0.35, top: size * 0.3, opacity: visuals.opacity,
        transform: [{ translateX: particle.translateX }, { translateY: particle.translateY }, { scale: visuals.scale }],
      }]}>+</Animated.Text>
    ))}</>;
  }
  if (channel === 'revive') {
    return <>
      <Animated.View style={[styles.reviveFlash, {
        width: size + 16, height: size + 16, borderRadius: size, left: -8, top: -8,
        opacity: visuals.opacity, transform: [{ scale: visuals.scale }],
      }]} />
      <Animated.Text style={[styles.reviveIcon, {
        left: size * 0.22, top: -size * 0.08, opacity: visuals.opacity,
        transform: [{ scale: visuals.scale }, { rotate: visuals.rotation! }],
      }]}>↻</Animated.Text>
    </>;
  }
  const inset = channel === 'shield' ? 10 : 6;
  return <Animated.View style={[
    styles.eventRing,
    channel === 'shield' ? styles.shieldEvent : channel === 'armor' ? styles.armorEvent : styles.ghostWave,
    {
      width: size + inset * 2, height: size + inset * 2, borderRadius: size, left: -inset, top: -inset,
      opacity: visuals.opacity,
      transform: [{ scale: visuals.scale }, { rotate: channel === 'armor' ? '18deg' : '0deg' }],
    },
  ]} />;
});

// Eventos de canais diferentes podem coexistir (ex.: reparo durante quebra de
// escudo). Ao terminar, suas views são desmontadas; o carro continua montado.
const DefenseEvents = memo(function DefenseEvents({ size, event }: { size: number; event?: DefenseVisualEvent }) {
  const [active, setActive] = useState<Partial<Record<EventChannel, DefenseVisualEvent>>>({});
  const lastEventId = useRef<number | null>(null);
  const eventId = event?.id;
  const eventType = event?.type;
  const amount = event?.amount;

  useEffect(() => {
    if (eventId === undefined || eventType === undefined || eventId === lastEventId.current) return;
    lastEventId.current = eventId;
    const snapshot = { id: eventId, type: eventType, amount };
    setActive(previous => ({ ...previous, [getEventChannel(eventType)]: snapshot }));
  }, [eventId, eventType, amount]);

  const onComplete = useCallback((channel: EventChannel, id: number) => {
    setActive(previous => {
      if (previous[channel]?.id !== id) return previous;
      const next = { ...previous };
      delete next[channel];
      return next;
    });
  }, []);

  return <>{EVENT_CHANNELS.map(channel => {
    const item = active[channel];
    return item ? <DefenseBurst key={`${channel}:${item.id}`} size={size} event={item} onComplete={onComplete} /> : null;
  })}</>;
});

function DefenseCardVisual({ size, shieldCharges, armorCharges, isGhost, secondChanceReady, isInvincible, event, children }: DefenseCardVisualProps) {
  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      {isGhost && <>
        <View style={[styles.ghostTrail, { width: size * 0.82, height: size * 0.52, left: -size * 0.42, top: size * 0.28, opacity: 0.14 }]} />
        <View style={[styles.ghostTrail, { width: size * 0.72, height: size * 0.46, left: -size * 0.7, top: size * 0.31, opacity: 0.08 }]} />
      </>}
      {shieldCharges > 0 && <ShieldAura size={size} />}
      {armorCharges > 0 && <ArmorAura size={size} charges={armorCharges} />}
      {secondChanceReady && <SecondChanceAura size={size} />}

      {/* A identidade deste nó é fixa, mesmo ao ativar/remover todas as auras. */}
      <View key="car" style={[styles.carLayer, { opacity: isGhost ? 0.42 : 1 }]}>
        {children}
      </View>

      {isInvincible && <InvulnerabilityAura size={size} />}
      <DefenseEvents size={size} event={event} />
    </View>
  );
}

export default memo(DefenseCardVisual);

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  invulnerabilityRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 5,
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
