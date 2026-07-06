import { carMaps } from '@/src/utils/carMaps';
import React, { createContext, useContext, useState } from 'react';

type CarKey = keyof typeof carMaps;

interface CarContextType {
  selectedCar: CarKey;
  selectedColorFront: string;
  selectedColorBack: string;
  setSelectedCar: (car: CarKey) => void;
  setSelectedColorFront: (color: string) => void;
  setSelectedColorBack: (color: string) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCar, setSelectedCar] = useState<CarKey>('fusca');
  const [selectedColorFront, setSelectedColorFront] = useState<string>('#FF3B30');
  const [selectedColorBack, setSelectedColorBack] = useState<string>('#FF3B30');

  return (
    <CarContext.Provider value={{ selectedCar, selectedColorFront, selectedColorBack, setSelectedCar, setSelectedColorFront, setSelectedColorBack }}>
      {children}
    </CarContext.Provider>
  );
};

export const useCarSelection = () => {
  const context = useContext(CarContext);
  if (!context) {
    throw new Error('useCarSelection deve ser usado dentro de CarProvider');
  }
  return context;
};
