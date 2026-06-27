import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ALL_CARDS = [
    { id: 'chains', name: 'CHAINS', cost: 3, color: '#AF52DE' },
    { id: 'tnt', name: 'TNT', cost: 4, color: '#FF4500' },
    { id: 'swap', name: 'SWAP', cost: 4, color: '#FF004D' },
    { id: 'slow_slow', name: 'SLOW SLOW', cost: 5, color: '#FF9500' }, // ID corrigido para bater com o Mapa
    { id: 'blind', name: 'BLIND', cost: 5, color: '#FFCC80' },
    { id: 'bullet', name: 'BULLET', cost: 3, color: '#007AFF' },
    { id: 'tornado', name: 'TORNADO', cost: 4, color: '#34C759' },
    { id: 'nitro_power', name: 'NITRO POWER', cost: 2, color: '#00FFFF' }, // ID corrigido para bater com o Mapa
];

export default function DeckSelection() {
    const [selectedDeck, setSelectedDeck] = useState<string[]>([]);

    const toggleCard = (cardId: string) => {
        if (selectedDeck.includes(cardId)) {
            setSelectedDeck(prev => prev.filter(id => id !== cardId));
        } else {
            if (selectedDeck.length >= 4) {
                Alert.alert('Deck cheio!', 'Só é permitido selecionar 04 cartas para a partida');
                return;
            }
            // Correção: Adiciona a carta ao deck em vez de disparar a função prematuramente
            setSelectedDeck(prev => [...prev, cardId]);
        }
    };

    const handleConfirm = () => {
        if (selectedDeck.length !== 4) {
            Alert.alert('Deck incompleto!', 'É preciso selecionar 04 cartas para a partida');
            return;
        }

        // Navega para o mapa passando as cartas selecionadas por parâmetro
        router.navigate({
            pathname: '/mapa',
            params: { deck: JSON.stringify(selectedDeck) }
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MONTE O SEU DECK</Text>
            <Text style={styles.subtitle}>Selecione 4 cartas estratégias para a partida. ({selectedDeck.length}/4)</Text>

            <ScrollView contentContainerStyle={styles.grid}>
                {ALL_CARDS.map(card => {
                    const isSelected = selectedDeck.includes(card.id);
                    return (
                        <TouchableOpacity
                            key={card.id}
                            activeOpacity={0.8}
                            onPress={() => toggleCard(card.id)}
                            style={[
                                styles.card,
                                { borderColor: card.color },
                                isSelected && { backgroundColor: card.color }
                            ]}
                        >
                            <View style={styles.boostBadge}>
                                <Text style={styles.boostText}>💧 {card.cost}</Text>
                            </View>
                            <Text style={[styles.cardName, isSelected && { color: '#fff' }]}>
                                {card.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
                
            <TouchableOpacity style={styles.playBtn} onPress={handleConfirm}>
                <Text style={styles.playBtnText}>CORRER!</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#1c1c1e', padding: 20, justifyContent: 'center'},
    title: {fontSize: 32, fontWeight: '900', color: '#ffd700', textAlign: 'center', marginTop: 40, fontStyle: 'italic'},
    subtitle: {fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 20},
    grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, paddingBottom: 20},
    card: {width: 140, height: 100, borderRadius: 12, borderWidth: 3, backgroundColor: '#2c2c2e', justifyContent: 'center', alignItems: 'center', padding: 10, position: 'relative'},
    cardName: {color: '#fff', fontWeight: '900', fontSize: 14, textAlign: 'center'},
    boostBadge: {position: 'absolute', top: -10, left: -10, backgroundColor: '#ff007a', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#fff'},
    boostText: {color: '#fff', fontSize: 11, fontWeight: 900},
    playBtn: {backgroundColor: "#34c759", paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 20, borderWidth: 2, borderColor: '#fff'},
    playBtnText: {color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic'}
})