import React, {
    useEffect,
    useState,
} from 'react';

import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    joinWildRace,
    leaveWildRace,
    setWildDrive,
    subscribeWildOnline,
    type WildOnlineState,
} from '@/src/services/wildserver/multiplayerClient';


const INITIAL_STATE:
    WildOnlineState = {

        connected: false,

        roomId: null,
        sessionId: null,

        raceStarted: false,

        drive: 0,

        players: [],

        error: null,
    };


export default function OnlineTeste() {

    const [
        state,
        setState,
    ] =
        useState<WildOnlineState>(
            INITIAL_STATE
        );


    useEffect(
        () => {

            const unsubscribe =
                subscribeWildOnline(
                    setState
                );


            joinWildRace()
                .catch(
                    error => {

                        console.error(
                            '[ONLINE TEST]',
                            error,
                        );
                    }
                );


            return () => {

                unsubscribe();

                setWildDrive(0);

                leaveWildRace();
            };
        },

        [],
    );


    const status =
        !state.connected
            ? 'CONECTANDO...'
            : state.raceStarted
                ? 'CORRIDA PRONTA'
                : 'AGUARDANDO PLAYER 2';


    return (

        <SafeAreaView
            style={
                styles.container
            }
        >

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <Text
                    style={
                        styles.title
                    }
                >
                    WILD ONLINE TEST
                </Text>


                <Text
                    style={
                        styles.status
                    }
                >
                    {status}
                </Text>


                <View
                    style={
                        styles.serverBox
                    }
                >

                    <Text
                        style={
                            styles.info
                        }
                    >
                        Room: {state.roomId ?? '-'}
                    </Text>

                    <Text
                        style={
                            styles.info
                        }
                    >
                        Session: {state.sessionId ?? '-'}
                    </Text>

                    <Text
                        style={
                            styles.info
                        }
                    >
                        Players: {state.players.length}/2
                    </Text>

                    <Text
                        style={
                            styles.info
                        }
                    >
                        Input local: {state.drive.toFixed(2)}
                    </Text>

                </View>


                {state.error && (

                    <Text
                        style={
                            styles.error
                        }
                    >
                        {state.error}
                    </Text>
                )}


                <View
                    style={
                        styles.players
                    }
                >

                    {state.players.map(
                        player => (

                            <View
                                key={
                                    player.sessionId
                                }

                                style={[
                                    styles.playerCard,

                                    player.isMe &&
                                    styles.myPlayer,
                                ]}
                            >

                                <Text
                                    style={
                                        styles.playerTitle
                                    }
                                >

                                    {player.isMe
                                        ? 'ME'
                                        : 'OPPONENT'}

                                    {' • '}

                                    SLOT {player.slot}

                                </Text>


                                <Text
                                    style={
                                        styles.playerText
                                    }
                                >
                                    {player.sessionId}
                                </Text>


                                <Text
                                    style={
                                        styles.playerText
                                    }
                                >
                                    Car: {player.carId}
                                </Text>


                                <Text
                                    style={
                                        styles.bigNumber
                                    }
                                >
                                    SPEED
                                    {' '}
                                    {player.speed.toFixed(1)}
                                </Text>


                                <Text
                                    style={
                                        styles.bigNumber
                                    }
                                >
                                    X
                                    {' '}
                                    {player.x.toFixed(1)}
                                </Text>


                                <Text
                                    style={
                                        styles.playerText
                                    }
                                >
                                    Drive:
                                    {' '}
                                    {player.direction.toFixed(2)}
                                </Text>

                            </View>
                        )
                    )}

                </View>


                <View
                    style={
                        styles.controls
                    }
                >

                    <Pressable

                        onPressIn={
                            () =>
                                setWildDrive(-1)
                        }

                        onPressOut={
                            () =>
                                setWildDrive(0)
                        }

                        style={[
                            styles.button,
                            styles.brake,
                        ]}
                    >

                        <Text
                            style={
                                styles.buttonText
                            }
                        >
                            FREAR
                        </Text>

                    </Pressable>


                    <Pressable

                        onPress={
                            () =>
                                setWildDrive(0)
                        }

                        style={[
                            styles.button,
                            styles.neutral,
                        ]}
                    >

                        <Text
                            style={
                                styles.buttonText
                            }
                        >
                            NEUTRO
                        </Text>

                    </Pressable>


                    <Pressable

                        onPressIn={
                            () =>
                                setWildDrive(1)
                        }

                        onPressOut={
                            () =>
                                setWildDrive(0)
                        }

                        style={[
                            styles.button,
                            styles.accelerate,
                        ]}
                    >

                        <Text
                            style={
                                styles.buttonText
                            }
                        >
                            ACELERAR
                        </Text>

                    </Pressable>

                </View>


                <Text
                    style={
                        styles.instructions
                    }
                >
                    Segure ACELERAR ou FREAR.
                    Os números devem mudar nos dois aparelhos.
                </Text>

            </ScrollView>

        </SafeAreaView>
    );
}


const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor: '#101114',
        },

        content: {
            flexGrow: 1,
            padding: 24,
        },

        title: {
            color: '#FFFFFF',
            fontSize: 26,
            fontWeight: '900',
            textAlign: 'center',
        },

        status: {
            color: '#FFD60A',
            fontSize: 18,
            fontWeight: '800',
            textAlign: 'center',
            marginTop: 8,
        },

        serverBox: {
            marginTop: 18,
            padding: 14,
            backgroundColor: '#1B1D22',
            borderRadius: 12,
        },

        info: {
            color: '#CCCCCC',
            fontSize: 13,
            marginVertical: 2,
        },

        error: {
            color: '#FF5252',
            textAlign: 'center',
            marginTop: 10,
        },

        players: {
            flexDirection: 'row',
            gap: 16,
            marginTop: 18,
        },

        playerCard: {
            flex: 1,
            minHeight: 160,
            backgroundColor: '#1B1D22',
            borderRadius: 14,
            padding: 16,
            borderWidth: 2,
            borderColor: '#333333',
        },

        myPlayer: {
            borderColor: '#FFD60A',
        },

        playerTitle: {
            color: '#FFD60A',
            fontWeight: '900',
            fontSize: 16,
        },

        playerText: {
            color: '#CCCCCC',
            marginTop: 5,
        },

        bigNumber: {
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: 22,
            marginTop: 8,
        },

        controls: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 20,
            marginTop: 28,
        },

        button: {
            width: 160,
            height: 70,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },

        brake: {
            backgroundColor: '#B71C1C',
        },

        neutral: {
            backgroundColor: '#555555',
        },

        accelerate: {
            backgroundColor: '#1B8D3D',
        },

        buttonText: {
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: 18,
        },

        instructions: {
            color: '#999999',
            textAlign: 'center',
            marginTop: 15,
        },
    });