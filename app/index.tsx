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

      <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={handleStartPress}>
        <Text style={styles.buttonText}>PRESSIONE PARA COMEÇAR</Text>

        {/* detalhe inferior */}
        <View style={styles.bottomGlow} />
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
    width: 800,
    height: 800,
  },
  button: {
    width: 290,
    height: 70,
    backgroundColor: "#121212",
    borderWidth: 1.5,
    borderColor: "#C79A32",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  buttonText: {
    color: "#E9C56C",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -2,
    width: 80,
    height: 4,
    borderRadius: 100,
    backgroundColor: "#FFD24D",
    shadowColor: "#FFD24D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
});