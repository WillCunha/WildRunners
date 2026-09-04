import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  position: number;
  attacks: number;
  overtakes: number;
};

/**
 * HUD compacto das missões.
 *
 * Durante a corrida o jogador precisa enxergar progresso, não ler descrição.
 * Os nomes completos + XP continuam na RaceResultScreen.
 */
export default function RaceObjectivesHUD({
  position,
  attacks,
  overtakes,
}: Props) {
  const objectives = [
    {
      id: 'top3',
      icon: '🏁',
      progress: `#${Math.max(1, position)}`,
      done: position <= 3,
    },
    {
      id: 'attacks',
      icon: '🎯',
      progress: `${Math.min(Math.max(0, attacks), 2)}/2`,
      done: attacks >= 2,
    },
    {
      id: 'overtakes',
      icon: '⚡',
      progress: `${Math.min(Math.max(0, overtakes), 3)}/3`,
      done: overtakes >= 3,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {objectives.map(objective => (
        <View
          key={objective.id}
          style={[
            styles.chip,
            objective.done && styles.chipDone,
          ]}
        >
          <Text style={styles.icon}>{objective.icon}</Text>
          <Text
            style={[
              styles.progress,
              objective.done && styles.progressDone,
            ]}
          >
            {objective.done ? '✓' : objective.progress}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 37,
    left: '33%',
    right: '33%',
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  chip: {
    minWidth: 50,
    height: 23,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(8,8,12,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipDone: {
    backgroundColor: 'rgba(0,208,132,0.38)',
    borderColor: 'rgba(0,208,132,0.82)',
  },
  icon: {
    fontSize: 11,
    marginRight: 4,
  },
  progress: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  progressDone: {
    color: '#FFFFFF',
    fontSize: 11,
  },
});
