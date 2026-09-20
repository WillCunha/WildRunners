import { getEquipmentById } from '@/src/utils/carEquipments';
import type { EquippedCarEquipment } from '@/src/types/playerTypes';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  carId: string;
  width: number;
  height: number;
  equipped?: EquippedCarEquipment;
};

export default React.memo(function CarEquipmentLayers({ carId, width, height, equipped }: Props) {
  if (!equipped) return null;

  const ids = [
    equipped.sideSkirt,
    equipped.frontBumper,
    equipped.rearBumper,
    equipped.spoiler,
  ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height, zIndex: 12 }]}>
      {ids.map(id => {
        const item = getEquipmentById(carId, id);
        if (!item) return null;
        return (
          <Image
            key={item.id}
            source={item.image}
            resizeMode="contain"
            style={StyleSheet.absoluteFill}
          />
        );
      })}
    </View>
  );
});
