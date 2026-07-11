import { CITY_MAPS } from '@/src/utils/cityMaps';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = 220;
const SPACER_ITEM_SIZE = (width - ITEM_SIZE) / 2;

export default function TrackSelectionScreen({ currentLevel = 2 }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const params = useLocalSearchParams<{ deck?: string }>();

  const dataWithSpacers = [
    { id: 'left-spacer' },
    ...CITY_MAPS,
    { id: 'right-spacer' }
  ];

  const renderItem = ({ item, index }) => {
    if (!item.city) {
      return <View style={{ width: SPACER_ITEM_SIZE }} />;
    }

    // ... lógica de animação do scroll continua exatamente igual ...
    const inputRange = [(index - 2) * ITEM_SIZE, (index - 1) * ITEM_SIZE, index * ITEM_SIZE];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const isUnlocked = currentLevel >= item.levelRequired;

    return (
      <View style={{ width: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
          <View style={styles.imageContainer}>
            <Image source={item.image} style={[styles.image, !isUnlocked && { opacity: 0.4 }]} />
            {!isUnlocked && <View style={styles.lockedOverlay} />}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.cityText}>{item.city}</Text>

            {isUnlocked ? (
              <TouchableOpacity
                style={styles.btnContinue}
                onPress={() => {
                  router.navigate({
                    pathname: '/mapa',
                    params: {
                      deck: params.deck,
                      mapImage: item.image
                    }
                  });
                }}
              >
                <Text style={styles.btnContinueText}>CONTINUAR</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.btnLocked}>
                <Text style={styles.btnLockedText}>🔒 NÍVEL {item.levelRequired}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>ESCOLHA A PISTA:</Text>

      <Animated.FlatList
        data={dataWithSpacers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_SIZE}
        decelerationRate="fast"
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212c5e',
    justifyContent: 'center',
    alignContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
  },
  cardContainer: {
    width: ITEM_SIZE,
    borderRadius: 24,
    // Sombra para destacar o card

  },
  imageContainer: {
    width: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 220,
    height: 220,
    resizeMode: 'cover',
    borderRadius: 24,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderRadius: 24,
  },
  infoContainer: {
    padding: 16,
    alignItems: 'center',
  },
  cityText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    marginTop: -6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnContinue: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    width: 200,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
  },
  btnContinueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  btnLocked: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#555',
    width: '100%',
    alignItems: 'center',
  },
  btnLockedText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});