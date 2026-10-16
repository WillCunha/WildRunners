/**
 * WILD ONLINE ALPHA 9 — Mapa multiplayer, visual real do Wild.
 * Colyseus / AWS is the ONLY source of speed, x, race phase, ranking and result.
 * The offline Mapa component is not mounted while this view is active.
 * Not yet online: cards, collision, pickups, jumping, XP, tutorial and rewards.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Carro from '@/components/Carro';
import CenarioBackground, { type CenarioId, type SkyTheme } from '@/components/Cenarios/CenarioBackground';
import { useCarSelection } from '@/context/CarContext';
import { carMaps } from '@/src/utils/carMaps';
import { WildPositionSmoother } from '@/src/online/wildOnlineSmoothing';
import { clearWildAlpha9Room, getWildAlpha9Room } from '@/src/online/wildOnlineAlpha9Session';
import {
  EMPTY_ALPHA9_SNAPSHOT, readWildAlpha9Snapshot,
  type Alpha9Phase, type Alpha9Snapshot,
} from '@/src/online/wildOnlineAlpha9Snapshot';

type CarKey = keyof typeof carMaps;
const INPUT_INTERVAL_MS = 1000 / 30;
const MemoOnlineCarro = React.memo(Carro);
const MemoOnlineScenery = React.memo(CenarioBackground);
const GROUND_PANEL_HEIGHT = 148;
const PHASE_NAMES: Record<Alpha9Phase, string> = {
  waiting: 'AGUARDANDO JOGADORES',
  countdown: 'LARGADA',
  racing: 'CORRIDA ONLINE',
  paused: 'PAUSADA — RECONEXÃO',
  finished: 'CORRIDA FINALIZADA',
};
const limit = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));

export default function WildOnlineMapaView() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ mapId?: string; skyTheme?: string }>();
  const mapId = (params.mapId || 'sao_paulo') as CenarioId;
  const skyTheme = (params.skyTheme || 'day') as SkyTheme;
  const { selectedColorFront, selectedColorBack, selectedFinishId, selectedEquipment } = useCarSelection();

  // Hold exactly the Colyseus instance that was transferred from the Alpha 8 lab.
  const room = useRef(getWildAlpha9Room()).current;
  const sessionId = room?.sessionId ?? '';
  const [race, setRace] = useState<Alpha9Snapshot>(() =>
    room ? readWildAlpha9Snapshot(room.state as any) : EMPTY_ALPHA9_SNAPSHOT);
  const [visualX, setVisualX] = useState<Record<string, number>>({});
  const [connection, setConnection] = useState<'connected' | 'dropped' | 'ended'>(room ? 'connected' : 'ended');
  const [info, setInfo] = useState('Pista online: velocidade e posições vêm da AWS.');
  const [ping, setPing] = useState<number | null>(null);
  const [autoDrive, setAutoDrive] = useState(false);
  const phaseRef = useRef<Alpha9Phase>(race.phase);
  const droppedRef = useRef(false);
  const aliveRef = useRef(true);
  const autoRef = useRef(false);
  const accelHeld = useRef(false);
  const brakeHeld = useRef(false);
  const analogRef = useRef(0);
  const analogKnob = useRef(new Animated.Value(0)).current;
  const smoother = useRef(new WildPositionSmoother()).current;
  const inputTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const visualTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingSeq = useRef(0);
  const pendingPings = useRef(new Map<number, number>());
  const sceneryTravel = useRef(new Animated.Value(0)).current;

  const resetDrive = useCallback(() => {
    analogRef.current = 0;
    analogKnob.setValue(0);
    autoRef.current = false;
    accelHeld.current = false;
    brakeHeld.current = false;
    if (aliveRef.current) setAutoDrive(false);
  }, [analogKnob]);

  const stopTimers = useCallback(() => {
    if (inputTimer.current) clearInterval(inputTimer.current);
    if (visualTimer.current) clearInterval(visualTimer.current);
    if (pingTimer.current) clearInterval(pingTimer.current);
    inputTimer.current = null;
    visualTimer.current = null;
    pingTimer.current = null;
    pendingPings.current.clear();
  }, []);

  const analogPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => phaseRef.current === 'racing' && !droppedRef.current,
    onMoveShouldSetPanResponder: () => phaseRef.current === 'racing' && !droppedRef.current,
    onPanResponderGrant: () => {
      analogRef.current = 0;
      analogKnob.setValue(0);
    },
    onPanResponderMove: (_event, gesture) => {
      if (phaseRef.current !== 'racing' || droppedRef.current) return;
      const drive = Math.abs(gesture.dx / 100) < 0.08 ? 0 : limit(gesture.dx / 100, -1, 1);
      analogRef.current = drive;
      analogKnob.setValue(drive * 84);
    },
    onPanResponderRelease: () => { analogRef.current = 0; analogKnob.setValue(0); },
    onPanResponderTerminate: () => { analogRef.current = 0; analogKnob.setValue(0); },
  })).current;

  useEffect(() => {
    aliveRef.current = true;
    if (!room) {
      setInfo('Nenhuma sessão transferida. Entre primeiro pelo WildOnlineLab.');
      return () => { aliveRef.current = false; };
    }

    // Cada montagem tem um token próprio; callbacks registrados anteriormente
    // no Room não podem executar após remount ou retorno ao mapa.
    let activeMount = true;
    const isCurrent = () => activeMount && aliveRef.current && getWildAlpha9Room() === room;
    const updateState = (snap = false) => {
      if (!isCurrent()) return;
      const next = readWildAlpha9Snapshot(room.state as any);
      const oldPhase = phaseRef.current;
      phaseRef.current = next.phase;
      if (oldPhase === 'racing' && next.phase !== 'racing') resetDrive();
      smoother.ingest(next.players, next.phase, snap);
      setRace(next);
    };
    const startTimers = () => {
      stopTimers();
      let input: ReturnType<typeof room.input>;
      try { input = room.input(); }
      catch (error) { if (isCurrent()) setInfo('Input indisponível: ' + String(error)); return; }
      if (!input) { setInfo('O servidor não disponibilizou room.input().'); return; }
      let inputWarning = false;
      inputTimer.current = setInterval(() => {
        if (!isCurrent() || droppedRef.current) return;
        const drive = phaseRef.current !== 'racing' ? 0 :
          brakeHeld.current ? -1 : accelHeld.current ? 1 :
          analogRef.current !== 0 ? analogRef.current : autoRef.current ? 1 : 0;
        try {
          input.data.drive = limit(drive, -1, 1);
          input.send();
          inputWarning = false;
        } catch (error) {
          if (!inputWarning) console.warn('[WILD ALPHA 9] Input interrompido:', error);
          inputWarning = true;
        }
      }, INPUT_INTERVAL_MS);
      visualTimer.current = setInterval(() => {
        if (!isCurrent() || droppedRef.current) return;
        const positions = smoother.frame(Date.now());
        const me = positions[room.sessionId];
        if (Number.isFinite(me)) sceneryTravel.setValue(Math.max(0, me) * 0.35);
        setVisualX(positions);
      }, INPUT_INTERVAL_MS);
      pingTimer.current = setInterval(() => {
        if (!isCurrent() || droppedRef.current) return;
        const seq = ++pingSeq.current;
        const now = Date.now();
        for (const [key, sentAt] of pendingPings.current) {
          if (now - sentAt > 10000) pendingPings.current.delete(key);
        }
        try {
          room.send('ping-check', { seq });
          pendingPings.current.set(seq, now);
        } catch { /* transient network failure handled by Colyseus */ }
      }, 2000);
    };

    smoother.reset();
    updateState(true);
    setVisualX(smoother.frame(Date.now()));
    room.onStateChange(() => updateState());
    room.onMessage('pong-check', (data: { seq?: number }) => {
      if (!isCurrent() || typeof data?.seq !== 'number') return;
      const start = pendingPings.current.get(data.seq);
      if (start !== undefined) {
        pendingPings.current.delete(data.seq);
        setPing(Date.now() - start);
      }
    });
    room.onMessage('nitro-result', (data: { message?: string }) => {
      if (isCurrent()) setInfo(String(data?.message ?? 'Nitro processado pela AWS.'));
    });
    room.onMessage('race-ready', () => { if (isCurrent()) setInfo('Sala completa! Aguardando READY.'); });
    room.onMessage('race-go', () => { if (isCurrent()) setInfo('🏁 GO!'); });
    room.onMessage('race-finished', (data: {finishReason?: string}) => {
      if (isCurrent()) setInfo('Resultado recebido: ' + String(data?.finishReason ?? 'finish'));
    });
    room.onDrop(() => {
      if (!isCurrent()) return;
      droppedRef.current = true;
      stopTimers();
      resetDrive(); // Never replay analog, acceleration or auto after a drop.
      setConnection('dropped');
      setPing(null);
      setInfo('Sinal perdido. Vaga reservada pela AWS por até 10 segundos.');
    });
    room.onReconnect(() => {
      if (!isCurrent()) return;
      droppedRef.current = false;
      resetDrive();
      setConnection('connected');
      setInfo('Sessão recuperada. Aceleração precisa de novo comando.');
      updateState(true); // Snap to authoritative x; no rollback or replay.
      setVisualX(smoother.frame(Date.now()));
      startTimers();
    });
    room.onLeave((code: number) => {
      if (!isCurrent()) return;
      stopTimers();
      resetDrive();
      clearWildAlpha9Room(room);
      setConnection('ended');
      setInfo(`Sessão encerrada pela AWS (${code}).`);
    });
    room.onError((code: number, message: string) => {
      if (isCurrent()) setInfo(`AWS ${code}: ${message}`);
    });
    startTimers();
    return () => {
      activeMount = false;
      aliveRef.current = false;
      stopTimers();
      resetDrive();
      // React Navigation/Expo can temporarily unmount this view during routing or
      // development remounts. Never convert that into a voluntary disconnect (4000).
      // The explicit SAIR button is responsible for calling room.leave().
      // If this screen is accidentally closed, reopen the same session from the Lab.
    };
  }, [room, resetDrive, sceneryTravel, smoother, stopTimers]);

  const exit = () => {
    stopTimers();
    resetDrive();
    if (room && clearWildAlpha9Room(room)) void room.leave().catch(() => {});
    router.back();
  };

  const myPlayer = race.players.find(p => p.sessionId === sessionId);
  const canDrive = connection === 'connected' && race.phase === 'racing';
  const canReady = connection === 'connected' && (
    race.phase === 'finished' || (race.phase === 'waiting' && myPlayer && !myPlayer.ready));
  const canNitro = canDrive && !!myPlayer && myPlayer.nitroCharges > 0 &&
    myPlayer.nitroRemaining <= 0 && myPlayer.nitroCooldown <= 0;
  const safeSend = (kind: string, payload: unknown) => {
    if (!room || connection !== 'connected') return;
    try { room.send(kind, payload); }
    catch (error) { setInfo(`Falha ao enviar ${kind}: ${String(error)}`); }
  };
  const myVisual = visualX[sessionId] ?? myPlayer?.x ?? 0;
  const trackGroundY = height - GROUND_PANEL_HEIGHT - 8;
  const cameraOrigin = width * 0.36;
  const projectedX = (x: number) => cameraOrigin + (x - myVisual) * 0.65;

  return (
    <View style={s.screen}>
      <MemoOnlineScenery
        isMoving={canDrive && (myPlayer?.speed ?? 0) > 0}
        mapId={mapId}
        skyTheme={skyTheme}
        groundY={trackGroundY}
        travelX={sceneryTravel}
      />
      <View style={[s.ground, { top: trackGroundY }]} pointerEvents="none" />
      <View style={[s.laneGuide, { top: trackGroundY - 104 }]} pointerEvents="none" />
      <View style={[s.laneGuide, { top: trackGroundY - 42 }]} pointerEvents="none" />

      {race.players.map(player => {
        const visual = visualX[player.sessionId] ?? player.x;
        const x = projectedX(visual);
        const self = player.sessionId === sessionId;
        const validCar = Object.prototype.hasOwnProperty.call(carMaps, player.carId) ? player.carId as CarKey : 'fusca';
        return (
          <View key={player.sessionId} pointerEvents="none" style={[
            s.carAnchor,
            { left: x - 24, top: trackGroundY - 126 + player.slot * 62, opacity: player.connected ? 1 : 0.5 },
          ]}>
            <View style={s.carName}>
              <Text style={s.carNameText}>{self ? 'VOCÊ' : player.name} · {player.rank}º · {player.carId}{validCar !== player.carId ? ' (ID inválido)' : ''}</Text>
            </View>
            <View style={s.carWide}>
              <MemoOnlineCarro
                carType={validCar}
                carColorFront={self ? selectedColorFront : '#FF3B30'}
                carColorBack={self ? selectedColorBack : '#FF9500'}
                {...(self ? {paintFinishId: selectedFinishId, equipment: selectedEquipment} : {})}
                speed={player.speed}
                skin="default"
                renderWidth={180}
              />
            </View>
          </View>
        );
      })}

      <View style={s.topHud}>
        <View style={s.headerLine}>
          <Text style={s.title}>🏎️ WILD ONLINE 9</Text>
          <Text style={s.infoText}>{ping === null ? 'Ping: —' : `Ping: ${ping}ms`}</Text>
        </View>
        <Text style={s.subtitle}>{room?.roomId ?? 'SEM SALA'} · {PHASE_NAMES[race.phase]}</Text>
        <Text style={s.serverCars} numberOfLines={2}>
          AWS · {race.players.length}/2 · {race.players.length
            ? race.players.map(p => `${p.sessionId === sessionId ? 'VOCÊ' : 'RIVAL'}: ${p.carId} (${p.sessionId})`).join(' | ')
            : 'sem jogadores no state'}
        </Text>
        <View style={s.infoLine}>
          <Text style={s.infoText}>⏱ {race.raceTime.toFixed(1)}s</Text>
          <Text style={s.infoText}>🏁 {Math.round(myPlayer?.x ?? 0)}/{Math.round(race.finishDistance)}</Text>
          <Text style={s.infoText}>⚡ {Math.round(myPlayer?.speed ?? 0)} unid./s</Text>
        </View>
        <View style={s.progressTrack}>
          {race.players.map(player => (
            <View key={player.sessionId} style={[
              s.progressMarker,
              {left: `${limit(player.x / race.finishDistance * 100, 0, 98)}%` as `${number}%`,
                backgroundColor: player.sessionId === sessionId ? '#ffd60a' : '#ff5252'},
            ]} />
          ))}
        </View>
        <Text style={s.notice} numberOfLines={2}>{info}</Text>
      </View>

      {race.phase !== 'racing' && (
        <View style={s.centerOverlay} pointerEvents="box-none">
          {race.phase === 'countdown' && <Text style={s.bigText}>{race.countdown || 'GO!'}</Text>}
          {race.phase === 'paused' && <Text style={s.bigText}>⏸️ RECONEXÃO</Text>}
          {connection === 'dropped' && <Text style={s.bigText}>📶 SEM SINAL</Text>}
          {connection === 'ended' && <Text style={s.bigText}>SESSÃO ENCERRADA</Text>}
          {race.phase === 'finished' && connection !== 'ended' && (
            <Text style={s.bigText}>{race.winnerSessionId === sessionId ? '🏆 VITÓRIA!' :
              race.winnerSessionId ? '🏁 DERROTA' : '🏁 EMPATE'}</Text>
          )}
          {canReady && (
            <Pressable style={s.readyBtn} onPress={() => safeSend('ready', true)}>
              <Text style={s.buttonLabel}>{race.phase === 'finished' ? 'REVANCHE' : 'ESTOU PRONTO'}</Text>
            </Pressable>
          )}
          {race.phase === 'waiting' && myPlayer?.ready && <Text style={s.infoText}>Aguardando o rival...</Text>}
        </View>
      )}

      <View style={s.bottomHud}>
        <View style={s.bottomHeader}>
          <Text style={s.subtle}>ALPHA 9 · DIREÇÃO AUTORITATIVA</Text>
          <Pressable style={s.exitBtn} onPress={exit}><Text style={s.buttonLabel}>SAIR</Text></Pressable>
        </View>
        <View style={s.controls}>
          <Pressable disabled={!canDrive} style={[s.controlBtn, s.brake, !canDrive && s.disabled]}
            onPressIn={() => { brakeHeld.current = true; }}
            onPressOut={() => { brakeHeld.current = false; }}>
            <Text style={s.buttonLabel}>FREIO</Text>
          </Pressable>
          <View style={s.analogPanel} {...analogPan.panHandlers}>
            <Text style={s.analogLabel}>−</Text>
            <View style={s.analogLine} />
            <Animated.View style={[s.analogKnob, { transform: [{translateX: analogKnob}] }]} />
            <Text style={s.analogLabel}>+</Text>
          </View>
          <Pressable disabled={!canDrive} style={[s.controlBtn, s.accel, !canDrive && s.disabled]}
            onPressIn={() => { accelHeld.current = true; }}
            onPressOut={() => { accelHeld.current = false; }}>
            <Text style={s.buttonLabel}>ACELERA</Text>
          </Pressable>
          <Pressable disabled={!canNitro} style={[s.controlBtn, s.nitro, !canNitro && s.disabled]}
            onPress={() => safeSend('nitro-activate', {})}>
            <Text style={s.buttonLabel}>⚡ {myPlayer?.nitroCharges ?? 0}</Text>
          </Pressable>
          <Pressable disabled={!canDrive} style={[s.controlBtn, autoDrive && s.autoActive, !canDrive && s.disabled]}
            onPress={() => { autoRef.current = !autoRef.current; setAutoDrive(autoRef.current); }}>
            <Text style={s.buttonLabel}>AUTO {autoDrive ? 'ON' : 'OFF'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#0b2837', overflow: 'hidden'},
  ground: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#2e8b565b', borderTopWidth: 5, borderTopColor: '#34C759'},
  laneGuide: {position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)'},
  carAnchor: {position: 'absolute', zIndex: 4, height: 54, width: 50},
  carWide: {width: '200%', alignItems: 'center', justifyContent: 'flex-end'},
  carName: {minWidth: 100, marginLeft: -25, alignItems: 'center', borderRadius: 5, backgroundColor: '#111c', paddingHorizontal: 4},
  carNameText: {fontSize: 10, fontWeight: '800', color: '#fff'},
  topHud: {position: 'absolute', top: 22, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.65)', padding: 10, borderRadius: 10, gap: 5, zIndex: 20},
  headerLine: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: 17, color: '#ffd60a', fontWeight: '900'},
  subtitle: {fontSize: 11, color: '#eee'},
  serverCars: {fontSize: 11, color: '#96ecff', fontWeight: '700'},
  infoLine: {flexDirection: 'row', justifyContent: 'space-between'},
  infoText: {fontSize: 12, fontWeight: '700', color: '#fff'},
  progressTrack: {height: 8, marginVertical: 6, backgroundColor: '#d5d9e288', borderRadius: 5, overflow: 'hidden'},
  progressMarker: {position: 'absolute', top: 0, height: 8, width: 14, borderRadius: 5},
  notice: {fontSize: 11, color: '#bffbcb'},
  centerOverlay: {position: 'absolute', top: '42%', left: 10, right: 10, zIndex: 22, alignItems: 'center', gap: 8},
  bigText: {fontSize: 28, color: '#fff', fontWeight: '900', textShadowColor: '#000', textShadowRadius: 6},
  readyBtn: {backgroundColor: '#168740', borderRadius: 9, paddingHorizontal: 24, paddingVertical: 12},
  buttonLabel: {fontSize: 12, color: '#fff', fontWeight: '900'},
  bottomHud: {position: 'absolute', bottom: 0, left: 0, right: 0, height: GROUND_PANEL_HEIGHT,
    padding: 10, backgroundColor: '#101114ef', zIndex: 30, gap: 10},
  bottomHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  subtle: {color: '#f5d73a', fontWeight: '800', fontSize: 11},
  exitBtn: {backgroundColor: '#595959', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12},
  controls: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6},
  controlBtn: {paddingHorizontal: 8, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 9},
  brake: {backgroundColor: '#9c2929'}, accel: {backgroundColor: '#187d40'}, nitro: {backgroundColor: '#1259aa'},
  autoActive: {backgroundColor: '#976f08'},
  disabled: {opacity: 0.4},
  analogPanel: {flex: 1, height: 60, backgroundColor: '#34383f', borderRadius: 9, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'},
  analogLabel: {color: '#fff', fontSize: 17, paddingHorizontal: 3, fontWeight: '800'},
  analogLine: {position: 'absolute', left: 10, right: 10, height: 3, backgroundColor: '#777'},
  analogKnob: {position: 'absolute', alignSelf: 'center', left: '50%', marginLeft: -13, height: 26, width: 26, borderRadius: 13, backgroundColor: '#ffd60a', borderWidth: 2, borderColor: '#fff'},
});
