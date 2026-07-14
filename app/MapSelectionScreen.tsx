import { usePlayerStore } from '@/src/store/playerStore';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const ITEM_SIZE = width * 0.35;
const SPACER_ITEM_SIZE = (width - ITEM_SIZE) / 2;

export default function MapSelectionScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const params = useLocalSearchParams<{ deck?: string }>();
  const profile = usePlayerStore((state) => state.profile);


  const dataWithSpacers = [
    { id: 'left-spacer' },
    ...CITY_MAPS,
    { id: 'right-spacer' }
  ];

  const renderItem = ({ item, index }) => {
    if (!item.city) {
      return <View style={{ width: SPACER_ITEM_SIZE }} />;
    }

    const inputRange = [
      (index - 2) * ITEM_SIZE,
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const currentLevel = profile?.trophies || 0;
    const isUnlocked = currentLevel >= item.levelRequired;

    return (

      <View style={{ width: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.cardScaleWrapper, { transform: [{ scale }] }]}>

          <View style={styles.cardVisual}>

            <View style={styles.imageWrapper}>
              <Image
                source={isUnlocked ? item.icon : item.iconGRAY}
                style={styles.image}
              />
              {!isUnlocked && <View style={styles.lockedOverlay} />}
            </View>

            <View style={styles.cityTextContainer}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>

          </View>

          {isUnlocked ? (
            <TouchableOpacity
              style={styles.btnContinue}
              activeOpacity={0.8}
              onPress={() => {
                console.log("url do background passada: ", item.background)
                router.navigate({
                  pathname: '/mapa',
                  params: {
                    deck: params.deck,
                    mapImage: item.background,
                  }
                })
              }}
            >
              <Text style={styles.btnContinueText}>CONTINUAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.btnLocked}>
              <Text style={styles.btnLockedText}>🔒 NÍVEL {item.levelRequired}</Text>
            </View>
          )}

        </Animated.View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("@/assets/images/components/background/start_screen.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>ESCOLHA A PISTA</Text>

        <Animated.FlatList
          data={dataWithSpacers}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ alignItems: 'center' }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          renderItem={renderItem}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  container: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 4,
    fontFamily: 'Fredoka-Bold',
  },
  cardScaleWrapper: {
    width: '90%',
    paddingBottom: 25,
    position: 'relative',
  },
  cardVisual: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#000',
    padding: 5,
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#000',
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cityTextContainer: {
    paddingTop: 16,
    paddingBottom: 24, // Espaço para o texto não ficar colado no botão
    alignItems: 'center',
  },
  cityText: {
    fontSize: 22,
    color: '#000',
    textTransform: 'uppercase',
    fontFamily: 'Fredoka-Regular'
  },
  btnContinue: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '50%',
    height: 50,
    backgroundColor: '#FFEB3B', // Um amarelo/verde vibrante para dar destaque no estilo noir
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnContinueText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  btnLocked: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '50%',
    height: 50,
    backgroundColor: '#9E9E9E',
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLockedText: {
    color: '#000',
    fontSize: 14,
  },
});