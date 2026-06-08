
import { useCarSelection } from '@/context/CarContext';
import { carMaps } from '@/src/utils/carMaps';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Tipagem baseada no seu mapeamento
type CarKey = keyof typeof carMaps;

// Paleta de cores disponíveis para o jogador escolher
const AVAILABLE_COLORS = [
    '#FF3B30', // Vermelho
    '#34C759', // Verde
    '#007AFF', // Azul
    '#FFCC00', // Amarelo
    '#FF9500', // Laranja
    '#AF52DE', // Roxo
    '#1C1C1E', // Preto
    '#F2F2F7', // Branco
];

export default function CarSelectionScreen() {
    const navigation = useNavigation();
    const { setSelectedCar, setSelectedColor } = useCarSelection();

    // Estados locais para preview antes de confirmar
    const [previewCar, setPreviewCar] = useState<CarKey>('fusca');
    const [previewColor, setPreviewColor] = useState<string>(AVAILABLE_COLORS[0]);

    const currentCar = carMaps[previewCar];
    const carKeys = Object.keys(carMaps) as CarKey[];

    const handlePlayPress = () => {
        // Salva a seleção no contexto global
        setSelectedCar(previewCar);
        setSelectedColor(previewColor);

        // Navega para a tela do jogo 
        // Ajuste o nome da rota conforme sua navegação
        router.navigate('/mapa' as any);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GARAGEM</Text>
            <Text style={styles.subtitle}>Selecione o veículo para sua próxima corrida.</Text>
            <View style={styles.controlsContainer}>
                {/* SELETOR DE CORES */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.colorScroll}>
                    {AVAILABLE_COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                previewColor === color && styles.colorOptionSelected
                            ]}
                            onPress={() => setPreviewColor(color)}
                            activeOpacity={0.8}
                        />
                    ))}
                </ScrollView>


                {/* ÁREA DE PREVIEW DO CARRO */}
                <View style={styles.carWrapper}>
                    {/* Camada 1: Corpo Branco atua como base (sem position absolute) */}
                    <Image
                        source={currentCar.corpoBranco}
                        style={[styles.carBase, { tintColor: previewColor }]}
                        resizeMode="contain"
                    />
                    {/* Camada 2: Detalhes por cima (com position absolute ancorado) */}
                    <Image
                        source={currentCar.corpoTransparente}
                        style={styles.carOverlay}
                        resizeMode="contain"
                    />
                    {/* Roda Traseira */}
                    <Image
                        source={currentCar.wheelImage}
                        style={[
                            styles.wheel,
                            {
                                width: currentCar.size.width,
                                height: currentCar.size.height,
                                left: currentCar.rodaTras.x,
                                bottom: currentCar.rodaTras.y
                            }
                        ]}
                    />

                    {/* Roda Dianteira */}
                    <Image
                        source={currentCar.wheelImage}
                        style={[
                            styles.wheel,
                            {
                                width: currentCar.size.width,
                                height: currentCar.size.height,
                                left: currentCar.rodaFrente.x,
                                bottom: currentCar.rodaFrente.y
                            }
                        ]}
                    />
                </View>

                {/* SELETOR DE CARROS */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modelScroll}>
                    {carKeys.map((carKey) => (
                        <TouchableOpacity
                            key={carKey}
                            style={[
                                styles.modelOption,
                                previewCar === carKey && styles.modelOptionSelected
                            ]}
                            onPress={() => setPreviewCar(carKey)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.modelText,
                                previewCar === carKey && styles.modelTextSelected
                            ]}>
                                {carKey.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            {/* BOTÃO DE JOGAR */}
            <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.9}
                onPress={handlePlayPress}
            >
                <Text style={styles.playButtonText}>CORRER!</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1C1C1E',
        textAlign: 'center',
        marginTop: 20,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 30,
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,

    },
    carWrapper: {
        width: '30%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,

    },
    carBase: {
        width: '100%',
        height: '100%',
        zIndex: 999,
    },
    carOverlay: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 999,
    },
    wheel: {
        width: 55,
        height: 55,
        position: 'absolute',
    },
    controlsContainer: {
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 10,
        marginLeft: 5,
    },
    colorScroll: {
        marginBottom: 30,
        maxWidth: '20%',
        maxHeight: 150,
        minHeight: 150,
        overflow: 'hidden',
        marginLeft: 20,
        paddingLeft: 10,
        paddingTop: 5,
    },
    colorOption: {
        width: 30,
        height: 30,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        marginRight: 15,
        marginBottom: 4,
    },
    colorOptionSelected: {
        borderColor: '#1C1C1E',
        borderWidth: 3,
        transform: [{ scale: 1.1 }],
    },
    modelScroll: {
        marginBottom: 10,
        maxWidth: '20%',
        textAlign: 'center',
        maxHeight: 150,
        minHeight: 150,
        overflow: 'hidden',
        paddingTop: 5,

    },
    modelOption: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 5,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#D1D1D6',
        marginRight: 12,
        marginBottom: 4,

    },
    modelOptionSelected: {
        borderColor: '#1C1C1E',
        backgroundColor: '#1C1C1E',
    },
    modelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8E8E93',
        textAlign: 'center',

    },
    modelTextSelected: {
        color: '#FFFFFF',
    },
    playButton: {
        backgroundColor: '#FFCC00',
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#1C1C1E',
        alignItems: 'center',
        shadowColor: '#1C1C1E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    playButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: 2,
    },
});
