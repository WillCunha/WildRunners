import React, { createContext, useState, useContext } from 'react';
import { carMaps } from '@/src/utils/carMaps';

type CarKey = keyof typeof carMaps;

interface CarContextType {
  selectedCar: CarKey;
  selectedColor: string;
  setSelectedCar: (car: CarKey) => void;
  setSelectedColor: (color: string) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCar, setSelectedCar] = useState<CarKey>('fusca');
  const [selectedColor, setSelectedColor] = useState<string>('#FF3B30');

  return (
    <CarContext.Provider value={{ selectedCar, selectedColor, setSelectedCar, setSelectedColor }}>
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
