import { router } from 'expo-router';
import {
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';

interface WildBackButtonProps {
  onPress?: () => void;
}

export default function WildBackButton({
  onPress,
}: WildBackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.arrow}>
        ‹
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor:
      'rgba(10, 12, 18, 0.82)',

    borderWidth: 1,
    borderColor:
      'rgba(255, 255, 255, 0.18)',
  },

  pressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  arrow: {
    color: '#FFFFFF',

    fontSize: 38,
    fontWeight: '900',

    lineHeight: 40,

    marginTop: -3,
  },
});