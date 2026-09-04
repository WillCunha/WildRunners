import { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';

export interface TornadoRacer {
  id: string;
  x: number;
  y: number;
  color?: string;
  isPlayer?: boolean;
}

interface TornadoEffectProps {
  allRacers: TornadoRacer[];
  callerId: string;
  onTornadoAnnounced: (
    victims: TornadoRacer[],
    callerX: number,
    callerY: number,
  ) => void;
  onCancel?: () => void;
}

export default function TornadoEffect({
  allRacers,
  callerId,
  onTornadoAnnounced,
  onCancel,
}: TornadoEffectProps) {
  const announcedRef = useRef(false);
  const announcedCallbackRef = useRef(onTornadoAnnounced);
  const cancelCallbackRef = useRef(onCancel);

  announcedCallbackRef.current = onTornadoAnnounced;
  cancelCallbackRef.current = onCancel;

  useEffect(() => {
    if (announcedRef.current) return;

    const caller = allRacers.find(racer => racer.id === callerId);

    if (!caller) {
      announcedRef.current = true;
      cancelCallbackRef.current?.();
      return;
    }

    const victimsAhead = allRacers
      .filter(racer => racer.id !== callerId && racer.x > caller.x)
      .sort((a, b) => a.x - b.x);

    announcedRef.current = true;
    announcedCallbackRef.current(victimsAhead, caller.x, caller.y);
    Vibration.vibrate(80);
  }, [allRacers, callerId]);

  return null;
}