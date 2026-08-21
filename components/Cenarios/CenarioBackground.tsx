import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

export type CenarioId =
  | 'sao_paulo'
  | 'rio';

export type SkyTheme =
  | 'day'
  | 'night'
  | 'sunset'
  | 'cloudy';

type CenarioAssets = {
  skies: Partial<Record<SkyTheme, ImageSourcePropType>>;

  farCity: ImageSourcePropType;
  landmarks: ImageSourcePropType;
  nearCity: ImageSourcePropType;
};

interface CenarioBackgroundProps {
  isMoving: boolean;
  mapId?: CenarioId;
  skyTheme?: SkyTheme;
  groundY: number;
}


/* =========================================================
   ASSETS DOS CENÁRIOS
========================================================= */

const CENARIOS: Partial<Record<CenarioId, CenarioAssets>> = {

  sao_paulo: {

    skies: {
      day: require(
        '@/assets/images/components/cenarios/sao_paulo/sky_day.png'
      ),

      /*
      Depois:

      night: require(
        '@/assets/images/components/cenarios/sao_paulo/sky_night.png'
      ),

      sunset: require(
        '@/assets/images/components/cenarios/sao_paulo/sky_sunset.png'
      ),

      cloudy: require(
        '@/assets/images/components/cenarios/sao_paulo/sky_cloudy.png'
      ),
      */
    },

    farCity: require(
      '@/assets/images/components/cenarios/sao_paulo/city_far.png'
    ),

    landmarks: require(
      '@/assets/images/components/cenarios/sao_paulo/landmarks.png'
    ),

    nearCity: require(
      '@/assets/images/components/cenarios/sao_paulo/city_near.png'
    ),
  },

};


/* =========================================================
   COMPONENTE
========================================================= */

const CenarioBackground: React.FC<CenarioBackgroundProps> = ({
  isMoving,
  mapId = 'sao_paulo',
  skyTheme = 'day',
  groundY,
}) => {

  const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  } = useWindowDimensions();


  /*
   * Cada plano possui sua própria posição.
   *
   * NÃO usamos State aqui.
   * Animated.Value não provoca re-render do React.
   */

  const farX =
    useRef(new Animated.Value(0)).current;

  const landmarkX =
    useRef(new Animated.Value(0)).current;

  const nearX =
    useRef(new Animated.Value(0)).current;


  /*
   * Cenário escolhido.
   */

  const cenario =
    CENARIOS[mapId] ??
    CENARIOS.sao_paulo!;


  /*
   * Caso o céu solicitado ainda não exista,
   * usamos o céu diurno.
   */

  const skySource =
    cenario.skies[skyTheme] ??
    cenario.skies.day!;


  /* =========================================================
     PARALLAX
  ========================================================= */

  useEffect(() => {

    let farAnimation:
      Animated.CompositeAnimation | null = null;

    let landmarkAnimation:
      Animated.CompositeAnimation | null = null;

    let nearAnimation:
      Animated.CompositeAnimation | null = null;


    if (isMoving) {

      /*
       * DISTANTE
       *
       * Move muito lentamente.
       */

      farAnimation = Animated.loop(

        Animated.timing(farX, {

          toValue: -SCREEN_WIDTH,

          duration: 60000,

          easing: Easing.linear,

          useNativeDriver: true,

        })

      );


      /*
       * LANDMARKS
       *
       * Movimento intermediário.
       */

      landmarkAnimation = Animated.loop(

        Animated.timing(landmarkX, {

          toValue: -SCREEN_WIDTH,

          duration: 36000,

          easing: Easing.linear,

          useNativeDriver: true,

        })

      );


      /*
       * PRÉDIOS PRÓXIMOS
       *
       * Movem mais rápido.
       */

      nearAnimation = Animated.loop(

        Animated.timing(nearX, {

          toValue: -SCREEN_WIDTH,

          duration: 18000,

          easing: Easing.linear,

          useNativeDriver: true,

        })

      );


      farAnimation.start();

      landmarkAnimation.start();

      nearAnimation.start();

    } else {

      farX.stopAnimation();

      landmarkX.stopAnimation();

      nearX.stopAnimation();

    }


    return () => {

      farAnimation?.stop();

      landmarkAnimation?.stop();

      nearAnimation?.stop();

    };

  }, [
    isMoving,
    SCREEN_WIDTH,
    farX,
    landmarkX,
    nearX,
  ]);


return (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {/* CÉU */}
    <Animated.Image
      source={skySource}
      resizeMode="cover"
      style={[
        styles.fullScreen,
        {
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        },
      ]}
    />

    {/* ÁREA RECORTADA: nada passa da linha da pista */}
    <View
      pointerEvents="none"
      style={[
        styles.cityClip,
        {
          height: groundY,
        },
      ]}
    >
      <ParallaxLayer
        source={cenario.farCity}
        translateX={farX}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        opacity={0.72}
      />

      <ParallaxLayer
        source={cenario.landmarks}
        translateX={landmarkX}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        opacity={1}
      />

      <ParallaxLayer
        source={cenario.nearCity}
        translateX={nearX}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        opacity={1}
      />
    </View>
  </View>
);
};


/* =========================================================
   CAMADA REPETÍVEL
========================================================= */

interface ParallaxLayerProps {

  source: ImageSourcePropType;

  translateX: Animated.Value;

  width: number;

  height: number;

  opacity?: number;

}


const ParallaxLayer: React.FC<ParallaxLayerProps> = ({

  source,

  translateX,

  width,

  height,

  opacity = 1,

}) => {

  return (

    <Animated.View

      style={[
        styles.parallaxStrip,

        {
          width: width * 2,

          height,

          opacity,

          transform: [
            {
              translateX,
            },
          ],
        },
      ]}

    >

      <Animated.Image

        source={source}

        resizeMode="cover"

        style={{
          width,
          height,
        }}

      />


      <Animated.Image
        source={source}
        resizeMode="cover"
        style={{
          width,
          height,
        }}

      />

    </Animated.View>

  );

};


/* =========================================================
   STYLES
========================================================= */
const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  cityClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },

  parallaxStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
  },
});


export default CenarioBackground;