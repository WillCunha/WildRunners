import { useLanguage } from '@/context/LanguageContext';
import { useLoadingStore } from '@/src/store/LoadingStore';
import { usePlayerStore } from '@/src/store/playerStore';
import { useAssets } from 'expo-asset';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
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
  const profile = usePlayerStore(state => state.profile);
  const { width } = useWindowDimensions();

  const {
    t,
    hasSelectedLanguage,
    isLoading: isLanguageLoading,
  } = useLanguage();

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const scanProgress = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(
    require('@/assets/audio/wild_runners_main_title.mp3'),
  );

  const [assets] = useAssets([
    require('@/assets/images/components/background/background_home.png'),
    require('@/assets/images/gameLogoV5.png'),
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
          toValue: 1.025,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.delay(320),
      ]),
    );

    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(1350),
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1050),
      ]),
    );

    pulseAnimation.start();
    scanAnimation.start();

    return () => {
      pulseAnimation.stop();
      scanAnimation.stop();
    };
  }, [player, scaleValue, scanProgress]);

  const handleStartPress = () => {
    if (isLanguageLoading) {
      return;
    }

    player.pause();

    const nextScreen = !profile
      ? '/RegistrationScreen'
      : '/CarSelectionScreen';

    if (!hasSelectedLanguage) {
      router.push({
        pathname: '/LanguageSelectionScreen',
        params: {
          next: nextScreen,
        },
      });

      return;
    }

    router.push({
      pathname: '/LoadingScreen',
      params: {
        next: nextScreen,
      },
    });
  };

  if (!assets) {
    return null;
  }

  const buttonWidth = Math.min(Math.max(width * 0.46, 310), 520);

  const scanTranslateX = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-110, buttonWidth + 40],
  });

  const scanOpacity = scanProgress.interpolate({
    inputRange: [0, 0.08, 0.86, 1],
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
            {
              width: buttonWidth,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.outerRailLeft} />
          <View style={styles.outerRailRight} />

          <TouchableOpacity
            style={styles.button}
            onPress={handleStartPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(10,10,13,0.98)',
                'rgba(27,28,33,0.96)',
                'rgba(11,11,14,0.98)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View pointerEvents="none" style={styles.innerBorder} />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.speedScan,
                {
                  opacity: scanOpacity,
                  transform: [{ translateX: scanTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(97,231,255,0)',
                  'rgba(97,231,255,0.32)',
                  'rgba(255,255,255,0.55)',
                  'rgba(97,231,255,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanGradient}
              />
            </Animated.View>

            <View pointerEvents="none" style={styles.chevronZoneLeft}>
              <Text style={styles.chevrons}>››</Text>
            </View>

            <View pointerEvents="none" style={styles.buttonCopy}>
              <View style={styles.buttonMetaRow}>
                <View style={styles.metaLine} />
                <Text style={styles.buttonMeta}>WR // START</Text>
                <View style={styles.metaLine} />
              </View>

              <Text style={styles.buttonText}>{t('start.pressToStart')}</Text>
            </View>

            <View pointerEvents="none" style={styles.chevronZoneRight}>
              <Text style={styles.chevrons}>››</Text>
            </View>

            <View pointerEvents="none" style={styles.bottomAccent} />
            <View pointerEvents="none" style={styles.topAccent} />
            <View pointerEvents="none" style={styles.cornerTopLeft} />
            <View pointerEvents="none" style={styles.cornerBottomRight} />
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

const ACCENT = '#61E7FF';

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
    backgroundColor: 'rgba(0,0,0,0.19)',
  },

  logo: {
    width: 450,
    height: 170,
  },

  buttonWrapper: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  outerRailLeft: {
    position: 'absolute',
    left: 0,
    top: 17,
    width: 3,
    height: 38,
    backgroundColor: 'rgba(97,231,255,0.65)',
  },

  outerRailRight: {
    position: 'absolute',
    right: 0,
    bottom: 17,
    width: 3,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },

  button: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',

    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  innerBorder: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },

  speedScan: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 105,
  },

  scanGradient: {
    flex: 1,
    transform: [{ skewX: '-18deg' }],
  },

  chevronZoneLeft: {
    position: 'absolute',
    left: 17,
    height: '100%',
    justifyContent: 'center',
  },

  chevronZoneRight: {
    position: 'absolute',
    right: 17,
    height: '100%',
    justifyContent: 'center',
  },

  chevrons: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -4,
    opacity: 0.9,
    textShadowColor: ACCENT,
    textShadowRadius: 8,
  },

  buttonCopy: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 62,
    zIndex: 2,
  },

  buttonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },

  metaLine: {
    width: 21,
    height: 1,
    backgroundColor: 'rgba(97,231,255,0.55)',
  },

  buttonMeta: {
    color: 'rgba(255,255,255,0.44)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2.5,
    fontSize: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(97,231,255,0.28)',
    textShadowRadius: 8,
  },

  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: '35%',
    right: '35%',
    height: 2,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 1,
    shadowRadius: 9,
    elevation: 5,
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 18,
    width: 70,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },

  cornerTopLeft: {
    position: 'absolute',
    left: 7,
    top: 7,
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: ACCENT,
  },

  cornerBottomRight: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },

  wfLogo: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    width: 50,
    height: 50,
    opacity: 0.9,
  },
});
