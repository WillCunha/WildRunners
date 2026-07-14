import { useCarSelection } from '@/context/CarContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CarKey = keyof typeof carMaps;

const AVAILABLE_COLORS = [
    '#FF3B30', '#34C759', '#007AFF', '#FFCC00',
    '#FF9500', '#AF52DE', '#1C1C1E', '#F2F2F7',
];

// Define o nível máximo de upgrade para calcular a porcentagem da barra
const MAX_UPGRADE_LEVEL = 10;

const getPlayerTier = (trophies: number) => {
    if (trophies >= 600) return 4;
    if (trophies >= 300) return 3;
    if (trophies >= 100) return 2;
    return 1;
};

// Componente visual da barra de progresso
const StatBar = ({ label, progress }: { label: string, progress: number }) => (
    <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
    </View>
);

export default function CarSelectionScreen() {
    const navigation = useNavigation();
    const { setSelectedCar, setSelectedColorFront, setSelectedColorBack } = useCarSelection();

    const profile = usePlayerStore((state) => state.profile);
    const buyCar = usePlayerStore((state) => state.buyCar);

    const [previewCar, setPreviewCar] = useState<CarKey>('fusca');
    const [previewColorFront, setPreviewColorFront] = useState<string>(AVAILABLE_COLORS[0]);
    const [previewColorBack, setPreviewColorBack] = useState<string>(AVAILABLE_COLORS[0]);

    const currentCarData = carMaps[previewCar];
    const carKeys = (Object.keys(carMaps) as CarKey[]).filter(
        (carKey) => profile?.garage[carKey] !== undefined
    );
    const playerTier = getPlayerTier(profile?.trophies || 0);
    const isLockedByTier = currentCarData.tier > playerTier;

    // Dados do carro na garagem
    const ownedCarData = profile?.garage[previewCar];
    const isOwned = ownedCarData !== undefined;

    const carCost = currentCarData.tier * 100;

    // Lógica das barras de progresso (0% a 100%)
    const calculateProgress = (level?: number) => {
        if (!isOwned || !level) return 0;
        // Subtraímos 1 porque o nível inicial (1) equivale a 0% de upgrade
        return Math.min(100, Math.max(0, ((level - 1) / (MAX_UPGRADE_LEVEL - 1)) * 100));
    };

    const speedProgress = calculateProgress(ownedCarData?.motor?.speedLevel);
    const accelProgress = calculateProgress(ownedCarData?.motor?.accelerationLevel);
    const jumpProgress = calculateProgress(ownedCarData?.motor?.jumpPowerLevel);
    const defProgress = calculateProgress(ownedCarData?.engrenagem?.defenseLevel);

    const handleOpenOficina = () => {
        if (!isOwned) {
            Alert.alert("Bloqueado", "Você precisa comprar o carro antes de melhorá-lo.");
            return;
        }

        setSelectedCar(previewCar);
        setSelectedColorFront(previewColorFront);
        setSelectedColorBack(previewColorBack);

        // 3. Só depois de salvar no contexto, faz a navegação
        router.push({ pathname: '/LoadingScreen', params: { next: '/OficinaScreen' } });
    };

    const handleActionPress = () => {
        if (isLockedByTier) return;

        if (!isOwned) {
            const success = buyCar(previewCar, 0, carCost);
            if (!success) {
                Alert.alert("Saldo Insuficiente", `Você precisa de ${carCost} engrenagens para comprar este veículo.`);
            }
            return;
        }

        setSelectedCar(previewCar);
        setSelectedColorFront(previewColorFront);
        setSelectedColorBack(previewColorBack);
        router.navigate('/deckselection' as any);
    };

    let buttonText = 'CONTINUAR';
    let dynamicButtonStyle = styles.playButton;

    if (isLockedByTier) {
        buttonText = `BLOQUEADO (REQUER NÍVEL ${currentCarData.tier})`;
        dynamicButtonStyle = [styles.playButton, { backgroundColor: '#555555', borderColor: '#333333' }];
    } else if (!isOwned) {
        buttonText = `COMPRAR (${carCost} ENGRENAGENS)`;
        dynamicButtonStyle = [styles.playButton, { backgroundColor: '#FF3B30', borderColor: '#8B0000' }];
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerLeftInfoContainer}>
                <View style={styles.infoBadge}>
                    <Text style={styles.infoUsernameText}>@{profile?.username}</Text>
                </View>
                <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>NÍVEL {playerTier}</Text>
                </View>
                <View style={[styles.infoBadge, { backgroundColor: '#FFCC00' }]}>
                    <Text style={styles.iconText}>🏆</Text>
                    <Text style={styles.infoBadgeText}>{profile?.trophies || 0}</Text>
                </View>
            </View>
            <View style={styles.headerInfoContainer}>
                <View style={styles.infoBadge}>
                    <Text style={styles.iconText}>⚙️</Text>
                    <Text style={styles.infoBadgeText}>{profile?.parts?.motor || 0}</Text>
                </View>
                <View style={styles.infoBadge}>
                    <Text style={styles.iconText}>🎨</Text>
                    <Text style={styles.infoBadgeText}>{profile?.parts?.spray || 0}</Text>
                </View>
                <View style={styles.infoBadge}>
                    <Text style={styles.iconText}>🔧</Text>
                    <Text style={styles.infoBadgeText}>{profile?.parts?.engrenagem || 0}</Text>
                </View>
            </View>
            <Text style={styles.title}>GARAGEM</Text>
            <Text style={styles.subtitle}>Selecione o veículo para sua próxima corrida.</Text>

            <View style={styles.controlsContainer}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.colorScroll}>
                    {AVAILABLE_COLORS.map((color) => (
                        <TouchableOpacity
                            key={`front-${color}`}
                            style={[styles.colorOption, { backgroundColor: color }, previewColorFront === color && styles.colorOptionSelected]}
                            onPress={() => setPreviewColorFront(color)}
                            activeOpacity={0.8}
                        />
                    ))}
                </ScrollView>

                <ScrollView showsVerticalScrollIndicator={false} style={[styles.colorScroll, { marginLeft: '-15%' }]}>
                    {AVAILABLE_COLORS.map((color) => (
                        <TouchableOpacity
                            key={`back-${color}`}
                            style={[styles.colorOption, { backgroundColor: color }, previewColorBack === color && styles.colorOptionSelected]}
                            onPress={() => setPreviewColorBack(color)}
                            activeOpacity={0.8}
                        />
                    ))}
                </ScrollView>

                <View style={[styles.carWrapper, isLockedByTier && { opacity: 0.3 }]}>
                    <Image source={currentCarData.corpoBrancoFrente} style={[styles.carBase, { tintColor: previewColorBack }]} resizeMode="contain" />
                    <Image source={currentCarData.corpoBrancoTras} style={[styles.carBase, { tintColor: previewColorFront }]} resizeMode="contain" />
                    <Image source={currentCarData.corpoTransparente} style={styles.carOverlay} resizeMode="contain" />
                    <Image source={currentCarData.wheelImage} style={[styles.wheel, { width: currentCarData.size.width, height: currentCarData.size.height, left: currentCarData.rodaTras.x, bottom: currentCarData.rodaTras.y }]} />
                    <Image source={currentCarData.wheelImage} style={[styles.wheel, { width: currentCarData.size.width, height: currentCarData.size.height, left: currentCarData.rodaFrente.x, bottom: currentCarData.rodaFrente.y }]} />
                </View>



                <ScrollView showsVerticalScrollIndicator={false} style={styles.modelScroll}>
                    <Text style={styles.modelTitle}>LISTA DE VEÍCULOS</Text>

                    {carKeys.map((carKey) => {
                        const carTier = carMaps[carKey].tier;
                        const isCarOwned = profile?.garage[carKey] !== undefined;
                        const isCarLocked = carTier > playerTier;

                        return (
                            <TouchableOpacity
                                key={carKey}
                                style={[
                                    styles.modelOption,
                                    previewCar === carKey && styles.modelOptionSelected,
                                    isCarLocked && { borderColor: '#FF3B30' }
                                ]}
                                onPress={() => setPreviewCar(carKey)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.modelText, previewCar === carKey && styles.modelTextSelected]}>
                                    {carKey.toUpperCase()} {isCarOwned ? '✓' : (isCarLocked ? '🔒' : '💰')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

            </View>

            {/* CAIXA DE STATUS (UPGRADES) */}
            <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>STATUS DO VEÍCULO</Text>
                <StatBar label="Velocidade" progress={speedProgress} />
                <StatBar label="Aceleração" progress={accelProgress} />
                <StatBar label="Força do Pulo" progress={jumpProgress} />
                <StatBar label="Defesa" progress={defProgress} />
            </View>

            <View style={styles.btnContainer}>
                <TouchableOpacity style={styles.btnOficina} onPress={handleOpenOficina}>
                    <Text style={styles.openOficinaText}>OFICINA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicButtonStyle} activeOpacity={isLockedByTier ? 1 : 0.9} onPress={handleActionPress}>
                    <Text style={styles.playButtonText}>{buttonText}</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
    headerLeftInfoContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start', // Alinha os itens à esquerda
        gap: 8,
        zIndex: 100,
    },
    headerInfoContainer: {
        position: 'absolute',
        top: 40,
        right: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        zIndex: 100,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#1C1C1E',
        shadowColor: '#1C1C1E',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
        gap: 6,
    },
    infoUsernameText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: 1,
    },
    infoBadgeText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: 1,
    },
    iconText: {
        fontSize: 14,
    },
    title: { fontSize: 32, fontWeight: '900', color: '#1C1C1E', textAlign: 'center', marginTop: 20, textTransform: 'uppercase', letterSpacing: 2 },
    subtitle: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93', textAlign: 'center', marginBottom: 30 },

    statsContainer: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#1C1C1E',
        width: 160,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#1C1C1E',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    statsTitle: { fontSize: 12, fontWeight: '900', color: '#1C1C1E', marginBottom: 10, textAlign: 'center' },
    statRow: { marginBottom: 8 },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 3, textTransform: 'uppercase' },
    barContainer: {
        height: 14,
        backgroundColor: '#FFFFFF', // Fundo branco quando não tem upgrade
        borderWidth: 2,
        borderColor: '#1C1C1E',
        borderRadius: 8,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#34C759', // Verde do progresso
    },

    previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30, },
    selectorColumn: { alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'row', width: '18%' },
    carWrapper: { width: '30%', height: 100, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    carBase: { width: '100%', height: '100%', zIndex: 999, position: 'absolute', top: 0, left: 0 },
    carOverlay: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 999 },
    wheel: { width: 55, height: 55, position: 'absolute', zIndex: 999 },
    controlsContainer: { marginBottom: 20, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    sectionLabel: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 10, marginLeft: 5 },
    colorScroll: { marginBottom: 30, maxWidth: '5%', maxHeight: 150, minHeight: 150, overflow: 'hidden', marginLeft: 20, paddingLeft: 10, paddingTop: 5 },
    colorOption: { width: 30, height: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', marginBottom: 4 },
    colorOptionSelected: { borderColor: '#1C1C1E', borderWidth: 3, transform: [{ scale: 1.1 }] },
    modelScroll: { padding: 12, marginTop: -18, backgroundColor: '#fff', marginBottom: 2, maxWidth: 160, textAlign: 'center', maxHeight: 200, minHeight: 200, overflow: 'hidden', paddingTop: 5, paddingBottom: 10, borderRadius: 16, borderWidth: 3, borderColor: '#1C1C1E', elevation: 5, shadowColor: '#1C1C1E', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, },
    modelTitle: { fontSize: 12, fontWeight: '900', color: '#1C1C1E', marginBottom: 10, textAlign: 'center' },
    modelOption: { backgroundColor: '#FFFFFF', paddingVertical: 5, borderRadius: 16, borderWidth: 3, borderColor: '#000', marginBottom: 4 },
    modelOptionSelected: { borderColor: '#1C1C1E', backgroundColor: '#1C1C1E' },
    modelText: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93', textAlign: 'center' },
    modelTextSelected: { color: '#FFFFFF' },
    scrollCars: { display: 'flex', flexDirection: 'column' },
    btnContainer: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 10 },
    openOficinaText: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    btnOficina: { backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 20, textTransform: 'uppercase', width: '33%', borderWidth: 4, borderColor: '#1C1C1E', alignItems: 'center', shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
    playButton: { backgroundColor: '#FFCC00', paddingVertical: 10, borderRadius: 20, textTransform: 'uppercase', width: '33%', borderWidth: 4, borderColor: '#1C1C1E', alignItems: 'center', shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
    playButtonText: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
});