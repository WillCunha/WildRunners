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
import { getCardDefinition } from '@/src/utils/cardMap';
import { Client } from '@colyseus/sdk';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  Modal,
  useWindowDimensions,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const SERVER_URL = 'https://online.wfsoft.com.br';
const ROOM_TYPE = 'wild_race';
const ENABLED_ONLINE_CARDS = new Set<string>([
  'slow_slow', 'nitro_power', 'shield', 'bullet', 'chains', 'tnt', 'oil_spit',
  'quick_repair', 'emp_pulse',
]);

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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const compact = viewportHeight < 440;
  const portrait = viewportHeight > viewportWidth;
  const { selectedCar } = useCarSelection();
  const profile = usePlayerStore(state => state.profile);
  const equippedDeck = usePlayerStore(state => state.equippedDeck);
  const deckReady = Array.isArray(equippedDeck) && equippedDeck.length === 4 &&
    new Set(equippedDeck).size === 4 &&
    equippedDeck.every(id => ENABLED_ONLINE_CARDS.has(id) && !!getCardDefinition(id) &&
      profile?.unlocks?.cards?.includes(id));
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
    if (!deckReady) {
      setDetail('Deck inválido ou com carta ainda não habilitada online. Escolha quatro cartas em DECK SELECTION.');
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
      const cosmetics = profile?.garage?.[carId]?.customization;
      const joinPayload = {
        name: 'Mobile Test', carId, deck: equippedDeck,
        colorFront: cosmetics?.paint?.primaryColor ?? '#FF3B30',
        colorBack: cosmetics?.paint?.secondaryColor ?? '#FF3B30',
        finishId: cosmetics?.paint?.finishId ?? 'solid',
        equipment: cosmetics?.equipment ?? {},
      };
      const joined = joinExisting
        ? await client.joinById(code, joinPayload)
        : await client.create(ROOM_TYPE, { privateRoom: true, ...joinPayload });
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
  }, [attachRoom, busy, carId, deckReady, equippedDeck, profile, hasGarageCar, roomCode]);

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
      {portrait ? (
        <View style={styles.rotateScreen}>
          <Text style={styles.rotateIcon}>↻</Text>
          <Text style={styles.rotateTitle}>GIRE PARA JOGAR</Text>
          <Text style={styles.rotateText}>O lobby do Wild Online foi projetado para a tela horizontal.</Text>
          <Pressable style={styles.rotateBack} onPress={() => router.back()}>
            <Text style={styles.rotateBackText}>← VOLTAR</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.shell, compact && styles.shellCompact]}>
          {/* Barra fixa: sem cabeçalho alto e sem necessidade de scroll. */}
          <View style={styles.topBar}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>WF</Text></View>
            <View style={styles.brandTextBlock}>
              <Text style={styles.brandTitle}>WILD <Text style={styles.brandAccent}>ONLINE</Text></Text>
              <Text style={styles.brandSub}>SALA MULTIPLAYER  /  PRÉ-ALPHA 12</Text>
            </View>
            <View style={styles.topFill} />
            <View style={styles.connectionBadge}>
              <View style={[styles.statusDot,
                isPreview ? styles.goldDot : connectedRoomId && !isReconnecting ? styles.greenDot :
                isReconnecting ? styles.orangeDot : styles.greyDot]} />
              <Text style={styles.connectionText} numberOfLines={1}>{statusLabel}</Text>
            </View>
            <View style={[styles.pingBadge, pingIsHigh && styles.pingBadgeHigh]}>
              <Text style={[styles.pingText, pingIsHigh && styles.pingTextHigh]}>
                {isPreview || ping === null ? 'PING —' : `PING ${ping} ms`}
              </Text>
            </View>
            <Pressable style={styles.backTop} onPress={() => {
              if (isPreview) { setPreviewLobby(false); return; }
              void leave();
              router.back();
            }}>
              <Text style={styles.backTopText}>← VOLTAR</Text>
            </Pressable>
          </View>

          {/* 70 / 30: painéis fixos e independentes da altura do conteúdo. */}
          <View style={styles.split}>
            <View style={styles.leftColumn}>
              {!connectedRoomId && hasTransferredRoom ? (
                <View style={[styles.mainPanel, compact && styles.compactMainPanel]}>
                  <Text style={styles.sectionKicker}>SESSÃO EM ANDAMENTO</Text>
                  <Text style={styles.mainTitle}>Sua corrida continua ativa</Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    Retome a mesma conexão sem criar um jogador duplicado na AWS.
                  </Text>
                  <View style={styles.filler} />
                  <View style={styles.actionsRow}>
                    <Pressable style={[styles.mainAction, styles.flexGrow]} onPress={resumeTransferred}>
                      <Text style={styles.mainActionText}>🏎️  RETOMAR CORRIDA →</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={() => void endTransferred()}>
                      <Text style={styles.secondaryActionText}>ENCERRAR SESSÃO</Text>
                    </Pressable>
                  </View>
                </View>
              ) : !showingRoom ? (
                <View style={[styles.mainPanel, compact && styles.compactMainPanel]}>
                  <View style={styles.panelHeading}>
                    <View style={styles.headingText}>
                      <Text style={styles.sectionKicker}>01  /  MULTIPLAYER</Text>
                      <Text style={styles.mainTitle}>ESCOLHA SUA SALA</Text>
                    </View>
                    <View style={styles.capacityChip}><Text style={styles.capacityText}>2 PILOTOS  ·  PRIVADA</Text></View>
                  </View>

                  <View style={styles.modeRow}>
                    <Pressable style={[styles.modeTab, lobbyMode === 'create' && styles.modeTabActive]}
                      onPress={() => setLobbyMode('create')}>
                      <Text style={[styles.modeLabel, lobbyMode === 'create' && styles.modeLabelActive]}>＋ CRIAR SALA</Text>
                    </Pressable>
                    <Pressable style={[styles.modeTab, lobbyMode === 'join' && styles.modeTabActive]}
                      onPress={() => setLobbyMode('join')}>
                      <Text style={[styles.modeLabel, lobbyMode === 'join' && styles.modeLabelActive]}>↗ ENTRAR COM CÓDIGO</Text>
                    </Pressable>
                  </View>

                  {lobbyMode === 'create' ? (
                    <View style={styles.modeBody}>
                      <Text style={styles.modeBodyTitle}>Crie uma sala só de vocês.</Text>
                      <Text style={styles.desc} numberOfLines={2}>Compartilhe o código com um amigo e espere os dois pilotos ficarem prontos.</Text>
                    </View>
                  ) : (
                    <View style={styles.modeBodyJoin}>
                      <Text style={styles.formLabel}>CÓDIGO DO CONVITE</Text>
                      <TextInput
                        style={styles.codeInput}
                        placeholder="Ex.: 3BT0b4oXx"
                        placeholderTextColor="#66768F"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={48}
                        value={roomCode}
                        onChangeText={setRoomCode}
                        returnKeyType="done"
                      />
                    </View>
                  )}

                  <View style={styles.filler} />
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.mainAction, styles.flexGrow, (busy || !hasGarageCar) && styles.disabled]}
                      disabled={busy || !hasGarageCar}
                      onPress={() => void connect(lobbyMode === 'join')}
                    >
                      {busy ? <ActivityIndicator color="#101522" size="small" /> : (
                        <Text style={styles.mainActionText}>
                          {lobbyMode === 'join' ? 'ENTRAR NA SALA  →' : 'CRIAR SALA PRIVADA  →'}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={() => {
                      setPreviewLobby(true);
                      setPreviewOpponent(false);
                      setShowDiagnostics(false);
                    }}>
                      <Text style={styles.secondaryActionText}>◇ PRÉVIA OFFLINE</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={[styles.mainPanel, compact && styles.compactMainPanel]}>
                  <View style={styles.roomHeading}>
                    <View style={styles.roomIdentity}>
                      <Text style={styles.sectionKicker}>{isPreview ? 'MODO DEMONSTRAÇÃO · SEM AWS' : 'SALA PRIVADA  /  CONVITE'}</Text>
                      <Text style={styles.inviteCode} selectable={!isPreview} numberOfLines={1} adjustsFontSizeToFit>
                        {isPreview ? 'DEMO-LOCAL' : connectedRoomId}
                      </Text>
                    </View>
                    <View style={styles.roomTopActions}>
                      <Text style={styles.roomCount}>{roomPlayers}/2</Text>
                      {!isPreview && (
                        <Pressable style={styles.shareAction} onPress={() => void shareRoom()}>
                          <Text style={styles.shareActionText}>↗ COMPARTILHAR</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.pilotsRow}>
                    <View style={[styles.pilotCompact, styles.pilotMine]}>
                      <View style={styles.pilotNumber}><Text style={styles.pilotNumberText}>01</Text></View>
                      <View style={styles.pilotDetails}>
                        <Text style={styles.pilotName}>VOCÊ</Text>
                        <Text style={styles.pilotCar} numberOfLines={1}>{isPreview ? (hasGarageCar ? carId.toUpperCase() : 'SEM CARRO') : (myPlayer?.carId ?? carId).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.pilotReady, !(isPreview || myPlayer?.ready) && styles.pilotNotReady]}>
                        {isPreview ? 'DEMO' : myPlayer?.ready ? '✓ READY' : 'AGUARDANDO'}
                      </Text>
                    </View>
                    <View style={[styles.pilotCompact, roomPlayers < 2 && styles.pilotEmpty]}>
                      <View style={[styles.pilotNumber, styles.pilotNumberRival]}><Text style={styles.pilotNumberText}>02</Text></View>
                      <View style={styles.pilotDetails}>
                        <Text style={styles.pilotName}>{roomPlayers >= 2 ? (isPreview ? 'RIVAL DEMO' : 'RIVAL') : 'VAGA LIVRE'}</Text>
                        <Text style={styles.pilotCar} numberOfLines={1}>{roomPlayers >= 2 ? (isPreview ? 'FUSCA · DEMO' : (race?.players.find(p => p.sessionId !== sessionId)?.carId ?? 'RIVAL').toUpperCase()) : 'AGUARDANDO PILOTO'}</Text>
                      </View>
                      <Text style={[styles.pilotReady, styles.pilotNotReady]}>
                        {roomPlayers >= 2 ? (isPreview ? 'DEMO' : race?.players.find(p => p.sessionId !== sessionId)?.ready ? '✓ READY' : 'NA SALA') : '○ LIVRE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.phaseRow}>
                    <Text style={styles.phaseLabel} numberOfLines={1}>
                      {isPreview ? '⏳ AGUARDANDO RIVAL' : phaseText[currentPhase]}
                    </Text>
                    {currentPhase === 'countdown' && !isPreview && <Text style={styles.countdown}>{race?.countdown ?? 3}</Text>}
                    {currentPhase === 'finished' && !isPreview && (
                      <Text style={styles.finishResult}>
                        {race?.winnerSessionId === sessionId ? '🏆 VITÓRIA' : race?.winnerSessionId ? 'DERROTA' : 'EMPATE'}
                      </Text>
                    )}
                    <View style={styles.filler} />
                    {!isPreview && currentPhase === 'waiting' && myPlayer?.ready && <Text style={styles.readyMini}>✓ PRONTO</Text>}
                  </View>

                  <View style={styles.filler} />
                  <View style={styles.actionsRow}>
                    {isPreview ? (
                      <>
                        <Pressable style={[styles.mainAction, styles.flexGrow]} onPress={() => setPreviewOpponent(value => !value)}>
                          <Text style={styles.mainActionText}>{previewOpponent ? '− OCULTAR RIVAL' : '＋ SIMULAR RIVAL'}</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryAction} onPress={() => setPreviewLobby(false)}>
                          <Text style={styles.secondaryActionText}>SAIR DA PRÉVIA</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        {canReady && (
                          <Pressable style={[styles.mainAction, styles.flexGrow]} onPress={() => sendRaceCommand('ready', true)}>
                            <Text style={styles.mainActionText}>{currentPhase === 'finished' ? '↻ REVANCHE' : '✓ ESTOU PRONTO!'}</Text>
                          </Pressable>
                        )}
                        {!isReconnecting && (
                          <Pressable style={[styles.mapAction, !canReady && styles.flexGrow]} onPress={enterOnlineMap}>
                            <Text style={styles.mapActionText}>🏎️ ABRIR PISTA →</Text>
                          </Pressable>
                        )}
                        <Pressable style={styles.roomLeave} onPress={() => void leave()}>
                          <Text style={styles.roomLeaveText}>SAIR</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.leftBottomBar}>
                <Text style={styles.bottomStatus} numberOfLines={1} ellipsizeMode="tail">
                  {isPreview ? 'Prévia local: nenhum jogador conectado à AWS.' : detail}
                </Text>
                {!!connectedRoomId && !isPreview && (
                  <Pressable style={styles.toolsLink} onPress={() => setShowDiagnostics(true)}>
                    <Text style={styles.toolsLinkText}>⚙ TELEMETRIA</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={[styles.garagePanel, compact && styles.compactSidePanel]}>
                <View style={styles.sideTitleRow}>
                  <Text style={styles.sectionKicker}>SEU VEÍCULO</Text>
                  <Text style={styles.sideCheck}>{hasGarageCar ? '✓ GARAGEM' : 'SEM SELEÇÃO'}</Text>
                </View>
                <View style={styles.carIdentity}>
                  <View style={[styles.carIconArea, compact && styles.compactCarIconArea]}><Text style={styles.carIcon}>🏎️</Text></View>
                  <View style={styles.carIdentityText}>
                    <Text style={styles.carName} numberOfLines={1} adjustsFontSizeToFit>
                      {hasGarageCar ? carId.toUpperCase() : 'SELECIONE UM CARRO'}
                    </Text>
                    <Text style={styles.carSub} numberOfLines={1}>CAR SELECTION · VEÍCULO ATIVO</Text>
                  </View>
                </View>
                <View style={styles.carSpecs}>
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>VELOCIDADE</Text>
                    <Text style={styles.specNumber}>{localStats.topSpeedKmh.toFixed(0)} <Text style={styles.specUnit}>km/h</Text></Text>
                  </View>
                  <View style={styles.specDivider} />
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>MOTOR</Text>
                    <Text style={styles.specNumber}>NV. {localMotor?.speedLevel ?? 1}</Text>
                  </View>
                </View>
                <Text style={styles.sideCaveat} numberOfLines={compact ? 1 : 2}>Dados da garagem. A física da corrida online ainda usa os atributos definidos pela AWS.</Text>
              </View>

              <View style={[styles.deckPanel, compact && styles.compactSidePanel]}>
                <View style={styles.sideTitleRow}>
                  <Text style={styles.sectionKicker}>SEU DECK</Text>
                  <Text style={styles.deckCount}>{deckReady ? '4/4 VINCULADAS' : `${equippedDeck?.length ?? 0}/4 VINCULADAS`}</Text>
                </View>
                <View style={styles.deckGrid}>
                  {[0, 1, 2, 3].map(slot => {
                    const cardId = equippedDeck?.[slot];
                    const card = cardId ? getCardDefinition(cardId) : undefined;
                    return (
                      <View key={slot} style={styles.deckSlot}>
                        {card ? <Image source={card.image} resizeMode="contain" style={{width: 21, height: 21}} /> :
                          <Text style={styles.deckSlotIcon}>◇</Text>}
                        <Text style={styles.deckSlotLabel} numberOfLines={1}>{card?.name ?? `SLOT 0${slot + 1}`}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.deckNote} numberOfLines={compact ? 1 : 2}>Deck salvo em DECK SELECTION. A AWS valida custos e recargas; posse Firestore será verificada antes da produção.</Text>
              </View>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>WF SOFT  /  WILD RUNNERS</Text>
            <Text style={styles.footerInfo}>LOBBY PRIVADO • 2 JOGADORES • PRÉ-ALPHA 12</Text>
          </View>
        </View>
      )}

      {/* Ferramentas fora da área principal, em janela sobreposta. */}
      <Modal visible={showDiagnostics && !portrait} animationType="fade" transparent
        onRequestClose={() => setShowDiagnostics(false)} supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}>
        <View style={styles.modalShade}>
          <View style={[styles.modalPanel, { maxWidth: Math.min(viewportWidth - 28, 980), maxHeight: viewportHeight - 24 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.sectionKicker}>SALA ONLINE / AWS</Text>
                <Text style={styles.modalTitle}>FERRAMENTAS DE LABORATÓRIO</Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setShowDiagnostics(false)}>
                <Text style={styles.modalCloseText}>✕ FECHAR</Text>
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.modalTelemetry}>
                <Text style={styles.modalSectionTitle}>POSIÇÕES OFICIAIS · {(race?.raceTime ?? 0).toFixed(1)}s</Text>
                {(race?.players ?? []).map(player => {
                  const visualX = visualPositions[player.sessionId] ?? player.x;
                  const progress = Math.max(0, Math.min(100, 100 * Math.max(0, visualX - player.startX) / Math.max(1, race?.finishDistance ?? 6000)));
                  return (
                    <View key={player.sessionId} style={styles.telemetryCard}>
                      <Text style={styles.telemetryName}>{player.sessionId === sessionId ? 'VOCÊ' : 'RIVAL'} · {player.carId.toUpperCase()} · {player.rank}º</Text>
                      <View style={styles.telemetryTrack}><View style={[styles.telemetryFill, { width: `${progress}%` as `${number}%` }]} /></View>
                      <Text style={styles.telemetryData}>{progress.toFixed(0)}% · {player.speed.toFixed(0)} u/s · {player.connected ? 'CONECTADO' : 'RECONEXÃO'}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.modalControlArea}>
                <Text style={styles.modalSectionTitle}>COMANDOS DE TESTE · 30 HZ</Text>
                <View style={styles.modalActions}>
                  <Pressable disabled={!canControl} style={[styles.modalAction, autoDrive && styles.autoEnabled, !canControl && styles.disabled]} onPress={toggleAuto}>
                    <Text style={styles.modalActionText}>AUTO {autoDrive ? 'ON' : 'OFF'}</Text>
                  </Pressable>
                  <Pressable disabled={!canNitro} style={[styles.modalAction, !canNitro && styles.disabled]} onPress={() => sendRaceCommand('nitro-activate', {})}>
                    <Text style={styles.modalActionText}>⚡ NITRO</Text>
                  </Pressable>
                </View>
                <View style={styles.modalActions}>
                  <Pressable disabled={!canControl} style={[styles.modalAction, styles.brakeAction, !canControl && styles.disabled]}
                    onPressIn={() => holdDrive('brake', true)} onPressOut={() => holdDrive('brake', false)}>
                    <Text style={styles.modalActionText}>FREAR</Text>
                  </Pressable>
                  <Pressable disabled={!canControl} style={[styles.modalAction, styles.accelAction, !canControl && styles.disabled]}
                    onPressIn={() => holdDrive('accel', true)} onPressOut={() => holdDrive('accel', false)}>
                    <Text style={styles.modalActionText}>ACELERAR</Text>
                  </Pressable>
                </View>
                <Text style={styles.modalInfo} numberOfLines={2}>A AWS continua responsável pela física, posição, nitro e resultado.</Text>
              </View>
            </View>
            <Text style={styles.modalFoot} numberOfLines={2}>SESSÃO: {sessionId || '—'}  ·  {detail}</Text>
          </View>
        </View>
      </Modal>
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
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 5, paddingBottom: 3, gap: 7 },
  shellCompact: { paddingHorizontal: 8, gap: 5 },
  topBar: { height: 43, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 3 },
  brandMark: { width: 35, height: 35, borderRadius: 10, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontSize: 15, color: '#131A28', fontWeight: '900', fontStyle: 'italic' },
  brandTextBlock: { justifyContent: 'center', gap: 1 },
  brandTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.6, color: COLORS.white },
  brandAccent: { color: COLORS.gold },
  brandSub: { color: '#92A2BC', fontSize: 8, fontWeight: '800', letterSpacing: 1.0 },
  topFill: { flex: 1 },
  connectionBadge: { maxWidth: 155, minWidth: 78, flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 8, gap: 6, borderRadius: 9, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#172238' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  greenDot: { backgroundColor: '#43DBA0' },
  goldDot: { backgroundColor: COLORS.gold },
  orangeDot: { backgroundColor: '#FFA961' },
  greyDot: { backgroundColor: '#758299' },
  connectionText: { flexShrink: 1, fontSize: 9, color: COLORS.white, fontWeight: '900' },
  pingBadge: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, backgroundColor: '#18253A' },
  pingBadgeHigh: { backgroundColor: '#51321E' },
  pingText: { color: '#D1DDEE', fontSize: 10, fontWeight: '900' },
  pingTextHigh: { color: '#FFC28C' },
  backTop: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#384760', borderRadius: 9 },
  backTopText: { fontSize: 10, fontWeight: '900', color: '#DCE6F6' },
  split: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 9 },
  leftColumn: { flex: 7, minWidth: 0, gap: 5 },
  rightColumn: { flex: 3, minWidth: 0, gap: 7 },
  mainPanel: { flex: 1, minHeight: 0, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 12, gap: 8 },
  sectionKicker: { color: COLORS.gold, fontWeight: '900', letterSpacing: 1.0, fontSize: 9 },
  panelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  headingText: { gap: 3, flex: 1 },
  mainTitle: { fontSize: 21, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  capacityChip: { backgroundColor: '#203448', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  capacityText: { color: '#B1EDCF', fontSize: 9, fontWeight: '900' },
  modeRow: { flexDirection: 'row', borderRadius: 10, backgroundColor: '#0A1221', padding: 4, gap: 5 },
  modeTab: { flex: 1, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  modeTabActive: { backgroundColor: '#344761' },
  modeLabel: { color: '#99A9C4', fontSize: 10, fontWeight: '900' },
  modeLabelActive: { color: COLORS.white },
  modeBody: { gap: 4, justifyContent: 'center' },
  modeBodyJoin: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeBodyTitle: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
  formLabel: { width: 102, color: COLORS.soft, fontWeight: '900', fontSize: 9 },
  codeInput: { flex: 1, minWidth: 0, height: 39, backgroundColor: '#0E1727', borderRadius: 9, color: COLORS.white, borderWidth: 1, borderColor: '#486082', paddingHorizontal: 12, fontWeight: '800', fontSize: 14 },
  desc: { color: COLORS.soft, fontSize: 11, lineHeight: 15 },
  filler: { flex: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'stretch', gap: 7 },
  flexGrow: { flex: 1 },
  mainAction: { minHeight: 39, paddingHorizontal: 9, paddingVertical: 9, backgroundColor: COLORS.gold, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mainActionText: { color: '#192131', fontWeight: '900', fontSize: 11, textAlign: 'center' },
  secondaryAction: { minHeight: 39, minWidth: 116, justifyContent: 'center', alignItems: 'center', backgroundColor: '#263751', borderRadius: 10, paddingHorizontal: 8 },
  secondaryActionText: { fontSize: 10, color: '#DCE9FF', fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.4 },
  leftBottomBar: { height: 23, paddingHorizontal: 3, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomStatus: { fontSize: 10, flex: 1, color: '#A7B8D0' },
  toolsLink: { paddingHorizontal: 7, paddingVertical: 3, borderColor: '#3C567A', borderWidth: 1, borderRadius: 6 },
  toolsLinkText: { color: '#B9D2FF', fontWeight: '900', fontSize: 9 },
  roomHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roomIdentity: { flex: 1, minWidth: 0, gap: 2 },
  inviteCode: { color: COLORS.white, fontWeight: '900', fontSize: 23, letterSpacing: 1.0 },
  roomTopActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomCount: { color: COLORS.gold, fontWeight: '900', fontSize: 16 },
  shareAction: { borderRadius: 9, backgroundColor: '#ECF4FF', paddingHorizontal: 10, minHeight: 32, justifyContent: 'center' },
  shareActionText: { color: '#172238', fontWeight: '900', fontSize: 10 },
  pilotsRow: { flexDirection: 'row', gap: 8 },
  pilotCompact: { flex: 1, minWidth: 0, minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderRadius: 10, borderColor: '#426A78', borderWidth: 1, backgroundColor: '#1C3340' },
  pilotMine: { borderColor: '#A68B39', backgroundColor: '#322E26' },
  pilotEmpty: { borderStyle: 'dashed', borderColor: '#48556C', backgroundColor: '#1C2534' },
  pilotNumber: { borderRadius: 7, backgroundColor: '#574C25', paddingHorizontal: 6, paddingVertical: 7 },
  pilotNumberRival: { backgroundColor: '#365270' },
  pilotNumberText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  pilotDetails: { minWidth: 0, flex: 1, gap: 3 },
  pilotName: { fontSize: 11, color: COLORS.white, fontWeight: '900' },
  pilotCar: { fontSize: 9, color: '#B8C6DD', fontWeight: '700' },
  pilotReady: { color: '#98EEC8', fontSize: 8, fontWeight: '900' },
  pilotNotReady: { color: '#D7B96D' },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 29, borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#0D1627' },
  phaseLabel: { color: '#C6D9F1', fontSize: 10, fontWeight: '900' },
  countdown: { color: COLORS.gold, fontWeight: '900', fontSize: 17 },
  finishResult: { color: COLORS.gold, fontWeight: '900', fontSize: 10 },
  readyMini: { color: '#81E8B2', fontSize: 10, fontWeight: '900' },
  mapAction: { minHeight: 39, backgroundColor: '#2C527D', borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  mapActionText: { color: '#EFF6FF', fontWeight: '900', fontSize: 11, textAlign: 'center' },
  roomLeave: { paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#472730', borderRadius: 10 },
  roomLeaveText: { color: '#FFBAC2', fontSize: 10, fontWeight: '900' },
  compactMainPanel: { padding: 9, gap: 6 },
  compactSidePanel: { padding: 7, gap: 4 },
  compactCarIconArea: { width: 31, height: 31 },
  garagePanel: { flex: 1, minHeight: 0, backgroundColor: '#1B2A40', borderWidth: 1, borderColor: '#3C5272', padding: 10, borderRadius: 15, gap: 8 },
  sideTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  sideCheck: { color: '#A3E5BC', fontSize: 8, fontWeight: '900' },
  carIdentity: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  carIconArea: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#2D3C52', alignItems: 'center', justifyContent: 'center' },
  carIcon: { fontSize: 25 },
  carIdentityText: { minWidth: 0, flex: 1, gap: 3 },
  carName: { color: COLORS.white, fontWeight: '900', fontSize: 15 },
  carSub: { fontSize: 8, color: '#9EB0CC', fontWeight: '800' },
  carSpecs: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111C2C', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 },
  specCol: { flex: 1, alignItems: 'center', gap: 2 },
  specLabel: { color: '#9EB0CC', fontSize: 8, fontWeight: '900' },
  specNumber: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
  specUnit: { fontSize: 9, fontWeight: '800' },
  specDivider: { height: 22, width: 1, backgroundColor: '#394A60' },
  sideCaveat: { color: '#95A6BD', fontSize: 9, lineHeight: 12 },
  deckPanel: { flex: 1, minHeight: 0, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, padding: 10, gap: 7 },
  deckCount: { color: '#9CABC2', fontSize: 8, fontWeight: '900' },
  deckGrid: { flex: 1, minHeight: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignContent: 'center' },
  deckSlot: { width: '48%', minHeight: 34, flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: '#53627B', borderRadius: 9, backgroundColor: '#1B2A40' },
  deckSlotIcon: { color: '#8694AA', fontWeight: '900', fontSize: 14 },
  deckSlotLabel: { color: '#ACBAD0', fontSize: 9, fontWeight: '900' },
  deckNote: { color: '#97A8C0', fontSize: 9, lineHeight: 12 },
  footer: { height: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  footerBrand: { color: '#647892', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  footerInfo: { color: '#647892', fontSize: 8, fontWeight: '800' },
  rotateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 13 },
  rotateIcon: { fontSize: 52, color: COLORS.gold },
  rotateTitle: { color: COLORS.white, fontWeight: '900', fontSize: 23 },
  rotateText: { color: COLORS.soft, textAlign: 'center', fontSize: 14 },
  rotateBack: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, backgroundColor: '#2E405E' },
  rotateBackText: { color: COLORS.white, fontWeight: '900' },
  modalShade: { flex: 1, backgroundColor: 'rgba(2,7,16,0.92)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  modalPanel: { width: '98%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#506585', padding: 13, borderRadius: 17, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: COLORS.white, fontWeight: '900', fontSize: 17, marginTop: 4 },
  modalClose: { backgroundColor: '#33445C', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  modalCloseText: { color: COLORS.white, fontWeight: '900', fontSize: 10 },
  modalContent: { flexDirection: 'row', gap: 12 },
  modalTelemetry: { flex: 1.3, gap: 6 },
  modalControlArea: { flex: 1, gap: 9 },
  modalSectionTitle: { color: COLORS.gold, fontWeight: '900', fontSize: 10 },
  telemetryCard: { borderWidth: 1, borderColor: '#394B65', borderRadius: 10, backgroundColor: '#1B2A41', padding: 8, gap: 4 },
  telemetryName: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  telemetryData: { color: '#A9BDDA', fontSize: 9 },
  telemetryTrack: { height: 6, borderRadius: 4, backgroundColor: '#40516A', overflow: 'hidden' },
  telemetryFill: { height: 6, borderRadius: 4, backgroundColor: COLORS.gold },
  modalActions: { flexDirection: 'row', gap: 7 },
  modalAction: { flex: 1, minHeight: 37, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#2B527D' },
  modalActionText: { color: COLORS.white, fontSize: 11, fontWeight: '900' },
  autoEnabled: { backgroundColor: '#296E4B' },
  brakeAction: { backgroundColor: '#8A3B44' },
  accelAction: { backgroundColor: '#278157' },
  modalInfo: { color: '#9CADC6', fontSize: 10, lineHeight: 14 },
  modalFoot: { color: '#A0B3CC', fontSize: 9 },
});
