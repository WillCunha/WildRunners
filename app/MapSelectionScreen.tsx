import { AudioContext } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import { getPlayerLevel, normalizeLegacyLevelRequirement } from '@/src/utils/progression';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

type CityMap = (typeof CITY_MAPS)[number];
type CarouselItem = CityMap | { id: string; city?: undefined };

const ACCENT = '#FFD60A';

export default function MapSelectionScreen() {
  const { width, height } = useWindowDimensions();
  const isCompactLandscape = height < 430;

  const { t } = useLanguage();

  const itemSize = Math.min(width * 0.37, 440);
  const spacerSize = Math.max(0, (width - itemSize) / 2);

  const scrollX = useRef(new Animated.Value(0)).current;
  const params = useLocalSearchParams<{ deck?: string }>();
  const profile = usePlayerStore(state => state.profile);
  const { pauseMusic } = useContext(AudioContext);
  const [activeIndex, setActiveIndex] = useState(0);

  const dataWithSpacers: CarouselItem[] = [
    { id: 'left-spacer' },
    ...CITY_MAPS,
    { id: 'right-spacer' },
  ];

  const activeMap = CITY_MAPS[activeIndex] ?? CITY_MAPS[0];
  const trophies = profile?.trophies ?? 0;
  const playerLevel = getPlayerLevel(profile?.xp ?? 0);

  const startRace = (item: CityMap) => {
    const requiredLevel = normalizeLegacyLevelRequirement(item.levelRequired);
    if (playerLevel < requiredLevel) return;

    pauseMusic();
    router.navigate({
      pathname: '/mapa',
      params: {
        deck: params.deck,
        mapImage: item.background,
      },
    });
  };

  const renderItem = ({ item, index }: { item: CarouselItem; index: number }) => {
    if (!item.city) return <View style={{ width: spacerSize }} />;

    const realIndex = index - 1;
    const inputRange = [
      (realIndex - 1) * itemSize,
      realIndex * itemSize,
      (realIndex + 1) * itemSize,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.84, 1, 0.84],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.48, 1, 0.48],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [16, 0, 16],
      extrapolate: 'clamp',
    });

    const requiredLevel = normalizeLegacyLevelRequirement(item.levelRequired);
    const isUnlocked = playerLevel >= requiredLevel;

    return (
      <View style={{ width: itemSize, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            styles.cardScaleWrapper,
            { opacity, transform: [{ scale }, { translateY }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => startRace(item)}
            style={styles.cardVisual}
          >
            <View style={styles.cardAccent} />

            <View style={styles.imageWrapper}>
              <Image
                source={(isUnlocked ? item.icon : item.iconGRAY) as ImageSourcePropType}
                style={styles.image}
              />
              <View style={styles.imageShade} />

              <View style={styles.mapNumberBadge}>
                <Text style={styles.mapNumberLabel}>{t('mapSelection.track')}</Text>
                <Text style={styles.mapNumberValue}>
                  {String(realIndex + 1).padStart(2, '0')}
                </Text>
              </View>

              {!isUnlocked && (
                <View style={styles.lockedOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.lockTitle}>{t('mapSelection.lockedTrack')}</Text>
                  <Text style={styles.lockRequirement}>
                    {t('mapSelection.requiresLevel', { level: requiredLevel })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.mapCategory}> {t('mapSelection.circuit')}</Text>
              <Text style={styles.cityText} numberOfLines={1}>
                {item.city}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('mapSelection.status')}</Text>
                  <Text style={[styles.metaValue, isUnlocked && styles.metaValueReady]}>
                    {isUnlocked ? t('mapSelection.unlocked') : t('mapSelection.locked')}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>{t('mapSelection.requirement')}</Text>
                  <Text style={styles.metaValue}>{t('mapSelection.levelShort')} {requiredLevel}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const activeRequiredLevel = activeMap
    ? normalizeLegacyLevelRequirement(activeMap.levelRequired)
    : 1;

  const activeUnlocked = activeMap
    ? playerLevel >= activeRequiredLevel
    : false;

  return (
    <ImageBackground
      source={require('@/assets/images/components/background/start_screen.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, isCompactLandscape && styles.containerCompact]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, isCompactLandscape && styles.headerTitleCompact]}>
                {t('mapSelection.title')}
              </Text>
              <Text style={styles.headerSubtitle}>{t('mapSelection.subtitle')}</Text>
            </View>

            <View style={styles.headerBadges}>
              <View style={styles.headerBadge}>
                <Text style={styles.badgeLabel}>{t('mapSelection.pilot')}</Text>
                <Text style={styles.badgeValue} numberOfLines={1}>
                  @{profile?.username ?? 'PLAYER'}
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.badgeLabel}>{t('mapSelection.level')}</Text>
                <Text style={styles.badgeValue}>⭐ {playerLevel}</Text>
              </View>
              <View style={[styles.headerBadge, styles.trophyBadge]}>
                <Text style={styles.badgeLabel}>{t('mapSelection.trophies')}</Text>
                <Text style={styles.badgeValue}>🏆 {trophies}</Text>
              </View>
            </View>
          </View>

          <View style={styles.carouselFrame}>
            <View style={styles.frameLineTop} />
            <View style={styles.frameLineBottom} />

            <Animated.FlatList
              data={dataWithSpacers}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={itemSize}
              decelerationRate="fast"
              bounces={false}
              contentContainerStyle={styles.carouselContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true },
              )}
              onMomentumScrollEnd={event => {
                const nextIndex = Math.round(
                  event.nativeEvent.contentOffset.x / itemSize,
                );
                setActiveIndex(
                  Math.max(0, Math.min(CITY_MAPS.length - 1, nextIndex)),
                );
              }}
              scrollEventThrottle={16}
              renderItem={renderItem}
              getItemLayout={(_, index) => ({
                length: index === 0 || index === dataWithSpacers.length - 1
                  ? spacerSize
                  : itemSize,
                offset:
                  index === 0
                    ? 0
                    : spacerSize + Math.max(0, index - 1) * itemSize,
                index,
              })}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.selectedMapInfo}>
              <Text style={styles.selectedMapLabel}>{t('mapSelection.selectedTrack')}</Text>
              <Text style={styles.selectedMapName} numberOfLines={1}>
                {activeMap?.city?.toUpperCase() ?? t('mapSelection.noTrack')}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={activeUnlocked ? 0.86 : 1}
              onPress={() => activeMap && startRace(activeMap)}
              style={[
                styles.continueButton,
                !activeUnlocked && styles.continueButtonLocked,
              ]}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !activeUnlocked && styles.continueButtonTextLocked,
                ]}
              >
                {activeUnlocked
                  ? t('mapSelection.raceOnTrack')
                  : t('mapSelection.lockedButton', {
                    level: activeRequiredLevel,
                  })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.82)',
  },
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 10 },
  containerCompact: { paddingVertical: 7 },
  header: {
    minHeight: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.8,
  },
  headerTitleCompact: { fontSize: 23 },
  headerSubtitle: {
    color: '#8D8D94',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerBadges: { flexDirection: 'row', gap: 8 },
  headerBadge: {
    minWidth: 90,
    maxWidth: 150,
    minHeight: 39,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(36,36,39,0.92)',
    justifyContent: 'center',
  },
  trophyBadge: { minWidth: 100 },
  badgeLabel: { color: '#85858C', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  badgeValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 1 },
  carouselFrame: {
    flex: 1,
    minHeight: 0,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(23,23,25,0.88)',
    overflow: 'hidden',
  },
  frameLineTop: {
    position: 'absolute',
    top: '21%',
    left: '-5%',
    width: '110%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotate: '-4deg' }],
  },
  frameLineBottom: {
    position: 'absolute',
    bottom: '20%',
    left: '-5%',
    width: '110%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '5deg' }],
  },
  carouselContent: { alignItems: 'center' },
  cardScaleWrapper: { width: '92%', maxWidth: 410 },
  cardVisual: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: '#222226',
    overflow: 'hidden',
  },
  cardAccent: { height: 4, backgroundColor: ACCENT },
  imageWrapper: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    backgroundColor: '#151517',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  mapNumberBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 54,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(15,15,17,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  mapNumberLabel: { color: '#85858C', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  mapNumberValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: -1 },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,8,10,0.72)',
  },
  lockIcon: { fontSize: 24 },
  lockTitle: { color: '#FF453A', fontSize: 13, fontWeight: '900', fontStyle: 'italic', marginTop: 5 },
  lockRequirement: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', marginTop: 3, letterSpacing: 0.5 },
  cardInfo: { paddingHorizontal: 13, paddingTop: 10, paddingBottom: 12 },
  mapCategory: { color: '#85858C', fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  cityText: { color: ACCENT, fontSize: 22, fontWeight: '900', fontStyle: 'italic', marginTop: -1 },
  metaRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#29292D',
    paddingHorizontal: 9,
    marginTop: 8,
  },
  metaCell: { flex: 1 },
  metaLabel: { color: '#85858C', fontSize: 7, fontWeight: '900' },
  metaValue: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', marginTop: 1 },
  metaValueReady: { color: '#32D74B' },
  metaDivider: { width: StyleSheet.hairlineWidth, height: 23, backgroundColor: 'rgba(255,255,255,0.20)', marginHorizontal: 9 },
  footer: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  selectedMapInfo: { flex: 1, minWidth: 0 },
  selectedMapLabel: { color: '#85858C', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  selectedMapName: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', fontStyle: 'italic', marginTop: -1 },
  continueButton: {
    minWidth: 220,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonLocked: { borderColor: '#55555D', backgroundColor: '#303035' },
  continueButtonText: { color: '#111113', fontSize: 11, fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.4 },
  continueButtonTextLocked: { color: '#A0A0A7' },
});
