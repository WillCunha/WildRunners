import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const IMAGEM_SAO_PAULO = require('@/assets/images/components/cenarios/sao_pauloV4.png');

interface CenarioBackgroundProps {
  isMoving: boolean;
  mapImage: string;
}

const CenarioBackground: React.FC<CenarioBackgroundProps> = ({ isMoving, mapImage }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  const [currentXValue, setCurrentXValue] = useState(0);

  useEffect(() => {
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
      animation = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -SCREEN_WIDTH, 
          duration: 15000, 
          easing: Easing.linear, 
          useNativeDriver: true, 
        })
      );
      animation.start();
    } else {
      scrollX.stopAnimation();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isMoving, scrollX, SCREEN_WIDTH]);

 
  const segundaImagemX = scrollX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0],
    outputRange: [0, SCREEN_WIDTH],
  });

  const fonteCenario = mapImage ? {uri: mapImage} : IMAGEM_SAO_PAULO;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Primeira Imagem de Fundo (A que começa na tela) */}
      <Animated.Image
        source={fonteCenario}
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