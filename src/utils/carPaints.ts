import type { PaintFinishId } from '@/src/types/playerTypes';

export type PaintFinishDefinition = {
  id: PaintFinishId;
  name: string;
  requiredLevel: number;
  price: number;
  sourcePivot: number;
  shadingStrength: number;
};

export const DEFAULT_CAR_PAINT = {
  primaryColor: '#353232',
  secondaryColor: '#080808',
  finishId: 'solid' as PaintFinishId,
};

export const CAR_PAINT_FINISHES: Record<PaintFinishId, PaintFinishDefinition> = {
  solid: {
    id: 'solid',
    name: 'Sólido',
    requiredLevel: 1,
    price: 0,
    sourcePivot: 0.46,
    shadingStrength: 0.82,
  },
  metallic: {
    id: 'metallic',
    name: 'Metálico',
    requiredLevel: 4,
    price: 180,
    sourcePivot: 0.43,
    shadingStrength: 1.08,
  },
  matte: {
    id: 'matte',
    name: 'Fosco',
    requiredLevel: 6,
    price: 260,
    sourcePivot: 0.49,
    shadingStrength: 0.52,
  },
  pearlescent: {
    id: 'pearlescent',
    name: 'Perolado',
    requiredLevel: 10,
    price: 450,
    sourcePivot: 0.42,
    shadingStrength: 1.18,
  },
};

export const getPaintFinish = (finishId?: PaintFinishId) =>
  CAR_PAINT_FINISHES[finishId ?? 'solid'] ?? CAR_PAINT_FINISHES.solid;
