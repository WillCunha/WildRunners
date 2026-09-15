import React, { useMemo, useRef } from 'react';
import {
  Animated,
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

export type CenarioId =
  | 'sao_paulo'
  | 'rio'
  | 'salvador'
  | 'manaus'
  | 'brasilia'
  | 'balneario_camboriu';

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
  // Mantido opcional para compatibilidade com chamadas antigas.
  // O movimento real agora vem de travelX, alimentado pela física do Mapa.
  isMoving?: boolean;
  travelX?: Animated.Value;
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
  rio: {
    skies: {
      day: require(
        '@/assets/images/components/cenarios/rio/sky_day.png'
      ),
      /*
      Depois:
      night: require(
        '@/assets/images/components/cenarios/rio/sky_night.png'
      ),
      sunset: require(
        '@/assets/images/components/cenarios/rio/sky_sunset.png'
      ),
      cloudy: require(
        '@/assets/images/components/cenarios/rio/sky_cloudy.png'
      ),
      */
    },
    farCity: require(
      '@/assets/images/components/cenarios/rio/city_far.png'
    ),
    landmarks: require(
      '@/assets/images/components/cenarios/rio/landmarks.png'
    ),
    nearCity: require(
      '@/assets/images/components/cenarios/rio/city_near.png'
    ),
  },
  salvador: {
    skies: {
      day: require(
        '@/assets/images/components/cenarios/salvador/sky_day.png'
      ),
      /*
      Depois:
      night: require(
        '@/assets/images/components/cenarios/salvador/sky_night.png'
      ),
      sunset: require(
        '@/assets/images/components/cenarios/salvador/sky_sunset.png'
      ),
      cloudy: require(
        '@/assets/images/components/cenarios/salvador/sky_cloudy.png'
      ),
      */
    },
    farCity: require(
      '@/assets/images/components/cenarios/salvador/city_far.png'
    ),
    landmarks: require(
      '@/assets/images/components/cenarios/salvador/landmarks.png'
    ),
    nearCity: require(
      '@/assets/images/components/cenarios/salvador/city_near.png'
    ),
  },
  balneario_camboriu: {
    skies: {
      day: require(
        '@/assets/images/components/cenarios/balneario_camboriu/sky_day.png'
      ),
      /*
      Depois:
      night: require(
        '@/assets/images/components/cenarios/balneario_camboriu/sky_night.png'
      ),
      sunset: require(
        '@/assets/images/components/cenarios/balneario_camboriu/sky_sunset.png'
      ),
      cloudy: require(
        '@/assets/images/components/cenarios/balneario_camboriu/sky_cloudy.png'
      ),
      */
    },
    farCity: require(
      '@/assets/images/components/cenarios/balneario_camboriu/city_far.png'
    ),
    landmarks: require(
      '@/assets/images/components/cenarios/balneario_camboriu/landmarks.png'
    ),
    nearCity: require(
      '@/assets/images/components/cenarios/balneario_camboriu/city_near.png'
    ),
  },
  brasilia: {
    skies: {
      day: require(
        '@/assets/images/components/cenarios/brasilia/sky_day.png'
      ),
      /*
      Depois:
      night: require(
        '@/assets/images/components/cenarios/brasilia/sky_night.png'
      ),
      sunset: require(
        '@/assets/images/components/cenarios/brasilia/sky_sunset.png'
      ),
      cloudy: require(
        '@/assets/images/components/cenarios/brasilia/sky_cloudy.png'
      ),
      */
    },
    farCity: require(
      '@/assets/images/components/cenarios/brasilia/city_far.png'
    ),
    landmarks: require(
      '@/assets/images/components/cenarios/brasilia/landmarks.png'
    ),
    nearCity: require(
      '@/assets/images/components/cenarios/brasilia/city_near.png'
    ),
  },
  manaus: {
    skies: {
      day: require(
        '@/assets/images/components/cenarios/manaus/sky_day.png'
      ),
      /*
      Depois:
      night: require(
        '@/assets/images/components/cenarios/manaus/sky_night.png'
      ),
      sunset: require(
        '@/assets/images/components/cenarios/manaus/sky_sunset.png'
      ),
      cloudy: require(
        '@/assets/images/components/cenarios/manaus/sky_cloudy.png'
      ),
      */
    },
    farCity: require(
      '@/assets/images/components/cenarios/manaus/city_far.png'
    ),
    landmarks: require(
      '@/assets/images/components/cenarios/manaus/landmarks.png'
    ),
    nearCity: require(
      '@/assets/images/components/cenarios/manaus/city_near.png'
    ),
  },
};


/* =========================================================
   COMPONENTE
========================================================= */

const FAR_PARALLAX_FACTOR = 0.18;
const LANDMARK_PARALLAX_FACTOR = 0.46;
const NEAR_PARALLAX_FACTOR = 1.0;

const CenarioBackground: React.FC<CenarioBackgroundProps> = ({
  travelX,
  mapId = 'sao_paulo',
  skyTheme = 'day',
  groundY,
}) => {
  const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  } = useWindowDimensions();

  // Fallback mantém o componente seguro caso alguma tela antiga ainda não envie travelX.
  const fallbackTravelX = useRef(new Animated.Value(0)).current;
  const travel = travelX ?? fallbackTravelX;
  const loopWidth = Math.max(1, SCREEN_WIDTH);

  const cenario =
    CENARIOS[mapId] ??
    CENARIOS.sao_paulo!;

  const skySource =
    cenario.skies[skyTheme] ??
    cenario.skies.day!;

  /* =========================================================
     PARALLAX LIGADO À VELOCIDADE REAL

     travelX é incrementado pelo loop de física do Mapa usando
     playerSpeed.current. Não existe setState nem Animated.loop aqui.

     Cada camada deriva do MESMO deslocamento com uma profundidade:
     - far:       18%
     - landmarks: 46%
     - near:      100%

     Animated.modulo mantém duas imagens repetidas em loop sem salto.
  ========================================================= */
  const farX = useMemo(
    () =>
      Animated.multiply(
        Animated.modulo(
          Animated.multiply(travel, FAR_PARALLAX_FACTOR),
          loopWidth,
        ),
        -1,
      ),
    [travel, loopWidth],
  );

  const landmarkX = useMemo(
    () =>
      Animated.multiply(
        Animated.modulo(
          Animated.multiply(travel, LANDMARK_PARALLAX_FACTOR),
          loopWidth,
        ),
        -1,
      ),
    [travel, loopWidth],
  );

  const nearX = useMemo(
    () =>
      Animated.multiply(
        Animated.modulo(
          Animated.multiply(travel, NEAR_PARALLAX_FACTOR),
          loopWidth,
        ),
        -1,
      ),
    [travel, loopWidth],
  );

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* CÉU permanece parado: é nossa referência visual de profundidade. */}
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

  translateX: any;

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
