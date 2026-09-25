import WildBackButton from '@/components/ui/WildBackButton';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayerStore, type CardPurchaseResult } from '@/src/store/playerStore';
import { ALL_CARDS, getCardDefinition, type CardDefinition } from '@/src/utils/cardMap';
import { getDeckStoreCopy } from '@/src/utils/deckStoreText';
import { getPlayerLevel } from '@/src/utils/progression';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet,
    Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';

type Filter = 'all' | 'attack' | 'defense';
const ACCENT = '#FFD60A';
const EMPTY_OWNED: string[] = [];

export default function DeckStore() {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 700;
  const compact = height < 430;
  const { language } = useLanguage();
  const copy = getDeckStoreCopy(String(language));
  const profile = usePlayerStore(state => state.profile);
  const purchaseCard = usePlayerStore(state => state.purchaseCard);
  const [hydrated, setHydrated] = useState(() => usePlayerStore.persist.hasHydrated());
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState('oil_spit');

  useEffect(() => usePlayerStore.persist.onFinishHydration(() => setHydrated(true)), []);

  const owned = profile?.unlocks?.cards ?? EMPTY_OWNED;
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const chips = profile?.parts?.chips ?? 0;
  const level = getPlayerLevel(profile?.xp ?? 0);
  const selected = getCardDefinition(selectedId) ?? ALL_CARDS[0];
  const selectedOwned = ownedSet.has(selected.id);
  const selectedLocked = level < selected.requiredLevel;
  const selectedMissing = Math.max(0, selected.purchasePrice - chips);
  const canBuy = hydrated && !!profile && !selectedOwned && !selectedLocked && selectedMissing === 0;
  const visible = useMemo(
    () => ALL_CARDS.filter(card => filter === 'all' || card.category === filter),
    [filter],
  );
  const ownedCount = ALL_CARDS.filter(card => ownedSet.has(card.id)).length;
  const gridColumns = isWide ? (width >= 1150 ? 4 : 3) : 2;
  const gridWidth = isWide ? width * 0.59 - 48 : width - 48;
  const tileWidth = Math.max(116, Math.min(218, (gridWidth - (gridColumns - 1) * 10) / gridColumns));

  const handlePurchase = () => {
    if (!hydrated || !profile) {
      Alert.alert(copy.title, copy.noProfile);
      return;
    }
    if (selectedOwned) return;
    if (selectedLocked) {
      Alert.alert(copy.title, copy.locked);
      return;
    }
    if (selectedMissing > 0) {
      Alert.alert(copy.title, copy.insufficient);
      return;
    }
    const cardId = selected.id;
    const cardName = selected.name;
    Alert.alert(copy.buyTitle, copy.buyQuestion(cardName, selected.purchasePrice), [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.confirm,
        onPress: () => {
          // O store revalida saldo, posse e nível: o estado pode ter mudado
          // enquanto o modal de confirmação estava aberto.
          const result: CardPurchaseResult = purchaseCard(cardId);
          if (result === 'purchased') {
            Alert.alert(copy.successTitle, copy.success(cardName));
            return;
          }
          const message = result === 'already_owned' ? copy.already
            : result === 'level_locked' ? copy.locked
            : result === 'insufficient_chips' ? copy.insufficient
            : result === 'no_profile' ? copy.noProfile : copy.failed;
          Alert.alert(copy.title, message);
        },
      },
    ]);
  };

  const renderCard = (card: CardDefinition) => {
    const hasCard = ownedSet.has(card.id);
    const locked = level < card.requiredLevel;
    const active = selected.id === card.id;
    return (
      <TouchableOpacity
        key={card.id}
        accessibilityRole="button"
        accessibilityLabel={card.name}
        activeOpacity={0.8}
        onPress={() => setSelectedId(card.id)}
        style={[styles.card, { width: tileWidth, borderColor: active ? ACCENT : card.color + '8A' }, active && styles.cardActive]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardCost}>💧 {card.cost}</Text>
          <Text style={[styles.cardState, hasCard ? styles.ownedText : locked ? styles.lockedText : styles.priceText]}>
            {hasCard ? '✓ ' + copy.owned : locked ? '🔒 ' + card.requiredLevel : '🔳 ' + card.purchasePrice}
          </Text>
        </View>
        <Image source={card.image} resizeMode="contain" style={[styles.cardArt, !hasCard && locked && styles.dimmed]} />
        <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
      </TouchableOpacity>
    );
  };

  const catalog = (
    <View style={[styles.catalog, isWide && styles.catalogWide]}>
      <View style={styles.catalogHeading}>
        <Text style={styles.sectionTitle}>{copy.shop}</Text>
        <Text style={styles.sectionSub}>{ownedCount}/{ALL_CARDS.length} {copy.collection}</Text>
      </View>
      <View style={styles.tabs}>
        {(['all', 'attack', 'defense'] as Filter[]).map(key => (
          <TouchableOpacity
            key={key}
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => setFilter(key)}
            style={[styles.tab, filter === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
              {copy[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        style={isWide ? styles.catalogScroll : undefined}
        nestedScrollEnabled
      >
        {visible.map(renderCard)}
      </ScrollView>
    </View>
  );

  const details = (
    <ScrollView style={[styles.details, isWide && styles.detailsWide]} contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      <View style={[styles.hero, { borderColor: selected.color + '9A' }]}>
        <View style={styles.heroHeadline}>
          <Text style={[styles.detailCategory, { color: selected.color }]}>{copy[selected.category]}</Text>
          <Text style={styles.detailName}>{selected.name}</Text>
        </View>
        <Image source={selected.image} resizeMode="contain" style={[styles.heroArt, compact && styles.heroArtCompact]} />
        <Text style={styles.description}>{copy.descriptions[selected.id as keyof typeof copy.descriptions]}</Text>
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{copy.cardCost}</Text>
          <Text style={styles.metricValue}>💧 {selected.cost}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{copy.price}</Text>
          <Text style={styles.metricValue}>🔳 {selected.purchasePrice}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{copy.level}</Text>
          <Text style={styles.metricValue}>{selected.requiredLevel}</Text>
        </View>
      </View>
      {selectedOwned ? (
        <View style={styles.ownedBanner}><Text style={styles.ownedBannerText}>✓ {copy.owned}</Text></View>
      ) : selectedLocked ? (
        <View style={styles.lockedBanner}><Text style={styles.lockedBannerText}>🔒 {copy.levelNeeded} {selected.requiredLevel}</Text></View>
      ) : selectedMissing > 0 ? (
        <View style={styles.lockedBanner}><Text style={styles.lockedBannerText}>🔳 {copy.missing} {selectedMissing}</Text></View>
      ) : (
        <View style={styles.readyBanner}><Text style={styles.readyText}>✓ {copy.ready}</Text></View>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        disabled={!canBuy}
        onPress={handlePurchase}
        style={[styles.buyButton, !canBuy && styles.buyDisabled]}
      >
        <Text style={[styles.buyText, !canBuy && styles.buyTextDisabled]}>
          {selectedOwned ? `✓ ${copy.owned}` : selectedLocked ? `🔒 ${copy.level} ${selected.requiredLevel}`
            : selectedMissing > 0 ? `🔳 ${copy.missing} ${selectedMissing}`
            : `${copy.buy} · 🔳 ${selected.purchasePrice}`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={styles.deckButton} onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/deckselection' as any);
      }}>
        <Text style={styles.deckButtonText}>{copy.deck} →</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.shell, compact && styles.shellCompact]}>
        <View style={styles.header}>
          <WildBackButton />
          <View style={styles.heading}>
            <Text style={[styles.title, compact && styles.titleCompact]}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <View style={styles.balancePanel}>
            <Text style={styles.balanceLabel}>{copy.chips}</Text>
            <Text style={styles.balanceValue}>🔳 {hydrated ? chips : '—'}</Text>
            <Text style={styles.levelText}>{copy.level} {level}</Text>
          </View>
        </View>
        {!hydrated ? (
          <View style={styles.loading}><ActivityIndicator color={ACCENT} size="large" /></View>
        ) : !profile ? (
          <View style={styles.loading}><Text style={styles.description}>{copy.noProfile}</Text></View>
        ) : isWide ? (
          <View style={styles.contentRow}>{catalog}{details}</View>
        ) : (
          <ScrollView style={styles.mobileScroll} contentContainerStyle={styles.mobileContent}>
            {details}
            {catalog}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111014' },
  shell: { flex: 1, backgroundColor: '#151518', padding: 14, gap: 12 },
  shellCompact: { padding: 8, gap: 6 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { flex: 1 },
  title: { color: '#FFF', fontSize: 23, fontWeight: '900', letterSpacing: 1.4 },
  titleCompact: { fontSize: 18 },
  subtitle: { color: ACCENT, fontWeight: '900', fontSize: 10, letterSpacing: 1.6 },
  balancePanel: { alignItems: 'flex-end', backgroundColor: '#27242B', borderWidth: 1, borderColor: '#57505F', paddingVertical: 7, paddingHorizontal: 13, borderRadius: 12 },
  balanceLabel: { fontSize: 9, color: '#AFA5B8', fontWeight: '800' },
  balanceValue: { fontSize: 17, color: ACCENT, fontWeight: '900' },
  levelText: { fontSize: 9, color: '#E2DDE5', fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contentRow: { flex: 1, flexDirection: 'row', gap: 12, minHeight: 0 },
  catalog: { backgroundColor: '#1C1A20', borderColor: '#37313D', borderWidth: 1, borderRadius: 14, padding: 12 },
  catalogWide: { width: '59%', flex: 0 },
  catalogHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sectionSub: { color: '#BEB1C5', fontSize: 10, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: { borderColor: '#4B4350', borderWidth: 1, backgroundColor: '#25212A', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 11 },
  tabActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  tabText: { color: '#E2DAE9', fontWeight: '900', fontSize: 10 },
  tabTextActive: { color: '#171319' },
  catalogScroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 14, alignContent: 'flex-start' },
  card: { backgroundColor: '#262229', borderWidth: 1.5, borderRadius: 12, padding: 8, minHeight: 119, alignItems: 'center', justifyContent: 'space-between' },
  cardActive: { backgroundColor: '#343029', borderWidth: 2 },
  cardTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCost: { fontSize: 10, color: '#E8DFED', fontWeight: '900' },
  cardState: { fontSize: 9, fontWeight: '900' },
  ownedText: { color: '#59E99B' }, lockedText: { color: '#B1A8B6' }, priceText: { color: ACCENT },
  cardArt: { height: 62, width: '88%' }, dimmed: { opacity: 0.6 },
  cardName: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  details: { backgroundColor: '#201C24', borderWidth: 1, borderColor: '#3F3745', borderRadius: 14 },
  detailsWide: { flex: 1, minWidth: 0 },
  detailsContent: { padding: 12, gap: 10 },
  hero: { backgroundColor: '#28222E', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 7 },
  heroHeadline: { alignSelf: 'stretch' },
  detailCategory: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  detailName: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  heroArt: { width: '75%', height: 120 },
  heroArtCompact: { height: 76 },
  description: { fontSize: 11, lineHeight: 16, color: '#DFD4E6', textAlign: 'center' },
  metricRow: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, minWidth: 0, padding: 9, borderRadius: 9, backgroundColor: '#302A35', alignItems: 'center' },
  metricLabel: { color: '#BDB0C8', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  metricValue: { color: '#FFF', fontWeight: '900', fontSize: 15, marginTop: 4 },
  ownedBanner: { backgroundColor: '#173E2D', padding: 8, borderRadius: 8, alignItems: 'center' },
  ownedBannerText: { color: '#6CF2A9', fontWeight: '900', fontSize: 10 },
  lockedBanner: { backgroundColor: '#40302B', padding: 8, borderRadius: 8, alignItems: 'center' },
  lockedBannerText: { color: '#FFD2A0', fontWeight: '900', fontSize: 10 },
  readyBanner: { backgroundColor: '#203E34', padding: 8, borderRadius: 8, alignItems: 'center' },
  readyText: { color: '#9AFFC2', fontWeight: '900', fontSize: 10 },
  buyButton: { padding: 12, borderRadius: 11, alignItems: 'center', backgroundColor: ACCENT },
  buyDisabled: { backgroundColor: '#453D4B' },
  buyText: { color: '#211A00', fontSize: 13, fontWeight: '900' },
  buyTextDisabled: { color: '#D2C5DA' },
  deckButton: { borderColor: ACCENT, borderWidth: 1, borderRadius: 10, alignItems: 'center', padding: 10 },
  deckButtonText: { color: ACCENT, fontSize: 11, fontWeight: '900' },
  mobileScroll: { flex: 1 }, mobileContent: { gap: 12, paddingBottom: 24 },
});
