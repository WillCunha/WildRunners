/**
 * Hook para calcular a rotação das rodas baseado na velocidade do carro
 * 
 * A fórmula converte a velocidade linear do carro em rotação angular das rodas.
 * Cada "pixel" de movimento = rotação proporcional das rodas
 */

export const useWheelRotation = (speed: number, deltaTime: number = 1) => {
  /**
   * Calcula quantos graus as rodas devem girar
   * 
   * @param speed - Velocidade do carro (pixels por frame)
   * @param wheelDiameter - Diâmetro da roda em pixels (padrão 40)
   * @returns Número de graus a girar
   */
  const WHEEL_DIAMETER = 40; // Ajuste conforme o tamanho das suas rodas
  const wheelCircumference = Math.PI * WHEEL_DIAMETER;

  // Quantos graus giram por pixel de movimento
  const degreesPerPixel = 360 / wheelCircumference;

  // Total de graus para esse frame
  const wheelRotation = (speed * deltaTime) * degreesPerPixel;

  return wheelRotation;
};

/**
 * Função para converter coordenadas absolutas (de dentro da imagem)
 * para coordenadas relativas (para posicionar elementos filhos)
 * 
 * Exemplo de uso:
 * const rodaPos = convertToRelativePosition(
 *   { x: 283, y: 27 },     // Posição absoluta na imagem
 *   { width: 50, height: 50 } // Tamanho do carro
 * );
 */
export const convertToRelativePosition = (
  absolutePos: { x: number; y: number },
  containerSize: { width: number; height: number }
) => {
  return {
    x: absolutePos.x - containerSize.width / 2,
    y: absolutePos.y - containerSize.height / 2,
  };
};

/**
 * Calcula o ângulo de rotação acumulado
 * Mantém o valor entre 0-360 para evitar números muito grandes
 */
export const normalizeRotation = (rotation: number): number => {
  return ((rotation % 360) + 360) % 360;
};
