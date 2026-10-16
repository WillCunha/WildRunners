/**
 * Wild Online Alpha 9 — laboratório + transição para o Mapa (não é o multiplayer completo do Mapa).
 * Controles de direção, nitro e visualização suavizada com física da AWS.
 * Nenhuma variável de física offline é alterada por esta tela.
 */
import { useCarSelection } from '@/context/CarContext';
import { clearWildAlpha9Room, getWildAlpha9Room, handoffWildAlpha9Room } from '@/src/online/wildOnlineAlpha9Session';
import {
  getWildLocalMotorStats,
  WILD_CAR_IDS,
  type WildCarId,
} from '@/src/online/wildOnlineCarStats';
import { WildPositionSmoother } from '@/src/online/wildOnlineSmoothing';
import { usePlayerStore } from '@/src/store/playerStore';
import { Client } from '@colyseus/sdk';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const SERVER_URL = 'https://online.wfsoft.com.br';
const ROOM_TYPE = 'wild_race';

// SDK v0.18.x fornece room.input(), room.onDrop() e room.onReconnect().
type OnlineRoom = Awaited<ReturnType<Client['create']>>;
type OnlineInput = ReturnType<OnlineRoom['input']>;

type PlayerView = {
  sessionId: string;
  slot: number;
  carId: string;
  connected: boolean;
  ready: boolean;
  rank: number;
  speed: number;
  x: number;
  startX: number;
  maxSpeed: number;
  acceleration: number;
  nitroCharges: number;
  nitroRemaining: number;
  nitroCooldown: number;
};
type Phase = 'waiting' | 'countdown' | 'racing' | 'paused' | 'finished';
type RaceView = {
  phase: Phase;
  countdown: number;
  raceTime: number;
  finishDistance: number;
  winnerSessionId: string;
  finishReason: string;
  players: PlayerView[];
};

type ServerPlayer = Partial<PlayerView>;
type StateFromServer = {
  racePhase?: Phase;
  countdown?: number;
  raceTime?: number;
  finishDistance?: number;
  winnerSessionId?: string;
  finishReason?: string;
  players?: { forEach(cb: (player: ServerPlayer, sessionId: string) => void): void };
};

function extractRace(room: OnlineRoom): RaceView {
  const state = room.state as unknown as StateFromServer;
  const players: PlayerView[] = [];
  state?.players?.forEach((player, sessionId) => {
    players.push({
      sessionId,
      slot: Number(player.slot ?? 0),
      carId: String(player.carId ?? ''),
      connected: player.connected !== false,
      ready: player.ready === true,
      rank: Number(player.rank ?? 0),
      speed: Number(player.speed ?? 0),
      x: Number(player.x ?? 0),
      startX: Number(player.startX ?? 0),
      maxSpeed: Number(player.maxSpeed ?? 0),
      acceleration: Number(player.acceleration ?? 0),
      nitroCharges: Number(player.nitroCharges ?? 0),
      nitroRemaining: Number(player.nitroRemaining ?? 0),
      nitroCooldown: Number(player.nitroCooldown ?? 0),
    });
  });
  // Slots estáveis: a pista não troca de linha a cada ultrapassagem.
  players.sort((a, b) => a.slot - b.slot || a.sessionId.localeCompare(b.sessionId));
  return {
    phase: state?.racePhase ?? 'waiting',
    countdown: Number(state?.countdown ?? 0),
    raceTime: Number(state?.raceTime ?? 0),
    finishDistance: Number(state?.finishDistance ?? 6000),
    winnerSessionId: String(state?.winnerSessionId ?? ''),
    finishReason: String(state?.finishReason ?? ''),
    players,
  };
}

const phaseText: Record<Phase, string> = {
  waiting: 'AGUARDANDO READY',
  countdown: 'LARGADA',
  racing: 'CORRIDA EM ANDAMENTO',
  paused: 'PAUSADA — RECONEXÃO',
  finished: 'CORRIDA FINALIZADA',
};

export default function WildOnlineLab() {
  const router = useRouter();
  const { selectedCar } = useCarSelection();
  const profile = usePlayerStore(state => state.profile);
  // Fonte única para o veículo: garagem / CarSelection.
  // O fallback aqui serve APENAS para renderizar dados na prévia offline.
  // Sem seleção válida, o comando de criar/entrar em sala fica bloqueado.
  const hasGarageCar = WILD_CAR_IDS.includes(selectedCar as WildCarId);
  const carId: WildCarId = hasGarageCar ? (selectedCar as WildCarId) : 'fusca';
  const [roomCode, setRoomCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [connectedRoomId, setConnectedRoomId] = useState('');
  const [status, setStatus] = useState('DESCONECTADO');
  const [detail, setDetail] = useState('Crie uma sala ou entre com o código de outro dispositivo.');
  const [busy, setBusy] = useState(false);
  const [lobbyMode, setLobbyMode] = useState<'create' | 'join'>('create');
  const [previewLobby, setPreviewLobby] = useState(false);
  const [previewOpponent, setPreviewOpponent] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [autoDrive, setAutoDrive] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const [race, setRace] = useState<RaceView | null>(null);
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});

  const mounted = useRef(true);
  const roomRef = useRef<OnlineRoom | null>(null);
  const inputRef = useRef<OnlineInput | null>(null);
  const driveRef = useRef(0);
  const accelHeldRef = useRef(false);
  const brakeHeldRef = useRef(false);
  const autoDriveRef = useRef(false);
  const phaseRef = useRef<Phase>('waiting');
  const smoothingRef = useRef(new WildPositionSmoother());
  const droppedRef = useRef(false);
  const inputTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visualTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingsRef = useRef(new Map<number, number>());
  const pingSeqRef = useRef(0);

  const stopTimers = useCallback(() => {
    if (inputTimerRef.current) clearInterval(inputTimerRef.current);
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    if (visualTimerRef.current) clearInterval(visualTimerRef.current);
    inputTimerRef.current = null;
    pingTimerRef.current = null;
    visualTimerRef.current = null;
    inputRef.current = null;
    driveRef.current = 0;
    accelHeldRef.current = false;
    brakeHeldRef.current = false;
    pingsRef.current.clear();
  }, []);

  const startTimers = useCallback((room: OnlineRoom) => {
    stopTimers();
    try {
      const input = room.input();
      if (!input) throw new Error('A sala não disponibilizou defineInput().');
      inputRef.current = input;
      let inputErrorLogged = false;
      let pingErrorLogged = false;

      // O servidor decide o movimento; o cliente envia APENAS drive em [-1, 1].
      inputTimerRef.current = setInterval(() => {
        if (roomRef.current !== room || droppedRef.current || !inputRef.current) return;
        // Nunca reaplica um comando anterior enquanto a corrida está pausada.
        const drive = phaseRef.current === 'racing'
          ? (driveRef.current !== 0 ? driveRef.current : (autoDriveRef.current ? 1 : 0))
          : 0;
        try {
          input.data.drive = drive;
          input.send();
          if (inputErrorLogged) {
            console.log('[WILD ALPHA 8] Input recuperado.');
            inputErrorLogged = false;
          }
        } catch (error) {
          if (!inputErrorLogged) console.warn('[WILD ALPHA 8] Input indisponível:', error);
          inputErrorLogged = true;
        }
      }, 1000 / 30);

      pingTimerRef.current = setInterval(() => {
        if (roomRef.current !== room || droppedRef.current) return;
        const now = Date.now();
        for (const [key, when] of pingsRef.current) {
          if (now - when > 10000) pingsRef.current.delete(key);
        }
        const seq = ++pingSeqRef.current;
        try {
          room.send('ping-check', { seq });
          pingsRef.current.set(seq, now);
          pingErrorLogged = false;
        } catch (error) {
          if (!pingErrorLogged) console.warn('[WILD ALPHA 8] Ping indisponível:', error);
          pingErrorLogged = true;
        }
      }, 2000);

      // 30 fps somente para a representação da pista do laboratório.
      // Não modifica room.state, física, speed, x autoritativo nem ranking.
      visualTimerRef.current = setInterval(() => {
        if (!mounted.current || roomRef.current !== room || droppedRef.current) return;
        setVisualPositions(smoothingRef.current.frame(Date.now()));
      }, 1000 / 30);
    } catch (error) {
      stopTimers();
      if (mounted.current) setDetail('Falha ao preparar input: ' + String(error));
    }
  }, [stopTimers]);

  const resetUI = useCallback(() => {
    roomRef.current = null;
    droppedRef.current = false;
    autoDriveRef.current = false;
    stopTimers();
    smoothingRef.current.reset();
    phaseRef.current = 'waiting';
    if (!mounted.current) return;
    setVisualPositions({});
    setAutoDrive(false);
    setPing(null);
    setRace(null);
    setSessionId('');
    setConnectedRoomId('');
    setBusy(false);
    setStatus('DESCONECTADO');
    setShowDiagnostics(false);
  }, [stopTimers]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      autoDriveRef.current = false;
      stopTimers();
      smoothingRef.current.reset();
      const current = roomRef.current;
      roomRef.current = null;
      if (current) void current.leave().catch(() => {});
    };
  }, [stopTimers]);

  const attachRoom = useCallback((joined: OnlineRoom) => {
    roomRef.current = joined;
    droppedRef.current = false;
    setConnectedRoomId(joined.roomId);
    setSessionId(joined.sessionId);
    setRoomCode(joined.roomId);
    setStatus('CONECTADO');
    setPreviewLobby(false);
    setBusy(false);
    setDetail('Sala conectada. Agora aguarde o segundo jogador e pressione READY.');
    const initialRace = extractRace(joined);
    phaseRef.current = initialRace.phase;
    smoothingRef.current.reset();
    smoothingRef.current.ingest(initialRace.players, initialRace.phase, true);
    setRace(initialRace);
    setVisualPositions(smoothingRef.current.frame(Date.now()));

    joined.reconnection.enabled = true;
    joined.reconnection.minUptime = 1000;
    joined.reconnection.maxRetries = 12;
    joined.reconnection.maxDelay = 1000;
    joined.reconnection.maxEnqueuedMessages = 0;

    joined.onStateChange(() => {
      if (!mounted.current || roomRef.current !== joined) return;
      const snapshot = extractRace(joined);
      phaseRef.current = snapshot.phase;
      smoothingRef.current.ingest(snapshot.players, snapshot.phase);
      setRace(snapshot);
    });
    // Esses eventos são NOTIFICAÇÕES. O Schema da AWS continua sendo a verdade.
    // Antes, os listeners só existiam no multiplayerClient, não neste Lab.
    joined.onMessage('race-ready', () => {
      if (mounted.current && roomRef.current === joined) console.log('[WILD ALPHA 8] Sala completa.');
    });
    joined.onMessage('race-go', () => {
      if (mounted.current && roomRef.current === joined) console.log('[WILD ALPHA 8] GO da AWS.');
    });
    joined.onMessage('race-finished', (payload: {winnerSessionId?: string; finishReason?: string}) => {
      if (mounted.current && roomRef.current === joined) {
        console.log('[WILD ALPHA 8] FINISH da AWS:', payload?.winnerSessionId, payload?.finishReason);
      }
    });
    joined.onMessage('pong-check', (message: {seq: number}) => {
      if (!mounted.current || roomRef.current !== joined) return;
      const start = pingsRef.current.get(message.seq);
      if (start === undefined) return;
      pingsRef.current.delete(message.seq);
      setPing(Date.now() - start);
    });
    joined.onMessage('nitro-result', (message: {ok: boolean; message: string}) => {
      if (mounted.current && roomRef.current === joined) setDetail(message.message);
    });
    joined.onDrop(() => {
      if (!mounted.current || roomRef.current !== joined) return;
      droppedRef.current = true;
      stopTimers();
      // Segurança: reconexão nunca retoma aceleração automática ou botão segurado.
      autoDriveRef.current = false;
      setAutoDrive(false);
      setStatus('RECONECTANDO...');
      setDetail('Conexão perdida. O servidor reserva a vaga por até 10 segundos.');
      setPing(null);
    });
    joined.onReconnect(() => {
      if (!mounted.current || roomRef.current !== joined) return;
      droppedRef.current = false;
      setStatus('CONECTADO');
      setDetail('Sessão recuperada.');
      const recovered = extractRace(joined);
      phaseRef.current = recovered.phase;
      smoothingRef.current.ingest(recovered.players, recovered.phase, true);
      setRace(recovered);
      setVisualPositions(smoothingRef.current.frame(Date.now()));
      startTimers(joined);
    });
    joined.onLeave((code: number) => {
      if (!mounted.current || roomRef.current !== joined) return;
      resetUI();
      setDetail(`Conexão encerrada (${code}).`);
    });
    joined.onError((code: number, message: string) => {
      if (mounted.current && roomRef.current === joined) setDetail(`Servidor ${code}: ${message}`);
    });
    startTimers(joined);
  }, [resetUI, startTimers, stopTimers]);

  const connect = useCallback(async (joinExisting: boolean) => {
    if (roomRef.current || busy) return;
    if (!hasGarageCar) {
      setDetail('Nenhum carro válido selecionado. Volte a CAR SELECTION e escolha um veículo antes de correr online.');
      return;
    }
    if (getWildAlpha9Room()) {
      setDetail('Já existe uma sessão no mapa online. Retome ou encerre antes de criar outra.');
      return;
    }
    const code = roomCode.trim();
    if (joinExisting && !code) {
      setDetail('Digite o código da sala antes de entrar.');
      return;
    }
    setBusy(true);
    setDetail('Conectando ao AWS...');
    try {
      const client = new Client(SERVER_URL);
      const joined = joinExisting
        ? await client.joinById(code, { name: 'Mobile Test', carId })
        : await client.create(ROOM_TYPE, { privateRoom: true, name: 'Mobile Test', carId });
      if (!mounted.current) {
        await joined.leave().catch(() => {});
        return;
      }
      attachRoom(joined);
    } catch (error) {
      if (!mounted.current) return;
      setStatus('DESCONECTADO');
      setDetail('Erro de conexão: ' + String(error));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [attachRoom, busy, carId, hasGarageCar, roomCode]);

  // ALPHA 9: transfer the very same room to /Mapa. No JOIN, no new sessionId.
  // The LAB stops its own 30Hz sender BEFORE the online map starts another one.
  const enterOnlineMap = () => {
    const room = roomRef.current;
    if (!room || droppedRef.current) return;
    stopTimers();
    autoDriveRef.current = false;
    driveRef.current = 0;
    try { handoffWildAlpha9Room(room); }
    catch (error) { setDetail(String(error)); return; }
    // Prevent the Lab's screen cleanup/onLeave callback from disconnecting the transferred room.
    resetUI();
    router.push({ pathname: '/mapa', params: { mode: 'onlineAlpha9' } });
  };

  const resumeTransferred = () => {
    const transferred = getWildAlpha9Room();
    if (!transferred) return;
    router.push({ pathname: '/mapa', params: { mode: 'onlineAlpha9' } });
  };
  const endTransferred = async () => {
    const transferred = getWildAlpha9Room();
    if (!transferred) return;
    clearWildAlpha9Room(transferred);
    try { await transferred.leave(); } catch { /* conexão já finalizada */ }
    if (mounted.current) setDetail('Sessão transferida encerrada. Pode criar outra sala.');
  };

  const leave = useCallback(async () => {
    const current = roomRef.current;
    if (!current) return;
    resetUI(); // fecha localmente mesmo se a conexão caiu
    try { await current.leave(); } catch { /* já desconectado */ }
    if (mounted.current) setDetail('Você saiu da sala.');
  }, [resetUI]);

  const toggleAuto = () => {
    if (!roomRef.current || droppedRef.current || race?.phase !== 'racing') return;
    const next = !autoDriveRef.current;
    autoDriveRef.current = next;
    setAutoDrive(next);
  };

  const holdDrive = (kind: 'brake' | 'accel', holding: boolean) => {
    if (kind === 'brake') brakeHeldRef.current = holding;
    else accelHeldRef.current = holding;
    // Freio tem prioridade; AUTO atua apenas quando nenhum botão está segurado.
    driveRef.current = brakeHeldRef.current ? -1 : accelHeldRef.current ? 1 : 0;
  };

  const sendRaceCommand = (type: 'ready' | 'nitro-activate', payload: boolean | Record<string, never>) => {
    const room = roomRef.current;
    if (!room || droppedRef.current) return;
    try { room.send(type, payload); }
    catch (error) { if (mounted.current) setDetail('Comando não enviado: ' + String(error)); }
  };

  const garage = profile?.garage as Record<string, {
    motor?: {speedLevel?: number; accelerationLevel?: number};
  }> | undefined;
  const localMotor = garage?.[carId]?.motor;
  const localStats = getWildLocalMotorStats(
    carId, localMotor?.speedLevel ?? 1, localMotor?.accelerationLevel ?? 1,
  );
  const myPlayer = race?.players.find(p => p.sessionId === sessionId);
  const canReady = Boolean(roomRef.current && !droppedRef.current && (
    race?.phase === 'finished' || (race?.phase === 'waiting' && !myPlayer?.ready)
  ));
  const canControl = Boolean(connectedRoomId && !droppedRef.current && race?.phase === 'racing');
  const canNitro = canControl && Boolean(myPlayer && myPlayer.nitroCharges > 0 &&
    myPlayer.nitroCooldown <= 0 && myPlayer.nitroRemaining <= 0);

  const hasTransferredRoom = Boolean(getWildAlpha9Room());
  const isPreview = previewLobby && !connectedRoomId && !hasTransferredRoom;
  const showingRoom = Boolean(connectedRoomId) || isPreview;
  const roomPlayers = isPreview ? (previewOpponent ? 2 : 1) : (race?.players.length ?? 0);
  const currentPhase: Phase = isPreview ? 'waiting' : (race?.phase ?? 'waiting');
  const statusLabel = isPreview ? 'PRÉVIA OFFLINE' : status;
  const isReconnecting = !isPreview && (droppedRef.current || status === 'RECONECTANDO...' || currentPhase === 'paused');
  const pingIsHigh = ping !== null && ping >= 500;
  const roomShareCode = connectedRoomId;

  const shareRoom = async () => {
    if (!roomShareCode || isPreview) return;
    try {
      await Share.share({
        message: `🏎️ Bora correr no Wild Runners!\nEntre em uma sala privada com o código: ${roomShareCode}\nAbra o Wild Online e escolha ENTRAR EM SALA.`,
      });
    } catch (error) {
      if (mounted.current) setDetail('Não foi possível abrir o compartilhamento: ' + String(error));
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroOrbA} />
          <View pointerEvents="none" style={styles.heroOrbB} />
          <View style={styles.heroTop}>
            <Text style={styles.heroMicro}>WF SOFT  /  WILD RUNNERS</Text>
            <Text style={styles.heroVersion}>PRÉ-ALPHA 12</Text>
          </View>
          <Text style={styles.heroTitle}>WILD<Text style={styles.heroTitleAccent}> ONLINE</Text></Text>
          <Text style={styles.heroSubtitle}>Seu rival está a um código de distância.</Text>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTag}>🏁  1 PISTA</Text>
            <Text style={styles.heroTag}>🏎️  2 PILOTOS</Text>
            <Text style={styles.heroTag}>⚡  PvP</Text>
          </View>
        </View>

        <View style={styles.connectionStrip}>
          <View style={[styles.connectionDot, isPreview ? styles.dotGold : connectedRoomId && !isReconnecting ? styles.dotGreen : isReconnecting ? styles.dotOrange : styles.dotGrey]} />
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionLabel}>{statusLabel}</Text>
            <Text style={styles.connectionHint} numberOfLines={2}>
              {isPreview ? 'Interface de demonstração · sem conexão AWS' : connectedRoomId ? (isReconnecting ? 'Reconectando com a AWS' : 'Servidor AWS · São Paulo') : 'Conecte-se quando sua rede estiver estável'}
            </Text>
          </View>
          <View style={[styles.pingPill, pingIsHigh && styles.pingPillHigh]}>
            <Text style={[styles.pingText, pingIsHigh && styles.pingTextHigh]}>
              {isPreview || ping === null ? 'PING —' : `${ping} ms`}
            </Text>
          </View>
        </View>

        {!!detail && !isPreview && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{detail}</Text>
          </View>
        )}

        {!connectedRoomId && hasTransferredRoom && (
          <View style={styles.sectionCard}>
            <Text style={styles.eyebrow}>SESSÃO ATIVA</Text>
            <Text style={styles.sectionTitle}>Sua corrida ainda está no mapa</Text>
            <Text style={styles.muted}>Retome a mesma conexão, sem criar outro jogador na AWS.</Text>
            <Pressable style={styles.primaryButton} onPress={resumeTransferred}>
              <Text style={styles.primaryButtonText}>🏎️  RETOMAR CORRIDA   →</Text>
            </Pressable>
            <Pressable style={styles.ghostDangerButton} onPress={() => void endTransferred()}>
              <Text style={styles.dangerText}>Encerrar sessão anterior</Text>
            </Pressable>
          </View>
        )}

        {!showingRoom && !hasTransferredRoom && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionNumber}>01</Text>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.eyebrow}>VEÍCULO DA GARAGEM</Text>
                  <Text style={styles.sectionTitle}>{hasGarageCar ? carId.toUpperCase() : 'SEM CARRO SELECIONADO'}</Text>
                </View>
              </View>
              <View style={styles.garageSummary}>
                <Text style={styles.garageSummaryIcon}>🏎️</Text>
                <View style={styles.garageSummaryInfo}>
                  <Text style={styles.garageSummaryTitle}>{hasGarageCar ? 'CARRO CONFIRMADO' : 'VOLTE A CAR SELECTION'}</Text>
                  <Text style={styles.garageSummarySub}>
                    {hasGarageCar ? 'O mesmo veículo da garagem será enviado para a AWS.' : 'A sala online não escolherá um veículo por você.'}
                  </Text>
                </View>
                <Text style={styles.garageSummaryCheck}>{hasGarageCar ? '✓' : '!'}</Text>
              </View>
              {hasGarageCar && (
                <View style={styles.statsStrip}>
                  <Text style={styles.statsText}>⚙️ MOTOR VEL. NV.{localMotor?.speedLevel ?? 1}</Text>
                  <Text style={styles.statsText}>🚀 ACEL. NV.{localMotor?.accelerationLevel ?? 1}</Text>
                  <Text style={styles.statsText}>🏁 {localStats.topSpeedKmh.toFixed(0)} km/h (local)</Text>
                </View>
              )}
              <Text style={styles.captionText}>
                O online usa o carro selecionado em CAR SELECTION. Os upgrades locais ainda não alteram os atributos do servidor de testes.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionNumber}>02</Text>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.eyebrow}>ESCOLHA COMO JOGAR</Text>
                  <Text style={styles.sectionTitle}>Encontrar seu rival</Text>
                </View>
              </View>

              <View style={styles.modeSwitcher}>
                <Pressable onPress={() => setLobbyMode('create')}
                  style={[styles.modeButton, lobbyMode === 'create' && styles.modeSelected]}>
                  <Text style={[styles.modeText, lobbyMode === 'create' && styles.modeTextSelected]}>＋  CRIAR SALA</Text>
                </Pressable>
                <Pressable onPress={() => setLobbyMode('join')}
                  style={[styles.modeButton, lobbyMode === 'join' && styles.modeSelected]}>
                  <Text style={[styles.modeText, lobbyMode === 'join' && styles.modeTextSelected]}>↗  ENTRAR</Text>
                </Pressable>
              </View>

              {lobbyMode === 'create' ? (
                <View style={styles.modeDescription}>
                  <Text style={styles.modeTitle}>Uma sala só de vocês.</Text>
                  <Text style={styles.muted}>Crie uma sala privada, compartilhe o código com um amigo e corram juntos.</Text>
                  <View style={styles.privacyChip}><Text style={styles.privacyText}>🔒  SALA PRIVADA · ATÉ 2 JOGADORES</Text></View>
                </View>
              ) : (
                <View style={styles.modeDescription}>
                  <Text style={styles.modeTitle}>Já recebeu um convite?</Text>
                  <Text style={styles.muted}>Cole ou digite o código da sala enviada pelo anfitrião.</Text>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Cole o código da sala"
                    placeholderTextColor="#6D758A"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={48}
                    value={roomCode}
                    onChangeText={setRoomCode}
                    returnKeyType="done"
                  />
                </View>
              )}

              <Pressable
                style={[styles.primaryButton, (busy || !hasGarageCar) && styles.inactive]}
                disabled={busy || !hasGarageCar}
                onPress={() => void connect(lobbyMode === 'join')}
              >
                {busy ? <ActivityIndicator color="#111827" /> : (
                  <Text style={styles.primaryButtonText}>
                    {lobbyMode === 'join' ? 'ENTRAR NA SALA   →' : 'CRIAR SALA PRIVADA   →'}
                  </Text>
                )}
              </Pressable>
            </View>

            <Pressable style={styles.previewButton} onPress={() => { setPreviewLobby(true); setPreviewOpponent(false); setShowDiagnostics(false); }}>
              <Text style={styles.previewButtonText}>◇  VER PRÉVIA DO LOBBY SEM INTERNET</Text>
              <Text style={styles.previewHint}>Somente visual · nenhum comando enviado</Text>
            </Pressable>
          </>
        )}

        {showingRoom && (
          <>
            <View style={styles.roomCard}>
              <View style={styles.roomCardHeader}>
                <Text style={styles.eyebrow}>{isPreview ? 'DEMONSTRAÇÃO LOCAL' : 'SUA SALA PRIVADA'}</Text>
                <View style={styles.privateBadge}><Text style={styles.privateBadgeText}>🔒 PRIVADA</Text></View>
              </View>
              <Text style={styles.roomHelp}>{isPreview ? 'Veja como o lobby ficará com um segundo jogador.' : 'Compartilhe este código com seu rival:'}</Text>
              <Text selectable={!isPreview} style={styles.roomCode}>{isPreview ? 'DEMO-LOCAL' : connectedRoomId}</Text>
              {!isPreview && (
                <Pressable style={styles.inviteButton} onPress={() => void shareRoom()}>
                  <Text style={styles.inviteText}>↗   COMPARTILHAR CONVITE</Text>
                </Pressable>
              )}
              <Text style={styles.roomFoot}>{isPreview ? 'Prévia visual — esta sala não existe na AWS.' : 'Também é possível selecionar e copiar o código acima.'}</Text>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.lobbyTitleRow}>
                <View>
                  <Text style={styles.eyebrow}>LOBBY MULTIPLAYER</Text>
                  <Text style={styles.sectionTitle}>Pilotos na pista</Text>
                </View>
                <Text style={styles.playerCount}>{roomPlayers}/2</Text>
              </View>
              <View style={styles.pilotSlots}>
                <View style={styles.pilotCard}>
                  <View style={styles.pilotBadge}><Text style={styles.pilotBadgeText}>01</Text></View>
                  <View style={styles.pilotInfo}>
                    <Text style={styles.pilotTitle}>{isPreview ? 'VOCÊ' : (myPlayer ? 'VOCÊ' : 'JOGADOR 1')}</Text>
                    <Text style={styles.pilotSub} numberOfLines={1}>{isPreview ? (hasGarageCar ? carId.toUpperCase() : 'SEM CARRO') : (myPlayer?.carId ?? race?.players[0]?.carId ?? carId).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.pilotState}>{isPreview ? 'NA SALA' : myPlayer?.ready ? '✓ PRONTO' : 'CONECTADO'}</Text>
                </View>
                <View style={[styles.pilotCard, roomPlayers < 2 && styles.pilotCardEmpty]}>
                  <View style={[styles.pilotBadge, styles.pilotBadgeSecondary]}><Text style={styles.pilotBadgeText}>02</Text></View>
                  <View style={styles.pilotInfo}>
                    <Text style={styles.pilotTitle}>{roomPlayers >= 2 ? (isPreview ? 'RIVAL DEMO' : 'RIVAL') : 'AGUARDANDO...'}</Text>
                    <Text style={styles.pilotSub} numberOfLines={1}>{roomPlayers >= 2 ? (isPreview ? 'FUSCA · FICTÍCIO' : (race?.players.find(p => p.sessionId !== sessionId)?.carId ?? 'RIVAL').toUpperCase()) : 'Convide outro jogador'}</Text>
                  </View>
                  <Text style={[styles.pilotState, roomPlayers < 2 && styles.pilotStateWait]}>
                    {roomPlayers >= 2 ? (race?.players.find(p => p.sessionId !== sessionId)?.ready ? '✓ PRONTO' : 'NA SALA') : '○ LIVRE'}
                  </Text>
                </View>
              </View>
              <View style={styles.phaseStrip}>
                <Text style={styles.phaseText}>{isPreview ? '⏳ AGUARDANDO RIVAL' : phaseText[currentPhase]}</Text>
                {currentPhase === 'countdown' && !isPreview && <Text style={styles.countdownText}>{race?.countdown ?? 3}</Text>}
              </View>
              {currentPhase === 'finished' && !isPreview && (
                <Text style={styles.resultText}>
                  {race?.winnerSessionId === sessionId ? '🏆 VITÓRIA' : race?.winnerSessionId ? '🏁 DERROTA' : '🏁 EMPATE'}
                </Text>
              )}
              {!isPreview && canReady && (
                <Pressable style={styles.primaryButton} onPress={() => sendRaceCommand('ready', true)}>
                  <Text style={styles.primaryButtonText}>{currentPhase === 'finished' ? '↻   PEDIR REVANCHE' : '✓   ESTOU PRONTO!'}</Text>
                </Pressable>
              )}
              {!isPreview && currentPhase === 'waiting' && myPlayer?.ready && (
                <Text style={styles.readyHint}>✓ Você está pronto. A corrida começará quando o outro jogador também estiver.</Text>
              )}
              {!isPreview && !isReconnecting && (
                <Pressable style={styles.mapButton} onPress={enterOnlineMap}>
                  <Text style={styles.mapButtonText}>🏎️   ABRIR PISTA ONLINE   →</Text>
                </Pressable>
              )}
              {isPreview && (
                <Pressable style={styles.previewOpponentButton} onPress={() => setPreviewOpponent(value => !value)}>
                  <Text style={styles.previewOpponentText}>{previewOpponent ? '○  OCULTAR RIVAL DEMONSTRATIVO' : '＋  SIMULAR RIVAL (SOMENTE VISUAL)'}</Text>
                </Pressable>
              )}
              {isPreview && (
                <Pressable style={styles.mapButton} onPress={() => setPreviewLobby(false)}>
                  <Text style={styles.mapButtonText}>←   SAIR DA PRÉVIA</Text>
                </Pressable>
              )}
              <Text style={styles.captionText}>
                {isPreview ? 'READY e acesso ao mapa estão desativados na prévia.' : 'As posições, READY e resultados continuam sendo definidos pela AWS.'}
              </Text>
            </View>

            {!isPreview && (
              <>
                <Pressable style={styles.diagnosticsToggle} onPress={() => setShowDiagnostics(value => !value)}>
                  <View>
                    <Text style={styles.diagnosticsTitle}>⚙️   Ferramentas de laboratório</Text>
                    <Text style={styles.diagnosticsCaption}>Ping, telemetria e controles de teste</Text>
                  </View>
                  <Text style={styles.diagnosticsChevron}>{showDiagnostics ? '−' : '＋'}</Text>
                </Pressable>

                {showDiagnostics && (
                  <>
                    <View style={styles.sectionCard}>
                      <Text style={styles.eyebrow}>TELEMETRIA AWS</Text>
                      <Text style={styles.sectionTitle}>Posições oficiais</Text>
                      <Text style={styles.muted}>Sessão: {sessionId || '—'} · Tempo: {(race?.raceTime ?? 0).toFixed(2)} s</Text>
                      {(race?.players ?? []).map(player => {
                        const visualX = visualPositions[player.sessionId] ?? player.x;
                        const progressWorld = Math.max(0, visualX - player.startX);
                        const progress = Math.max(0, Math.min(100, 100 * progressWorld / Math.max(1, race?.finishDistance ?? 6000)));
                        return (
                          <View key={player.sessionId} style={[styles.telemetryRow, player.sessionId === sessionId && styles.telemetryRowSelf]}>
                            <Text style={styles.telemetryTitle}>
                              {player.sessionId === sessionId ? 'VOCÊ' : 'RIVAL'} · {player.carId.toUpperCase()} · {player.rank}º
                            </Text>
                            <View style={styles.track}>
                              <View style={[styles.trackFill, { width: `${progress}%` as `${number}%` }]} />
                              <View style={[styles.trackCar, { left: `${Math.min(91, progress)}%` as `${number}%` }]}><Text>🏎️</Text></View>
                            </View>
                            <Text style={styles.telemetryCaption}>Progresso {progress.toFixed(1)}% · x={player.x.toFixed(1)} · largada={player.startX.toFixed(0)}</Text>
                            <Text style={styles.telemetryCaption}>Velocidade {player.speed.toFixed(1)} / {player.maxSpeed.toFixed(1)} · Nitro {player.nitroCharges} cargas</Text>
                            <Text style={styles.telemetryCaption}>{player.connected ? 'Conectado' : 'Reconectando'} · Efeito nitro {player.nitroRemaining.toFixed(1)}s · Recarga {player.nitroCooldown.toFixed(1)}s</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.sectionCard}>
                      <Text style={styles.eyebrow}>CONTROLES DE TESTE · 30 HZ</Text>
                      <View style={styles.buttonPair}>
                        <Pressable disabled={!canControl} style={[styles.smallAction, autoDrive && styles.actionOn, !canControl && styles.inactive]} onPress={toggleAuto}>
                          <Text style={styles.smallActionText}>AUTO: {autoDrive ? 'ON' : 'OFF'}</Text>
                        </Pressable>
                        <Pressable disabled={!canNitro} style={[styles.smallAction, !canNitro && styles.inactive]} onPress={() => sendRaceCommand('nitro-activate', {})}>
                          <Text style={styles.smallActionText}>⚡ NITRO</Text>
                        </Pressable>
                      </View>
                      <View style={styles.buttonPair}>
                        <Pressable disabled={!canControl} style={[styles.brakeAction, !canControl && styles.inactive]}
                          onPressIn={() => holdDrive('brake', true)} onPressOut={() => holdDrive('brake', false)}>
                          <Text style={styles.smallActionText}>FREAR</Text>
                        </Pressable>
                        <Pressable disabled={!canControl} style={[styles.accelAction, !canControl && styles.inactive]}
                          onPressIn={() => holdDrive('accel', true)} onPressOut={() => holdDrive('accel', false)}>
                          <Text style={styles.smallActionText}>ACELERAR</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.captionText}>Aceleração e freio são enviados para a AWS; nenhuma física local é aplicada.</Text>
                    </View>
                  </>
                )}
                <Pressable style={styles.exitRoomButton} onPress={() => void leave()}>
                  <Text style={styles.exitRoomText}>SAIR DA SALA</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        <Pressable style={styles.backButton} onPress={() => { if (isPreview) { setPreviewLobby(false); return; } void leave(); router.back(); }}>
          <Text style={styles.backButtonText}>←  VOLTAR</Text>
        </Pressable>
        <Text style={styles.footerText}>WILD RUNNERS  •  WF SOFT  •  ONLINE LAB</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: '#080E1D',
  card: '#151E30',
  border: '#2A3449',
  gold: '#FFD54A',
  soft: '#AAB5C9',
  white: '#F6F8FF',
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 54, gap: 14 },
  hero: { backgroundColor: '#18243B', borderColor: '#364761', borderWidth: 1, borderRadius: 24, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, overflow: 'hidden', minHeight: 191 },
  heroOrbA: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: '#263F60', right: -83, top: -114, opacity: 0.85 },
  heroOrbB: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: '#30476B', right: 42, bottom: -72, opacity: 0.58 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  heroMicro: { color: '#A3B3CF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroVersion: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  heroTitle: { color: COLORS.white, fontSize: 36, fontWeight: '900', letterSpacing: -1.8, marginTop: 20 },
  heroTitleAccent: { color: COLORS.gold },
  heroSubtitle: { color: '#C6D2E5', fontSize: 14, marginTop: 6, fontWeight: '600' },
  heroBottom: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 20 },
  heroTag: { color: '#E7EAF0', fontSize: 10, fontWeight: '900', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 9, overflow: 'hidden', backgroundColor: '#263650' },
  connectionStrip: { flexDirection: 'row', backgroundColor: '#11192B', borderRadius: 16, padding: 13, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 10 },
  connectionDot: { width: 9, height: 9, borderRadius: 5 },
  dotGold: { backgroundColor: COLORS.gold },
  dotGreen: { backgroundColor: '#45D89E' },
  dotOrange: { backgroundColor: '#FFAB5C' },
  dotGrey: { backgroundColor: '#6E7D95' },
  connectionInfo: { flex: 1, minWidth: 0 },
  connectionLabel: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  connectionHint: { color: COLORS.soft, fontSize: 11, marginTop: 3 },
  pingPill: { borderColor: '#43506C', borderWidth: 1, backgroundColor: '#253148', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 },
  pingPillHigh: { backgroundColor: '#49301F', borderColor: '#99643B' },
  pingText: { color: '#CFD9ED', fontSize: 12, fontWeight: '900' },
  pingTextHigh: { color: '#FFBE77' },
  notice: { backgroundColor: '#121C30', borderLeftWidth: 3, borderLeftColor: '#789CD4', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8 },
  noticeText: { color: '#C9D4EA', fontSize: 12, lineHeight: 17 },
  sectionCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 17, gap: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionHeaderText: { flex: 1 },
  sectionNumber: { backgroundColor: '#283650', overflow: 'hidden', borderRadius: 13, color: COLORS.gold, fontWeight: '900', fontSize: 17, paddingVertical: 12, paddingHorizontal: 12 },
  eyebrow: { fontSize: 10, color: COLORS.gold, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  sectionTitle: { fontSize: 20, color: COLORS.white, fontWeight: '900' },
  muted: { color: COLORS.soft, fontSize: 13, lineHeight: 19 },
  garageSummary: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, backgroundColor: '#1E2A40', borderRadius: 14, borderWidth: 1, borderColor: '#344258' },
  garageSummaryIcon: { fontSize: 28 },
  garageSummaryInfo: { flex: 1, gap: 4 },
  garageSummaryTitle: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  garageSummarySub: { color: COLORS.soft, fontSize: 11, lineHeight: 16 },
  garageSummaryCheck: { color: COLORS.gold, fontWeight: '900', fontSize: 19 },
  statsStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: '#11192B', padding: 11, borderRadius: 11 },
  statsText: { fontSize: 11, color: '#BED4F8', fontWeight: '800' },
  captionText: { color: '#9EAAC0', fontSize: 11, lineHeight: 16 },
  modeSwitcher: { flexDirection: 'row', padding: 5, backgroundColor: '#0E1625', borderRadius: 13, gap: 5 },
  modeButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 6 },
  modeSelected: { backgroundColor: '#34445E' },
  modeText: { color: '#9DACC6', fontSize: 12, fontWeight: '900' },
  modeTextSelected: { color: COLORS.white },
  modeDescription: { gap: 9 },
  modeTitle: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  privacyChip: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#243746', borderRadius: 9 },
  privacyText: { fontSize: 10, color: '#8DE2B7', fontWeight: '900' },
  codeInput: { borderColor: '#465675', borderWidth: 1, paddingHorizontal: 16, minHeight: 55, backgroundColor: '#0E1524', borderRadius: 12, color: COLORS.white, fontWeight: '800', fontSize: 16 },
  primaryButton: { backgroundColor: COLORS.gold, minHeight: 53, borderRadius: 13, justifyContent: 'center', alignItems: 'center', padding: 13 },
  primaryButtonText: { color: '#171B27', fontSize: 13, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  inactive: { opacity: 0.45 },
  previewButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#536581', borderRadius: 14, padding: 15, alignItems: 'center', gap: 3 },
  previewButtonText: { color: '#DCE5F5', fontWeight: '900', fontSize: 12 },
  previewHint: { color: '#8797B3', fontSize: 11 },
  previewOpponentButton: { alignItems: 'center', justifyContent: 'center', borderColor: '#566783', borderWidth: 1, borderRadius: 12, paddingVertical: 13 },
  previewOpponentText: { color: '#C3D5F2', fontSize: 11, fontWeight: '900' },
  roomCard: { backgroundColor: '#1B2942', borderRadius: 20, borderWidth: 1, borderColor: '#4C6385', padding: 18, gap: 10 },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  privateBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#28463E', borderRadius: 9 },
  privateBadgeText: { color: '#8DE2B7', fontSize: 10, fontWeight: '900' },
  roomHelp: { color: '#BBC7DA', fontSize: 12 },
  roomCode: { fontSize: 31, fontWeight: '900', color: COLORS.white, letterSpacing: 1.8, textAlign: 'center', paddingVertical: 5 },
  inviteButton: { backgroundColor: '#F3F7FF', minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  inviteText: { fontSize: 12, color: '#1C2940', fontWeight: '900' },
  roomFoot: { color: '#9EADCA', fontSize: 11, textAlign: 'center' },
  lobbyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  playerCount: { fontSize: 18, color: COLORS.gold, fontWeight: '900', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: '#2E3240' },
  pilotSlots: { gap: 9 },
  pilotCard: { flexDirection: 'row', gap: 11, alignItems: 'center', backgroundColor: '#202E43', borderRadius: 14, padding: 13, borderColor: '#3C5270', borderWidth: 1 },
  pilotCardEmpty: { borderStyle: 'dashed', borderColor: '#4E5B71', backgroundColor: '#192236' },
  pilotBadge: { borderRadius: 11, height: 37, width: 37, alignItems: 'center', justifyContent: 'center', backgroundColor: '#574A25' },
  pilotBadgeSecondary: { backgroundColor: '#2B3A52' },
  pilotBadgeText: { fontSize: 14, color: COLORS.white, fontWeight: '900' },
  pilotInfo: { flex: 1, minWidth: 0, gap: 4 },
  pilotTitle: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  pilotSub: { color: '#B3C0D3', fontWeight: '700', fontSize: 11 },
  pilotState: { color: '#82E3AC', fontSize: 10, fontWeight: '900' },
  pilotStateWait: { color: '#D4B96F' },
  phaseStrip: { backgroundColor: '#10192B', paddingVertical: 12, paddingHorizontal: 13, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between' },
  phaseText: { color: '#DEE9FC', fontSize: 12, fontWeight: '900' },
  countdownText: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  resultText: { color: COLORS.gold, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  readyHint: { color: '#A0E8BD', fontSize: 12, textAlign: 'center' },
  mapButton: { backgroundColor: '#294265', minHeight: 52, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderColor: '#4E719C', borderWidth: 1, padding: 11 },
  mapButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  ghostDangerButton: { alignItems: 'center', padding: 12 },
  dangerText: { color: '#FF9B9B', fontWeight: '800', fontSize: 12 },
  diagnosticsToggle: { backgroundColor: '#121B2C', borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diagnosticsTitle: { color: '#D7E1F0', fontSize: 13, fontWeight: '900' },
  diagnosticsCaption: { color: '#8090A9', fontSize: 11, marginTop: 5 },
  diagnosticsChevron: { color: COLORS.gold, fontSize: 22 },
  telemetryRow: { borderWidth: 1, borderColor: '#34445D', padding: 11, borderRadius: 12, gap: 6 },
  telemetryRowSelf: { borderColor: '#F4D24A' },
  telemetryTitle: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
  telemetryCaption: { color: '#BCC8DB', fontSize: 11 },
  track: { height: 24, backgroundColor: '#2D3A50', borderRadius: 6, overflow: 'hidden', justifyContent: 'center' },
  trackFill: { height: 7, backgroundColor: COLORS.gold, borderRadius: 3 },
  trackCar: { position: 'absolute', top: 1 },
  buttonPair: { flexDirection: 'row', gap: 9 },
  smallAction: { flex: 1, padding: 13, backgroundColor: '#285078', borderRadius: 12, alignItems: 'center' },
  actionOn: { backgroundColor: '#28764D' },
  brakeAction: { flex: 1, padding: 13, backgroundColor: '#85373A', borderRadius: 12, alignItems: 'center' },
  accelAction: { flex: 1, padding: 13, backgroundColor: '#277A53', borderRadius: 12, alignItems: 'center' },
  smallActionText: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  exitRoomButton: { alignItems: 'center', padding: 13 },
  exitRoomText: { color: '#FCA3A3', fontWeight: '900', fontSize: 12 },
  backButton: { alignItems: 'center', padding: 10 },
  backButtonText: { color: '#97A9C3', fontWeight: '900', fontSize: 13 },
  footerText: { color: '#526580', fontSize: 10, textAlign: 'center', fontWeight: '900', letterSpacing: 1.3 },
});
