import type { CenarioId, SkyTheme } from '@/components/Cenarios/CenarioBackground';
import WildBackButton from '@/components/ui/WildBackButton';
import { AudioContext } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { setOfflineRaceSelection, setOnlineRaceMapSelection } from '@/src/online/selectedRaceMap';
import { beginOnlinePlayerMutation, confirmOnlinePlayerMutation } from '@/src/services/sync/onlinePlayerMutation';
import { usePlayerStore } from '@/src/store/playerStore';
import { MAX_DECK_SIZE, getCardDefinition } from '@/src/utils/cardMap';
import { CITY_MAPS } from '@/src/utils/cityMaps';
import { getPlayerLevel, normalizeLegacyLevelRequirement } from '@/src/utils/progression';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
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
const ONLINE_CARDS = new Set([
  'slow_slow', 'nitro_power', 'shield', 'bullet', 'chains', 'tnt', 'oil_spit',
  'quick_repair', 'emp_pulse', 'swap', 'magnet', 'blind', 'tornado',
  'bubble_lift', 'armor', 'ghost', 'second_chance',
]);

// O catálogo legado usa 'saopaulo'; o cenário 2.5D usa 'sao_paulo'.
function getCenarioId(map: CityMap): CenarioId {
  return (map.id === 'saopaulo' ? 'sao_paulo' : map.id) as CenarioId;
}


export default function MapSelectionScreen() {
  const { width, height } = useWindowDimensions();
  const isCompactLandscape = height < 430;

  const { t, language } = useLanguage();
  // Texto local temporário para não exigir mudanças nos três arquivos i18n.
  const locale = String(language).toLowerCase();
  const copy = locale.startsWith('es') ? {
    online: 'JUGAR ONLINE', onlineHint: 'Sala multijugador • requiere internet',
    offline: 'JUGAR OFFLINE', offlineHint: 'Carrera con bots • sin internet',
    preparing: 'PREPARANDO...', invalidDeck: 'Mazo inválido. Vuelve y selecciona cuatro cartas desbloqueadas.',
    unsupported: 'Este mazo contiene una carta que todavía no está habilitada en multijugador.',
    disconnected: 'Sin conexión para sincronizar el mazo. Elige OFFLINE para correr contra bots.',
    equipError: 'No se pudieron equipar las cartas seleccionadas.',
    syncError: 'El servidor no confirmó el mazo. Se restauró el guardado anterior.',
    startError: 'No se pudo preparar la carrera. Puedes elegir OFFLINE para jugar sin conexión.',
  } : locale.startsWith('en') ? {
    online: 'PLAY ONLINE', onlineHint: 'Multiplayer lobby • internet required',
    offline: 'PLAY OFFLINE', offlineHint: 'Race with bots • no internet',
    preparing: 'PREPARING...', invalidDeck: 'Invalid deck. Go back and select four unlocked cards.',
    unsupported: 'This deck has a card that is not enabled in multiplayer yet.',
    disconnected: 'Cannot sync your deck without internet. Choose OFFLINE to race bots.',
    equipError: 'Could not equip the selected cards.',
    syncError: 'The server did not confirm your deck. Your previous save was restored.',
    startError: 'Could not prepare the race. Choose OFFLINE to play without internet.',
  } : {
    online: 'JOGAR ONLINE', onlineHint: 'Lobby multiplayer • requer internet',
    offline: 'JOGAR OFFLINE', offlineHint: 'Corrida com bots • sem internet',
    preparing: 'PREPARANDO...', invalidDeck: 'Deck inválido. Volte à seleção e escolha quatro cartas desbloqueadas.',
    unsupported: 'Seu deck contém uma carta que ainda não está habilitada no multiplayer.',
    disconnected: 'Sem conexão para sincronizar o deck online. Escolha OFFLINE para correr contra bots.',
    equipError: 'Não foi possível equipar as cartas selecionadas.',
    syncError: 'O servidor não confirmou o deck. O save anterior foi restaurado.',
    startError: 'Não foi possível preparar a corrida. Para jogar sem internet, escolha OFFLINE.',
  };

  const itemSize = Math.min(width * 0.37, 440);
  const spacerSize = Math.max(0, (width - itemSize) / 2);

  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef<FlatList<CarouselItem>>(null);
  const launchLock = useRef(false);
  const params = useLocalSearchParams<{ deck?: string }>();
  const profile = usePlayerStore(state => state.profile);
  const savedDeck = usePlayerStore(state => state.equippedDeck);
  const setEquippedDeck = usePlayerStore(state => state.setEquippedDeck);
  const { pauseMusic } = useContext(AudioContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  const dataWithSpacers: CarouselItem[] = [
    { id: 'left-spacer' },
    ...CITY_MAPS,
    { id: 'right-spacer' },
  ];

  const activeMap = CITY_MAPS[activeIndex] ?? CITY_MAPS[0];
  const trophies = profile?.trophies ?? 0;
  const playerLevel = getPlayerLevel(profile?.xp ?? 0);

  const selectMap = (index: number) => {
    setModeMenuOpen(false);
    setActiveIndex(index);
    carouselRef.current?.scrollToOffset({ offset: index * itemSize, animated: true });
  };

  const readSelectedDeck = (): string[] | null => {
    let deck: unknown = savedDeck;
    if (params.deck !== undefined) {
      try { deck = JSON.parse(params.deck); }
      catch { return null; }
    }
    if (!Array.isArray(deck) || deck.length !== MAX_DECK_SIZE ||
      new Set(deck).size !== MAX_DECK_SIZE ||
      !deck.every(id => typeof id === 'string' && !!getCardDefinition(id) &&
        profile?.unlocks?.cards?.includes(id))) return null;
    return deck as string[];
  };

  const startRace = async (mode: 'online' | 'offline') => {
    if (launchLock.current || !activeMap) return;
    const requiredLevel = normalizeLegacyLevelRequirement(activeMap.levelRequired);
    if (playerLevel < requiredLevel) return;

    const deck = readSelectedDeck();
    if (!deck) {
      Alert.alert('WILD RUNNERS', copy.invalidDeck);
      return;
    }

    launchLock.current = true;
    setLaunching(true);
    try {
      const mapId = getCenarioId(activeMap);
      const skyTheme: SkyTheme = 'day';
      if (mode === 'offline') {
        setOfflineRaceSelection({ mapId, skyTheme, deck });
        setModeMenuOpen(false);
        pauseMusic();
        // O modo offline não consulta Firebase nem a AWS, mesmo com deck editado.
        router.replace({
          pathname: '/mapa',
          params: { mode: 'offline', deck: JSON.stringify(deck), mapId, skyTheme },
        } as any);
        return;
      }

      if (deck.some(id => !ONLINE_CARDS.has(id))) {
        Alert.alert('WILD NETWORK', copy.unsupported);
        return;
      }

      // Não enviar gravação desnecessária quando o deck já estiver sincronizado.
      const deckAlreadySaved = savedDeck.length === deck.length &&
        savedDeck.every((id, index) => id === deck[index]);
      if (!deckAlreadySaved) {
        const start = await beginOnlinePlayerMutation();
        if (!start.online) {
          Alert.alert('WILD NETWORK', copy.disconnected);
          return;
        }
        if (!setEquippedDeck(deck)) {
          Alert.alert('WILD NETWORK', copy.equipError);
          return;
        }
        if (!(await confirmOnlinePlayerMutation(start.before))) {
          Alert.alert('WILD NETWORK', copy.syncError);
          return;
        }
      }

      // A seleção em memória acompanha o handoff OnlineLab -> Mapa,
      // que atualmente não encaminha mapId ao abrir a corrida.
      setOnlineRaceMapSelection({ mapId, skyTheme });
      setModeMenuOpen(false);
      pauseMusic();
      router.navigate({
        pathname: '/OnlineLab',
        params: { mapId, skyTheme },
      } as any);
    } catch (error) {
      console.warn('[WILD MAP] Falha ao preparar corrida:', error);
      Alert.alert('WILD NETWORK', copy.startError);
    } finally {
      launchLock.current = false;
      setLaunching(false);
    }
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
            onPress={() => selectMap(realIndex)}
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
            <WildBackButton />
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
              ref={carouselRef}
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
                setModeMenuOpen(false);
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

            <View style={styles.playActionWrap}>
              {modeMenuOpen && activeUnlocked && !launching && (
                <View style={styles.modeMenu}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    style={styles.modeOption}
                    onPress={() => void startRace('online')}
                  >
                    <Text style={styles.modeOptionTitle}>🌐  {copy.online}</Text>
                    <Text style={styles.modeOptionHint}>{copy.onlineHint}</Text>
                  </TouchableOpacity>
                  <View style={styles.modeDivider} />
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    style={styles.modeOption}
                    onPress={() => void startRace('offline')}
                  >
                    <Text style={styles.modeOptionTitle}>🏁  {copy.offline}</Text>
                    <Text style={styles.modeOptionHint}>{copy.offlineHint}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                accessibilityRole="button"
                disabled={!activeUnlocked || launching}
                activeOpacity={activeUnlocked ? 0.86 : 1}
                onPress={() => setModeMenuOpen(open => !open)}
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
                  {launching ? copy.preparing : activeUnlocked
                    ? `${t('mapSelection.raceOnTrack')}  ▴`
                    : t('mapSelection.lockedButton', { level: activeRequiredLevel })}
                </Text>
              </TouchableOpacity>
            </View>
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
    zIndex: 20,
    overflow: 'visible',
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  selectedMapInfo: { flex: 1, minWidth: 0 },
  playActionWrap: { position: 'relative', zIndex: 20 },
  modeMenu: { position: 'absolute', bottom: 52, right: 0, width: 260, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,214,10,0.6)', backgroundColor: '#212125', paddingVertical: 4, zIndex: 25, elevation: 15 },
  modeOption: { minHeight: 51, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  modeOptionTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  modeOptionHint: { color: '#AAAAB2', fontSize: 9, marginTop: 3 },
  modeDivider: { backgroundColor: 'rgba(255,255,255,0.16)', height: 1 },
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
