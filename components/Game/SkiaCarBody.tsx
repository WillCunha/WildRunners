import { carMaps } from '@/src/utils/carMaps';
import {
  Canvas,
  ColorMatrix,
  CubicSampling,
  Group,
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type CarKey = keyof typeof carMaps;

type SkiaCarBodyProps = {
  carId: CarKey;
  width: number;
  primaryColor: string;
  secondaryColor: string;
  opacity?: number;
  /**
   * Luminância aproximada do cinza-base usado na arte exportada.
   * 0 = preto, 1 = branco.
   * Ajuste este valor se todas as cores estiverem saindo claras/escuras demais.
   */
  sourcePivot?: number;
  /** Intensidade da leitura de sombras/highlights da arte original. */
  shadingStrength?: number;
  style?: StyleProp<ViewStyle>;
};

type RGB = { r: number; g: number; b: number };

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const hexToRgb = (hex: string): RGB => {
  const clean = hex.trim().replace('#', '');

  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return {
      r: parseInt(clean[0] + clean[0], 16) / 255,
      g: parseInt(clean[1] + clean[1], 16) / 255,
      b: parseInt(clean[2] + clean[2], 16) / 255,
    };
  }

  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    };
  }

  // Fallback seguro para qualquer cor antiga/inválida salva no estado.
  return { r: 1, g: 1, b: 1 };
};

const desaturateColor = (color: RGB, saturation = 0.72): RGB => {
  const luminance =
    color.r * 0.2126 +
    color.g * 0.7152 +
    color.b * 0.0722;

  return {
    r: luminance + (color.r - luminance) * saturation,
    g: luminance + (color.g - luminance) * saturation,
    b: luminance + (color.b - luminance) * saturation,
  };
};

/**
 * Recolore uma camada neutra em grayscale sem apagar o relevo 2.5D.
 *
 * A luminância original vira a informação de sombra/highlight.
 * O meio-tom definido por sourcePivot vira exatamente a cor escolhida.
 */
const makePaintMatrix = (
  color: string,
  sourcePivot: number,
  shadingStrength: number,
) => {
  const originalColor = hexToRgb(color);

  const { r, g, b } = desaturateColor(
    originalColor,
    0.72,
  );

  const pivot = clamp01(sourcePivot);
  const strength = Math.max(0, shadingStrength);

  const lr = 0.2126 * strength;
  const lg = 0.7152 * strength;
  const lb = 0.0722 * strength;

  const pivotContribution = pivot * strength;

  return [
    lr, lg, lb, 0, r - pivotContribution,
    lr, lg, lb, 0, g - pivotContribution,
    lr, lg, lb, 0, b - pivotContribution,
    0, 0, 0, 1, 0,
  ];
};

function SkiaCarBody({
  carId,
  width,
  primaryColor,
  secondaryColor,
  opacity = 1,
  sourcePivot = 0.46,
  shadingStrength = 0.82,
  style,
}: SkiaCarBodyProps) {
  const car = carMaps[carId];
  const height = width * (car.baseSize.height / car.baseSize.width);

  const primaryImage = useImage(car.corpoBrancoFrente as any);
  const secondaryImage = useImage(car.corpoBrancoTras as any);
  const componentsImage = useImage(car.corpoTransparente as any);

  const primaryMatrix = useMemo(
    () => makePaintMatrix(primaryColor, sourcePivot, shadingStrength),
    [primaryColor, sourcePivot, shadingStrength],
  );

  const secondaryMatrix = useMemo(
    () => makePaintMatrix(secondaryColor, sourcePivot, shadingStrength),
    [secondaryColor, sourcePivot, shadingStrength],
  );



  return (
    <Canvas
      pointerEvents="none"
      style={[{ width, height }, style]}
    >
      <Group opacity={opacity}>
        {primaryImage && (
          <SkiaImage
            image={primaryImage}
            x={0}
            y={0}
            width={width}
            height={height}
            fit="contain"
            sampling={CubicSampling}
          >
            <ColorMatrix matrix={primaryMatrix} />
          </SkiaImage>
        )}

        {secondaryImage && (
          <SkiaImage
            image={secondaryImage}
            x={0}
            y={0}
            width={width}
            height={height}
            fit="contain"
            sampling={CubicSampling}
          >
            <ColorMatrix matrix={secondaryMatrix} />
          </SkiaImage>
        )}

        {/* Vidros, faróis, contornos, cromados etc. não recebem recoloração. */}
        {componentsImage && (
          <SkiaImage
            image={componentsImage}
            x={0}
            y={0}
            width={width}
            height={height}
            fit="contain"
            sampling={CubicSampling}
          />
        )}
      </Group>
    </Canvas>
  );
}

export default React.memo(SkiaCarBody);
