import { useCarSelection } from '@/context/CarContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TUTORIAL_DECK = [
  'shield',
  'bullet',
  'chains',
  'tnt',
];

export default function TutorialRaceEntry() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    setSelectedCar,
    setSelectedColorFront,
    setSelectedColorBack,
  } = useCarSelection();

  useEffect(() => {
    // O perfil inicial possui o Buggy na garagem.
    // Forçamos o mesmo carro no CarContext porque o jogador
    // ainda não passou pela CarSelectionScreen nesta primeira corrida.
    setSelectedCar('buggy');
    setSelectedColorFront('#FF3B30');
    setSelectedColorBack('#0f0f0f');

    const frameId = requestAnimationFrame(() => {
      router.replace({
        pathname: '/mapa',
        params: {
          mode: 'tutorial',
          mapId: 'sao_paulo',
          skyTheme: 'day',
          deck: JSON.stringify(TUTORIAL_DECK),
        },
      } as any);
    });

    return () => cancelAnimationFrame(frameId);
  }, [
    router,
    setSelectedCar,
    setSelectedColorFront,
    setSelectedColorBack,
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t('tutorial.preparingFirstRace')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0E',
  },
  text: {
    color: '#FFD60A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
