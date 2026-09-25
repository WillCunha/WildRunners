import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

/** Visual estático, leve e sem timer por poça. A engine controla a existência. */
export default memo(function OilSpitVisual({ x, groundY }: { x: number; groundY: number }) {
  return (
    <View pointerEvents="none" style={[styles.container, { left: x - 39, top: groundY - 13 }]}>
      <View style={styles.shadow} />
      <View style={styles.puddle} />
      <View style={styles.lobeLeft} />
      <View style={styles.lobeRight} />
      <View style={styles.glint} />
      <View style={styles.glintSmall} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'absolute', width: 78, height: 20, zIndex: 2 },
  shadow: { position: 'absolute', width: 76, height: 13, top: 6, backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 30 },
  puddle: { position: 'absolute', left: 3, top: 2, width: 72, height: 13, backgroundColor: '#15101F', borderColor: '#7B4A92', borderWidth: 1, borderRadius: 24 },
  lobeLeft: { position: 'absolute', left: 10, top: 0, width: 22, height: 10, backgroundColor: '#15101F', borderRadius: 14 },
  lobeRight: { position: 'absolute', right: 7, top: 4, width: 20, height: 9, backgroundColor: '#15101F', borderRadius: 14 },
  glint: { position: 'absolute', left: 17, top: 5, width: 23, height: 2, borderRadius: 3, backgroundColor: '#9A65CF', opacity: 0.82 },
  glintSmall: { position: 'absolute', right: 17, top: 8, width: 8, height: 2, borderRadius: 3, backgroundColor: '#F7B332', opacity: 0.72 },
});
