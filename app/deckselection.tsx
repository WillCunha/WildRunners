import WildBackButton from '@/components/ui/WildBackButton';
import { ALL_CARDS, MAX_DECK_SIZE, getCardDefinition, type CardCategory, type CardDefinition } from '@/src/utils/cardMap';
import { useLanguage } from '@/context/LanguageContext';
import { getDeckStoreCopy } from '@/src/utils/deckStoreText';
import { usePlayerStore } from '@/src/store/playerStore';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const EMPTY_CARD_IDS: string[] = [];

export default function DeckSelection() {
  const { width, height } = useWindowDimensions();

  const { t, language } = useLanguage();
  const shopText = getDeckStoreCopy(String(language));
  const profile = usePlayerStore(state => state.profile);
  const equippedDeck = usePlayerStore(state => state.equippedDeck);
  const setEquippedDeck = usePlayerStore(state => state.setEquippedDeck);
  const [hydrated, setHydrated] = useState(() => usePlayerStore.persist.hasHydrated());

  useEffect(() => usePlayerStore.persist.onFinishHydration(() => setHydrated(true)), []);

  const ownedCardIds = profile?.unlocks?.cards ?? EMPTY_CARD_IDS;
  const ownedSet = useMemo(() => new Set(ownedCardIds), [ownedCardIds]);
  const ownedCards = useMemo(() => ALL_CARDS.filter(card => ownedSet.has(card.id)), [ownedSet]);

  const [activeCategory, setActiveCategory] = useState<CardCategory>('attack');
  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);
  const [openDescriptionId, setOpenDescriptionId] = useState<string | null>(null);

  // Após o AsyncStorage hidratar, mostra o deck salvo. Nunca sobrescreve o save vazio na partida.
  useEffect(() => {
    if (!hydrated) return;
    setSelectedDeck(equippedDeck.filter(id => ownedSet.has(id) && !!getCardDefinition(id)));
  }, [hydrated, profile?.id, equippedDeck, ownedSet]);

  const isCompactLandscape = height < 420;
  const columns = width >= 1180 ? 4 : width >= 760 ? 3 : 2;
  const cardGap = isCompactLandscape ? 10 : 12;

  // Aproxima a largura útil da área esquerda para manter o grid responsivo.
  const leftPaneContentWidth = Math.max(300, (width - 32) * 0.7 - 42);
  const availableCardWidth = Math.min(
    220,
    Math.max(124, (leftPaneContentWidth - cardGap * (columns - 1)) / columns),
  );

  const visibleCards = useMemo(
    () => ownedCards.filter(card => card.category === activeCategory),
    [activeCategory, ownedCards],
  );

  const selectedCards = useMemo(
    () =>
      selectedDeck
        .map(cardId => getCardDefinition(cardId))
        .filter((card): card is CardDefinition => !!card && ownedSet.has(card.id)),
    [selectedDeck, ownedSet],
  );

  const toggleCard = (cardId: string) => {
    if (!hydrated || !profile || !ownedSet.has(cardId)) return;
    setOpenDescriptionId(null);

    if (selectedDeck.includes(cardId)) {
      setSelectedDeck(current => current.filter(id => id !== cardId));
      return;
    }

    if (selectedDeck.length >= MAX_DECK_SIZE) {
      Alert.alert(
        t('deckSelection.fullDeckTitle'),
        t('deckSelection.fullDeckMessage', {
          count: MAX_DECK_SIZE,
        }),
      );
      return;
    }

    setSelectedDeck(current => [...current, cardId]);
  };

  const handleConfirm = () => {
    if (!hydrated || !profile) return;
    if (!isDeckComplete) {
      Alert.alert(
        t('deckSelection.incompleteDeckTitle'),
        t('deckSelection.incompleteDeckMessage', {
          count: MAX_DECK_SIZE,
        }),
      );
      return;
    }

    // Persistir apenas no confirmar; mudanças locais incompletas não alteram o deck salvo.
    if (!setEquippedDeck(selectedDeck)) {
      Alert.alert(t('deckSelection.incompleteDeckTitle'), t('deckSelection.incompleteDeckMessage', { count: MAX_DECK_SIZE }));
      return;
    }

    router.navigate({
      pathname: '/MapSelectionScreen',
      params: { deck: JSON.stringify(selectedDeck) },
    });
  };

  const attackCount = ownedCards.filter(card => card.category === 'attack').length;
  const defenseCount = ownedCards.filter(card => card.category === 'defense').length;
  const isDeckComplete = selectedDeck.length === MAX_DECK_SIZE &&
    new Set(selectedDeck).size === MAX_DECK_SIZE &&
    selectedDeck.every(id => ownedSet.has(id) && !!getCardDefinition(id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isCompactLandscape && styles.containerCompact]}>
        <View style={[styles.header, isCompactLandscape && styles.headerCompact]}>
          <WildBackButton />
          <View>
            <Text style={[styles.title, isCompactLandscape && styles.titleCompact]}>
              {t('deckSelection.title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('deckSelection.subtitle')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={shopText.open}
              activeOpacity={0.8}
              style={styles.storeButton}
              onPress={() => router.push('/DeckStore' as any)}
            >
              <Text style={styles.storeButtonText}>🛒 {shopText.open}</Text>
            </TouchableOpacity>
            <View style={styles.headerCounter}>
            <Text style={styles.headerCounterValue}>
              {selectedDeck.length}/{MAX_DECK_SIZE}
            </Text>
            <Text style={styles.headerCounterLabel}>{t('deckSelection.cards')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentRow}>
          {/* 70% — CATÁLOGO DE CARTAS */}
          <View style={styles.availablePane}>
            <View style={styles.availableTopRow}>
              <View>
                <Text style={styles.sectionTitle}>{t('deckSelection.availableCards')}</Text>
                <Text style={styles.sectionHint}>{t('deckSelection.availableHint')}</Text>
              </View>

              <View style={styles.categoryTabs}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory('attack')}
                  style={[
                    styles.categoryTab,
                    activeCategory === 'attack' && styles.categoryTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      activeCategory === 'attack' &&
                      styles.categoryTabTextActive,
                    ]}
                  >
                    {t('deckSelection.categories.attack')} {attackCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory('defense')}
                  style={[
                    styles.categoryTab,
                    activeCategory === 'defense' && styles.categoryTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      activeCategory === 'defense' &&
                      styles.categoryTabTextActive,
                    ]}
                  >
                    {t('deckSelection.categories.defense')} {defenseCount}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.cardsGrid,
                { gap: cardGap },
                isCompactLandscape && styles.cardsGridCompact,
              ]}
            >
              {hydrated && profile && visibleCards.length === 0 && (
                <Text style={styles.emptyOwnedText}>
                  {t('deckSelection.noOwnedCards')}
                </Text>
              )}
              {visibleCards.map(card => {
                const isSelected = selectedDeck.includes(card.id);

                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.82}
                    onPress={() => toggleCard(card.id)}
                    style={[
                      styles.card,
                      {
                        width: availableCardWidth,
                        minHeight: isCompactLandscape ? 108 : 126,
                        borderColor: card.color,
                      },
                      isSelected && {
                        backgroundColor: `${card.color}2E`,
                        borderWidth: 3,
                      },
                    ]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.costBadge, { borderColor: card.color }]}>
                        <Text style={styles.costText}>💧 {card.cost}</Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.selectedBadge, { backgroundColor: card.color }]}>
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </View>

                    <Image
                      source={card.image}
                      resizeMode="contain"
                      style={[
                        styles.cardImage,
                        isCompactLandscape && styles.cardImageCompact,
                      ]}
                    />

                    <View style={styles.cardBottomRow}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {card.name}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        onPress={(event) => {
                          event.stopPropagation();
                          setOpenDescriptionId(current =>
                            current === card.id ? null : card.id,
                          );
                        }}
                        style={[styles.infoButton, { borderColor: card.color }]}
                      >
                        <Text style={styles.infoButtonText}>?</Text>
                      </TouchableOpacity>
                    </View>

                    {openDescriptionId === card.id && (
                      <View
                        pointerEvents="none"
                        style={[styles.descriptionBubble, { borderColor: card.color }]}
                      >
                        <Text style={styles.descriptionBubbleText}>
                          {t(
                            `deckSelection.cardDescriptions.${card.id}`
                          )}
                        </Text>
                        <View
                          style={[styles.descriptionBubbleArrow, { borderTopColor: card.color }]}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 30% — DECK SELECIONADO */}
          <View style={styles.selectedPane}>
            <View style={styles.selectedHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('deckSelection.yourDeck')}</Text>
                <Text style={styles.sectionHint}>{t('deckSelection.removeHint')}</Text>
              </View>

              <View
                style={[
                  styles.deckStatusBadge,
                  isDeckComplete && styles.deckStatusBadgeComplete,
                ]}
              >
                <Text style={styles.deckStatusText}>
                  {selectedDeck.length}/{MAX_DECK_SIZE}
                </Text>
              </View>
            </View>

            <View style={styles.selectedSlots}>
              {Array.from({ length: MAX_DECK_SIZE }).map((_, index) => {
                const card = selectedCards[index];

                if (!card) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={[
                        styles.emptySlot,
                        isCompactLandscape && styles.slotCompact,
                      ]}
                    >
                      <Text style={styles.slotNumber}>{index + 1}</Text>
                      <Text style={styles.emptySlotText}>{t('deckSelection.emptySlot')}</Text>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.82}
                    onPress={() => toggleCard(card.id)}
                    style={[
                      styles.selectedSlot,
                      {
                        borderColor: card.color,
                        backgroundColor: `${card.color}24`,
                      },
                      isCompactLandscape && styles.slotCompact,
                    ]}
                  >
                    <View style={[styles.slotNumberFilled, { backgroundColor: card.color }]}>
                      <Text style={styles.slotNumberFilledText}>{index + 1}</Text>
                    </View>

                    <View style={styles.selectedSlotInfo}>
                      <Text style={styles.selectedSlotName} numberOfLines={1}>
                        {card.name}
                      </Text>
                      <Text
                        style={styles.selectedSlotMeta}
                        numberOfLines={1}
                      >
                        {t(
                          `deckSelection.categories.${card.category}`
                        )}
                        {' • 💧 '}
                        {card.cost}
                      </Text>
                    </View>

                    <Text style={styles.removeIcon}>×</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={!hydrated || !profile}
              style={[
                styles.playButton,
                !isDeckComplete && styles.playButtonIncomplete,
                isCompactLandscape && styles.playButtonCompact,
              ]}
            >
              <Text style={styles.playButtonText}>
                {isDeckComplete ? t('deckSelection.race') : t('deckSelection.chooseMore', { count: MAX_DECK_SIZE - selectedDeck.length, })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storeButton: { backgroundColor: '#252129', borderWidth: 1.5, borderColor: '#FFD60A', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11 },
  storeButtonText: { fontWeight: '900', color: '#FFD60A', fontSize: 11, letterSpacing: 0.4 },
  emptyOwnedText: { color: '#A3A3AA', fontSize: 12, padding: 16, textAlign: 'center' },
  safeArea: {
    flex: 1,
    backgroundColor: '#151518',
  },
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  containerCompact: {
    paddingVertical: 8,
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerCompact: {
    minHeight: 52,
    marginBottom: 6,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  titleCompact: {
    fontSize: 23,
  },
  subtitle: {
    color: '#A9A9B0',
    fontSize: 13,
    marginTop: 2,
  },
  headerCounter: {
    minWidth: 72,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#252529',
  },
  headerCounterValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  headerCounterLabel: {
    color: '#9999A1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  availablePane: {
    flex: 7,
    paddingRight: 16,
    minWidth: 0,
  },
  selectedPane: {
    flex: 3,
    minWidth: 0,
    paddingLeft: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.72)',
  },
  availableTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  sectionHint: {
    color: '#8E8E95',
    fontSize: 11,
    marginTop: 2,
  },
  categoryTabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 11,
    backgroundColor: '#29292D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryTabText: {
    color: '#9B9BA2',
    fontSize: 11,
    fontWeight: '900',
  },
  categoryTabTextActive: {
    color: '#1B1B1E',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    paddingTop: 3,
    paddingBottom: 14,
  },
  cardsGridCompact: {
    paddingBottom: 8,
  },
  card: {
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: '#27272B',
    paddingHorizontal: 11,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  cardTopRow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#1C1C20',
  },
  costText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  cardImage: {
    width: '100%',
    height: 100,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 5,
  },
  cardImageCompact: {
    height: 100,
    marginTop: 12,
    marginBottom: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
  },
  cardName: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'left',
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    backgroundColor: '#1C1C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  descriptionBubble: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 38,
    zIndex: 30,
    elevation: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#111114',
    paddingHorizontal: 9,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  descriptionBubbleText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'left',
  },
  descriptionBubbleArrow: {
    position: 'absolute',
    right: 9,
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 7,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deckStatusBadge: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#303036',
  },
  deckStatusBadgeComplete: {
    backgroundColor: '#218A3B',
  },
  deckStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedSlots: {
    flex: 1,
    gap: 8,
  },
  selectedSlot: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  emptySlot: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#242428',
    paddingHorizontal: 10,
  },
  slotCompact: {
    minHeight: 46,
    paddingVertical: 5,
  },
  slotNumber: {
    color: '#66666E',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 10,
  },
  emptySlotText: {
    color: '#696970',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  slotNumberFilled: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  slotNumberFilledText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedSlotInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedSlotName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  selectedSlotMeta: {
    color: '#A3A3AA',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  removeIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '400',
    marginLeft: 6,
  },
  playButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  playButtonIncomplete: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: '#333338',
  },
  playButtonCompact: {
    minHeight: 42,
    marginTop: 7,
    paddingVertical: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
