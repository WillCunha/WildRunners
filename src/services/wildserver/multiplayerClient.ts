import { Client, Room } from '@colyseus/sdk';

const WILD_SERVER_URL = 'http://10.19.175.11';


const client = new Client(WILD_SERVER_URL);

let currentRoom: Room | null = null;

export async function joinWildRace() {
  try {
    console.log('[WILD ONLINE] Conectando ao servidor...');

    const room = await client.joinOrCreate('wild_race');

    currentRoom = room;

    console.log('[WILD ONLINE] ✅ Entrou na WildRaceRoom');
    console.log('[WILD ONLINE] Room ID:', room.roomId);
    console.log('[WILD ONLINE] Session ID:', room.sessionId);

    room.onLeave((code) => {
      console.log('[WILD ONLINE] 🔴 Saiu da sala. Code:', code);

      if (currentRoom === room) {
        currentRoom = null;
      }
    });

    room.onError((code, message) => {
      console.log(
        '[WILD ONLINE] ❌ Room error:',
        code,
        message
      );
    });

    return room;
  } catch (error) {
    console.error(
      '[WILD ONLINE] ❌ Falha ao entrar na sala:',
      error
    );

    throw error;
  }
}

export async function leaveWildRace() {
  if (!currentRoom) {
    return;
  }

  await currentRoom.leave();
  currentRoom = null;
}

export function getCurrentWildRoom() {
  return currentRoom;
}