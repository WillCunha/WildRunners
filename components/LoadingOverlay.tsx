import { useLanguage } from '@/context/LanguageContext';
import { useLoadingStore } from '@/src/store/LoadingStore';
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function LoadingOverlay() {
  const { t } = useLanguage();

  const {
    isLoading,
    tip,
    completed,
    total,
    progress,
    hasMeasuredProgress,
  } = useLoadingStore();

  const [isVisible, setIsVisible] =
    useState(isLoading);

  const progressAnim = useRef(
    new Animated.Value(progress),
  ).current;

  const opacity = useRef(
    new Animated.Value(isLoading ? 1 : 0),
  ).current;

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  }, [isLoading, opacity]);

  useEffect(() => {
    if (!hasMeasuredProgress) {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      return;
    }

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [
    hasMeasuredProgress,
    progress,
    progressAnim,
  ]);

  const widthInterpolate =
    progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

  const percentage =
    total > 0
      ? Math.round(
          (completed / total) * 100,
        )
      : 0;

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity },
      ]}
      pointerEvents={
        isLoading ? 'auto' : 'none'
      }
    >
      <View style={styles.cardContainer}>
        <Text style={styles.title}>
          {t('loading.title')}
        </Text>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            {tip}
          </Text>
        </View>

        <View
          style={styles.progressBarBackground}
        >
          {hasMeasuredProgress ? (
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: widthInterpolate,
                },
              ]}
            />
          ) : (
            <View
              style={
                styles.indeterminateContainer
              }
            >
              <ActivityIndicator
                size="small"
                color="#111"
              />
            </View>
          )}
        </View>

        <Text style={styles.progressText}>
          {hasMeasuredProgress
            ? `${percentage}%  •  ${completed}/${total}`
            : 'Preparando...'}
        </Text>
      </View>

      <Image
        source={require(
          '@/assets/images/logo1024v1.png'
        )}
        style={styles.wfLogo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
    elevation: 99999,
  },

  cardContainer: {
    width: '90%',
    backgroundColor: '#333',
    borderWidth: 4,
    borderColor: '#000',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 2,
    fontFamily: 'Fredoka-Bold',
  },

  tipBox: {
    width: '100%',
    backgroundColor: '#FFF275',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },

  tipText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Fredoka-Medium',
  },

  progressBarBackground: {
    width: '100%',
    height: 24,
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },

  indeterminateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
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
