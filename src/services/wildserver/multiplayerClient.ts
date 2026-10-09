import {
  Client,
} from '@/src/services/wildserver/colyseusNative';

import type {
  ClientInstance,
  Room,
} from '@/src/services/wildserver/colyseusNative';

const WILD_SERVER_URL = 'https://online.wfsoft.com.br';
const WILD_RACE_ROOM = 'wild_race';

let client: ClientInstance | null = null;
let currentRoom: Room | null = null;

function getWildClient() {
    if (!client) {
        console.log(
            '[WILD ONLINE] Criando cliente:',
            WILD_SERVER_URL,
        );

        client = new Client(WILD_SERVER_URL);
    }
 
    return client;
}

export async function joinWildRace() {
    if (currentRoom) {
        console.log(
            '[WILD ONLINE] 🟡 Já conectado:',
            currentRoom.roomId,
        );

        return currentRoom;
    }

    try {
        console.log(
            '[WILD ONLINE] 🔄 Entrando em:',
            WILD_RACE_ROOM,
        );

        const wildClient = getWildClient();

        const room = await wildClient.joinOrCreate(
            WILD_RACE_ROOM,
        );

        currentRoom = room;

        console.log(
            '[WILD ONLINE] 🟢 CONECTADO AO WILD ONLINE',
        );
        console.log(
            '[WILD ONLINE] Room ID:',
            room.roomId,
        );
        console.log(
            '[WILD ONLINE] Session ID:',
            room.sessionId,
        );

        room.onLeave((code) => {
            console.log(
                '[WILD ONLINE] 🔴 Saiu da sala. Code:',
                code,
            );

            if (currentRoom === room) {
                currentRoom = null;
            }
        });

        room.onError((code, message) => {
            console.error(
                '[WILD ONLINE] ❌ Room error:',
                code,
                message,
            );
        });

        return room;
    } catch (error) {
        console.error(
            '[WILD ONLINE] ❌ Falha ao entrar na WildRaceRoom:',
            error,
        );

        throw error;
    }
}

export async function leaveWildRace() {
    const room = currentRoom;

    if (!room) {
        console.log(
            '[WILD ONLINE] Nenhuma sala ativa.',
        );
        return;
    }

    currentRoom = null;

    try {
        await room.leave();

        console.log(
            '[WILD ONLINE] 🟡 Desconectado da WildRaceRoom.',
        );
    } catch (error) {
        console.warn(
            '[WILD ONLINE] Erro ao sair da sala:',
            error,
        );
    }
}

export function getCurrentWildRoom() {
    return currentRoom;
}

export function isWildOnlineConnected() {
    return currentRoom !== null;
}