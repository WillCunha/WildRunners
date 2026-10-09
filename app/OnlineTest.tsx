import {
  joinWildRace,
  leaveWildRace,
} from '@/src/services/wildserver/multiplayerClient';

import React, { useState } from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnlineTest() {
    const [status, setStatus] =
        useState('OFFLINE');

    const handleConnect = async () => {
        try {
            setStatus('CONNECTING...');

            const room =
                await joinWildRace();

            setStatus(
                `ONLINE • ${room.roomId}`,
            );
        } catch (error) {
            console.error(
                '[ONLINE TEST]',
                error,
            );

            setStatus('ERROR');
        }
    };

    const handleDisconnect = async () => {
        await leaveWildRace();

        setStatus('OFFLINE');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>
                WILD ONLINE TEST
            </Text>

            <Text style={styles.status}>
                {status}
            </Text>

            <View style={styles.row}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        void handleConnect();
                    }}
                >
                    <Text style={styles.buttonText}>
                        CONNECT
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        void handleDisconnect();
                    }}
                >
                    <Text style={styles.buttonText}>
                        DISCONNECT
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111113',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },

    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
    },

    status: {
        color: '#FFD60A',
        fontSize: 18,
        fontWeight: '900',
    },

    row: {
        flexDirection: 'row',
        gap: 16,
    },

    button: {
        paddingHorizontal: 28,
        paddingVertical: 16,
        backgroundColor: '#FFD60A',
        borderRadius: 12,
    },

    buttonText: {
        color: '#111113',
        fontWeight: '900',
    },
});