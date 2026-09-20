import { carMaps } from '@/src/utils/carMaps';
import type { EquippedCarEquipment, PaintFinishId } from '@/src/types/playerTypes';
import React, { createContext, useContext, useState } from 'react';

type CarKey = keyof typeof carMaps;

const EMPTY_EQUIPMENT: EquippedCarEquipment = {
  frontBumper: null,
  rearBumper: null,
  spoiler: null,
  sideSkirt: null,
};

interface CarContextType {
  selectedCar: CarKey;
  selectedColorFront: string;
  selectedColorBack: string;
  selectedFinishId: PaintFinishId;
  selectedEquipment: EquippedCarEquipment;
  setSelectedCar: (car: CarKey) => void;
  setSelectedColorFront: (color: string) => void;
  setSelectedColorBack: (color: string) => void;
  setSelectedFinishId: (finish: PaintFinishId) => void;
  setSelectedEquipment: (equipment: EquippedCarEquipment) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCar, setSelectedCar] = useState<CarKey>('fusca');
  const [selectedColorFront, setSelectedColorFront] = useState('#FF3B30');
  const [selectedColorBack, setSelectedColorBack] = useState('#FF3B30');
  const [selectedFinishId, setSelectedFinishId] = useState<PaintFinishId>('solid');
  const [selectedEquipment, setSelectedEquipment] = useState<EquippedCarEquipment>(EMPTY_EQUIPMENT);

  return (
    <CarContext.Provider
      value={{
        selectedCar,
        selectedColorFront,
        selectedColorBack,
        selectedFinishId,
        selectedEquipment,
        setSelectedCar,
        setSelectedColorFront,
        setSelectedColorBack,
        setSelectedFinishId,
        setSelectedEquipment,
      }}
    >
      {children}
    </CarContext.Provider>
  );
};

export const useCarSelection = () => {
  const context = useContext(CarContext);
  if (!context) throw new Error('useCarSelection deve ser usado dentro de CarProvider');
  return context;
};
