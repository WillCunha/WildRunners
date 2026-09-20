import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type HSV = { h: number; s: number; v: number };

type Props = {
  value: string;
  onChange: (hex: string) => void;
  width?: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '').trim();
  const safe = /^[0-9a-fA-F]{6}$/.test(clean) ? clean : 'FFFFFF';
  return {
    r: parseInt(safe.slice(0, 2), 16) / 255,
    g: parseInt(safe.slice(2, 4), 16) / 255,
    b: parseInt(safe.slice(4, 6), 16) / 255,
  };
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: HSV) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hueColor(h: number) {
  return hsvToHex({ h, s: 1, v: 1 });
}

export default function CarColorPicker({ value, onChange, width = 250 }: Props) {
  const initial = useMemo(() => {
    const { r, g, b } = hexToRgb(value);
    return rgbToHsv(r, g, b);
  }, [value]);
  const [hue, setHue] = useState(initial.h);
  const [sat, setSat] = useState(initial.s);
  const [val, setVal] = useState(initial.v);

  useEffect(() => {
    setHue(initial.h);
    setSat(initial.s);
    setVal(initial.v);
  }, [initial.h, initial.s, initial.v]);
  const squareHeight = Math.max(105, Math.round(width * 0.42));
  const hueHeight = 22;

  const emit = (next: HSV) => onChange(hsvToHex(next));

  const handleSquare = (x: number, y: number) => {
    const s = clamp(x / width, 0, 1);
    const v = 1 - clamp(y / squareHeight, 0, 1);
    setSat(s);
    setVal(v);
    emit({ h: hue, s, v });
  };

  const handleHue = (x: number) => {
    const h = clamp(x / width, 0, 1) * 359.999;
    setHue(h);
    emit({ h, s: sat, v: val });
  };

  const current = hsvToHex({ h: hue, s: sat, v: val });

  return (
    <View style={{ width }}>
      <View
        style={{ width, height: squareHeight }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => handleSquare(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderMove={e => handleSquare(e.nativeEvent.locationX, e.nativeEvent.locationY)}
      >
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={squareHeight}>
            <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={['#FFFFFF', hueColor(hue)]} />
          </Rect>
          <Rect x={0} y={0} width={width} height={squareHeight}>
            <LinearGradient start={vec(0, 0)} end={vec(0, squareHeight)} colors={['rgba(0,0,0,0)', '#000000']} />
          </Rect>
        </Canvas>
        <View
          pointerEvents="none"
          style={[
            styles.cursor,
            { left: sat * width - 7, top: (1 - val) * squareHeight - 7 },
          ]}
        />
      </View>

      <View
        style={[styles.hueBar, { width, height: hueHeight }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => handleHue(e.nativeEvent.locationX)}
        onResponderMove={e => handleHue(e.nativeEvent.locationX)}
      >
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={hueHeight}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
            />
          </Rect>
        </Canvas>
        <View pointerEvents="none" style={[styles.hueCursor, { left: (hue / 360) * width - 2 }]} />
      </View>

      <View style={styles.valueRow}>
        <View style={[styles.swatch, { backgroundColor: current }]} />
        <Text style={styles.hex}>{current}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  hueBar: {
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  hueCursor: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 4,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  hex: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
