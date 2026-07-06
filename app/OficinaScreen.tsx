import { useCarSelection } from '@/context/CarContext';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MAX_LEVEL = 10;
const BASE_COST = 50; 

// Componente visual da barra de progresso importado
const StatBar = ({ label, progress }: { label: string, progress: number }) => (
    <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
    </View>
);

export default function OficinaScreen() {
    // Pegando o carro e também as cores definidas pelo jogador na Garagem
    const { selectedCar, selectedColorFront, selectedColorBack } = useCarSelection();
    const carData = carMaps[selectedCar];

    const profile = usePlayerStore((state) => state.profile);
    const upgradeCar = usePlayerStore((state) => state.upgradeCar);

    if (!profile || !profile.garage[selectedCar]) {
        return <Text style={styles.errorText}>Carro não encontrado na garagem.</Text>;
    }

    const myCar = profile.garage[selectedCar];
    const myParts = profile.parts;

    // Lógica das barras de progresso adaptada para o nível máximo da oficina[cite: 11, 12]
    const calculateProgress = (level?: number) => {
        if (!level) return 0;
        // Subtraímos 1 porque o nível inicial (1) equivale a 0% de upgrade
        return Math.min(100, Math.max(0, ((level - 1) / (MAX_LEVEL - 1)) * 100));
    };

    const speedProgress = calculateProgress(myCar.motor.speedLevel);
    const accelProgress = calculateProgress(myCar.motor.accelerationLevel);
    const jumpProgress = calculateProgress(myCar.motor.jumpPowerLevel);
    const defProgress = calculateProgress(myCar.engrenagem.defenseLevel);

    const renderUpgradeItem = (
        title: string, 
        currentLevel: number, 
        partCategory: 'motor' | 'spray' | 'engrenagem', 
        statKey: any
    ) => {
        const isMaxed = currentLevel >= MAX_LEVEL;
        const upgradeCost = currentLevel * BASE_COST;
        const canAfford = myParts[partCategory] >= upgradeCost;

        const handleUpgrade = () => {
            if (isMaxed) return;
            const success = upgradeCar(selectedCar, partCategory, statKey, upgradeCost);
            if (!success) {
                Alert.alert("Sem peças!", `Você precisa de ${upgradeCost} peças de ${partCategory.toUpperCase()}.`);
            }
        };

        return (
            <View style={styles.upgradeCard}>
                <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeTitle}>{title}</Text>
                    <Text style={styles.upgradeLevel}>Nível: {currentLevel} / {MAX_LEVEL}</Text>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.upgradeButton, 
                        (isMaxed || !canAfford) && styles.upgradeButtonDisabled
                    ]}
                    onPress={handleUpgrade}
                    disabled={isMaxed}
                    activeOpacity={0.8}
                >
                    <Text style={styles.upgradeButtonText}>
                        {isMaxed ? 'MÁXIMO' : `UPAR (${upgradeCost} ${partCategory.toUpperCase()})`}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>OFICINA</Text>
            
            {/* CORPO CENTRAL EM 3 COLUNAS */}
            <View style={styles.mainContent}>
                
                {/* LADO ESQUERDO: STATUS DO VEÍCULO */}
                <View style={styles.leftColumn}>
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>STATUS DO VEÍCULO</Text>
                        <StatBar label="Velocidade" progress={speedProgress} />
                        <StatBar label="Aceleração" progress={accelProgress} />
                        <StatBar label="Força do Pulo" progress={jumpProgress} />
                        <StatBar label="Defesa" progress={defProgress} />
                    </View>
                </View>

                {/* CENTRO: REPRESENTAÇÃO VISUAL DO CARRO */}
                <View style={styles.centerColumn}>
                    <View style={styles.carWrapper}>
                        <Image 
                            source={carData.corpoBrancoFrente} 
                            style={[styles.carBase, { tintColor: selectedColorBack }]} 
                            resizeMode="contain" 
                        />
                        <Image 
                            source={carData.corpoBrancoTras} 
                            style={[styles.carBase, { tintColor: selectedColorFront }]} 
                            resizeMode="contain" 
                        />
                        <Image 
                            source={carData.corpoTransparente} 
                            style={styles.carOverlay} 
                            resizeMode="contain" 
                        />
                        <Image 
                            source={carData.wheelImage} 
                            style={[
                                styles.wheel, 
                                { 
                                    width: carData.size.width, 
                                    height: carData.size.height, 
                                    left: carData.rodaTras.x, 
                                    bottom: carData.rodaTras.y 
                                }
                            ]} 
                        />
                        <Image 
                            source={carData.wheelImage} 
                            style={[
                                styles.wheel, 
                                { 
                                    width: carData.size.width, 
                                    height: carData.size.height, 
                                    left: carData.rodaFrente.x, 
                                    bottom: carData.rodaFrente.y 
                                }
                            ]} 
                        />
                    </View>
                </View>

                {/* LADO DIREITO: LISTA DE UPGRADES */}
                <View style={styles.rightColumn}>
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                        {renderUpgradeItem('Velocidade Máxima', myCar.motor.speedLevel, 'motor', 'speedLevel')}
                        {renderUpgradeItem('Aceleração em Pulso', myCar.motor.accelerationLevel, 'motor', 'accelerationLevel')}
                        {renderUpgradeItem('Força do Pulo', myCar.motor.jumpPowerLevel, 'motor', 'jumpPowerLevel')}
                        {renderUpgradeItem('Defesa / Resistência', myCar.engrenagem.defenseLevel, 'engrenagem', 'defenseLevel')}
                        {renderUpgradeItem('Estética e Raridade', myCar.spray.rarityLevel, 'spray', 'rarityLevel')}
                    </ScrollView>
                </View>

            </View>

            {/* INVENTÁRIO NA PARTE INFERIOR (Ocupando 100%) */}
            <View style={styles.inventoryBar}>
                <Text style={styles.inventoryText}>⚙️ Motor: {myParts.motor}</Text>
                <Text style={styles.inventoryText}>🛡️ Engrenagem: {myParts.engrenagem}</Text>
                <Text style={styles.inventoryText}>🎨 Spray: {myParts.spray}</Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1C1C1E', padding: 20 },
    errorText: { color: '#FFF', textAlign: 'center', marginTop: 50 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
    
    // Divisão de Tela em 3 colunas
    mainContent: { flex: 1, flexDirection: 'row', width: '100%', alignItems: 'center' },
    leftColumn: { flex: 1, width: '33%', paddingRight: '10%', justifyContent: 'center' },
    centerColumn: { flex: 1.2, width: '33%', justifyContent: 'center', alignItems: 'center' },
    rightColumn: { flex: 1.5, width: '33%', paddingLeft: '12%', height: '100%' },
    
    statsContainer: {
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#1C1C1E',
        width: '100%', 
    },
    statsTitle: { fontSize: 12, fontWeight: '900', color: '#fff', marginBottom: 10, textAlign: 'center' },
    statRow: { marginBottom: 8 },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#fff', marginBottom: 3, textTransform: 'uppercase' },
    barContainer: {
        height: 14,
        backgroundColor: '#333',
        borderWidth: 2,
        borderColor: '#34C759',
        borderRadius: 8,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#34C759',
    },

    inventoryBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        backgroundColor: '#333', 
        padding: 15, 
        borderRadius: 12, 
        marginTop: 15, 
        width: '100%' 
    },
    inventoryText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
    
    // Lista
    scrollArea: { flex: 1 },
    upgradeCard: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 2, borderColor: '#444' },
    upgradeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    upgradeTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    upgradeLevel: { color: '#8E8E93', fontSize: 12, fontWeight: 'bold' },
    upgradeButton: { backgroundColor: '#34C759', padding: 12, borderRadius: 8, alignItems: 'center' },
    upgradeButtonDisabled: { backgroundColor: '#555' },
    upgradeButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },

    // Estilos do Carro
    carWrapper: { 
        width: '100%', 
        height: 100, 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 999 
    },
    carBase: { 
        width: '100%', 
        height: '100%', 
        zIndex: 999, 
        position: 'absolute', 
        top: 0, 
        left: 0 
    },
    carOverlay: { 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 999 
    },
    wheel: { 
        position: 'absolute', 
        zIndex: 999 
    },
});