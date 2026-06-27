import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const IMAGEM_SAO_PAULO = require('@/assets/images/components/cenarios/sao_pauloV4.png');

interface CenarioBackgroundProps {
  isMoving: boolean;
}

const CenarioBackground: React.FC<CenarioBackgroundProps> = ({ isMoving }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  // Precisamos rastrear o valor para dar o pause/play exatamente onde parou
  const [currentXValue, setCurrentXValue] = useState(0);

  useEffect(() => {
    // Escuta o valor da animação para guardar no estado quando pausar
    const listenerId = scrollX.addListener(({ value }) => {
      setCurrentXValue(value);
    });

    return () => {
      scrollX.removeListener(listenerId);
    };
  }, [scrollX]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isMoving) {
      // Inicia o loop infinito
      animation = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -SCREEN_WIDTH, // Move uma largura de tela inteira para a esquerda
          duration: 15000, // Ajuste de velocidade (quanto maior, mais lento)
          easing: Easing.linear, // Movimento constante, sem aceleração/desaceleração
          useNativeDriver: true, // Crucial para performance suave em 60fps
        })
      );
      animation.start();
    } else {
      // Se parou (countdown/gameover), congela onde está
      scrollX.stopAnimation();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isMoving, scrollX, SCREEN_WIDTH]);

  // Interpolação para a segunda imagem que vem grudada atrás
  // Quando a Imagem 1 estiver na posição translateX: 0, a Imagem 2 estará na translateX: SCREEN_WIDTH.
  // Quando a Imagem 1 estiver na posição translateX: -SCREEN_WIDTH (toda fora), a Imagem 2 estará na translateX: 0 (cobrindo a tela).
  const segundaImagemX = scrollX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0],
    outputRange: [0, SCREEN_WIDTH],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Primeira Imagem de Fundo (A que começa na tela) */}
      <Animated.Image
        source={IMAGEM_SAO_PAULO}
        resizeMode="stretch" // Garante que a imagem se estique para ocupar exatamente o container
        style={[
          styles.backgroundImage,
          {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            transform: [{ translateX: scrollX }],
          },
        ]}
      />

      {/* Segunda Imagem de Fundo (A emenda à direita) */}
      <Animated.Image
        source={IMAGEM_SAO_PAULO}
        resizeMode="stretch"
        style={[
          styles.backgroundImage,
          {
            position: 'absolute',
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            // Usamos a interpolação para ela seguir a primeira
            transform: [{ translateX: segundaImagemX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default CenarioBackground;