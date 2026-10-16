/**
 * Alpha 9: ownership of the Colyseus room when moving from the LAB to Mapa.
 * Only one screen sends drive inputs at a time. No connection is recreated.
 */
import type { Client } from '@colyseus/sdk';

export type WildAlpha9Room = Awaited<ReturnType<Client['create']>>;
let transferredRoom: WildAlpha9Room | null = null;

export function handoffWildAlpha9Room(room: WildAlpha9Room): void {
  if (transferredRoom && transferredRoom !== room) {
    throw new Error('Outra sala Alpha 9 ainda está ativa.');
  }
  transferredRoom = room;
}

export function getWildAlpha9Room(): WildAlpha9Room | null {
  return transferredRoom;
}

/** Avoid clearing a newer connection from a delayed callback. */
export function clearWildAlpha9Room(room: WildAlpha9Room): boolean {
  if (transferredRoom !== room) return false;
  transferredRoom = null;
  return true;
}
