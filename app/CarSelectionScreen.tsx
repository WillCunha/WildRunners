import { AudioContext } from '@/context/AudioContext';
import { useCarSelection } from '@/context/CarContext';
import { raceRewardsService } from '@/src/services/raceRewardsService';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
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

type CarCanvasProps = {
    carId: CarKey;
    width: number;
    colorFront: string;
    colorBack: string;
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

const MAX_UPGRADE_LEVEL = 10;
const ACCENT = '#FFD60A';

const DASHBOARD_MUSIC = require('@/assets/audio/dashboard/audio_one.mp3');

const getPlayerTier = (trophies: number) => {
    if (trophies >= 600) return 4;
    if (trophies >= 300) return 3;
    if (trophies >= 100) return 2;
    return 1;
};

const CarCanvas = React.memo(
    ({ carId, width, colorFront, colorBack }: CarCanvasProps) => {
        const car = carMaps[carId];
        const scale = width / car.baseSize.width;
        const height = car.baseSize.height * scale;

        return (
            <View style={{ width, height }}>
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

const StatBar = ({
    label,
    progress,
    value,
}: {
    label: string;
    progress: number;
    value: number;
}) => (
    <View style={styles.statBlock}>
        <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>NÍVEL {value}</Text>
        </View>
        <View style={styles.statTrack}>
            <View style={[styles.statFill, { width: `${Math.max(4, progress)}%` }]} />
            <View style={styles.statMarkerOne} />
            <View style={styles.statMarkerTwo} />
        </View>
    </View>
);

export default function CarSelectionScreen() {
    const { width, height } = useWindowDimensions();
    const isCompactLandscape = height < 430;
    const { playMusic } = useContext(AudioContext);
    const {
        selectedCar,
        selectedColorFront,
        selectedColorBack,
        setSelectedCar,
        setSelectedColorFront,
        setSelectedColorBack,
    } = useCarSelection();

    const profile = usePlayerStore(state => state.profile);

    const carKeys = useMemo(
        () =>
            (Object.keys(carMaps) as CarKey[]).filter(
                carKey => profile?.garage?.[carKey] !== undefined,
            ),
        [profile],
    );

    const selectedOwnedCar = carKeys.includes(selectedCar as CarKey)
        ? (selectedCar as CarKey)
        : null;

    const [previewCar, setPreviewCar] = useState<CarKey | null>(selectedOwnedCar);
    const [previewColorFront, setPreviewColorFront] = useState(
        selectedColorFront || AVAILABLE_COLORS[0],
    );
    const [previewColorBack, setPreviewColorBack] = useState(
        selectedColorBack || AVAILABLE_COLORS[2],
    );

    useEffect(() => {
        playMusic(DASHBOARD_MUSIC, { volume: 0.15, loop: true });
    }, [playMusic]);

    useEffect(() => {
        if (!profile) return;

        setPreviewCar(current => {
            if (current && profile.garage?.[current] !== undefined) return current;
            return carKeys[0] ?? null;
        });
    }, [carKeys, profile]);

    const playerTier = getPlayerTier(profile?.trophies ?? 0);
    const currentCarData = previewCar ? carMaps[previewCar] : null;
    const ownedCarData = previewCar ? profile?.garage?.[previewCar] : undefined;

    const previewWidth = Math.min(
        isCompactLandscape ? width * 0.42 : width * 0.46,
        isCompactLandscape ? 370 : 450,
    );

    const calculateProgress = (level = 1) =>
        Math.min(
            100,
            Math.max(0, ((level - 1) / (MAX_UPGRADE_LEVEL - 1)) * 100),
        );

    const speedLevel = ownedCarData?.motor?.speedLevel ?? 1;
    const accelerationLevel = ownedCarData?.motor?.accelerationLevel ?? 1;
    const jumpLevel = ownedCarData?.motor?.jumpPowerLevel ?? 1;
    const defenseLevel = ownedCarData?.engrenagem?.defenseLevel ?? 1;

    const handleOpenStore = () => {
        if (previewCar) {
            setSelectedCar(previewCar);
            setSelectedColorFront(previewColorFront);
            setSelectedColorBack(previewColorBack);
        }

        router.push({ pathname: '/LoadingScreen', params: { next: '/CarStore' } });
    };

    const resetProfile =
        usePlayerStore(
            state =>
                state.resetProfile,
        );

    const handleOpenOficina = () => {
        if (previewCar) {
            setSelectedCar(previewCar);
            setSelectedColorFront(previewColorFront);
            setSelectedColorBack(previewColorBack);
        }

        router.push({ pathname: '/LoadingScreen', params: { next: '/OficinaScreen' } });
    };

    const handleContinue = () => {
        if (!previewCar || !currentCarData || !ownedCarData) {
            Alert.alert(
                'Garagem vazia',
                'Compre um veículo na loja antes de continuar para a corrida.',
            );
            return;
        }

        setSelectedCar(previewCar);
        setSelectedColorFront(previewColorFront);
        setSelectedColorBack(previewColorBack);
        router.navigate('/deckselection' as any);
    };

    const testRaceResult = () => {
        const raceId =
            `test-${Date.now()}`;

        raceRewardsService.completeRace({
            raceId,
            position: 2,
            totalRacers: 6,
            carId: 'uno',
            mapId: 'city',
            rewards: {
                motor: 2,
                spray: 1,
                engrenagem: 225,
                trophies: 1,
            },

            unlocks: [
                {
                    id: 'unlock-test-tnt',
                    itemId: 'tnt',
                    type: 'card',
                    name: 'TNT',
                    rarity: 'epic',
                },
            ],
            finishedAt: Date.now(),
            isNewRecord: true,
        });
        router.push('/RaceResultScreen' as any,);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, isCompactLandscape && styles.containerCompact]}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, isCompactLandscape && styles.titleCompact]}>
                            RACE GARAGE
                        </Text>
                        <Text style={styles.subtitle}>ESCOLHA E PREPARE SUA MÁQUINA</Text>
                    </View>

                    <View style={styles.accountRow}>
                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>PILOTO</Text>
                            <Text style={styles.accountValue} numberOfLines={1}>
                                @{profile?.username ?? 'PLAYER'}
                            </Text>
                        </View>
                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>NÍVEL</Text>
                            <Text style={styles.accountValue}>{playerTier}</Text>
                        </View>
                        <View style={[styles.accountBadge, styles.trophyBadge]}>
                            <Text style={styles.accountLabel}>TROFÉUS</Text>
                            <Text style={styles.accountValue}>🏆 {profile?.trophies ?? 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.mainRow}>
                    <View style={styles.carSidebar}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarEyebrow}>SUA GARAGEM</Text>
                            <Text style={styles.sidebarCount}>{carKeys.length} CARROS</Text>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sidebarContent}
                            bounces={false}
                        >
                            {carKeys.map(carKey => {
                                const selected = previewCar === carKey;
                                const item = carMaps[carKey];

                                return (
                                    <TouchableOpacity
                                        key={carKey}
                                        activeOpacity={0.84}
                                        onPress={() => setPreviewCar(carKey)}
                                        style={[
                                            styles.sidebarCarItem,
                                            selected && styles.sidebarCarItemSelected,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.sidebarAccent,
                                                !selected && styles.sidebarAccentInactive,
                                            ]}
                                        />

                                        <Image
                                            source={item.icone as ImageSourcePropType}
                                            resizeMode="contain"
                                            style={styles.sidebarCarImage}
                                        />

                                        <View style={styles.sidebarCarInfo}>
                                            <Text
                                                style={[
                                                    styles.sidebarCarName,
                                                    selected && styles.sidebarCarNameSelected,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {carKey.toUpperCase()}
                                            </Text>
                                            <Text style={styles.sidebarCarMeta}>
                                                NÍVEL {item.tier} • PRONTO
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity
                                activeOpacity={0.84}
                                onPress={handleOpenStore}
                                style={[styles.sidebarCarItem, styles.sidebarStoreItem]}
                            >
                                <Text style={styles.sidebarStoreIcon}>＋</Text>
                                <View style={styles.sidebarCarInfo}>
                                    <Text style={styles.sidebarStoreTitle}>NOVO CARRO</Text>
                                    <Text style={styles.sidebarCarMeta}>ABRIR LOJA</Text>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <View style={styles.showroomPane}>
                        <View style={styles.showroomBackdrop}>
                            <View style={styles.diagonalLineOne} />
                            <View style={styles.diagonalLineTwo} />
                            <View style={styles.roadLine} />

                            <View style={styles.previewArea}>
                                {previewCar && currentCarData ? (
                                    <CarCanvas
                                        carId={previewCar}
                                        width={previewWidth}
                                        colorFront={previewColorFront}
                                        colorBack={previewColorBack}
                                    />
                                ) : (
                                    <View style={styles.emptyGarage}>
                                        <Text style={styles.emptyGarageIcon}>🏁</Text>
                                        <Text style={styles.emptyGarageTitle}>GARAGEM VAZIA</Text>
                                        <Text style={styles.emptyGarageText}>
                                            VISITE A LOJA PARA COMPRAR SEU PRIMEIRO CARRO
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.paintPanel}>
                                <View style={styles.paintColumn}>
                                    <Text style={styles.paintLabel}>COR PRINCIPAL</Text>
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
                                    <Text style={styles.paintLabel}>COR SECUNDÁRIA</Text>
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

                    <View style={styles.detailsPane}>
                        <ScrollView
                            style={styles.detailsScroll}
                            contentContainerStyle={styles.detailsScrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <Text style={styles.className}>VEÍCULO EQUIPADO</Text>
                            <Text
                                style={[styles.selectedCarName, isCompactLandscape && styles.selectedCarNameCompact]}
                                numberOfLines={1}
                            >
                                {previewCar?.toUpperCase() ?? 'SEM VEÍCULO'}
                            </Text>

                            <View style={styles.vehicleMetaRow}>
                                <View style={styles.infoCell}>
                                    <Text style={styles.infoCellLabel}>CATEGORIA</Text>
                                    <Text style={styles.infoCellValue}>
                                        NÍVEL {currentCarData?.tier ?? '-'}
                                    </Text>
                                </View>
                                <View style={styles.infoDivider} />
                                <View style={styles.infoCell}>
                                    <Text style={styles.infoCellLabel}>ESTADO</Text>
                                    <Text style={[styles.infoCellValue, styles.readyText]}>
                                        {previewCar ? 'PRONTO' : 'INDISPONÍVEL'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.performancePanel}>
                                <Text style={styles.performanceTitle}>UPGRADES INSTALADOS</Text>
                                <StatBar
                                    label="VELOCIDADE"
                                    value={speedLevel}
                                    progress={calculateProgress(speedLevel)}
                                />
                                <StatBar
                                    label="ACELERAÇÃO"
                                    value={accelerationLevel}
                                    progress={calculateProgress(accelerationLevel)}
                                />
                                <StatBar
                                    label="FORÇA DO PULO"
                                    value={jumpLevel}
                                    progress={calculateProgress(jumpLevel)}
                                />
                                <StatBar
                                    label="DEFESA"
                                    value={defenseLevel}
                                    progress={calculateProgress(defenseLevel)}
                                />
                            </View>

                            <View style={styles.partsPanel}>
                                <Text style={styles.partsTitle}>ESTOQUE DA GARAGEM</Text>
                                <View style={styles.partsRow}>
                                    <View style={styles.partBadge}>
                                        <Text style={styles.partIcon}>⚙️</Text>
                                        <Text style={styles.partValue}>{profile?.parts?.engrenagem ?? 0}</Text>
                                        <Text style={styles.partLabel}>MOTOR</Text>
                                    </View>
                                    <View style={styles.partBadge}>
                                        <Text style={styles.partIcon}>🎨</Text>
                                        <Text style={styles.partValue}>{profile?.parts?.spray ?? 0}</Text>
                                        <Text style={styles.partLabel}>SPRAY</Text>
                                    </View>
                                    <View style={styles.partBadge}>
                                        <Text style={styles.partIcon}>🔧</Text>
                                        <Text style={styles.partValue}>{profile?.parts?.motor ?? 0}</Text>
                                        <Text style={styles.partLabel}>PEÇAS</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.actionsRow}>
                            {/* <TouchableOpacity
                                activeOpacity={0.84}
                                onPress={resetProfile}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.secondaryButtonText}>RESET</Text>
                            </TouchableOpacity> */}

                            <TouchableOpacity
                                activeOpacity={0.84}
                                onPress={handleOpenOficina}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.secondaryButtonText}>OFICINA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.86}
                                onPress={handleContinue}
                                style={[styles.mainButton, !previewCar && styles.mainButtonDisabled]}
                            >
                                <Text style={styles.mainButtonText}>
                                    {previewCar ? 'EQUIPAR E CONTINUAR' : 'COMPRAR UM CARRO'}
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
    safeArea: { flex: 1, backgroundColor: '#101012' },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#171719',
    },
    containerCompact: { paddingVertical: 7 },
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
    titleCompact: { fontSize: 23 },
    subtitle: {
        color: '#8D8D94',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 1,
    },
    accountRow: { flexDirection: 'row', gap: 8 },
    accountBadge: {
        minWidth: 68,
        maxWidth: 145,
        minHeight: 39,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 11,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.45)',
        backgroundColor: '#242427',
        justifyContent: 'center',
    },
    trophyBadge: { minWidth: 96 },
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
    carSidebar: {
        maxWidth: '25%',
        minWidth: '25%',
        marginRight: 12,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.34)',
        backgroundColor: '#1E1E21',
        overflow: 'hidden',
    },
    sidebarHeader: {
        minHeight: 43,
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.14)',
        backgroundColor: '#242427',
    },
    sidebarEyebrow: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.8,
    },
    sidebarCount: {
        color: '#85858C',
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginTop: 2,
    },
    sidebarContent: {
        padding: 7,
        gap: 7,

    },
    sidebarCarItem: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: '#29292D',
        paddingHorizontal: 8,
        paddingVertical: 6,
        overflow: 'hidden',
    },
    sidebarCarItemSelected: {
        borderColor: ACCENT,
        backgroundColor: 'rgba(255,214,10,0.09)',
    },
    sidebarAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: ACCENT,
    },
    sidebarAccentInactive: {
        opacity: 0.18,
    },
    sidebarCarImage: {
        width: 100,
        height: 100,
        marginRight: 7,
    },
    sidebarCarInfo: {
        flex: 1,
        minWidth: 0,
    },
    sidebarCarName: {
        color: '#F4F4F5',
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    sidebarCarNameSelected: {
        color: ACCENT,
    },
    sidebarCarMeta: {
        color: '#85858C',
        fontSize: 7,
        fontWeight: '900',
        marginTop: 3,
    },
    sidebarStoreItem: {
        borderStyle: 'dashed',
        borderColor: 'rgba(255,214,10,0.45)',
    },
    sidebarStoreIcon: {
        width: 72,
        textAlign: 'center',
        color: ACCENT,
        fontSize: 27,
        fontWeight: '300',
        marginRight: 7,
    },
    sidebarStoreTitle: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    mainRow: { flex: 1, minHeight: 0, flexDirection: 'row' },
    showroomPane: { flex: 1, paddingRight: 14, maxWidth: '50%', minWidth: '50%' },
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
    previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
    carLayer: { position: 'absolute', left: 0, top: 0, zIndex: 2 },
    wheel: { position: 'absolute', zIndex: 1 },
    emptyGarage: { alignItems: 'center', maxWidth: 290 },
    emptyGarageIcon: { fontSize: 30 },
    emptyGarageTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 6 },
    emptyGarageText: {
        color: '#85858C',
        fontSize: 9,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.7,
        marginTop: 5,
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
    paintColumn: { flex: 1, minWidth: 0 },
    paintLabel: { color: '#85858C', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginBottom: 5 },
    colorRow: { flexDirection: 'row', gap: 5 },
    colorOption: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    colorOptionSelected: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.08 }] },
    detailsPane: {
        flex: 3.5,
        maxWidth: '25%',
        minWidth: '25%',
        minHeight: 0,
        paddingLeft: 14,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255,255,255,0.72)',
    },
    detailsScroll: { flex: 1, minHeight: 0 },
    detailsScrollContent: { paddingBottom: 6 },
    className: { color: '#8A8A91', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
    selectedCarName: {
        color: ACCENT,
        fontSize: 28,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.6,
        marginTop: -2,
    },
    selectedCarNameCompact: { fontSize: 22 },
    vehicleMetaRow: {
        minHeight: 45,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#242428',
        paddingHorizontal: 10,
        marginTop: 7,
        marginBottom: 9,
    },
    infoCell: { flex: 1 },
    infoCellLabel: { color: '#83838A', fontSize: 8, fontWeight: '900' },
    infoCellValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 1 },
    readyText: { color: '#32D74B' },
    infoDivider: { width: StyleSheet.hairlineWidth, height: 25, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 10 },
    performancePanel: { flexShrink: 0 },
    performanceTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 },
    statBlock: { marginBottom: 7 },
    statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    statLabel: { color: '#A0A0A7', fontSize: 8, fontWeight: '900' },
    statValue: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
    statTrack: { height: 7, borderRadius: 2, backgroundColor: '#303035', overflow: 'hidden' },
    statFill: { height: '100%', borderRadius: 2, backgroundColor: ACCENT },
    statMarkerOne: { position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(15,15,16,0.7)' },
    statMarkerTwo: { position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(15,15,16,0.7)' },
    partsPanel: { marginTop: 3 },
    partsTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 },
    partsRow: { flexDirection: 'row', gap: 6 },
    partBadge: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 7,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#242428',
        alignItems: 'center',
    },
    partIcon: { fontSize: 12 },
    partValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 1 },
    partLabel: { color: '#85858C', fontSize: 7, fontWeight: '900', marginTop: 1 },
    actionsRow: {
        flexShrink: 0,
        flexDirection: 'row',
        gap: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.14)',
    },
    secondaryButton: {
        minWidth: 100,
        minHeight: 42,
        paddingHorizontal: 11,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.52)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27272B',
    },
    secondaryButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', fontStyle: 'italic' },
    mainButton: {
        flex: 1,
        minHeight: 42,
        paddingHorizontal: 10,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: ACCENT,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonDisabled: { backgroundColor: '#35353A', borderColor: '#55555D' },
    mainButtonText: { color: '#111113', fontSize: 10, fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.3, textAlign: 'center' },
});
