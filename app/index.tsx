import { useLoadingStore } from '@/src/store/LoadingStore';
import { usePlayerStore } from '@/src/store/playerStore';
import { useAssets } from 'expo-asset';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const profile = usePlayerStore((state) => state.profile);
  const { width } = useWindowDimensions();

  const showLoading = useLoadingStore((state) => state.showLoading);
  const hideLoading = useLoadingStore((state) => state.hideLoading);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const arrowProgress = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(
    require('@/assets/audio/wild_runners_main_title.mp3')
  );

  const [assets] = useAssets([
    require('@/assets/images/components/background/start_screen.png'),
    require('@/assets/images/gameLogoV3.png'),
    require('@/assets/images/logo1024v1.png'),
  ]);

  useEffect(() => {
    if (assets) {
      hideLoading();
    } else {
      showLoading();
    }
  }, [assets, hideLoading, showLoading]);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.5;
    player.play();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.045,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ])
    );

    const arrowsAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(1700),
        Animated.timing(arrowProgress, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(arrowProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(850),
      ])
    );

    pulseAnimation.start();
    arrowsAnimation.start();

    return () => {
      pulseAnimation.stop();
      arrowsAnimation.stop();
    };
  }, [player, scaleValue, arrowProgress]);

  const handleStartPress = () => {
    player.pause();

    if (!profile) {
      router.push({
        pathname: '/LoadingScreen',
        params: { next: '/RegistrationScreen' },
      });
    } else {
      router.push({
        pathname: '/LoadingScreen',
        params: { next: '/CarSelectionScreen' },
      });
    }
  };

  if (!assets) {
    return null;
  }

  const buttonWidth = width * 0.5;

  const arrowTranslateX = arrowProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, buttonWidth + 20],
  });

  const arrowOpacity = arrowProgress.interpolate({
    inputRange: [0, 0.08, 0.82, 1],
    outputRange: [0, 0.9, 0.9, 0],
  });

  return (
    <ImageBackground
      source={require('@/assets/images/components/background/background_home.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Image
          source={require('@/assets/images/gameLogoV5.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Animated.View
          style={[
            styles.buttonWrapper,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartPress}
            activeOpacity={0.88}
          >
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.speedArrows,
                {
                  opacity: arrowOpacity,
                  transform: [{ translateX: arrowTranslateX }],
                },
              ]}
            >
              &gt;&gt;&gt;
            </Animated.Text>

            <Text style={styles.buttonText}>PRESSIONE PARA COMEÇAR</Text>
            <View style={styles.bottomGlow} />
          </TouchableOpacity>
        </Animated.View>

        <Image
          source={require('@/assets/images/logo1024v1.png')}
          style={styles.wfLogo}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  logo: {
    width: 450,
    height: 170,
  },

  buttonWrapper: {
    width: '50%',
  },

  button: {
    width: '100%',
    height: 54,
    backgroundColor: 'rgba(12,12,12,0.94)',
    borderWidth: 1.5,
    borderColor: '#D4A734',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
    position: 'relative',
    overflow: 'hidden',

    shadowColor: '#FFD24D',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },

  buttonText: {
    color: '#F2C55A',
    fontWeight: '800',
    letterSpacing: 2.2,
    fontSize: 22,
    textAlign: 'center',
    zIndex: 2,
  },

  speedArrows: {
    position: 'absolute',
    left: 0,
    color: '#FFF1A8',
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: -3,
    zIndex: 1,
    textShadowColor: '#FFD24D',
    textShadowRadius: 8,
  },

  bottomGlow: {
    position: 'absolute',
    bottom: -1,
    width: 105,
    height: 3,
    borderRadius: 10,
    backgroundColor: '#FFD24D',
    shadowColor: '#FFD24D',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },

  wfLogo: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    width: 50,
    height: 50,
    opacity: 0.90,
  },
});
