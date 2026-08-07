import { useCarSelection } from '@/context/CarContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
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
};

type StatBarProps = {
    label: string;
    progress: number;
    level: number;
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
                    style={[
                        styles.carLayer,
                        { width, height, tintColor: colorBack },
                    ]}
                />
                <Image
                    source={car.corpoBrancoTras as ImageSourcePropType}
                    resizeMode="contain"
                    style={[
                        styles.carLayer,
                        { width, height, tintColor: colorFront },
                    ]}
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

const StatBar = ({ label, progress, level }: StatBarProps) => (
    <View style={styles.statBlock}>
        <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>NV. {level}</Text>
        </View>

        <View style={styles.statTrack}>
            <View
                style={[
                    styles.statFill,
                    { width: `${Math.max(4, Math.min(100, progress))}%` },
                ]}
            />
            <View style={styles.statMarkerOne} />
            <View style={styles.statMarkerTwo} />
        </View>
    </View>
);

export default function OficinaScreen() {
    const { width, height } = useWindowDimensions();
    const isCompactLandscape = height < 430;

    const {
        selectedCar,
        selectedColorFront,
        selectedColorBack,
    } = useCarSelection();

    const profile = usePlayerStore(state => state.profile);
    const upgradeCar = usePlayerStore(state => state.upgradeCar);

    const carId = selectedCar as CarKey;
    const carData = carMaps[carId];
    const ownedCar = profile?.garage?.[selectedCar];

    if (!profile || !carData || !ownedCar) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar hidden={true} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorEyebrow}>WILD WORKSHOP</Text>
                    <Text style={styles.errorTitle}>CARRO NÃO ENCONTRADO</Text>
                    <Text style={styles.errorText}>
                        Selecione um veículo da sua garagem antes de abrir a oficina.
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
    const rarityLevel = ownedCar.spray.rarityLevel;

    const previewWidth = Math.min(
        isCompactLandscape ? width * 0.42 : width * 0.46,
        isCompactLandscape ? 385 : 465,
    );

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
            if (isMaxed) return;

            const success = upgradeCar(
                selectedCar,
                partCategory,
                statKey,
                upgradeCost,
            );

            if (!success) {
                Alert.alert(
                    'PEÇAS INSUFICIENTES',
                    `Você precisa de ${upgradeCost} peças de ${partCategory.toUpperCase()} para este upgrade.`,
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
                        <Text style={styles.levelBadgeLabel}>NÍVEL</Text>
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
                            {isMaxed ? 'STATUS' : 'CUSTO DO PRÓXIMO NÍVEL'}
                        </Text>
                        <Text
                            style={[
                                styles.costValue,
                                !canAfford && !isMaxed && styles.costValueLow,
                            ]}
                        >
                            {isMaxed
                                ? 'UPGRADE COMPLETO'
                                : `${icon} ${upgradeCost}  •  SALDO ${balance}`}
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
                                !canAfford && !isMaxed && styles.upgradeButtonTextLow,
                                isMaxed && styles.upgradeButtonTextMaxed,
                            ]}
                        >
                            {isMaxed ? 'MÁXIMO' : canAfford ? 'INSTALAR' : 'SEM PEÇAS'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
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
                    <View>
                        <Text
                            style={[
                                styles.title,
                                isCompactLandscape && styles.titleCompact,
                            ]}
                        >
                            WILD WORKSHOP
                        </Text>
                        <Text style={styles.subtitle}>
                            PERFORMANCE LAB / EVOLUA SUA MÁQUINA
                        </Text>
                    </View>

                    <View style={styles.accountRow}>
                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>MOTOR</Text>
                            <Text style={styles.accountValue}>⚙️ {myParts.motor}</Text>
                        </View>

                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>PEÇAS</Text>
                            <Text style={styles.accountValue}>
                                🔧 {myParts.engrenagem}
                            </Text>
                        </View>

                        <View style={styles.accountBadge}>
                            <Text style={styles.accountLabel}>SPRAY</Text>
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
                                        VEÍCULO EM MANUTENÇÃO
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
                                        <Text style={styles.vehicleBadgeLabel}>CATEGORIA</Text>
                                        <Text style={styles.vehicleBadgeValue}>
                                            NÍVEL {carData.tier}
                                        </Text>
                                    </View>
                                    <View style={[styles.vehicleBadge, styles.readyBadge]}>
                                        <Text style={styles.vehicleBadgeLabel}>STATUS</Text>
                                        <Text style={[styles.vehicleBadgeValue, styles.readyText]}>
                                            NA BANCADA
                                        </Text>
                                    </View>
                                    <View style={styles.vehicleBadge}>
                                        <Text style={styles.vehicleBadgeLabel}>RARIDADE</Text>
                                        <Text style={styles.vehicleBadgeValue}>NV. {rarityLevel}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.previewCarArea}>
                                <CarCanvas
                                    carId={carId}
                                    width={previewWidth}
                                    colorFront={selectedColorFront}
                                    colorBack={selectedColorBack}
                                />
                            </View>

                            <View style={styles.statsDock}>
                                <View style={styles.statsDockHeader}>
                                    <Text style={styles.statsDockTitle}>
                                        CONFIGURAÇÃO INSTALADA
                                    </Text>
                                    <Text style={styles.statsDockMeta}>
                                        NÍVEL MÁXIMO {MAX_LEVEL}
                                    </Text>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label="VELOCIDADE"
                                            level={speedLevel}
                                            progress={calculateProgress(speedLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label="ACELERAÇÃO"
                                            level={accelerationLevel}
                                            progress={calculateProgress(accelerationLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label="FORÇA DO PULO"
                                            level={jumpLevel}
                                            progress={calculateProgress(jumpLevel)}
                                        />
                                    </View>
                                    <View style={styles.statCell}>
                                        <StatBar
                                            label="DEFESA"
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
                                <Text style={styles.upgradesEyebrow}>BANCADA TÉCNICA</Text>
                                <Text style={styles.upgradesTitle}>UPGRADES</Text>
                            </View>
                            <View style={styles.workshopStatusBadge}>
                                <View style={styles.workshopStatusDot} />
                                <Text style={styles.workshopStatusText}>ONLINE</Text>
                            </View>
                        </View>

                        <Text style={styles.upgradesDescription}>
                            Instale melhorias permanentes usando as peças coletadas nas corridas.
                        </Text>

                        <ScrollView
                            style={styles.upgradesScroll}
                            contentContainerStyle={styles.upgradesScrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {renderUpgradeItem(
                                'Velocidade Máxima',
                                'Aumenta a velocidade final do veículo',
                                speedLevel,
                                'motor',
                                'speedLevel',
                                '⚙️',
                            )}
                            {renderUpgradeItem(
                                'Aceleração',
                                'Melhora a resposta e retomada de velocidade',
                                accelerationLevel,
                                'motor',
                                'accelerationLevel',
                                '⚙️',
                            )}
                            {renderUpgradeItem(
                                'Força do Pulo',
                                'Aumenta a potência dos saltos',
                                jumpLevel,
                                'motor',
                                'jumpPowerLevel',
                                '⚙️',
                            )}
                            {renderUpgradeItem(
                                'Defesa / Resistência',
                                'Fortalece o veículo contra ataques',
                                defenseLevel,
                                'engrenagem',
                                'defenseLevel',
                                '🔧',
                            )}
                            {renderUpgradeItem(
                                'Estética e Raridade',
                                'Eleva o nível visual e a raridade do carro',
                                rarityLevel,
                                'spray',
                                'rarityLevel',
                                '🎨',
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
