import { usePlayerStore } from '@/src/store/playerStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegistrationScreen() {
    const [username, setUsername] = useState('');
    const router = useRouter();
    const createProfile = usePlayerStore((state) => state.createProfile);

    const handleRegister = () => {
        if (username.trim().length > 2) {
            createProfile(username);
            router.replace('/CarSelectionScreen');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crie seu Piloto</Text>
            <TextInput
                style={styles.input}
                placeholder="Nome de usuário..."
                value={username}
                onChangeText={setUsername}
                maxLength={12}
            />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Começar Aventura</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 3,
        borderColor: '#333',
        borderRadius: 15,
        padding: 15,
        fontSize: 18,
        marginBottom: 20
    },
    button: { backgroundColor: '#FF9800', padding: 15, borderRadius: 15, borderWidth: 3, borderColor: '#E65100', alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});