import { usePlayerStore } from '@/src/store/playerStore';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const profile = usePlayerStore((state) => state.profile);
  
  const scaleValue = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer(require('@/assets/audio/wild_runners_main_title.mp3'));

  useEffect(() => {
    player.loop = true;
    player.play();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.06,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        })
      ])
    );

    pulseAnimation.start();

    return () => {
        pulseAnimation.stop();
    };
  }, [player]);

  const handleStartPress = () => {
    player.pause();

    if (!profile) {
      router.push({ pathname: '/LoadingScreen', params: { next: '/RegistrationScreen' } });
    } else {
      router.push({ pathname: '/LoadingScreen', params: { next: '/CarSelectionScreen' } }); 
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/gameLogoV3.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <TouchableOpacity activeOpacity={0.85} onPress={handleStartPress}>
        <Animated.View style={[styles.button, { transform: [{ scale: scaleValue }] }]}>
          <Text style={styles.buttonText}>PRESSIONE PARA COMEÇAR</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
  button: {
    backgroundColor: '#FFD700', 
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#000000', 
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10, 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.5,
  }
});