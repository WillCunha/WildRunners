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


export type WildRacePhase = 'waiting' | 'countdown' | 'racing' | 'paused' | 'finished';

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
    connected: boolean;
    rank: number;

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

    // Estado autoritativo recebido da AWS (inclui pausas e resultados).
    racePhase: WildRacePhase;
    countdown: number;
    raceTime: number;
    winnerSessionId: string;
    finishReason: string;

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
    racePhase: 'waiting',
    countdown: 0,
    raceTime: 0,
    winnerSessionId: '',
    finishReason: '',

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

                    connected:
                        Boolean(player.connected ?? true),

                    rank:
                        Number(player.rank ?? 0),

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
            Boolean(room?.state?.raceStarted),
        racePhase:
            (room?.state?.racePhase ?? 'waiting') as WildRacePhase,
        countdown:
            Number(room?.state?.countdown ?? 0),
        raceTime:
            Number(room?.state?.raceTime ?? 0),
        winnerSessionId:
            String(room?.state?.winnerSessionId ?? ''),
        finishReason:
            String(room?.state?.finishReason ?? ''),

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

        if (!driveInput) {
            throw new Error('Servidor sem canal defineInput disponível.');
        }

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


    let sendErrorLogged = false;
    driveTimer = setInterval(() => {
        if (!driveInput || currentRoom !== room) return;

        try {
            driveInput.data.drive = driveValue;
            driveInput.send();
            if (sendErrorLogged) {
                console.log('[WILD INPUT] Envio retomado.');
                sendErrorLogged = false;
            }
        } catch (error) {
            // Oscilação de Wi-Fi não deve causar exceção não tratada no timer.
            if (!sendErrorLogged) {
                console.warn('[WILD INPUT] Envio suspenso temporariamente:', error);
                sendErrorLogged = true;
            }
        }
    }, INPUT_RATE);
}

function clearOnlineRoomState(error: string | null = null) {
    onlineState = {
        connected: false,
        roomId: null,
        sessionId: null,
        raceStarted: false,
        racePhase: 'waiting',
        countdown: 0,
        raceTime: 0,
        winnerSessionId: '',
        finishReason: '',
        drive: 0,
        players: [],
        error,
    };
    emitState();
}

function installRoomEvents(
    room: any
) {
    // Mensagens são avisos. O Schema permanece a fonte de verdade.
    // Instalar nos três caminhos de entrada: pública, privada e por código.
    room.onMessage('race-ready', (payload: any) => {
        console.log('[WILD EVENT] Sala pronta:', payload?.roomId);
    });
    room.onMessage('race-go', () => {
        console.log('[WILD EVENT] Largada informada pela AWS');
    });
    room.onMessage('race-finished', (payload: any) => {
        console.log('[WILD EVENT] Resultado informado:', payload?.winnerSessionId,
            payload?.finishReason);
    });

    room.onLeave((code: number) => {
        // Um evento atrasado de uma sala anterior não apaga a sala atual.
        if (currentRoom !== room) return;
        console.log('[WILD ONLINE] Saiu da sala:', code);
        currentRoom = null;
        stopInputLoop();
        clearOnlineRoomState();
    });

    room.onError((code: number, message: string) => {
        if (currentRoom !== room) return;
        console.error('[WILD ONLINE] Room error:', code, message);
        onlineState = {
            ...onlineState,
            error: `${code}: ${message}`,
        };
        emitState();
    });
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


        installRoomEvents(room);
        installStateSync(room);
        startInputLoop(room);

        return room;

    } catch (error) {

        console.error(
            '[WILD ONLINE] Falha:',
            error,
        );


        clearOnlineRoomState(
            error instanceof Error ? error.message : String(error)
        );


        throw error;
    }
}

export async function createWildRace() {

    if (currentRoom) {
        return currentRoom;
    }

    try {

        console.log(
            '[WILD ONLINE] Criando sala privada...',
        );

        const wildClient =
            getWildClient();

        const room =
            await wildClient.create(
                WILD_RACE_ROOM,
                {
                    privateRoom: true,
                    name: 'Player',
                    carId: 'fusca',
                },
            );

        currentRoom = room;

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
            '[WILD ONLINE] SALA CRIADA'
        );

        console.log(
            '[WILD ONLINE] CÓDIGO:',
            room.roomId,
        );

        installRoomEvents(room);
        installStateSync(room);
        startInputLoop(room);

        return room;

    } catch (error) {

        console.error(
            '[WILD ONLINE] Falha ao criar sala:',
            error,
        );

        clearOnlineRoomState(error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export async function joinWildRaceByCode(
    roomCode: string,
) {

    if (currentRoom) {
        return currentRoom;
    }

    const code =
        roomCode.trim();

    if (!code) {
        throw new Error(
            'Código da sala vazio.'
        );
    }

    try {

        console.log(
            '[WILD ONLINE] Procurando sala:',
            code,
        );

        const wildClient =
            getWildClient();

        const room =
            await wildClient.joinById(
                code,
                {
                    name: 'Player',
                    carId: 'fusca',
                },
            );

        currentRoom = room;

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
            '[WILD ONLINE] ENTROU PELO CÓDIGO:',
            room.roomId,
        );

        installRoomEvents(room);
        installStateSync(room);
        startInputLoop(room);

        return room;

    } catch (error) {

        console.error(
            '[WILD ONLINE] Sala não encontrada:',
            code,
            error,
        );

        clearOnlineRoomState(error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export function setWildDrive(
    value: number
) {

    driveValue = Number.isFinite(value)
        ? Math.max(-1, Math.min(1, value))
        : 0;


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
    clearOnlineRoomState();

    await room.leave();
}


export function getCurrentWildRoom() {
    return currentRoom;
}


export function isWildOnlineConnected() {
    return currentRoom !== null;
}