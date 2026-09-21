import type { EquippedCarEquipment } from '@/src/types/playerTypes';
import { getEquipmentById } from '@/src/utils/carEquipments';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  carId: string;
  width: number;
  height: number;
  equipped?: EquippedCarEquipment;
};

/**
 * Renderiza os equipamentos como layers do mesmo canvas usado pela carroceria.
 *
 * REGRA DOS ASSETS:
 * - carroceria e equipamentos de um mesmo carro devem ter o MESMO canvas;
 * - mesma largura e altura em pixels;
 * - mesma origem (0, 0);
 * - a área sem peça deve permanecer transparente;
 * - não recortar/trimar o PNG na exportação.
 *
 * Dessa forma não precisamos guardar x/y/scale por equipamento.
 */
export default React.memo(function CarEquipmentLayers({
  carId,
  width,
  height,
  equipped,
}: Props) {
  if (!equipped || width <= 0 || height <= 0) return null;

  // Ordem de desenho: os últimos ficam visualmente por cima dos anteriores.
  const ids = [
    equipped.sideSkirt,
    equipped.frontBumper,
    equipped.rearBumper,
    equipped.spoiler,
  ];

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={[
        styles.layerFrame,
        {
          width,
          height,
        },
      ]}
    >
      {ids.map(id => {
        const item = getEquipmentById(carId, id);
        if (!item) return null;

        return (
          <Image
            key={item.id}
            source={item.image}
            resizeMode="contain"
            fadeDuration={0}
            style={styles.equipmentLayer}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  layerFrame: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 12,
    overflow: 'visible',
  },

  equipmentLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
