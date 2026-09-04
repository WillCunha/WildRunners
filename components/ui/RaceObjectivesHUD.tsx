import { useLanguage } from '@/context/LanguageContext';
import { RACE_OBJECTIVE_REWARDS } from '@/src/utils/progression';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  position: number;
  attacks: number;
  overtakes: number;
};

export default function RaceObjectivesHUD({ position, attacks, overtakes }: Props) {
  const { t } = useLanguage();

  const rows = [
    {
      id: 'top3',
      icon: '🏁',
      label: t('raceObjectives.top3'),
      progress: `#${Math.max(1, position)}`,
      done: position <= 3,
      xp: RACE_OBJECTIVE_REWARDS.top3,
    },
    {
      id: 'attacks',
      icon: '🎯',
      label: t('raceObjectives.attacks'),
      progress: `${Math.min(Math.max(0, attacks), 2)}/2`,
      done: attacks >= 2,
      xp: RACE_OBJECTIVE_REWARDS.attacks,
    },
    {
      id: 'overtakes',
      icon: '⚡',
      label: t('raceObjectives.overtakes'),
      progress: `${Math.min(Math.max(0, overtakes), 3)}/3`,
      done: overtakes >= 3,
      xp: RACE_OBJECTIVE_REWARDS.overtakes,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>{t('raceObjectives.title')}</Text>
      {rows.map(row => (
        <View key={row.id} style={[styles.row, row.done && styles.rowDone]}>
          <Text style={styles.icon}>{row.icon}</Text>
          <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
          <Text style={styles.progress}>{row.progress}</Text>
          <Text style={styles.xp}>+{row.xp} XP</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 180,
    zIndex: 20,
    width: 230,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(8, 8, 12, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.35)',
  },
  title: {
    color: '#FFD60A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  row: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowDone: {
    backgroundColor: 'rgba(0, 208, 132, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.65)',
  },
  icon: { fontSize: 11, marginRight: 5 },
  label: { flex: 1, color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  progress: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', marginLeft: 5 },
  xp: { color: '#FFD60A', fontSize: 8, fontWeight: '900', marginLeft: 7 },
});
