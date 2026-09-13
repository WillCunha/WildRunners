import { useLanguage } from '@/context/LanguageContext';
import {
  getRaceObjectiveLabel,
  type RaceObjectiveDifficulty,
  type RaceObjectiveResult,
} from '@/src/utils/progression';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  objectives: RaceObjectiveResult[];
};

const difficultyLabel: Record<RaceObjectiveDifficulty, string> = {
  easy: 'F',
  medium: 'M',
  hard: 'D',
};

const difficultyBorder: Record<RaceObjectiveDifficulty, string> = {
  easy: '#52D273',
  medium: '#FFD60A',
  hard: '#FF5A5F',
};

/**
 * HUD das 3 missões sorteadas para a corrida.
 * O mapa entrega somente os snapshots quando alguma métrica muda;
 * este componente não participa do loop de física.
 */
export default function RaceObjectivesHUD({ objectives }: Props) {
  const { language } = useLanguage();

  return (
    <View style={styles.container} pointerEvents="none">
      {objectives.map(objective => (
        <View
          key={objective.id}
          style={[
            styles.chip,
            {
              borderLeftColor: difficultyBorder[objective.difficulty],
            },
            objective.completed && styles.chipDone,
          ]}
        >
          <View style={styles.mainRow}>
            <Text style={styles.icon}>{objective.icon}</Text>

            <View style={styles.textArea}>
              <Text style={styles.label} numberOfLines={1}>
                {getRaceObjectiveLabel(objective.id, language, true)}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.difficulty}>
                  {difficultyLabel[objective.difficulty]}
                </Text>
                <Text
                  style={[
                    styles.progress,
                    objective.completed && styles.progressDone,
                  ]}
                >
                  {objective.completed ? '✓' : objective.progressText}
                </Text>
              </View>
            </View>

            <Text style={styles.xp}>+{objective.xpPossible}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 154,
    alignItems: 'stretch',
    gap: 4,
  },
  chip: {
    minHeight: 31,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(8,8,12,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderLeftWidth: 3,
  },
  chipDone: {
    backgroundColor: 'rgba(0,208,132,0.30)',
    borderColor: 'rgba(0,208,132,0.72)',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    fontSize: 12,
    marginRight: 4,
  },
  textArea: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  metaRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficulty: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 7,
    fontWeight: '900',
  },
  progress: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 8,
    fontWeight: '900',
  },
  progressDone: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  xp: {
    marginLeft: 5,
    color: '#FFD60A',
    fontSize: 8,
    fontWeight: '900',
  },
});
