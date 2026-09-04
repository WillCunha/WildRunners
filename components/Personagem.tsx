import { charactersMap } from '@/src/utils/charactersMap';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const PLAYER_SIZE = 60;

export default function Personagem({ isGrounded, isCrouching, skinId = 'default', isMoving = true }) {
  
  const cycle = useRef(new Animated.Value(0)).current;
  const crouchAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // --- CONTROLE DA ANIMAÇÃO DE CORRIDA ---
  useEffect(() => {
    if (isMoving) {
      animRef.current = Animated.loop(
        Animated.timing(cycle, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      if (animRef.current) {
        animRef.current.stop();
      }
      cycle.setValue(0); // Retorna à pose estática inicial
    }

    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [isMoving]);

  useEffect(() => {
    Animated.timing(crouchAnim, {
      toValue: isCrouching ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isCrouching]);

  const handOneX = cycle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-15, 15, -15] });
  const handTwoX = cycle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [15, -15, 15] });
  const feetOneX = cycle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [10, -20, 10] });
  const feetTwoX = cycle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-20, 10, -20] });
  const headY = cycle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, 0] });

  // --- INTERPOLAÇÕES DO AGACHAMENTO ---
  const headCrouchY = crouchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25], 
  });

  const torsoScaleY = crouchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5], 
  });

  const torsoCrouchY = crouchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const currentSkin = charactersMap[skinId] || charactersMap['default'];

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={currentSkin.feetOne} 
        style={[styles.part, styles.feet, { transform: [{ translateX: feetTwoX }] }]} 
      />
      <Animated.Image 
        source={currentSkin.handTwo} 
        style={[styles.part, styles.hand, { transform: [{ translateX: handTwoX }] }]} 
      />
      <Animated.Image 
        source={currentSkin.torso}
        style={[styles.part, styles.torso, { transform: [{ translateY: torsoCrouchY }, { scaleY: torsoScaleY }] }]} 
      />
      <Animated.Image 
        source={currentSkin.head}
        style={[styles.part, styles.head, { transform: [{ translateY: headY }, { translateY: headCrouchY }] }]} 
      />
      <Animated.Image 
        source={currentSkin.feetOne} 
        style={[styles.part, styles.feet, { transform: [{ translateX: feetOneX }] }]} 
      />
      <Animated.Image 
        source={currentSkin.handOne} 
        style={[styles.part, styles.hand, { transform: [{ translateX: handOneX }] }]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: PLAYER_SIZE, height: PLAYER_SIZE, alignItems: 'center', justifyContent: 'center' },
  part: { position: 'absolute', resizeMode: 'contain' },
  head: { width: 40, height: 40, top: -20 },
  torso: { width: 35, height: 45, top: 0 },
  hand: { width: 20, height: 20, top: 15 },
  feet: { width: 25, height: 20, bottom: -10 },
});