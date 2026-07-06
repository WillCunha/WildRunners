import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const TIPS = [
  "Use suas cartas de corrida no momento certo para virar o jogo!",
  "Gatos correm mais rápido, mas cachorros têm mais resistência?",
  "Preparando os motores e embaralhando o deck...",
  "Dica: Curvas fechadas exigem mais controle!",
];

export default function LoadingScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams(); // Pega a rota de destino
  
  const [tip, setTip] = useState('');
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);

    Animated.timing(progress, {
      toValue: 1,
      duration: 4500, // Tempo de loading
      easing: Easing.linear,
      useNativeDriver: false, 
    }).start(() => {
      // Navega para a próxima tela substituindo o Loading na pilha
      if (next) {
        router.replace(next as string);
      } else {
        router.replace('/'); // Fallback de segurança
      }
    });
  }, []);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>CARREGANDO...</Text>
        
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, { width: widthInterpolate }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardContainer: { width: '90%', backgroundColor: '#333', borderWidth: 4, borderColor: '#000000', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 20, letterSpacing: 2 },
  tipBox: { width: '100%', backgroundColor: '#FFF275', borderWidth: 3, borderColor: '#000', borderRadius: 12, padding: 16, marginBottom: 30 },
  tipText: { fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center', lineHeight: 22 },
  progressBarBackground: { width: '100%', height: 24, backgroundColor: '#e0e0e0', borderWidth: 3, borderColor: '#000', borderRadius: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#34C759' },
});