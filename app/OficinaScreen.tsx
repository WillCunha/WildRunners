import CarColorPicker from '@/components/CarColorPicker';
import CarEquipmentLayers from '@/components/Game/CarEquipmentLayers';
import SkiaCarBody from '@/components/Game/SkiaCarBody';
import WildBackButton from '@/components/ui/WildBackButton';
import { useCarSelection } from '@/context/CarContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayerStore } from '@/src/store/playerStore';
import type { EquippedCarEquipment, PaintFinishId } from '@/src/types/playerTypes';
import { getAvailableEquipmentCategories, type EquipmentCategory } from '@/src/utils/carEquipments';
import { carMaps } from '@/src/utils/carMaps';
import { CAR_PAINT_FINISHES, DEFAULT_CAR_PAINT } from '@/src/utils/carPaints';
import { getPlayerLevel } from '@/src/utils/progression';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
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
    useWindowDimensions
} from 'react-native';

const MAX_LEVEL = 10;
const BASE_COST = 50;
const ACCENT = '#FFD60A';

type CarKey = keyof typeof carMaps;
type PartCategory = 'motor' | 'spray' | 'engrenagem';

type CarCanvasProps = {
    carId: CarKey;
    width: number;
    colorFront: string;
    colorBack: string;
    finishId: PaintFinishId;
    equipment: EquippedCarEquipment;
};

type StatBarProps = {
    label: string;
    progress: number;
    level: number;
};

const CarCanvas = React.memo(
    ({ carId, width, colorFront, colorBack, finishId, equipment }: CarCanvasProps) => {
        const car = carMaps[carId];
        const scale = width / car.baseSize.width;
        const height = car.baseSize.height * scale;
        const { t } = useLanguage();

        return (
            <View style={{ width, height }}>
                <SkiaCarBody
                    carId={carId}
                    width={width}
                    primaryColor={colorFront}
                    secondaryColor={colorBack}
                    finishId={finishId}
                    style={styles.carLayer}
                />

                <CarEquipmentLayers
                    carId={carId}
                    width={width}
                    height={height}
                    equipped={equipment}
                />

                <Image
                    source={car.wheelImage as ImageSourcePropType}
                    resizeMode="contain"
                    style={[
                        styles.wheel,
                        {
                            width: car.wheels.oficina.size.width * scale,
                            height: car.wheels.oficina.size.height * scale,
                            left: car.wheels.oficina.rodaTras.x * scale,
                            bottom: car.wheels.oficina.rodaTras.y * scale,
                        },
                    ]}
                />
                <Image
                    source={car.wheelImage as ImageSourcePropType}
                    resizeMode="contain"
                    style={[
                        styles.wheel,
                        {
                            width: car.wheels.oficina.size.width * scale,
                            height: car.wheels.oficina.size.height * scale,
                            left: car.wheels.oficina.rodaFrente.x * scale,
                            bottom: car.wheels.oficina.rodaFrente.y * scale,
                        },
                    ]}
                />
            </View>
        );
    },
);

const StatBar = ({
    label,
    progress,
    level,
}: StatBarProps) => {
    const { t } = useLanguage();

    return (
        <View style={styles.statBlock}>
            <View style={styles.statHeader}>
                <Text style={styles.statLabel}>
                    {label}
                </Text>

                <Text style={styles.statValue}>
                    {t('workshop.levelShort')} {level}
                </Text>
            </View>

            <View style={styles.statTrack}>
                <View
                    style={[
                        styles.statFill,
                        {
                            width: `${Math.max(
                                4,
                                Math.min(100, progress),
                            )}%`,
                        },
                    ]}
                />

                <View style={styles.statMarkerOne} />
                <View style={styles.statMarkerTwo} />
            </View>
        </View>
    );
};

export default function OficinaScreen() {
    const { width, height } = useWindowDimensions();
    const isCompactLandscape = height < 430;
    const { t } = useLanguage();

    const {
        selectedCar,
        selectedColorFront,
        selectedColorBack,
        setSelectedColorFront,
        setSelectedColorBack,
        setSelectedFinishId,
        setSelectedEquipment,
    } = useCarSelection();

    const profile = usePlayerStore(state => state.profile);
    const upgradeCar = usePlayerStore(state => state.upgradeCar);
    const applyCarPaint = usePlayerStore(state => state.applyCarPaint);
    const purchaseAndEquipEquipment = usePlayerStore(state => state.purchaseAndEquipEquipment);
    const setEquippedEquipment = usePlayerStore(state => state.setEquippedEquipment);

    const carId = selectedCar as CarKey;
    const carData = carMaps[carId];
    const ownedCar = profile?.garage?.[selectedCar];
    const playerLevel = getPlayerLevel(profile?.xp ?? 0);

    const fallbackEquipment: EquippedCarEquipment = {
        frontBumper: null,
        rearBumper: null,
        spoiler: null,
        sideSkirt: null,
    };

    const savedPaint = ownedCar?.customization?.paint ?? {
        ...DEFAULT_CAR_PAINT,
        primaryColor: selectedColorFront || DEFAULT_CAR_PAINT.primaryColor,
        secondaryColor: selectedColorBack || DEFAULT_CAR_PAINT.secondaryColor,
    };
    const savedEquipment = ownedCar?.customization?.equipment ?? fallbackEquipment;

    const [workshopMode, setWorkshopMode] = React.useState<'upgrades' | 'customization'>('upgrades');
    const [customCategory, setCustomCategory] = React.useState<'paint' | EquipmentCategory>('paint');
    const [activeColorLayer, setActiveColorLayer] = React.useState<'primary' | 'secondary'>('primary');
    const [previewPaint, setPreviewPaint] = React.useState(savedPaint);
    const [previewEquipment, setPreviewEquipment] = React.useState<EquippedCarEquipment>(savedEquipment);
    const upgradesScrollRef = React.useRef<ScrollView>(null);

    React.useEffect(() => {
        setPreviewPaint(savedPaint);
        setPreviewEquipment(savedEquipment);
    }, [selectedCar, ownedCar]);

    React.useEffect(() => {
        requestAnimationFrame(() => {
            upgradesScrollRef.current?.scrollTo({
                y: 0,
                animated: false,
            });
        });
    }, [workshopMode]);

    const availableEquipmentCategories = React.useMemo(
        () => getAvailableEquipmentCategories(String(carId)),
        [carId],
    );

    if (!profile || !carData || !ownedCar) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar hidden={true} />

                <View style={styles.errorContainer}>
                    <Text style={styles.errorEyebrow}>
                        {t('workshop.carNotFound.eyebrow')}
                    </Text>

                    <Text style={styles.errorTitle}>
                        {t('workshop.carNotFound.title')}
                    </Text>

                    <Text style={styles.errorText}>
                        {t('workshop.carNotFound.message')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const myParts = profile.parts;

    const calculateProgress = (level = 1) =>
        Math.min(
            100,
            Math.max(0, ((level - 1) / (MAX_LEVEL - 1)) * 100),
        );

    const speedLevel = ownedCar.motor.speedLevel;
    const accelerationLevel = ownedCar.motor.accelerationLevel;
    const jumpLevel = ownedCar.motor.jumpPowerLevel;
    const defenseLevel = ownedCar.engrenagem.defenseLevel;

    const previewWidth = Math.min(
        isCompactLandscape ? width * 0.42 : width * 0.46,
        isCompactLandscape ? 385 : 465,
    );

    const getResourceName = (
        category: PartCategory,
    ) => {
        if (category === 'motor') {
            return t('workshop.resources.engineParts');
        }

        if (category === 'engrenagem') {
            return t('workshop.resources.gears');
        }

        return t('workshop.resources.sprays');
    };

    const renderUpgradeItem = (
        title: string,
        subtitle: string,
        currentLevel: number,
        partCategory: PartCategory,
        statKey: any,
        icon: string,
    ) => {
        const isMaxed = currentLevel >= MAX_LEVEL;
        const upgradeCost = currentLevel * BASE_COST;
        const balance = myParts[partCategory] ?? 0;
        const canAfford = balance >= upgradeCost;
        const progress = calculateProgress(currentLevel);

        const handleUpgrade = () => {
            if (isMaxed) {
                return;
            }

            const success = upgradeCar(
                selectedCar,
                partCategory,
                statKey,
                upgradeCost,
            );

            if (!success) {
                Alert.alert(
                    t('workshop.insufficientResourcesTitle'),
                    t('workshop.insufficientResourcesMessage', {
                        cost: upgradeCost,
                        resource: getResourceName(partCategory),
                    }),
                );
            }
        };

        return (
            <View key={`${partCategory}-${statKey}`} style={styles.upgradeCard}>
                <View style={styles.upgradeCardHeader}>
                    <View style={styles.upgradeIconBox}>
                        <Text style={styles.upgradeIcon}>{icon}</Text>
                    </View>

                    <View style={styles.upgradeIdentity}>
                        <Text style={styles.upgradeTitle}>{title}</Text>
                        <Text style={styles.upgradeSubtitle}>{subtitle}</Text>
                    </View>

                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeLabel}> {t('workshop.level')}</Text>
                        <Text style={styles.levelBadgeValue}>
                            {currentLevel}/{MAX_LEVEL}
                        </Text>
                    </View>
                </View>

                <View style={styles.upgradeTrack}>
                    <View
                        style={[
                            styles.upgradeTrackFill,
                            { width: `${Math.max(4, progress)}%` },
                        ]}
                    />
                    <View style={styles.upgradeMarkerOne} />
                    <View style={styles.upgradeMarkerTwo} />
                </View>

                <View style={styles.upgradeFooter}>
                    <View>
                        <Text style={styles.costLabel}>
                            {isMaxed
                                ? t('workshop.status')
                                : t('workshop.nextLevelCost')}
                        </Text>
                        <Text
                            style={[
                                styles.costValue,
                                !canAfford && !isMaxed && styles.costValueLow,
                            ]}
                        >
                            {isMaxed
                                ? t('workshop.upgradeComplete')
                                : `${icon} ${upgradeCost}  •  ${t(
                                    'workshop.balance',
                                )} ${balance}`}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.84}
                        onPress={handleUpgrade}
                        disabled={isMaxed}
                        style={[
                            styles.upgradeButton,
                            !canAfford && !isMaxed && styles.upgradeButtonLowBalance,
                            isMaxed && styles.upgradeButtonMaxed,
                        ]}
                    >
                        <Text
                            style={[
                                styles.upgradeButtonText,
                                !canAfford &&
                                !isMaxed &&
                                styles.upgradeButtonTextLow,
                                isMaxed &&
                                styles.upgradeButtonTextMaxed,
                            ]}
                        >
                            {isMaxed
                                ? t('workshop.maximum')
                                : canAfford
                                    ? t('workshop.install')
                                    : t('workshop.noParts')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleApplyPaint = () => {
        const finish = CAR_PAINT_FINISHES[previewPaint.finishId];
        const result = applyCarPaint(
            String(carId),
            previewPaint,
            finish.requiredLevel,
            finish.price,
        );

        if (result === 'level_locked') {
            Alert.alert('Pintura bloqueada', `Disponível a partir do nível ${finish.requiredLevel}.`);
            return;
        }
        if (result === 'insufficient_spray') {
            Alert.alert('Spray insuficiente', `Você precisa de 🎨 ${finish.price}.`);
            return;
        }
        if (result === 'invalid' || result === 'car_not_owned' || result === 'no_profile') {
            Alert.alert('Não foi possível aplicar', 'Confira o veículo e tente novamente.');
            return;
        }

        setSelectedColorFront(previewPaint.primaryColor);
        setSelectedColorBack(previewPaint.secondaryColor);
        setSelectedFinishId(previewPaint.finishId);
    };

    const handleEquipmentAction = (category: ReturnType<typeof getAvailableEquipmentCategories>[number], item: any) => {
        const owned = ownedCar.customization?.ownedEquipment?.includes(item.id) ?? false;
        const result = owned
            ? (setEquippedEquipment(String(carId), category.slot, item.id) ? 'equipped' : 'invalid')
            : purchaseAndEquipEquipment(
                String(carId),
                category.slot,
                item.id,
                item.requiredLevel,
                item.price,
            );

        if (result === 'level_locked') {
            Alert.alert('Peça bloqueada', `Disponível a partir do nível ${item.requiredLevel}.`);
            return;
        }
        if (result === 'insufficient_spray') {
            Alert.alert('Spray insuficiente', `Você precisa de 🎨 ${item.price}.`);
            return;
        }
        if (result === 'invalid' || result === 'car_not_owned' || result === 'no_profile') {
            Alert.alert('Não foi possível equipar', 'Tente novamente.');
            return;
        }

        const nextEquipment = { ...previewEquipment, [category.slot]: item.id };
        setPreviewEquipment(nextEquipment);
        setSelectedEquipment(nextEquipment);
    };

    const openCustomization = () => {
        setPreviewPaint(savedPaint);
        setPreviewEquipment(savedEquipment);
        setCustomCategory('paint');
        setWorkshopMode('customization');
    };

    const closeCustomization = () => {
        setPreviewPaint(ownedCar.customization?.paint ?? savedPaint);
        setPreviewEquipment(ownedCar.customization?.equipment ?? savedEquipment);
        setWorkshopMode('upgrades');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View
                style={[
                    styles.container,
                    isCompactLandscape && styles.containerCompact,
                ]}
            >
                <View style={styles.header}>
                    <WildBackButton />
                    <View>
                        <Text
                            style={[
                                styles.title,
                                isCompactLandscape && styles.titleCompact,
                            ]}
                        >
                            {t('workshop.title')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t('workshop.subtitle')}
                        </Text>
                    </View>

                    <View style={styles.accountRow}>
                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>{t('workshop.engine')}</Text>
                            <Text style={styles.accountValue}>⚙️ {myParts.engrenagem}</Text>
                        </View>

                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>{t('workshop.parts')}</Text>
                            <Text style={styles.accountValue}>
                                🔧 {myParts.motor}
                            </Text>
                        </View>

                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}> {t('workshop.spray')}</Text>
                            <Text style={styles.accountValue}>🎨 {myParts.spray}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.mainRow}>
                    <View style={styles.showroomPane}>
                        <View style={styles.showroomBackdrop}>
                            <View style={styles.diagonalLineOne} />
                            <View style={styles.diagonalLineTwo} />
                            <View style={styles.roadLine} />
                            <View style={styles.roadShadow} />

                            <View style={styles.vehicleIdentityRow}>
                                <View>
                                    <Text style={styles.vehicleEyebrow}>
                                        {t('workshop.vehicleInMaintenance')}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.vehicleName,
                                            isCompactLandscape && styles.vehicleNameCompact,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {String(selectedCar).toUpperCase()}
                                    </Text>
                                </View>

                                <View style={styles.vehicleBadgesRow}>
                                    <View style={styles.vehicleBadge}>
                                        <Text style={styles.vehicleBadgeLabel}>   {t('workshop.category')}</Text>
                                        <Text style={styles.vehicleBadgeValue}>
                                            {t('workshop.level')} {carData.tier}
                                        </Text>
                                    </View>
                                    <View style={[styles.vehicleBadge, styles.readyBadge]}>
                                        <Text style={styles.vehicleBadgeLabel}> {t('workshop.status')}</Text>
                                        <Text style={[styles.vehicleBadgeValue, styles.readyText]}>
                                            {t('workshop.onBench')}
                                        </Text>
                                    </View>
                                    <View style={styles.vehicleBadge}>
                                        <Text style={styles.vehicleBadgeLabel}>PINTURA</Text>
                                        <Text style={styles.vehicleBadgeValue}>{CAR_PAINT_FINISHES[previewPaint.finishId].name.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.previewCarArea}>
                                <CarCanvas
                                    carId={carId}
                                    width={previewWidth}
                                    colorFront={previewPaint.primaryColor}
                                    colorBack={previewPaint.secondaryColor}
                                    finishId={previewPaint.finishId}
                                    equipment={previewEquipment}
                                />
                            </View>

                            <View style={styles.statsDock}>
                                <View style={styles.statsDockHeader}>
                                    <Text style={styles.statsDockTitle}>
                                        {t('workshop.installedConfiguration')}
                                    </Text>
                                    <Text style={styles.statsDockMeta}>
                                        {t('workshop.maxLevel', {
                                            level: MAX_LEVEL,
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label={t('workshop.speed')}
                                            level={speedLevel}
                                            progress={calculateProgress(speedLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label={t('workshop.acceleration')}
                                            level={accelerationLevel}
                                            progress={calculateProgress(accelerationLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label={t('workshop.jumpPower')}
                                            level={jumpLevel}
                                            progress={calculateProgress(jumpLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label={t('workshop.defense')}
                                            level={defenseLevel}
                                            progress={calculateProgress(defenseLevel)}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.upgradesPane}>
                        <View style={styles.upgradesHeader}>
                            <View>
                                <Text style={styles.upgradesEyebrow}>
                                    {workshopMode === 'upgrades' ? t('workshop.technicalBench') : 'ESTÚDIO VISUAL'}
                                </Text>
                                <Text style={styles.upgradesTitle}>
                                    {workshopMode === 'upgrades' ? t('workshop.upgrades') : 'CUSTOMIZAÇÃO'}
                                </Text>
                            </View>

                            {workshopMode === 'customization' ? (
                                <TouchableOpacity style={styles.backModeButton} onPress={closeCustomization}>
                                    <Text style={styles.backModeButtonText}>‹ VOLTAR</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.workshopStatusBadge}>
                                    <View style={styles.workshopStatusDot} />
                                    <Text style={styles.workshopStatusText}>{t('workshop.online')}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.upgradesDescription}>
                            {workshopMode === 'upgrades'
                                ? t('workshop.upgradesDescription')
                                : 'Escolha pintura, acabamento e componentes. O carro à esquerda mostra o preview em tempo real.'}
                        </Text>

                        <ScrollView
                            ref={upgradesScrollRef}
                            style={styles.upgradesScroll}
                            contentContainerStyle={styles.upgradesScrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {workshopMode === 'upgrades' ? (
                                <>
                                    {renderUpgradeItem(
                                        t('workshop.upgradeItems.maxSpeed.title'),
                                        t('workshop.upgradeItems.maxSpeed.subtitle'),
                                        speedLevel,
                                        'motor',
                                        'speedLevel',
                                        '🔧',
                                    )}

                                    {renderUpgradeItem(
                                        t('workshop.upgradeItems.acceleration.title'),
                                        t('workshop.upgradeItems.acceleration.subtitle'),
                                        accelerationLevel,
                                        'motor',
                                        'accelerationLevel',
                                        '🔧',
                                    )}

                                    {renderUpgradeItem(
                                        t('workshop.upgradeItems.jumpPower.title'),
                                        t('workshop.upgradeItems.jumpPower.subtitle'),
                                        jumpLevel,
                                        'motor',
                                        'jumpPowerLevel',
                                        '🔧',
                                    )}

                                    {renderUpgradeItem(
                                        t('workshop.upgradeItems.defense.title'),
                                        t('workshop.upgradeItems.defense.subtitle'),
                                        defenseLevel,
                                        'engrenagem',
                                        'defenseLevel',
                                        '⚙️',
                                    )}

                                    <TouchableOpacity activeOpacity={0.84} style={styles.customizationCard} onPress={openCustomization}>
                                        <View style={styles.upgradeIconBox}>
                                            <Text style={styles.upgradeIcon}>🎨</Text>
                                        </View>
                                        <View style={styles.upgradeIdentity}>
                                            <Text style={styles.upgradeTitle}>CUSTOMIZAR</Text>
                                            <Text style={styles.upgradeSubtitle}>Pintura, acabamento e componentes visuais</Text>
                                        </View>
                                        <Text style={styles.customizationArrow}>›</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.categoryTabs}>
                                        <TouchableOpacity
                                            style={[styles.categoryTab, customCategory === 'paint' && styles.categoryTabSelected]}
                                            onPress={() => setCustomCategory('paint')}
                                        >
                                            <Text style={[styles.categoryTabText, customCategory === 'paint' && styles.categoryTabTextSelected]}>PINTURA</Text>
                                        </TouchableOpacity>

                                        {availableEquipmentCategories.map(category => (
                                            <TouchableOpacity
                                                key={category.key}
                                                style={[styles.categoryTab, customCategory === category.key && styles.categoryTabSelected]}
                                                onPress={() => setCustomCategory(category.key)}
                                            >
                                                <Text style={[styles.categoryTabText, customCategory === category.key && styles.categoryTabTextSelected]}>
                                                    {category.label.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {customCategory === 'paint' ? (
                                        <View style={styles.paintEditor}>
                                            <View style={styles.paintLayerRow}>
                                                <TouchableOpacity
                                                    style={[styles.paintLayerButton, activeColorLayer === 'primary' && styles.paintLayerButtonSelected]}
                                                    onPress={() => setActiveColorLayer('primary')}
                                                >
                                                    <View style={[styles.paintSwatch, { backgroundColor: previewPaint.primaryColor }]} />
                                                    <Text style={styles.paintLayerText}>COR PRIMÁRIA</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.paintLayerButton, activeColorLayer === 'secondary' && styles.paintLayerButtonSelected]}
                                                    onPress={() => setActiveColorLayer('secondary')}
                                                >
                                                    <View style={[styles.paintSwatch, { backgroundColor: previewPaint.secondaryColor }]} />
                                                    <Text style={styles.paintLayerText}>COR SECUNDÁRIA</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <CarColorPicker
                                                width={Math.min(285, width * 0.27)}
                                                value={activeColorLayer === 'primary' ? previewPaint.primaryColor : previewPaint.secondaryColor}
                                                onChange={color => setPreviewPaint(current => ({
                                                    ...current,
                                                    [activeColorLayer === 'primary' ? 'primaryColor' : 'secondaryColor']: color,
                                                }))}
                                            />

                                            <Text style={styles.customSectionTitle}>ACABAMENTO</Text>
                                            <View style={styles.finishGrid}>
                                                {Object.values(CAR_PAINT_FINISHES).map(finish => {
                                                    const locked = playerLevel < finish.requiredLevel;
                                                    const selected = previewPaint.finishId === finish.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={finish.id}
                                                            activeOpacity={0.82}
                                                            style={[styles.finishCard, selected && styles.finishCardSelected]}
                                                            onPress={() => !locked && setPreviewPaint(current => ({ ...current, finishId: finish.id }))}
                                                        >
                                                            <Text style={styles.finishName}>{finish.name.toUpperCase()}</Text>
                                                            <Text style={[styles.finishMeta, locked && styles.finishMetaLocked]}>
                                                                {locked ? `🔒 Nível ${finish.requiredLevel}` : `🎨 ${finish.price}`}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            <TouchableOpacity style={styles.applyCustomizationButton} onPress={handleApplyPaint}>
                                                <Text style={styles.applyCustomizationButtonText}>
                                                    APLICAR • 🎨 {CAR_PAINT_FINISHES[previewPaint.finishId].price}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <>
                                            {availableEquipmentCategories
                                                .filter(category => category.key === customCategory)
                                                .map(category => (
                                                    <View key={category.key}>
                                                        <TouchableOpacity
                                                            style={styles.stockItem}
                                                            onPress={() => {
                                                                const success = setEquippedEquipment(
                                                                    String(carId),
                                                                    category.slot,
                                                                    null,
                                                                );

                                                                if (!success) {
                                                                    Alert.alert(
                                                                        'Não foi possível equipar',
                                                                        'Tente novamente.',
                                                                    );
                                                                    return;
                                                                }

                                                                const next = { ...previewEquipment, [category.slot]: null };
                                                                setPreviewEquipment(next);
                                                                setSelectedEquipment(next);
                                                            }}
                                                        >
                                                            <Text style={styles.equipmentName}>ORIGINAL</Text>
                                                            <Text style={styles.equipmentMeta}>EQUIPAR GRÁTIS</Text>
                                                        </TouchableOpacity>

                                                        {category.items.map(item => {
                                                            const owned = ownedCar.customization?.ownedEquipment?.includes(item.id) ?? false;
                                                            const equipped = ownedCar.customization?.equipment?.[category.slot] === item.id;
                                                            const locked = playerLevel < item.requiredLevel;
                                                            return (
                                                                <View key={item.id} style={[styles.equipmentCard, equipped && styles.equipmentCardSelected]}>
                                                                    <TouchableOpacity
                                                                        style={styles.equipmentPreviewButton}
                                                                        onPress={() => setPreviewEquipment(current => ({ ...current, [category.slot]: item.id }))}
                                                                    >
                                                                        <Image source={item.image} resizeMode="contain" style={styles.equipmentThumb} />
                                                                        <View style={{ flex: 1 }}>
                                                                            <Text style={styles.equipmentName}>{item.name.toUpperCase()}</Text>
                                                                            <Text style={styles.equipmentMeta}>
                                                                                {locked ? `🔒 Nível ${item.requiredLevel}` : owned ? (equipped ? 'EQUIPADO' : 'COMPRADO') : `🎨 ${item.price}`}
                                                                            </Text>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        disabled={locked || equipped}
                                                                        style={[styles.equipmentAction, (locked || equipped) && styles.equipmentActionDisabled]}
                                                                        onPress={() => handleEquipmentAction(category, item)}
                                                                    >
                                                                        <Text style={styles.equipmentActionText}>{equipped ? 'OK' : owned ? 'EQUIPAR' : 'COMPRAR'}</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                ))}
                                        </>
                                    )}
                                </>
                            )}
                        </ScrollView>
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
        minWidth: 92,
        minHeight: 39,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 11,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.45)',
        backgroundColor: '#242427',
        justifyContent: 'center',
    },
    accountLabel: {
        color: '#85858C',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    accountValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 1,
    },

    mainRow: {
        flex: 1,
        minHeight: 0,
        flexDirection: 'row',
    },
    showroomPane: {
        flex: 6.2,
        minWidth: 0,
        paddingRight: 14,
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
        width: '92%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        transform: [{ rotate: '-12deg' }],
        top: '31%',
        left: '-5%',
    },
    diagonalLineTwo: {
        position: 'absolute',
        width: '105%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        transform: [{ rotate: '9deg' }],
        top: '54%',
        left: '2%',
    },
    roadLine: {
        position: 'absolute',
        left: '9%',
        right: '9%',
        bottom: '33%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.24)',
    },
    roadShadow: {
        position: 'absolute',
        left: '16%',
        right: '16%',
        bottom: '32%',
        height: 18,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.16)',
        transform: [{ scaleY: 0.35 }],
    },

    vehicleIdentityRow: {
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10,
        gap: 12,
    },
    vehicleEyebrow: {
        color: '#8A8A91',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.6,
    },
    vehicleName: {
        color: ACCENT,
        fontSize: 28,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.8,
        marginTop: -1,
    },
    vehicleNameCompact: {
        fontSize: 23,
    },
    vehicleBadgesRow: {
        flexDirection: 'row',
        gap: 6,
    },
    vehicleBadge: {
        minWidth: 73,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.13)',
        backgroundColor: '#27272B',
    },
    readyBadge: {
        borderColor: 'rgba(50,215,75,0.34)',
        backgroundColor: 'rgba(50,215,75,0.06)',
    },
    vehicleBadgeLabel: {
        color: '#77777F',
        fontSize: 7,
        fontWeight: '900',
    },
    vehicleBadgeValue: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 2,
    },
    readyText: {
        color: '#32D74B',
    },

    previewCarArea: {
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingBottom: 4,
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

    statsDock: {
        flexShrink: 0,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(15,15,17,0.82)',
    },
    statsDockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 7,
    },
    statsDockTitle: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    statsDockMeta: {
        color: '#77777F',
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    statCell: {
        flex: 1,
        minWidth: 0,
        minHeight: 28,
    },
    statBlock: {
        width: '100%',
        flexShrink: 0,
    },
    statHeader: {
        minHeight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statLabel: {
        color: '#A0A0A7',
        fontSize: 8,
        fontWeight: '900',
        flexShrink: 1,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 8,
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
        backgroundColor: ACCENT,
    },
    statMarkerOne: {
        position: 'absolute',
        left: '33%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(15,15,16,0.72)',
    },
    statMarkerTwo: {
        position: 'absolute',
        left: '66%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(15,15,16,0.72)',
    },

    upgradesPane: {
        flex: 3.8,
        minWidth: 0,
        minHeight: 0,
        paddingLeft: 14,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255,255,255,0.72)',
    },
    upgradesHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
    },
    upgradesEyebrow: {
        color: '#8A8A91',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.6,
    },
    upgradesTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.8,
        marginTop: -1,
    },
    workshopStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(50,215,75,0.34)',
        backgroundColor: 'rgba(50,215,75,0.07)',
    },
    workshopStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#32D74B',
    },
    workshopStatusText: {
        color: '#32D74B',
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    upgradesDescription: {
        color: '#8D8D94',
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '700',
        marginTop: 2,
        marginBottom: 8,
    },
    upgradesScroll: {
        flex: 1,
        minHeight: 0,
    },
    upgradesScrollContent: {
        paddingBottom: 8,
        gap: 7,
    },

    upgradeCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#242428',
        padding: 9,
    },
    upgradeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    upgradeIconBox: {
        width: 30,
        height: 30,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,214,10,0.25)',
        backgroundColor: 'rgba(255,214,10,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    upgradeIcon: {
        fontSize: 14,
    },
    upgradeIdentity: {
        flex: 1,
        minWidth: 0,
    },
    upgradeTitle: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    upgradeSubtitle: {
        color: '#85858C',
        fontSize: 7,
        fontWeight: '700',
        marginTop: 1,
    },
    levelBadge: {
        minWidth: 48,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#2C2C31',
        alignItems: 'center',
    },
    levelBadgeLabel: {
        color: '#77777F',
        fontSize: 6,
        fontWeight: '900',
    },
    levelBadgeValue: {
        color: ACCENT,
        fontSize: 9,
        fontWeight: '900',
        marginTop: 1,
    },
    upgradeTrack: {
        height: 6,
        borderRadius: 2,
        backgroundColor: '#303035',
        overflow: 'hidden',
        marginTop: 7,
    },
    upgradeTrackFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: ACCENT,
    },
    upgradeMarkerOne: {
        position: 'absolute',
        left: '33%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(15,15,16,0.72)',
    },
    upgradeMarkerTwo: {
        position: 'absolute',
        left: '66%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(15,15,16,0.72)',
    },
    upgradeFooter: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 7,
    },
    costLabel: {
        color: '#73737A',
        fontSize: 6,
        fontWeight: '900',
        letterSpacing: 0.4,
    },
    costValue: {
        color: '#EAEAEC',
        fontSize: 8,
        fontWeight: '900',
        marginTop: 1,
    },
    costValueLow: {
        color: '#FF6961',
    },
    upgradeButton: {
        minWidth: 86,
        minHeight: 31,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ACCENT,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeButtonLowBalance: {
        borderColor: '#5B5B62',
        backgroundColor: '#303035',
    },
    upgradeButtonMaxed: {
        borderColor: 'rgba(50,215,75,0.38)',
        backgroundColor: 'rgba(50,215,75,0.10)',
    },
    upgradeButtonText: {
        color: '#111113',
        fontSize: 8,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.4,
    },
    upgradeButtonTextLow: {
        color: '#8A8A91',
    },
    upgradeButtonTextMaxed: {
        color: '#32D74B',
    },

    customizationCard: {
        minHeight: 58,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,214,10,0.45)',
        backgroundColor: 'rgba(255,214,10,0.06)',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    customizationArrow: { color: ACCENT, fontSize: 28, fontWeight: '900', marginLeft: 8 },
    backModeButton: {
        paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: '#29292D',
    },
    backModeButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
    categoryTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    categoryTab: {
        paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)', backgroundColor: '#29292D',
    },
    categoryTabSelected: { borderColor: ACCENT, backgroundColor: 'rgba(255,214,10,0.10)' },
    categoryTabText: { color: '#8D8D94', fontSize: 7, fontWeight: '900' },
    categoryTabTextSelected: { color: ACCENT },
    paintEditor: { gap: 10 },
    paintLayerRow: { flexDirection: 'row', gap: 7 },
    paintLayerButton: {
        flex: 1, minHeight: 38, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
        backgroundColor: '#29292D', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7,
    },
    paintLayerButtonSelected: { borderColor: ACCENT },
    paintSwatch: { width: 19, height: 19, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
    paintLayerText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900' },
    customSectionTitle: { color: '#8A8A91', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
    finishGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    finishCard: {
        minWidth: '47%', flexGrow: 1, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
        backgroundColor: '#29292D', paddingHorizontal: 9, paddingVertical: 8,
    },
    finishCardSelected: { borderColor: ACCENT, backgroundColor: 'rgba(255,214,10,0.08)' },
    finishName: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
    finishMeta: { color: ACCENT, fontSize: 7, fontWeight: '900', marginTop: 3 },
    finishMetaLocked: { color: '#77777F' },
    applyCustomizationButton: {
        minHeight: 38, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginTop: 2,
    },
    applyCustomizationButtonText: { color: '#111113', fontSize: 9, fontWeight: '900', fontStyle: 'italic' },
    stockItem: {
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#29292D',
        padding: 10, marginBottom: 7,
    },
    equipmentCard: {
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: '#29292D',
        padding: 7, marginBottom: 7, flexDirection: 'row', alignItems: 'center', gap: 7,
    },
    equipmentCardSelected: { borderColor: '#32D74B' },
    equipmentPreviewButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    equipmentThumb: { width: 68, height: 40 },
    equipmentName: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
    equipmentMeta: { color: '#8D8D94', fontSize: 7, fontWeight: '800', marginTop: 2 },
    equipmentAction: {
        minWidth: 62, minHeight: 30, borderRadius: 7, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7,
    },
    equipmentActionDisabled: { backgroundColor: '#3A3A3F' },
    equipmentActionText: { color: '#111113', fontSize: 7, fontWeight: '900' },

    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#171719',
    },
    errorEyebrow: {
        color: ACCENT,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.6,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        marginTop: 4,
    },
    errorText: {
        color: '#8D8D94',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 6,
    },
});
