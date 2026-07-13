import { useLoadingStore } from '@/src/store/LoadingStore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export default function LoadingOverlay() {
  const { isLoading, tip } = useLoadingStore();
  
  const [isVisible, setIsVisible] = useState(isLoading);
  
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      
    } else {
      // 2. Usamos o callback do .start() para desmontar a tela APENAS quando a opacidade zerar
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          setIsVisible(false);
        }
      });
    }
  }, [isLoading]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // 3. Substituímos a checagem que causava o erro pelo nosso novo estado
  if (!isVisible) return null; 

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={isLoading ? 'auto' : 'none'}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>CARREGANDO...</Text>
        
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, { width: widthInterpolate }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 99999, elevation: 99999 },
  cardContainer: { width: '90%', backgroundColor: '#333', borderWidth: 4, borderColor: '#000000', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 20, letterSpacing: 2 },
  tipBox: { width: '100%', backgroundColor: '#FFF275', borderWidth: 3, borderColor: '#000', borderRadius: 12, padding: 16, marginBottom: 30 },
  tipText: { fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center', lineHeight: 22 },
  progressBarBackground: { width: '100%', height: 24, backgroundColor: '#e0e0e0', borderWidth: 3, borderColor: '#000', borderRadius: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#34C759' },
});