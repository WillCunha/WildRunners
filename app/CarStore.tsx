import { useCarSelection } from '@/context/CarContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
import {
  CAR_SHOP_CATALOG,
  CAR_SHOP_ORDER,
  ShopCarId,
} from '@/src/utils/carShopCatalog';
import { getPlayerLevel } from '@/src/utils/progression';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

type CarKey = keyof typeof carMaps;
type AvailableShopCarId = Extract<ShopCarId, CarKey>;

// Mantém carros temporariamente comentados no catálogo, sem quebrar a tela.
// Assim que o Buggy voltar ao carMaps, ele reaparece automaticamente no trilho.
const AVAILABLE_SHOP_CARS = CAR_SHOP_ORDER.filter(
  (carId): carId is AvailableShopCarId => carId in carMaps,
);

type CarCanvasProps = {
  carId: CarKey;
  width: number;
  colorFront: string;
  colorBack: string;
  opacity?: number;
};

const AVAILABLE_COLORS = [
  '#FF453A',
  '#32D74B',
  '#0A84FF',
  '#FFD60A',
  '#FF9F0A',
  '#BF5AF2',
  '#F2F2F7',
  '#2C2C2E',
];

const MAX_BASE_SPEED = Math.max(
  ...AVAILABLE_SHOP_CARS.map(carId => carMaps[carId].stats.speed.base),
);
const MAX_BASE_ACCELERATION = Math.max(
  ...AVAILABLE_SHOP_CARS.map(carId => carMaps[carId].stats.acceleration.base),
);
const MAX_UPGRADE_POTENTIAL = Math.max(
  ...AVAILABLE_SHOP_CARS.map(carId =>
    carMaps[carId].stats.speed.maxUpgrade +
    carMaps[carId].stats.acceleration.maxUpgrade,
  ),
);

const CarCanvas = React.memo(
  ({ carId, width, colorFront, colorBack, opacity = 1 }: CarCanvasProps) => {
    const car = carMaps[carId];
    const scale = width / car.baseSize.width;
    const height = car.baseSize.height * scale;

    return (
      <View style={{ width, height, opacity }}>
        <Image
          source={car.corpoBrancoFrente as ImageSourcePropType}
          resizeMode="contain"
          style={[styles.carLayer, { width, height, tintColor: colorBack }]}
        />
        <Image
          source={car.corpoBrancoTras as ImageSourcePropType}
          resizeMode="contain"
          style={[styles.carLayer, { width, height, tintColor: colorFront }]}
        />
        <Image
          source={car.corpoTransparente as ImageSourcePropType}
          resizeMode="contain"
          style={[styles.carLayer, { width, height }]}
        />

        <Image
          source={car.wheelImage as ImageSourcePropType}
          resizeMode="contain"
          style={[
            styles.wheel,
            {
              width: car.wheels.loja.size.width * scale,
              height: car.wheels.loja.size.height * scale,
              left: car.wheels.loja.rodaTras.x * scale,
              bottom: car.wheels.loja.rodaTras.y * scale,
            },
          ]}
        />
        <Image
          source={car.wheelImage as ImageSourcePropType}
          resizeMode="contain"
          style={[
            styles.wheel,
            {
              width: car.wheels.loja.size.width * scale,
              height: car.wheels.loja.size.height * scale,
              left: car.wheels.loja.rodaFrente.x * scale,
              bottom: car.wheels.loja.rodaFrente.y * scale,
            },
          ]}
        />
      </View>
    );
  },
);

const PerformanceBar = ({
  label,
  percent,
  value,
  accent,
}: {
  label: string;
  percent: number;
  value: string;
  accent: string;
}) => (
  <View style={styles.statBlock}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={styles.statTrack}>
      <View
        style={[
          styles.statFill,
          {
            width: `${Math.max(4, Math.min(100, percent))}%`,
            backgroundColor: accent,
          },
        ]}
      />
      <View style={styles.statMarkerOne} />
      <View style={styles.statMarkerTwo} />
    </View>
  </View>
);

export default function SelectionCar() {
  const { width, height } = useWindowDimensions();

  const { t } = useLanguage();

  const isCompactLandscape = height < 430;

  const {
    selectedCar,
    selectedColorFront,
    selectedColorBack,
    setSelectedCar,
    setSelectedColorFront,
    setSelectedColorBack,
  } = useCarSelection();

  const profile = usePlayerStore(state => state.profile);
  const buyCar = usePlayerStore(state => state.buyCar);
  const validSelectedCar = AVAILABLE_SHOP_CARS.includes(
    selectedCar as AvailableShopCarId,
  )
    ? (selectedCar as AvailableShopCarId)
    : null;

  const [previewCar, setPreviewCar] = useState<AvailableShopCarId>(
    validSelectedCar ?? AVAILABLE_SHOP_CARS[0],
  );
  const [previewColorFront, setPreviewColorFront] = useState(
    selectedColorFront || AVAILABLE_COLORS[0],
  );
  const [previewColorBack, setPreviewColorBack] = useState(
    selectedColorBack || AVAILABLE_COLORS[2],
  );

  useEffect(() => {
    if (!profile) return;

    const currentExists = AVAILABLE_SHOP_CARS.includes(previewCar);
    if (currentExists) return;

    const firstOwnedCar = AVAILABLE_SHOP_CARS.find(
      carId => profile.garage?.[carId],
    );
    setPreviewCar(firstOwnedCar ?? AVAILABLE_SHOP_CARS[0]);
  }, [previewCar, profile]);

  const playerLevel = getPlayerLevel(profile?.xp ?? 0);
  const gears = profile?.parts?.engrenagem ?? 0;
  const carData = carMaps[previewCar];
  const shopData = CAR_SHOP_CATALOG[previewCar];
  const ownedCarData = profile?.garage?.[previewCar];
  const isOwned = ownedCarData !== undefined;
  const isLocked = carData.tier > playerLevel;
  const canAfford = gears >= shopData.price;
  const missingGears = Math.max(0, shopData.price - gears);

  const previewWidth = Math.min(
    isCompactLandscape ? width * 0.43 : width * 0.48,
    isCompactLandscape ? 380 : 470,
  );

  const stats = useMemo(() => {
    const upgradePotential =
      carData.stats.speed.maxUpgrade + carData.stats.acceleration.maxUpgrade;

    return {
      speed: (carData.stats.speed.base / MAX_BASE_SPEED) * 100,
      acceleration:
        (carData.stats.acceleration.base / MAX_BASE_ACCELERATION) * 100,
      potential: (upgradePotential / MAX_UPGRADE_POTENTIAL) * 100,
    };
  }, [carData]);

  const handleBuy = () => {
    if (!profile) {
      Alert.alert(
        t('carStore.profileUnavailableTitle'),
        t('carStore.profileUnavailableMessage'),
      );

      return;
    }

    if (isLocked) {
      Alert.alert(
        t('carStore.vehicleLockedTitle'),
        t('carStore.vehicleLockedMessage', {
          level: carData.tier,
          car: shopData.name,
        }),
      );

      return;
    }

    if (!canAfford) {
      Alert.alert(
        t('carStore.insufficientGearsTitle'),
        t('carStore.insufficientGearsMessage', {
          count: missingGears,
          car: shopData.name,
        }),
      );

      return;
    }

    Alert.alert(
      t('carStore.buyConfirmTitle', {
        car: shopData.name,
      }),

      t('carStore.buyConfirmMessage', {
        price: shopData.price,
      }),

      [
        {
          text: t('carStore.cancel'),
          style: 'cancel',
        },

        {
          text: t('carStore.buy'),

          onPress: () => {
            const success = buyCar(
              previewCar,
              carData.tier,
              shopData.price,
            );

            if (!success) {
              Alert.alert(
                t('carStore.purchaseFailedTitle'),
                t('carStore.purchaseFailedMessage'),
              );

              return;
            }

            Alert.alert(
              t('carStore.purchaseSuccessTitle'),

              t('carStore.purchaseSuccessMessage', {
                car: shopData.name,
              }),
            );
          },
        },
      ],
    );
  };

  const handleEquipAndContinue = () => {
    setSelectedCar(previewCar);
    setSelectedColorFront(previewColorFront);
    setSelectedColorBack(previewColorBack);
    router.navigate('/OficinaScreen' as any);
  };

  const handleMainAction = () => {
    if (isOwned) {
      handleEquipAndContinue();
      return;
    }

    handleBuy();
  };

  const handleWorkshop = () => {
    if (!isOwned) {
      Alert.alert(
        t('carStore.carNotPurchasedTitle'),
        t('carStore.carNotPurchasedMessage'),
      );

      return;
    }

    setSelectedCar(previewCar);
    setSelectedColorFront(previewColorFront);
    setSelectedColorBack(previewColorBack);

    router.push({
      pathname: '/LoadingScreen',
      params: {
        next: '/OficinaScreen',
      },
    });
  };

  const mainButtonText = isLocked
    ? t('carStore.lockedLevel', {
      level: carData.tier,
    })
    : isOwned
      ? t('carStore.equipAndContinue')
      : canAfford
        ? `${t('carStore.buy')} • ⚙️ ${shopData.price}`
        : `${t('carStore.missing')} ⚙️ ${missingGears}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          isCompactLandscape && styles.containerCompact,
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.title,
                isCompactLandscape && styles.titleCompact,
              ]}
            >
              {t('carStore.title')}
            </Text>
            <Text style={styles.subtitle}>{t('carStore.subtitle')}</Text>
          </View>

          <View style={styles.accountRow}>
            <View style={styles.accountBadge}>
              <Text style={styles.accountLabel}>{t('carStore.level')}</Text>
              <Text style={styles.accountValue}>{playerLevel}</Text>
            </View>
            <View style={[styles.accountBadge, styles.gearBadge]}>
              <Text style={styles.accountLabel}>{t('carStore.gears')}</Text>
              <Text style={styles.accountValue}>⚙️ {gears}</Text>
            </View>
          </View>
        </View>

        {/* MENU HORIZONTAL DE CARROS */}
        <View
          style={[
            styles.carRail,
            isCompactLandscape && styles.carRailCompact,
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carRailContent}
          >
            {AVAILABLE_SHOP_CARS.map(carId => {
              const itemCar = carMaps[carId];
              const itemShop = CAR_SHOP_CATALOG[carId];
              const selected = previewCar === carId;
              const owned = profile?.garage?.[carId] !== undefined;
              const locked = itemCar.tier > playerLevel;

              return (
                <TouchableOpacity
                  key={carId}
                  activeOpacity={0.82}
                  onPress={() => setPreviewCar(carId)}
                  style={[
                    styles.railItem,
                    isCompactLandscape && styles.railItemCompact,
                    selected && {
                      borderColor: itemShop.accent,
                      backgroundColor: `${itemShop.accent}1C`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.railAccent,
                      { backgroundColor: itemShop.accent },
                      !selected && styles.railAccentInactive,
                    ]}
                  />

                  <Image
                    source={itemCar.icone as ImageSourcePropType}
                    style={[
                      styles.railCarImage,
                      isCompactLandscape && styles.railCarImageCompact,
                      locked && styles.lockedImage,
                    ]}
                  />

                  <Text
                    style={[
                      styles.railCarName,
                      selected && { color: itemShop.accent },
                    ]}
                    numberOfLines={1}
                  >
                    {itemShop.shortName}
                  </Text>

                  <View style={styles.railStatusRow}>
                    <Text style={styles.railTier}>{t('carStore.levelShort')} {itemCar.tier}</Text>
                    <Text
                      style={[
                        styles.railStatus,
                        owned && styles.railStatusOwned,
                        locked && styles.railStatusLocked,
                      ]}
                    >
                      {owned ? t('carStore.garage') : locked ? t('carStore.locked') : `⚙️ ${itemShop.price}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mainRow}>
          {/* SHOWROOM */}
          <View style={styles.showroomPane}>
            <View style={styles.showroomBackdrop}>
              <View style={styles.diagonalLineOne} />
              <View style={styles.diagonalLineTwo} />
              <View style={styles.roadLine} />

              <View style={styles.previewCarArea}>
                <CarCanvas
                  carId={previewCar}
                  width={previewWidth}
                  colorFront={previewColorFront}
                  colorBack={previewColorBack}
                  opacity={isLocked ? 0.32 : 1}
                />

                {isLocked && (
                  <View style={styles.previewLock}>
                    <Text style={styles.previewLockIcon}>🔒</Text>
                    <Text style={styles.previewLockTitle}>{t('carStore.accessLocked')}</Text>
                    <Text style={styles.previewLockText}>
                      {t('carStore.requiresLevel', {
                        level: carData.tier,
                      })}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.paintPanel}>
                <View style={styles.paintColumn}>
                  <Text style={styles.paintLabel}> {t('carStore.primaryColor')}</Text>
                  <View style={styles.colorRow}>
                    {AVAILABLE_COLORS.map(color => (
                      <TouchableOpacity
                        key={`front-${color}`}
                        activeOpacity={0.8}
                        onPress={() => setPreviewColorFront(color)}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          previewColorFront === color && styles.colorOptionSelected,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.paintColumn}>
                  <Text style={styles.paintLabel}> {t('carStore.secondaryColor')}</Text>
                  <View style={styles.colorRow}>
                    {AVAILABLE_COLORS.map(color => (
                      <TouchableOpacity
                        key={`back-${color}`}
                        activeOpacity={0.8}
                        onPress={() => setPreviewColorBack(color)}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          previewColorBack === color && styles.colorOptionSelected,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* INFORMAÇÕES E COMPRA */}
          <View style={styles.detailsPane}>
            <ScrollView
              style={styles.detailsScroll}
              contentContainerStyle={[
                styles.detailsScrollContent,
                isCompactLandscape && styles.detailsScrollContentCompact,
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.carIdentityRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.className}>{shopData.className}</Text>
                  <Text
                    style={[
                      styles.selectedCarName,
                      { color: shopData.accent },
                      isCompactLandscape && styles.selectedCarNameCompact,
                    ]}
                    numberOfLines={1}
                  >
                    {shopData.name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.availabilityBadge,
                    isOwned && styles.availabilityOwned,
                    isLocked && styles.availabilityLocked,
                  ]}
                >
                  <Text style={styles.availabilityText}>
                    {isOwned ? t('carStore.purchased') : isLocked ? t('carStore.locked') : t('carStore.available')}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.description,
                  isCompactLandscape && styles.descriptionCompact,
                ]}
                numberOfLines={isCompactLandscape ? 2 : 3}
              >
                {t(
                  `carStore.carDescriptions.${previewCar}`
                )}
              </Text>

              <View style={styles.tierPriceRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{t('carStore.requirement')}</Text>
                  <Text style={styles.infoCellValue}> {t('carStore.level')}  {carData.tier}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>{t('carStore.price')}</Text>
                  <Text style={styles.infoCellValue}>
                    {isOwned ? t('carStore.inGarage') : `⚙️ ${shopData.price}`}
                  </Text>
                </View>
              </View>

              <View style={styles.performancePanel}>
                <Text style={styles.performanceTitle}> {t('carStore.factoryPerformance')}</Text>

                <PerformanceBar
                  label={t('carStore.speed')}
                  percent={stats.speed}
                  value={`${carData.stats.speed.base}`}
                  accent={shopData.accent}
                />
                <PerformanceBar
                  label={t('carStore.acceleration')}
                  percent={stats.acceleration}
                  value={`${carData.stats.acceleration.base}`}
                  accent={shopData.accent}
                />
                <PerformanceBar
                  label={t('carStore.potential')}
                  percent={stats.potential}
                  value={`${carData.stats.speed.maxUpgrade}/${carData.stats.acceleration.maxUpgrade}`}
                  accent={shopData.accent}
                />

                {isOwned && ownedCarData && (
                  <Text
                    style={styles.upgradeSummary}
                    numberOfLines={1}
                  >
                    {t('carStore.upgrades')}:{' '}
                    {t('carStore.engine')}{' '}
                    {ownedCarData.motor?.speedLevel ?? 1}
                    {' • '}
                    {t('carStore.launch')}{' '}
                    {ownedCarData.motor?.accelerationLevel ?? 1}
                    {' • '}
                    {t('carStore.defense')}{' '}
                    {ownedCarData.engrenagem?.defenseLevel ?? 1}
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={handleWorkshop}
                style={[
                  styles.secondaryButton,
                  !isOwned && styles.secondaryButtonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}> {t('carStore.workshop')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                onPress={handleMainAction}
                style={[
                  styles.mainButton,
                  { borderColor: shopData.accent },
                  isOwned && { backgroundColor: shopData.accent },
                  isLocked && styles.mainButtonLocked,
                  !isOwned && !isLocked && !canAfford && styles.mainButtonLowBalance,
                ]}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    isOwned && styles.mainButtonTextOwned,
                  ]}
                  numberOfLines={1}
                >
                  {mainButtonText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101012',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#171719',
  },
  containerCompact: {
    paddingVertical: 7,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.8,
  },
  titleCompact: {
    fontSize: 23,
  },
  subtitle: {
    color: '#8D8D94',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  accountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountBadge: {
    minWidth: 68,
    minHeight: 39,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: '#242427',
    justifyContent: 'center',
  },
  gearBadge: {
    minWidth: 108,
  },
  accountLabel: {
    color: '#85858C',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  accountValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  carRail: {
    height: 108,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: '#1E1E21',
    overflow: 'hidden',
    marginBottom: 10,
  },
  carRailCompact: {
    height: 88,
    marginBottom: 7,
  },
  carRailContent: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 8,
  },
  railItem: {
    width: 138,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#29292D',
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 5,
    overflow: 'hidden',
  },
  railItemCompact: {
    width: 122,
    paddingTop: 3,
    paddingBottom: 3,
  },
  railAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  railAccentInactive: {
    opacity: 0.3,
  },
  railCarImage: {
    width: '100%',
  },
  railCarImageCompact: {
    height: 36,
  },
  lockedImage: {
    opacity: 0.28,
  },
  railCarName: {
    color: '#F4F4F5',
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: -2,
  },
  railStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  railTier: {
    color: '#888890',
    fontSize: 8,
    fontWeight: '900',
  },
  railStatus: {
    color: '#E8E8EA',
    fontSize: 8,
    fontWeight: '900',
  },
  railStatusOwned: {
    color: '#32D74B',
  },
  railStatusLocked: {
    color: '#FF453A',
  },
  mainRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },
  showroomPane: {
    flex: 6.5,
    paddingRight: 14,
    minWidth: 0,
  },
  showroomBackdrop: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#202024',
    overflow: 'hidden',
  },
  diagonalLineOne: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ rotate: '-12deg' }],
    top: '32%',
    left: '-5%',
  },
  diagonalLineTwo: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '9deg' }],
    top: '54%',
    left: '5%',
  },
  roadLine: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: 66,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  previewCarArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  carLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  wheel: {
    position: 'absolute',
    zIndex: 1,
  },
  previewLock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.8)',
    backgroundColor: 'rgba(14,14,16,0.88)',
  },
  previewLockIcon: {
    fontSize: 22,
  },
  previewLockTitle: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  previewLockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  paintPanel: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(15,15,17,0.74)',
  },
  paintColumn: {
    flex: 1,
    minWidth: 0,
  },
  paintLabel: {
    color: '#85858C',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 5,
  },
  colorOption: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  detailsPane: {
    flex: 3.5,
    minWidth: 0,
    minHeight: 0,
    paddingLeft: 14,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.72)',
  },
  detailsScroll: {
    flex: 1,
    minHeight: 0,
  },
  detailsScrollContent: {
    paddingBottom: 6,
  },
  detailsScrollContentCompact: {
    paddingBottom: 3,
  },
  carIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  className: {
    color: '#8A8A91',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  selectedCarName: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    marginTop: -2,
  },
  selectedCarNameCompact: {
    fontSize: 22,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6E6E76',
    backgroundColor: '#27272B',
  },
  availabilityOwned: {
    borderColor: '#32D74B',
    backgroundColor: 'rgba(50,215,75,0.12)',
  },
  availabilityLocked: {
    borderColor: '#FF453A',
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  description: {
    color: '#A7A7AE',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    marginBottom: 8,
  },
  descriptionCompact: {
    fontSize: 10,
    lineHeight: 13,
    marginBottom: 5,
  },
  tierPriceRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#242428',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  infoCell: {
    flex: 1,
  },
  infoCellLabel: {
    color: '#83838A',
    fontSize: 8,
    fontWeight: '900',
  },
  infoCellValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  infoDivider: {
    width: StyleSheet.hairlineWidth,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 10,
  },
  performancePanel: {
    flexShrink: 0,
  },
  performanceTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  statBlock: {
    marginBottom: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  statLabel: {
    color: '#A0A0A7',
    fontSize: 8,
    fontWeight: '900',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  statTrack: {
    height: 7,
    borderRadius: 2,
    backgroundColor: '#303035',
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
  statMarkerOne: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(15,15,16,0.7)',
  },
  statMarkerTwo: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(15,15,16,0.7)',
  },
  upgradeSummary: {
    color: '#8D8D94',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  actionsRow: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  secondaryButton: {
    minWidth: 84,
    minHeight: 42,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272B',
  },
  secondaryButtonDisabled: {
    opacity: 0.35,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  mainButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: '#242428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonLocked: {
    borderColor: '#505057',
    backgroundColor: '#2B2B2F',
  },
  mainButtonLowBalance: {
    borderColor: '#FF9F0A',
    backgroundColor: 'rgba(255,159,10,0.09)',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  mainButtonTextOwned: {
    color: '#111113',
  },
});