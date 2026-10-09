import {
    Client,
} from '@/src/services/wildserver/colyseusNative';

import type {
    ClientInstance,
    Room,
} from '@/src/services/wildserver/colyseusNative';


const WILD_SERVER_URL =
    'https://online.wfsoft.com.br';

const WILD_RACE_ROOM =
    'wild_race';

const INPUT_RATE =
    1000 / 30;


let client:
    ClientInstance | null = null;

let currentRoom:
    Room | null = null;

let driveInput:
    any = null;

let driveValue =
    0;

let driveTimer:
    ReturnType<typeof setInterval>
    | null = null;


export type WildOnlinePlayer = {
    sessionId: string;
    name: string;
    carId: string;

    slot: number;

    x: number;
    y: number;

    speed: number;
    direction: number;

    ready: boolean;

    isMe: boolean;
};


export type WildOnlineState = {

    connected: boolean;

    roomId:
    string | null;

    sessionId:
    string | null;

    raceStarted:
    boolean;

    drive:
    number;

    players:
    WildOnlinePlayer[];

    error:
    string | null;
};


let onlineState:
    WildOnlineState = {

    connected: false,

    roomId: null,
    sessionId: null,

    raceStarted: false,

    drive: 0,

    players: [],

    error: null,
};


type Listener =
    (
        state: WildOnlineState
    ) => void;


const listeners =
    new Set<Listener>();


function emitState() {

    const snapshot = {
        ...onlineState,

        players:
            [...onlineState.players],
    };


    listeners.forEach(
        listener =>
            listener(snapshot)
    );
}


function getWildClient() {

    if (!client) {

        console.log(
            '[WILD ONLINE] Criando cliente:',
            WILD_SERVER_URL,
        );


        client =
            new Client(
                WILD_SERVER_URL
            );
    }


    return client;
}


function rebuildPlayers(
    room: any
) {
    const players:
        WildOnlinePlayer[] = [];

    const statePlayers =
        room?.state?.players;

    if (statePlayers) {
        statePlayers.forEach(
            (
                player: any,
                sessionId: string,
            ) => {
                players.push({
                    sessionId,

                    name:
                        player.name ??
                        'Player',

                    carId:
                        player.carId ??
                        'fusca',

                    slot:
                        Number(
                            player.slot ?? 0
                        ),

                    x:
                        Number(
                            player.x ?? 0
                        ),

                    y:
                        Number(
                            player.y ?? 0
                        ),

                    speed:
                        Number(
                            player.speed ?? 0
                        ),

                    direction:
                        Number(
                            player.direction ?? 0
                        ),

                    ready:
                        Boolean(
                            player.ready
                        ),

                    isMe:
                        sessionId ===
                        room.sessionId,
                });
            }
        );
    }

    players.sort(
        (a, b) =>
            a.slot - b.slot
    );

    onlineState = {
        ...onlineState,

        raceStarted:
            Boolean(
                room?.state?.raceStarted
            ),

        players,
    };

    emitState();
}
function installStateSync(
    room: any
) {
    /**
     * Estado inicial.
     */
    rebuildPlayers(room);

    /**
     * Toda vez que a AWS sincronizar
     * uma mudança no State:
     *
     * speed
     * x
     * players
     * raceStarted
     * etc.
     *
     * reconstruímos nossa visão local.
     */
    room.onStateChange(
        () => {
            rebuildPlayers(room);
        }
    );

    console.log(
        '[WILD STATE] Sincronização instalada.'
    );
}


function stopInputLoop() {

    if (driveTimer) {

        clearInterval(
            driveTimer
        );

        driveTimer = null;
    }


    driveInput = null;

    driveValue = 0;
}


function startInputLoop(
    room: any
) {

    stopInputLoop();


    try {

        driveInput =
            room.input();


        console.log(
            '[WILD INPUT] Canal iniciado.'
        );

    } catch (error) {

        console.error(
            '[WILD INPUT] Não foi possível criar input:',
            error,
        );


        onlineState = {
            ...onlineState,

            error:
                'Input channel unavailable',
        };


        emitState();

        return;
    }


    driveTimer =
        setInterval(
            () => {

                if (
                    !driveInput
                ) {
                    return;
                }


                driveInput.data.drive =
                    driveValue;


                driveInput.send();

            },

            INPUT_RATE,
        );
}


export async function joinWildRace() {

    if (currentRoom) {

        console.log(
            '[WILD ONLINE] Já conectado:',
            currentRoom.roomId,
        );


        return currentRoom;
    }


    try {

        onlineState = {
            ...onlineState,

            error: null,
        };


        emitState();


        console.log(
            '[WILD ONLINE] Entrando em:',
            WILD_RACE_ROOM,
        );


        const wildClient =
            getWildClient();


        const room =
            await wildClient.joinOrCreate(
                WILD_RACE_ROOM,
            );


        currentRoom =
            room;


        onlineState = {
            ...onlineState,

            connected: true,

            roomId:
                room.roomId,

            sessionId:
                room.sessionId,

            error: null,
        };


        emitState();


        console.log(
            '[WILD ONLINE] CONECTADO'
        );

        console.log(
            '[WILD ONLINE] Room:',
            room.roomId,
        );

        console.log(
            '[WILD ONLINE] Session:',
            room.sessionId,
        );


        installStateSync(
            room
        );


        startInputLoop(
            room
        );


        room.onLeave(
            code => {

                console.log(
                    '[WILD ONLINE] Saiu:',
                    code,
                );


                stopInputLoop();


                if (
                    currentRoom === room
                ) {
                    currentRoom =
                        null;
                }


                onlineState = {

                    connected: false,

                    roomId: null,
                    sessionId: null,

                    raceStarted: false,

                    drive: 0,

                    players: [],

                    error: null,
                };


                emitState();
            }
        );


        room.onError(
            (
                code,
                message,
            ) => {

                console.error(
                    '[WILD ONLINE] Room error:',
                    code,
                    message,
                );


                onlineState = {
                    ...onlineState,

                    error:
                        `${code}: ${message}`,
                };


                emitState();
            }
        );


        return room;

    } catch (error) {

        console.error(
            '[WILD ONLINE] Falha:',
            error,
        );


        onlineState = {
            ...onlineState,

            connected: false,

            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        };


        emitState();


        throw error;
    }
}


export function setWildDrive(
    value: number
) {

    driveValue =
        Math.max(
            -1,
            Math.min(
                1,
                value,
            ),
        );


    onlineState = {
        ...onlineState,

        drive:
            driveValue,
    };


    emitState();
}


export function subscribeWildOnline(
    listener: Listener
) {

    listeners.add(
        listener
    );


    listener({
        ...onlineState,

        players:
            [...onlineState.players],
    });


    return () => {

        listeners.delete(
            listener
        );
    };
}


export function getWildOnlineState() {

    return {
        ...onlineState,

        players:
            [...onlineState.players],
    };
}


export async function leaveWildRace() {

    const room =
        currentRoom;


    if (!room) {
        return;
    }


    currentRoom =
        null;


    stopInputLoop();


    await room.leave();
}


export function getCurrentWildRoom() {
    return currentRoom;
}


export function isWildOnlineConnected() {
    return currentRoom !== null;
}