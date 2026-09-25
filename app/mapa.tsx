// PARA TESTES REMOVA SEMPRE O "USE EFFECT DE PREPARAÇÃO DO INICIO"
import Carro from '@/components/Carro';
import CenarioBackground, { CenarioId, SkyTheme, } from '@/components/Cenarios/CenarioBackground';
import BubbleLiftVisual from '@/components/Decks/BubbleLiftVisual';
import ChainsEffect from '@/components/Decks/ChainsEffect';
import DefenseCardVisual, { DefenseVisualEvent, DefenseVisualKind } from '@/components/Decks/DefenseCardVisual';
import EmpPulseVisual from '@/components/Decks/EmpPulseVisual';
import GuidedBulletEffect from '@/components/Decks/GuidedBulletEffect';
import OilSpitVisual from '@/components/Decks/OilSpitVisual';
import SlowSlowVisual from '@/components/Decks/SlowSlowVisual';
import SwapEffect from '@/components/Decks/SwapEffect';
import TornadoEffect from '@/components/Decks/TornadoEffect';
import CorrenteVisual from '@/components/ui/CorrenteVisual';
import ExplosionVisual from '@/components/ui/ExplosionVisual';
import GuidedBulletVisual from '@/components/ui/GuidedBulletVisual';
import RaceFinishTransition from '@/components/ui/RaceFinishTransition';
import RaceObjectivesHUD from '@/components/ui/RaceObjectivesHUD';
import RaceTutorialOverlay, { type TutorialStep } from '@/components/ui/RaceTutorialOverlay';
import TornadoVisual from '@/components/ui/TornadoVisual';
import { AudioContext } from '@/context/AudioContext';
import { useCarSelection } from '@/context/CarContext';
import { raceRewardsService } from '@/src/services/raceRewardsService';
import { useLoadingStore } from '@/src/store/LoadingStore';
import { usePlayerStore } from '@/src/store/playerStore';
import { useTutorialStore } from '@/src/store/tutorialStore';
import { ALL_CARDS, CARD_CATEGORIES, CARD_MAP, getCardDefinition, type CardId } from '@/src/utils/cardMap';
import { carMaps } from '@/src/utils/carMaps';
import {
  evaluateRaceObjectivesLive,
  selectRaceObjectives,
  type RaceObjectiveId,
  type RaceObjectiveResult,
  type RacePerformanceStats,
} from '@/src/utils/progression';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

type CarKey = keyof typeof carMaps;

type PartType = 'motor' | 'spray' | 'engrenagem' | 'chips';

// Os CHIPs de drop são moeda de compra; NÃO são o boost das cartas.
const CHIP_DROP_CHANCE = 0.18;
const MAX_DROPPED_ITEMS = 110;
const MAGNET_DURATION_FRAMES = 60 * 5;
const MAGNET_RADIUS = 210;
const MAGNET_RADIUS_SQ = MAGNET_RADIUS * MAGNET_RADIUS;
const MAGNET_PICKUP_RADIUS_SQ = 42 * 42;

type DroppedPiece = {
  id: string;
  x: number;
  y: number;
  type: PartType;
  velY: number;
};

interface MapaProps {
  initialDeck?: string[];
};

const MAP_MUSIC = require(
  '@/assets/audio/maps/level_one.mp3'
);

// O cenário não precisa renderizar novamente a cada snapshot da física.
// Ele só atualiza quando isMoving ou mapImage realmente mudam.
const MemoCenarioBackground = React.memo(CenarioBackground);



/* ================= CONFIGURAÇÕES DA FÍSICA E VELOCIDADE ================= */
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const PLAYER_SIZE = 50;

// HUD inferior / pista: mantemos a linha da pista acima do painel para os carros
// nunca ficarem escondidos atrás dos controles.
const BOTTOM_HUD_HEIGHT = 118;
const BOTTOM_HUD_BOTTOM = 0;
const TRACK_TO_HUD_GAP = 5;

// ================= VELOCIDADE / PILOTAGEM =================
// O carMaps guarda os valores que o jogador entende como km/h.
// A física do Mapa trabalha numa escala menor para não deslocar centenas de pixels por tick.
const KMH_PER_PHYSICS_UNIT = 18;
const MAX_MOTOR_LEVEL = 10;
const INITIAL_SPEED_RATIO = 0.55; // velocidade ao iniciar a corrida
const BRAKE_MIN_SPEED_RATIO = 0.35; // piso do freio, proporcional ao carro
const NITRO_SPEED_MULTIPLIER = 1.30;
const NITRO_CARD_SPEED_MULTIPLIER = 1.25;
const SLOW_SPEED_MULTIPLIER = 0.40;
// OIL SPIT: trap temporário, sem tirar vidas. 60 Hz, sem animação JS adicional.
const OIL_PUDDLE_FRAMES = 60 * 5;
const OIL_ARM_FRAMES = 12;
const OIL_SLIP_FRAMES = 60 * 2;
const OIL_SPEED_MULTIPLIER = 0.60;
const OIL_MAX_PUDDLES = 8;
// EMP PULSE: bloqueio eletrônico individual, sem dano ou alteração de posição.
const EMP_DURATION_FRAMES = 60 * 2;


// Distância visual do cenário por unidade de velocidade física/tick.
// Um único Animated.Value alimenta as três camadas do parallax.
const SCENARIO_TRAVEL_SCALE = 0.35;

// Constantes legadas mantidas apenas para efeitos/compatibilidade ainda existentes.
const MAX_SPEED = 12
const MIN_SPEED = 3;
const IMPULSE_FORCE = 1.5;
const ACCELERATION = 0.3;
const FRICTION = 0.15;

// Controle analógico horizontal. O centro mantém a velocidade atual;
// direita acelera e esquerda freia de forma proporcional ao deslocamento.
const ANALOG_DEAD_ZONE = 0.08;
const ANALOG_KNOB_SIZE = 34;
const NITRO_DURATION = 60 * 3;

/* ================= CORES DISPONÍVEIS ================= */
const AVAILABLE_BOT_COLORS = [
  '#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#FF9500', '#AF52DE', '#1C1C1E', '#F2F2F7',
];

type BotDifficulty = 'easy' | 'balanced' | 'rival';

// Balanceamento da IA: 2 bots mais acessíveis, 2 equilibrados e 1 rival forte.
const BOT_DIFFICULTIES: BotDifficulty[] = ['easy', 'easy', 'balanced', 'balanced', 'rival'];
const BOT_CATCHUP_DISTANCE = 180;
const BOT_CATCHUP_MULTIPLIER = 1.02;
const BOT_PLAYER_TARGET_CHANCE = 0.35;
const BOT_LEADER_TARGET_CHANCE = 0.72;
const BOT_CLOSE_LEADER_DISTANCE = 420;
const BOT_TNT_REAR_RANGE = 360;
const BOT_DEFENSE_REACTION_CHANCE = 0.75;
const NITRO_POWER_MULTIPLIER = 1.25;

export default function Mapa({ initialDeck = ['swap', 'bullet', 'chains', 'tnt'] }: MapaProps) {

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const GROUND_Y = SCREEN_HEIGHT - (BOTTOM_HUD_HEIGHT + BOTTOM_HUD_BOTTOM + TRACK_TO_HUD_GAP);
  const router = useRouter();

  const showLoading = useLoadingStore((state) => state.showLoading);
  const hideLoading = useLoadingStore((state) => state.hideLoading);
  useFocusEffect(
    useCallback(() => {
      showLoading();
    }, [showLoading])
  );

  useFocusEffect(
    useCallback(() => {
      const subscription =
        BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            /*
             * Uma corrida em andamento NÃO
             * pode ser abandonada acidentalmente.
             */
            return true;
          }
        );

      return () => {
        subscription.remove();
      };
    }, [])
  );


  const params = useLocalSearchParams<{
    deck?: string;
    mapId?: string;
    skyTheme?: string;
    mode?: string;
  }>();

  const isTutorial = params.mode === 'tutorial';
  const selectedMapId = (params.mapId as CenarioId) || 'sao_paulo';
  const selectedSkyTheme = (params.skyTheme as SkyTheme) || 'day';

  const markTutorialCompleted = useTutorialStore(
    state => state.markCompleted,
  );

  const [tutorialStep, setTutorialStep] =
    useState<TutorialStep>('perfect_start');

  const [tutorialVisible, setTutorialVisible] =
    useState(isTutorial);

  // Durante uma dica, a engine continua montada, mas a simulação fica congelada.
  // O ref permite ao game loop enxergar a pausa imediatamente sem depender de render.
  const [tutorialPaused, setTutorialPaused] =
    useState(isTutorial);
  const tutorialPausedRef = useRef(isTutorial);

  const setTutorialPause = useCallback((paused: boolean) => {
    tutorialPausedRef.current = paused;
    setTutorialPaused(paused);
  }, []);

  const [tutorialPerfectStartHits, setTutorialPerfectStartHits] =
    useState(0);

  // O PanResponder é criado uma única vez. Por isso o tutorial usa refs
  // para que o analógico sempre enxergue a etapa atual, sem closure velha.
  const tutorialModeRef = useRef(isTutorial);
  const tutorialStepRef = useRef<TutorialStep>('perfect_start');
  const tutorialDoneRef = useRef(false);

  const moveTutorialTo = useCallback((
    expectedStep: TutorialStep,
    nextStep: TutorialStep,
  ) => {
    if (!tutorialModeRef.current) return;
    if (tutorialDoneRef.current) return;
    if (tutorialStepRef.current !== expectedStep) return;

    tutorialStepRef.current = nextStep;
    setTutorialStep(nextStep);

    // Cada nova explicação congela a corrida até o jogador tocar CONTINUAR.
    setTutorialVisible(true);
    setTutorialPause(true);
  }, [setTutorialPause]);

  const finishTutorial = useCallback(() => {
    if (!tutorialModeRef.current) return;
    if (tutorialDoneRef.current) return;

    tutorialDoneRef.current = true;
    tutorialModeRef.current = false;
    setTutorialVisible(false);
    setTutorialPause(false);
    markTutorialCompleted();
  }, [markTutorialCompleted, setTutorialPause]);

  const {
    selectedCar,
    selectedColorFront,
    selectedColorBack,
    selectedFinishId,
    selectedEquipment,
  } = useCarSelection();

  const fallbackDeck = ['swap', 'bullet', 'chains', 'tnt'];
  const finalDeck = params.deck ? JSON.parse(params.deck as string) : fallbackDeck;

  const profile = usePlayerStore((state) => state.profile);

  const carKey = (selectedCar || 'buggy') as string;

  const carStats = profile?.garage?.[carKey as any] || {
    motor: { speedLevel: 1, accelerationLevel: 1, jumpPowerLevel: 1 },
    engrenagem: { defenseLevel: 1 },
  };

  // O MODELO do carro define a faixa de desempenho; o upgrade define onde o player
  // está dentro dessa faixa. Assim, um supercarro continua superior mesmo no neutro/freio.
  const selectedCarDefinition = carMaps[carKey as CarKey] ?? carMaps.buggy;

  const clampUpgradeLevel = (level: number | undefined) =>
    Math.max(1, Math.min(MAX_MOTOR_LEVEL, Number(level) || 1));

  const speedLevel = clampUpgradeLevel(carStats.motor.speedLevel);
  const accelerationLevel = clampUpgradeLevel(carStats.motor.accelerationLevel);

  const speedUpgradeProgress = (speedLevel - 1) / (MAX_MOTOR_LEVEL - 1);
  const accelerationUpgradeProgress = (accelerationLevel - 1) / (MAX_MOTOR_LEVEL - 1);

  // Valor oficial mostrado no velocímetro quando o carro chega ao seu teto normal.
  const DYNAMIC_TOP_SPEED_KMH =
    selectedCarDefinition.stats.speed.base +
    (selectedCarDefinition.stats.speed.maxUpgrade - selectedCarDefinition.stats.speed.base) * speedUpgradeProgress;

  // Aceleração também respeita modelo + upgrade. Esse valor é um stat de balanceamento;
  // convertemos abaixo para incremento da escala física por tick.
  const DYNAMIC_ACCELERATION_STAT =
    selectedCarDefinition.stats.acceleration.base +
    (selectedCarDefinition.stats.acceleration.maxUpgrade - selectedCarDefinition.stats.acceleration.base) * accelerationUpgradeProgress;

  const DYNAMIC_MAX_SPEED = DYNAMIC_TOP_SPEED_KMH / KMH_PER_PHYSICS_UNIT;
  const DYNAMIC_INITIAL_SPEED = DYNAMIC_MAX_SPEED * INITIAL_SPEED_RATIO;
  const DYNAMIC_MIN_SPEED = DYNAMIC_MAX_SPEED * BRAKE_MIN_SPEED_RATIO;
  const DYNAMIC_NITRO_SPEED = DYNAMIC_MAX_SPEED * NITRO_SPEED_MULTIPLIER;

  // Escala de resposta do acelerador. Carros com acceleration maior chegam ao teto antes.
  // Mantemos a faixa pequena porque stepGame roda ~60 vezes por segundo.
  const DYNAMIC_ACCELERATION_PER_TICK =
    0.02 + Math.min(1, DYNAMIC_ACCELERATION_STAT / 220) * 0.06;

  const DYNAMIC_JUMP_FORCE = JUMP_FORCE - ((carStats.motor.jumpPowerLevel - 1) * 0.6);
  // Nível 1 = 5 Vidas, Nível 2 = 6 Vidas...
  const INITIAL_LIVES = isTutorial
    ? 8
    : 4 + carStats.engrenagem.defenseLevel;

  const BASE_PLAYER_X = SCREEN_WIDTH * 0.4;
  const GAP_BETWEEN_RACERS = 130;
  const TOTAL_RACERS = 6;


  type CardEffect = CardId | 'score_boost';

  type OilPuddle = {
    id: number;
    callerId: string;
    x: number;
    remainingFrames: number;
    armFrames: number;
  };

  type TNTBox = {
    id: string;
    callerId: string;
    x: number;
    y: number;
    timer: number;
    state: 'counting' | 'exploding';
  };


  const BOT_NAMES = [
    'Relâmpago', 'Marquinhos', 'Trovão', 'Faísca', 'Brisa',
    'Ventania', 'Cometa', 'Nitro', 'Sombra', 'Turbina', 'Rex'
  ];


  const COOLDOWNS = { HEAVY: 60 * 15, LIGHT: 60 * 8, DEFENSE: 60 * 12 };

  const defaultStatus = {
    gravityMultiplier: 1,
    controlsInverted: false,
    isBlind: false,
    isPanicking: false,
    isGhost: false,
    scoreMultiplier: 1,
    isStunned: false,
    isSlowed: false,
    oilSlipTimer: 0,
    empTimer: 0,
    invincibleTimer: 0,
    isLevitating: false,
    bubbleLiftStartY: null as number | null,
    shieldCharges: 0,
    armorCharges: 0,
    secondChanceReady: false,
  };

  const playerStatus = useRef({ ...defaultStatus });
  const activeEffectsTimers = useRef<Partial<Record<CardEffect, number>>>({});

  const isCrouchingRef = useRef(false);
  const [isCrouching, setIsCrouching] = useState(false);

  const playerSpeed = useRef(DYNAMIC_INITIAL_SPEED);

  // Parallax dirigido pela velocidade real do player.
  // Ref acumula distância; Animated.Value entrega ao cenário sem re-render React.
  const scenarioTravelRef = useRef(0);
  const scenarioTravelAnim = useRef(new Animated.Value(0)).current;

  // -1 = freio máximo | 0 = neutro | +1 = aceleração máxima.
  // Fica em ref para o gesto não provocar re-render durante a corrida.
  const analogInputRef = useRef(0);
  const analogKnobX = useRef(new Animated.Value(0)).current;
  const analogTrackWidthRef = useRef(0);
  const analogDragStartXRef = useRef(0);

  const nitroCharge = useRef(0);
  const isNitroActive = useRef(false);
  const nitroTimer = useRef(0);

  const y = useRef(SCREEN_HEIGHT / 2);
  const playerXRef = useRef(BASE_PLAYER_X);
  const velocity = useRef(0);
  const isGrounded = useRef(false);
  const gameTime = useRef(0);

  const raceTimeRef = useRef(0);
  const timeRemainingRef = useRef(0);

  const isCountingRef = useRef(false);
  const {
    playBeep,
    playMusic,
    pauseMusic,
    playRaceTick,
    playFinal30Warning,
    playCardSfx
  } = useContext(AudioContext);

  const clampAnalogKnobX = (value: number) => {
    const maxTravel = Math.max(0, (analogTrackWidthRef.current - ANALOG_KNOB_SIZE) / 2);
    if (maxTravel <= 0) return 0;
    return Math.max(-maxTravel, Math.min(maxTravel, value));
  };

  const updateAnalogFromKnob = (knobX: number) => {
    const maxTravel = Math.max(0, (analogTrackWidthRef.current - ANALOG_KNOB_SIZE) / 2);
    analogInputRef.current = maxTravel > 0
      ? Math.max(-1, Math.min(1, knobX / maxTravel))
      : 0;
  };

  const releaseAnalogControl = () => {
    analogInputRef.current = 0;
    analogDragStartXRef.current = 0;
    Animated.spring(analogKnobX, {
      toValue: 0,
      stiffness: 260,
      damping: 22,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };

  const analogPanResponder = useRef(
    PanResponder.create({
      // O controle só é renderizado durante a corrida. Não usamos `started`/`gameOver`
      // aqui porque o PanResponder é criado uma única vez e prenderia os valores
      // iniciais desses states no closure (started=false).
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1,
      onPanResponderGrant: () => {
        analogKnobX.stopAnimation((currentX: number) => {
          analogDragStartXRef.current = currentX || 0;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (isNitroActive.current) return;
        const nextX = clampAnalogKnobX(
          analogDragStartXRef.current + gestureState.dx,
        );
        analogKnobX.setValue(nextX);
        updateAnalogFromKnob(nextX);

        if (
          tutorialModeRef.current &&
          tutorialStepRef.current === 'accelerate' &&
          analogInputRef.current >= 0.45
        ) {
          moveTutorialTo('accelerate', 'brake');
        }

        if (
          tutorialModeRef.current &&
          tutorialStepRef.current === 'brake' &&
          analogInputRef.current <= -0.35
        ) {
          moveTutorialTo('brake', 'card');
        }
      },
      onPanResponderRelease: releaseAnalogControl,
      onPanResponderTerminate: releaseAnalogControl,
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  const getRandomColor = () => AVAILABLE_BOT_COLORS[Math.floor(Math.random() * AVAILABLE_BOT_COLORS.length)];

  const botsRef = useRef(
    ['bot1', 'bot2', 'bot3', 'bot4', 'bot5'].map((id, index) => {
      const bStats = generateBotsStats(carStats, BOT_DIFFICULTIES[index] ?? 'balanced');
      const skins = ['default', 'gangster', 'ninja', 'pirate', 'surger'];

      return {
        id,
        name: getRandomName(),
        lives: bStats.maxLives,
        maxLives: bStats.maxLives,
        isDead: false,
        deck: generateRandomDeck(),
        angle: 0,
        x: 0,
        y: SCREEN_HEIGHT / 2,
        speed: 0,
        targetSpeed: bStats.maxSpeed,
        stats: bStats,
        difficulty: BOT_DIFFICULTIES[index] ?? 'balanced',
        skin: skins[index],
        isCrouching: false,
        velocity: 0,
        score: 0,
        thinkTimer: 0,
        status: { ...defaultStatus },
        activeEffectsTimers: {} as Partial<Record<CardEffect, number>>,
        carType: bStats.carType,
        carColorFront: getRandomColor(),
        carColorBack: getRandomColor(),
      }
    })
  )


  // ---- CRONOMETRO DA PARTIDA ---- //
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const final30WarningPlayedRef = useRef(false);

  // ---- NITRO ---- //
  const [nitroPercent, setNitroPercent] = useState(0);
  const [isNitroReady, setIsNitroReady] = useState(false);
  const isNitroReadyRef = useRef(false);
  const setNitroReady = (ready: boolean) => {
    if (isNitroReadyRef.current === ready) return;
    isNitroReadyRef.current = ready;
    setIsNitroReady(ready);
  };
  // ---- DADOS DO PLAYER  ---- //
  // Posição/ângulo visuais NÃO ficam mais em state.
  // A física escreve nos refs; Animated.Value move o carro sem re-render do React.
  const [playerLives, setPlayerLives] = useState(INITIAL_LIVES);
  const playerLivesRef = useRef(INITIAL_LIVES);
  const playerIsDead = useRef(false);

  // ---- DECK ---- //

  const [boost, setBoost] = useState<number>(5);
  const MAX_BOOST = 10;
  const [playerDeck, setPlayerDeck] = useState<string[]>(finalDeck);

  // Snapshot React leve para HUD, minimapa e efeitos que ainda usam JSX.
  // Movimento dos carros não depende deste tick.
  const [, setRaceSnapshotTick] = useState(0);


  // COMEÇO DE CORRIDA
  const [started, setStarted] = useState(false);

  // FIM DE CORRIDA
  const [gameOver, setGameOver] = useState(false);
  const [showFinishTransition, setShowFinishTransition] = useState(false);

  const [countdownStep, setCountdownStep] = useState<number | string | null>(null);

  // ---- MINI-GAME DE LARGADA ---- //
  const [miniGameVisible, setMiniGameVisible] = useState(false);
  const [miniGamePos, setMiniGamePos] = useState({ top: 0, left: 0 });
  const miniGameClicksRef = useRef(0);

  // A música acompanha a pausa didática. playMusic sem restart retoma do ponto
  // em que foi pausada, então a dica realmente congela a sensação da corrida.
  useEffect(() => {
    if (!isTutorial || !started || gameOver) return;

    if (tutorialPaused) {
      pauseMusic();
      return;
    }

    playMusic(MAP_MUSIC, {
      volume: 0.5,
      loop: true,
      restart: false,
    });
  }, [
    gameOver,
    isTutorial,
    pauseMusic,
    playMusic,
    started,
    tutorialPaused,
  ]);

  const cameraTransformRef = useRef({ x: 0, scale: 1 });
  const angleRenderRef = useRef(0);

  // ================= VISUAL 60 FPS SEM RE-RENDER =================
  // O game loop continua no JS, mas posição/câmera vão direto para nós Animated.
  const cameraXAnim = useRef(new Animated.Value(0)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;

  const playerXAnim = useRef(new Animated.Value(BASE_PLAYER_X)).current;
  const playerYAnim = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current;
  const playerAngleAnim = useRef(new Animated.Value(0)).current;
  const playerSkidXAnim = useRef(new Animated.Value(0)).current;
  const lastPlayerSkidXRef = useRef(0);

  type RacerVisual = {
    x: Animated.Value;
    y: Animated.Value;
    angle: Animated.Value;
    skidX: Animated.Value;
    lastSkidX: number;
    lastX: number;
    lastY: number;
    lastAngle: number;
  };

  const botVisualsRef = useRef<Record<string, RacerVisual>>({});

  if (Object.keys(botVisualsRef.current).length === 0) {
    botsRef.current.forEach(bot => {
      botVisualsRef.current[bot.id] = {
        x: new Animated.Value(bot.x),
        y: new Animated.Value(bot.y),
        angle: new Animated.Value(bot.angle || 0),
        skidX: new Animated.Value(0),
        lastSkidX: 0,
        lastX: bot.x,
        lastY: bot.y,
        lastAngle: bot.angle || 0,
      };
    });
  }

  // Cache visual: evita atravessar a ponte JS/native com valores idênticos a cada tick.
  const lastCameraVisualRef = useRef({ x: Number.NaN, scale: Number.NaN });
  const lastPlayerVisualRef = useRef({ x: Number.NaN, y: Number.NaN, angle: Number.NaN });

  // Evita setState de arrays vazios a 30 FPS.
  // Quando um efeito existe, ele continua recebendo snapshots a 30 FPS.
  const lastDynamicRenderCountRef = useRef({
    pieces: 0,
    bullets: 0,
    tnts: 0,
    bubbles: 0,
    oil: 0,
  });
  const [focusedDriver, setFocusedDriver] = useState<number | string | null>(null);

  const [leaderboard, setLeaderboard] = useState<{ id: string, name: string }[]>([]);
  const lastOrderRef = useRef('');

  // Roster fixo da corrida para o HUD continuar mostrando quem foi eliminado.
  const [raceRoster, setRaceRoster] = useState<Array<{
    id: string;
    name: string;
    color: string;
    isPlayer: boolean;
  }>>([]);

  const [isBlindActive, setIsBlindActive] = useState(false);

  const [isCameraLocked, setIsCameraLocked] = useState(false);

  // ---- DECKS ---- //
  // SWAP
  const SWAP_COOLDOWN = CARD_MAP.swap.cooldownMs;
  const [activeSwap, setActiveSwap] = useState<{ callerId: string; targetId?: string; } | null>(null);
  // Ref usada pelo game loop para não depender de closures antigas do React.
  const activeSwapRef = useRef<{ callerId: string; targetId?: string; } | null>(null);
  const [currentSwapTarget, setCurrentSwapTarget] = useState<string | null>(null);
  const [swapCooldown, setSwapCooldown] = useState(0);
  const swapScaleAnim = useRef(new Animated.Value(1)).current;

  // CHAINS
  const CHAINS_COOLDOWN = CARD_MAP.chains.cooldownMs;
  const [activeChains, setActiveChains] = useState<{ callerId: string } | null>(null);
  const [activeChainsState, setActiveChainsState] = useState<{ callerId: string; targetId: string; duration: number; } | null>(null);
  const activeChainsStateRef = useRef<{ callerId: string; targetId: string; duration: number; } | null>(null);
  const [chainsCooldown, setChainsCooldown] = useState(0);

  // GUIDED BULLET
  const BULLET_COOLDOWN = CARD_MAP.bullet.cooldownMs;
  const activeBulletsRef = useRef<{ id: string; callerId: string; targetId: string; x: number; y: number; angle: number }[]>([]);
  const [activeBulletEffect, setActiveBulletEffect] = useState<{ callerId: string } | null>(null);
  const [bulletCooldown, setBulletCooldown] = useState(0);
  const [bulletsToRender, setBulletsToRender] = useState(activeBulletsRef.current);

  // OIL SPIT: estado mutável na engine; snapshots somente quando há poças.
  const OIL_SPIT_COOLDOWN = CARD_MAP.oil_spit.cooldownMs;
  const activeOilRef = useRef<OilPuddle[]>([]);
  const oilSequenceRef = useRef(0);
  const [oilSpitCooldown, setOilSpitCooldown] = useState(0);

  // MAGNET: duração por corredor, sem novos setState no loop de física.
  const MAGNET_COOLDOWN = CARD_MAP.magnet.cooldownMs;
  const [magnetCooldown, setMagnetCooldown] = useState(0);

  // EMP PULSE: timer da interferência vive no status de cada corredor.
  const EMP_PULSE_COOLDOWN = CARD_MAP.emp_pulse.cooldownMs;
  const [empPulseCooldown, setEmpPulseCooldown] = useState(0);
  const [oilsToRender, setOilsToRender] = useState<OilPuddle[]>([]);

  // TNT BOX
  const TNT_COOLDOWN = CARD_MAP.tnt.cooldownMs;
  const activeTNTRef = useRef<TNTBox[]>([]);
  const [tntCooldown, setTntCooldown] = useState(0);
  const [tntsToRender, setTntsToRender] = useState<TNTBox[]>([]);

  // TORNADO
  const TORNADO_COOLDOWN = CARD_MAP.tornado.cooldownMs;
  const [tornadoCooldown, setTornadoCooldown] = useState(0);
  const [activeTornado, setActiveTornado] = useState<{ callerId: string } | null>(null);
  const [tornadosToRender, setTornadosToRender] = useState<{
    id: string;
    callerId: string;
    callerX: number;
    callerY: number;
    victims: { id: string; x: number; y: number }[];
  }[]>([]);

  // SLOW SLOW
  const SLOW_COOLDOWN = CARD_MAP.slow_slow.cooldownMs;
  const [slowCooldown, setSlowCooldown] = useState(0);
  const [isSlowActive, setIsSlowActive] = useState(false);

  // NITRO POWER
  const NITRO_COOLDOWN = CARD_MAP.nitro_power.cooldownMs;
  const [nitroCooldown, setNitroCooldown] = useState(0);
  const [isNitroPowerActive, setIsNitroPowerActive] = useState(false);

  // BUBBLE LIFT
  const BUBBLE_COOLDOWN = CARD_MAP.bubble_lift.cooldownMs;
  const BUBBLE_DURATION = 60 * 3;
  const BUBBLE_RISE_DURATION = 30;
  const BUBBLE_LIFT_HEIGHT = 120;
  const BUBBLE_SPEED = 18;
  const activeBubblesRef = useRef<{
    id: string;
    callerId: string;
    targetId: string;
    x: number;
    y: number;
    angle: number;
    life: number;
  }[]>([]);
  const [bubbleCooldown, setBubbleCooldown] = useState(0);
  const [bubblesToRender, setBubblesToRender] = useState(activeBubblesRef.current);

  // PROTEÇÃO E SOBREVIVÊNCIA
  const SHIELD_COOLDOWN = CARD_MAP.shield.cooldownMs;
  const QUICK_REPAIR_COOLDOWN = CARD_MAP.quick_repair.cooldownMs;
  const GHOST_COOLDOWN = CARD_MAP.ghost.cooldownMs;
  const SECOND_CHANCE_COOLDOWN = CARD_MAP.second_chance.cooldownMs;
  const ARMOR_COOLDOWN = CARD_MAP.armor.cooldownMs;
  const [shieldCooldown, setShieldCooldown] = useState(0);
  const [quickRepairCooldown, setQuickRepairCooldown] = useState(0);
  const [ghostCooldown, setGhostCooldown] = useState(0);
  const [secondChanceCooldown, setSecondChanceCooldown] = useState(0);
  const [armorCooldown, setArmorCooldown] = useState(0);

  // Snapshot leve do estado defensivo usado somente pelo HUD.
  // Atualiza apenas quando uma proteção realmente muda.
  const [playerProtectionHud, setPlayerProtectionHud] = useState({
    shieldCharges: 0,
    armorCharges: 0,
    secondChanceReady: false,
    isGhost: false,
  });

  const syncPlayerProtectionHud = useCallback(() => {
    const status = playerStatus.current;
    const next = {
      shieldCharges: status.shieldCharges,
      armorCharges: status.armorCharges,
      secondChanceReady: status.secondChanceReady,
      isGhost: status.isGhost,
    };

    setPlayerProtectionHud(prev =>
      prev.shieldCharges === next.shieldCharges &&
      prev.armorCharges === next.armorCharges &&
      prev.secondChanceReady === next.secondChanceReady &&
      prev.isGhost === next.isGhost
        ? prev
        : next
    );
  }, []);

  // EVENTOS VISUAIS DAS CARTAS DEFENSIVAS.
  // Um único evento por corredor é suficiente: o componente executa a animação
  // quando o ID muda, sem adicionar animações ao game loop.
  const defenseVisualIdRef = useRef(0);
  const [defenseVisualEvents, setDefenseVisualEvents] = useState<
    Record<string, DefenseVisualEvent | undefined>
  >({});



  const triggerDefenseVisual = (
    racerId: string,
    type: DefenseVisualKind,
    amount?: number
  ) => {
    defenseVisualIdRef.current += 1;

    setDefenseVisualEvents(prev => ({
      ...prev,
      [racerId]: {
        id: defenseVisualIdRef.current,
        type,
        amount,
      },
    }));
  };

  //PEÇAS
  const activePiecesRef = useRef<DroppedPiece[]>([]);
  const [piecesToRender, setPiecesToRender] = useState<DroppedPiece[]>([]);

  // Caixa da corrida; CHIPs serão creditados na carteira somente ao concluir a partida.
  const sessionPartsRef = useRef({ motor: 0, spray: 0, engrenagem: 0, chips: 0 });
  const [sessionPartsHud, setSessionPartsHud] = useState({
    motor: 0,
    spray: 0,
    engrenagem: 0,
    chips: 0,
  });

  // ID da partida
  const raceIdRef = useRef('');
  // Evita creditar a mesma partida mais de uma vez.
  const gameOverHandledRef = useRef(false);

  // Métricas objetivas usadas pelo XP e pelo catálogo dinâmico de missões.
  // Recursos coletados são cumulativos: perder loot ao tomar dano NÃO desfaz
  // progresso de uma missão de coleta.
  const racePerformanceRef = useRef({
    successfulAttacks: 0,
    successfulDefenses: 0,
    overtakes: 0,
    livesLost: 0,
    worstPosition: 1,
    bestPosition: TOTAL_RACERS,
    timeInTop3Seconds: 0,
    timeInFirstSeconds: 0,
    cardsUsed: 0,
    offensiveCardsUsed: 0,
    defensiveCardsUsed: 0,
    uniqueCardsUsed: [] as string[],
    uniqueOffensiveCardsUsed: [] as string[],
    opponentsEliminated: 0,
    collectedMotor: 0,
    collectedSpray: 0,
    collectedGears: 0,
    collectedTotal: 0,
  });

  // A posição é amostrada junto do leaderboard. Quando ela melhora,
  // contabilizamos quantas posições o player ganhou naquele intervalo.
  const lastSampledPlayerPositionRef = useRef<number | null>(null);
  const currentPlayerPositionRef = useRef(TOTAL_RACERS);

  // Os 3 IDs são sorteados UMA VEZ por corrida e ficam congelados até o resultado.
  const selectedObjectiveIdsRef = useRef<RaceObjectiveId[]>([]);
  const [raceObjectivesHud, setRaceObjectivesHud] = useState<RaceObjectiveResult[]>([]);

  const buildObjectivePerformanceSnapshot = (): RacePerformanceStats => ({
    perfectStart: miniGameClicksRef.current >= 3,
    successfulAttacks: racePerformanceRef.current.successfulAttacks,
    successfulDefenses: racePerformanceRef.current.successfulDefenses,
    overtakes: racePerformanceRef.current.overtakes,
    livesLost: racePerformanceRef.current.livesLost,
    worstPosition: racePerformanceRef.current.worstPosition,
    survived: !playerIsDead.current,
    bestPosition: racePerformanceRef.current.bestPosition,
    timeInTop3Seconds: racePerformanceRef.current.timeInTop3Seconds,
    timeInFirstSeconds: racePerformanceRef.current.timeInFirstSeconds,
    cardsUsed: racePerformanceRef.current.cardsUsed,
    offensiveCardsUsed: racePerformanceRef.current.offensiveCardsUsed,
    defensiveCardsUsed: racePerformanceRef.current.defensiveCardsUsed,
    uniqueCardsUsed: [...racePerformanceRef.current.uniqueCardsUsed],
    uniqueOffensiveCardsUsed: [...racePerformanceRef.current.uniqueOffensiveCardsUsed],
    opponentsEliminated: racePerformanceRef.current.opponentsEliminated,
    collectedMotor: racePerformanceRef.current.collectedMotor,
    collectedSpray: racePerformanceRef.current.collectedSpray,
    collectedGears: racePerformanceRef.current.collectedGears,
    collectedTotal: racePerformanceRef.current.collectedTotal,
    selectedObjectiveIds: [...selectedObjectiveIdsRef.current],
  });

  const syncRaceObjectivesHud = (position = currentPlayerPositionRef.current) => {
    currentPlayerPositionRef.current = position;

    const next = evaluateRaceObjectivesLive(
      position,
      TOTAL_RACERS,
      buildObjectivePerformanceSnapshot(),
      selectedObjectiveIdsRef.current,
    );

    setRaceObjectivesHud(prev => {
      const signature = (items: RaceObjectiveResult[]) =>
        items.map(item => `${item.id}:${item.current}:${item.completed}:${item.progressText}`).join('|');

      return signature(prev) === signature(next) ? prev : next;
    });
  };

  const registerPlayerCardUse = (effect: string) => {
    racePerformanceRef.current.cardsUsed += 1;

    if (!racePerformanceRef.current.uniqueCardsUsed.includes(effect)) {
      racePerformanceRef.current.uniqueCardsUsed.push(effect);
    }

    if (getCardDefinition(effect)?.category === 'attack') {
      racePerformanceRef.current.offensiveCardsUsed += 1;
      if (!racePerformanceRef.current.uniqueOffensiveCardsUsed.includes(effect)) {
        racePerformanceRef.current.uniqueOffensiveCardsUsed.push(effect);
      }
    }

    if (getCardDefinition(effect)?.category === 'defense') {
      racePerformanceRef.current.defensiveCardsUsed += 1;
    }

    if (
      tutorialModeRef.current &&
      tutorialStepRef.current === 'card'
    ) {
      moveTutorialTo('card', 'draft');
    }

    syncRaceObjectivesHud();
  };

  const registerSuccessfulAttack = (sourceId: string, targetId: string) => {
    if (sourceId === 'player' && targetId !== 'player') {
      racePerformanceRef.current.successfulAttacks += 1;
      syncRaceObjectivesHud();
    }
  };

  const registerSuccessfulDefense = (racerId: string, sourceId?: string) => {
    if (racerId === 'player' && sourceId && sourceId !== 'player') {
      racePerformanceRef.current.successfulDefenses += 1;
      syncRaceObjectivesHud();
    }
  };

  const getTrophyReward = (
    position: number,
    didFinish: boolean,
  ) => {
    if (
      didFinish &&
      position === 1
    ) {
      return 1;
    }

    return 0;
  };

  /* ================= CORES DE VIDAS QUE IRÃO PARA O PLACAR DE POSIÇÕES ================= */
  const getLifeColor = (lives: number) => {
    if (lives >= 4) return '#00D084'; // Verde (Saudável)
    if (lives === 3) return '#FFD700'; // Amarelo (Atenção)
    if (lives === 2) return '#FF8C00'; // Laranja (Perigo)
    if (lives === 1) return '#FF4500'; // Vermelho (Por um fio)
    return '#888888';                  // Cinza (Eliminado)
  };


  /* ================= MATCHMAKING + FISICA DOS BOTS ================= */
  function getCarSpeedKmhAtLevel(carType: CarKey, level: number) {
    const definition = carMaps[carType];
    const safeLevel = clampUpgradeLevel(level);
    const progress = (safeLevel - 1) / (MAX_MOTOR_LEVEL - 1);

    return (
      definition.stats.speed.base +
      (definition.stats.speed.maxUpgrade - definition.stats.speed.base) * progress
    );
  }

  function getCarAccelerationAtLevel(carType: CarKey, level: number) {
    const definition = carMaps[carType];
    const safeLevel = clampUpgradeLevel(level);
    const progress = (safeLevel - 1) / (MAX_MOTOR_LEVEL - 1);

    return (
      definition.stats.acceleration.base +
      (definition.stats.acceleration.maxUpgrade - definition.stats.acceleration.base) * progress
    );
  }

  function pickMatchedBotCarType(difficulty: BotDifficulty, botSpeedLevel: number): CarKey {
    const allCars = Object.keys(carMaps) as CarKey[];
    const playerTier = Number(selectedCarDefinition.tier ?? 1);

    // Easy/balanced ficam na mesma faixa de progressao visual do player.
    // Apenas o rival pode aparecer com um carro do proximo tier, e mesmo assim
    // sua velocidade REAL sera limitada logo abaixo para a corrida continuar justa.
    const maxTier = playerTier + (difficulty === 'rival' ? 1 : 0);
    const maxNaturalRatio =
      difficulty === 'easy' ? 1.05 :
      difficulty === 'balanced' ? 1.18 :
      1.35;

    const candidates = allCars.filter(carType => {
      const definition = carMaps[carType];
      const candidateTier = Number(definition.tier ?? 1);
      const candidateTopSpeed = getCarSpeedKmhAtLevel(carType, botSpeedLevel);

      return (
        candidateTier <= maxTier &&
        candidateTopSpeed <= DYNAMIC_TOP_SPEED_KMH * maxNaturalRatio
      );
    });

    const pool = candidates.length > 0 ? candidates : [carKey as CarKey];
    const targetRatio = difficulty === 'easy' ? 0.90 : difficulty === 'rival' ? 1.08 : 0.98;

    const ranked = [...pool].sort((a, b) => {
      const aRatio = getCarSpeedKmhAtLevel(a, botSpeedLevel) / Math.max(1, DYNAMIC_TOP_SPEED_KMH);
      const bRatio = getCarSpeedKmhAtLevel(b, botSpeedLevel) / Math.max(1, DYNAMIC_TOP_SPEED_KMH);
      return Math.abs(aRatio - targetRatio) - Math.abs(bRatio - targetRatio);
    });

    // Sorteia entre os 3 carros mais adequados para manter variedade sem criar
    // grids absurdos como Buggy vs Ferrari/Lamborghini/Monster no inicio.
    const shortlist = ranked.slice(0, Math.min(3, ranked.length));
    return shortlist[Math.floor(Math.random() * shortlist.length)] ?? (carKey as CarKey);
  }

  function generateBotsStats(playerStats: typeof carStats, difficulty: BotDifficulty = 'balanced') {
    const getLevelOffset = () => {
      const roll = Math.random();

      if (difficulty === 'easy') return roll < 0.75 ? -1 : 0;
      if (difficulty === 'rival') return roll < 0.65 ? 0 : 1;
      if (roll < 0.20) return -1;
      if (roll < 0.80) return 0;
      return 1;
    };

    const botSpeedLevel = clampUpgradeLevel(playerStats.motor.speedLevel + getLevelOffset());
    const botAccelLevel = clampUpgradeLevel(playerStats.motor.accelerationLevel + getLevelOffset());
    const botJumpLevel = clampUpgradeLevel(playerStats.motor.jumpPowerLevel + getLevelOffset());
    const botDefenseLevel = clampUpgradeLevel(playerStats.engrenagem.defenseLevel + getLevelOffset());

    const botCarType = pickMatchedBotCarType(difficulty, botSpeedLevel);
    const naturalTopSpeedKmh = getCarSpeedKmhAtLevel(botCarType, botSpeedLevel);

    // Limite competitivo relativo ao player. O modelo ainda importa, mas nenhum bot
    // recebe uma vantagem estrutural gigantesca por ter sorteado um supercarro.
    const competitiveCap =
      DYNAMIC_TOP_SPEED_KMH * (
        difficulty === 'easy' ? 0.95 :
        difficulty === 'rival' ? 1.06 :
        1.00
      );

    const finalTopSpeedKmh = Math.min(naturalTopSpeedKmh, competitiveCap);
    const maxSpeed = finalTopSpeedKmh / KMH_PER_PHYSICS_UNIT;

    const accelerationStat = getCarAccelerationAtLevel(botCarType, botAccelLevel);
    const accelMultiplier = difficulty === 'easy' ? 0.92 : difficulty === 'rival' ? 1.03 : 0.98;
    const accelerationPerTick =
      (0.02 + Math.min(1, accelerationStat / 220) * 0.06) * accelMultiplier;

    return {
      carType: botCarType,
      maxSpeed,
      initialSpeed: maxSpeed * INITIAL_SPEED_RATIO,
      minSpeed: maxSpeed * BRAKE_MIN_SPEED_RATIO,
      accelerationPerTick,
      jumpForce: JUMP_FORCE - ((botJumpLevel - 1) * 0.6),
      maxLives: 4 + botDefenseLevel,
      cruiseMinRatio: difficulty === 'easy' ? 0.82 : difficulty === 'rival' ? 0.94 : 0.88,
    };
  }


  /* ================= SETA AS POSIÇÕES DE MODO ALEATORIO ================= */
  const setupPositions = () => {
    const positions = Array.from({ length: TOTAL_RACERS }, (_, i) => BASE_PLAYER_X - (i * GAP_BETWEEN_RACERS));
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    playerXRef.current = positions[0];
    playerXAnim.setValue(positions[0]);
    playerLivesRef.current = INITIAL_LIVES;
    setPlayerLives(INITIAL_LIVES);
    playerIsDead.current = false;
    playerStatus.current = { ...defaultStatus };
    activeEffectsTimers.current = {};
    activeOilRef.current = [];
    activePiecesRef.current = [];
    setPiecesToRender([]);
    lastDynamicRenderCountRef.current.pieces = 0;
    oilSequenceRef.current = 0;
    setOilsToRender([]);
    lastDynamicRenderCountRef.current.oil = 0;
    playerSkidXAnim.setValue(0);
    lastPlayerSkidXRef.current = 0;
    setOilSpitCooldown(0);
    setEmpPulseCooldown(0);
    setMagnetCooldown(0);
    setPlayerProtectionHud({
      shieldCharges: 0,
      armorCharges: 0,
      secondChanceReady: false,
      isGhost: false,
    });
    setDefenseVisualEvents({});
    setIsSlowActive(false);
    playerSpeed.current = DYNAMIC_INITIAL_SPEED;
    scenarioTravelRef.current = 0;
    scenarioTravelAnim.setValue(0);
    analogInputRef.current = 0;
    analogKnobX.setValue(0);
    gameTime.current = 0;
    racePerformanceRef.current = {
      successfulAttacks: 0,
      successfulDefenses: 0,
      overtakes: 0,
      livesLost: 0,
      worstPosition: 1,
      bestPosition: TOTAL_RACERS,
      timeInTop3Seconds: 0,
      timeInFirstSeconds: 0,
      cardsUsed: 0,
      offensiveCardsUsed: 0,
      defensiveCardsUsed: 0,
      uniqueCardsUsed: [],
      uniqueOffensiveCardsUsed: [],
      opponentsEliminated: 0,
      collectedMotor: 0,
      collectedSpray: 0,
      collectedGears: 0,
      collectedTotal: 0,
    };

    const initialPlayerPosition =
      1 + positions.filter(position => position > positions[0]).length;

    lastSampledPlayerPositionRef.current = initialPlayerPosition;
    currentPlayerPositionRef.current = initialPlayerPosition;
    racePerformanceRef.current.bestPosition = initialPlayerPosition;
    racePerformanceRef.current.worstPosition = initialPlayerPosition;

    selectedObjectiveIdsRef.current = selectRaceObjectives({
      deck: finalDeck,
      totalRacers: TOTAL_RACERS,
    });

    setRaceObjectivesHud(
      evaluateRaceObjectivesLive(
        initialPlayerPosition,
        TOTAL_RACERS,
        buildObjectivePerformanceSnapshot(),
        selectedObjectiveIdsRef.current,
      ),
    );

    final30WarningPlayedRef.current = false;
    timerPulseAnim.setValue(1);

    const startY = GROUND_Y - PLAYER_SIZE;

    const newBots = [...botsRef.current];
    const raceDifficulties = [...BOT_DIFFICULTIES];
    for (let i = raceDifficulties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raceDifficulties[i], raceDifficulties[j]] = [raceDifficulties[j], raceDifficulties[i]];
    }

    for (let i = 0; i < 5; i++) {
      const refreshedStats = generateBotsStats(carStats, raceDifficulties[i] ?? 'balanced');
      newBots[i].x = positions[i + 1];
      newBots[i].y = startY;
      newBots[i].velocity = 0;
      newBots[i].speed = refreshedStats.initialSpeed;
      newBots[i].stats = refreshedStats;
      newBots[i].difficulty = raceDifficulties[i] ?? 'balanced';
      newBots[i].maxLives = refreshedStats.maxLives;
      newBots[i].lives = refreshedStats.maxLives;
      newBots[i].isDead = false;
      newBots[i].status = { ...defaultStatus };
      newBots[i].activeEffectsTimers = {} as Partial<Record<CardEffect, number>>;
      newBots[i].deck = generateRandomDeck();
      newBots[i].carType = refreshedStats.carType;
      newBots[i].carColorFront = getRandomColor();
      newBots[i].carColorBack = getRandomColor();
      newBots[i].angle = 0;
    }
    botsRef.current = newBots;

    // Sincroniza imediatamente os nós visuais antes da contagem regressiva.
    newBots.forEach(bot => {
      const visual = botVisualsRef.current[bot.id];
      if (!visual) return;
      visual.x.setValue(bot.x);
      visual.y.setValue(bot.y);
      visual.angle.setValue(bot.angle || 0);
      visual.skidX.setValue(0);
      visual.lastSkidX = 0;
      visual.lastX = bot.x;
      visual.lastY = bot.y;
      visual.lastAngle = bot.angle || 0;
    });

    // Atualiza metadados/HUD uma vez após sortear carros, cores e posições.
    setRaceSnapshotTick(tick => tick + 1);

    setRaceRoster([
      {
        id: 'player',
        name: 'Você',
        color: selectedColorFront || '#00D084',
        isPlayer: true,
      },
      ...newBots.map(bot => ({
        id: bot.id,
        name: bot.name,
        color: bot.carColorFront,
        isPlayer: false,
      })),
    ]);

    const randomSeconds = isTutorial
      ? 90
      : Math.floor(Math.random() * (180 - 60 + 1)) + 60;
    raceTimeRef.current = randomSeconds;
    timeRemainingRef.current = randomSeconds;
    setTimeRemaining(randomSeconds);
  };


  /* ================= USE EFFECT DE PREPARAÇÃO DO INICIO ================= */
  useEffect(() => {
    if (!started && !isCountingRef.current && !gameOver) {
      sessionPartsRef.current = { motor: 0, spray: 0, engrenagem: 0, chips: 0 };
      setSessionPartsHud({ motor: 0, spray: 0, engrenagem: 0, chips: 0 });
      gameOverHandledRef.current = false;
      setShowFinishTransition(false);

      raceIdRef.current =
        `race-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;


      const startY = GROUND_Y - PLAYER_SIZE;

      y.current = startY;
      playerYAnim.setValue(y.current);

      setupPositions();

      setTimeout(() => {
        hideLoading();

        // Na primeira corrida, a largada só começa depois que o jogador
        // ler a primeira dica e tocar CONTINUAR.
        if (!isTutorial) {
          startRaceSequence();
        }
      }, 2000);
    }
  }, [SCREEN_HEIGHT, SCREEN_WIDTH]);

  /* ================= FINALIZAÇÃO ÚNICA DA PARTIDA ================= */

  useEffect(() => {
    if (
      !gameOver ||
      gameOverHandledRef.current
    ) {
      return;
    }

    gameOverHandledRef.current = true;

    /*
     * Congela a corrida.
     */
    setStarted(false);

    /*
     * Para a música da corrida.
     */
    pauseMusic();

    /* ================================
       1. CLASSIFICAÇÃO FINAL
    ================================ */

    const finalRanking = [
      {
        id: 'player',
        x: playerXRef.current,
      },

      ...botsRef.current.map(
        bot => ({
          id: bot.id,
          x: bot.x,
        }),
      ),
    ].sort(
      (a, b) => b.x - a.x,
    );

    const playerPosition =
      playerIsDead.current
        ? TOTAL_RACERS
        : finalRanking.findIndex(
          racer =>
            racer.id === 'player',
        ) + 1;

    racePerformanceRef.current.worstPosition = Math.max(
      racePerformanceRef.current.worstPosition,
      playerPosition,
    );

    const performance: RacePerformanceStats = {
      ...buildObjectivePerformanceSnapshot(),
      survived: !playerIsDead.current,
      selectedObjectiveIds: [...selectedObjectiveIdsRef.current],
    };

    /* ================================
       2. RECOMPENSAS
    ================================ */

    const rewards = {
      motor: Math.max(
        0,
        sessionPartsRef.current.motor,
      ),

      spray: Math.max(
        0,
        sessionPartsRef.current.spray,
      ),

      engrenagem: Math.max(
        0,
        sessionPartsRef.current.engrenagem,
      ),

      // Campo adicional no objeto: o serviço legado pode ignorá-lo; o crédito abaixo é explícito.
      chips: Math.max(0, sessionPartsRef.current.chips),

      trophies:
        getTrophyReward(
          playerPosition,
          !playerIsDead.current,
        ),
    };

    /* ================================
       3. REGISTRA RESULTADO
    ================================ */

    const chipsBeforeCompletion = usePlayerStore.getState().profile?.parts?.chips ?? 0;
    const completion =
      raceRewardsService.completeRace({
        raceId:
          raceIdRef.current,

        position:
          playerPosition,

        totalRacers:
          TOTAL_RACERS,

        carId:
          carKey,

        carVisual: {
          colorFront:
            selectedColorFront ||
            '#cc0000',

          colorBack:
            selectedColorBack ||
            '#000000',
        },

        rewards,

        performance,

        unlocks: [],

        finishedAt:
          Date.now(),

        isNewRecord:
          false,
      });

    /* ================================
       4. FALLBACK DE SEGURANÇA
    ================================ */

    if (!completion.result) {
      console.warn(
        '[RaceResult] Não foi possível concluir a corrida:',
        completion.status,
      );

      router.replace(
        '/SelectionCar' as any,
      );

      return;
    }

    // O serviço de recompensas existente aplica XP/peças/troféus uma única vez.
    // A carteira de CHIPs é atualizada SOMENTE na primeira aplicação da corrida.
    // Zustand persist salva essa alteração juntamente com o restante do perfil.
    if (completion.status === 'applied' && rewards.chips > 0) {
      usePlayerStore.setState(state => {
        if (!state.profile) return state;
        const currentChips = Math.max(0, Math.floor(state.profile.parts.chips ?? 0));
        // Compatível também caso o serviço passe a creditar CHIPs futuramente.
        const alreadyCredited = Math.max(0, currentChips - chipsBeforeCompletion);
        const pendingChips = Math.max(0, rewards.chips - alreadyCredited);
        if (pendingChips === 0) return state;
        return {
          profile: {
            ...state.profile,
            parts: { ...state.profile.parts, chips: currentChips + pendingChips },
            updatedAt: Date.now(),
          },
        };
      });
    }

    /* ================================
       5. FINALIZA O ONBOARDING
    ================================ */

    if (isTutorial) {
      finishTutorial();
    }

    /* ================================
       6. TRANSIÇÃO VISUAL
    ================================ */

    setShowFinishTransition(true);

  }, [
    gameOver,
    pauseMusic,
    router,
    carKey,
    selectedColorFront,
    selectedColorBack,
    isTutorial,
    finishTutorial,
  ]);

  /* ================= PRESSÃO DOS 30 SEGUNDOS FINAIS ================= */
  const pulseRaceTimer = useCallback((scale: number) => {
    timerPulseAnim.stopAnimation();
    timerPulseAnim.setValue(1);

    Animated.sequence([
      Animated.spring(timerPulseAnim, {
        toValue: scale,
        speed: 28,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.spring(timerPulseAnim, {
        toValue: 1,
        speed: 24,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [timerPulseAnim]);

  useEffect(() => {
    if (!started || gameOver || timeRemaining <= 0 || timeRemaining > 30) {
      return;
    }

    if (timeRemaining === 30) {
      if (!final30WarningPlayedRef.current) {
        final30WarningPlayedRef.current = true;
        playFinal30Warning();
      }

      pulseRaceTimer(1.24);
      return;
    }

    // Um único tick por segundo. Nada deste efeito entra no loop de física de 60 FPS.
    playRaceTick();
    pulseRaceTimer(timeRemaining <= 10 ? 1.18 : 1.10);
  }, [
    started,
    gameOver,
    timeRemaining,
    playRaceTick,
    playFinal30Warning,
    pulseRaceTimer,
  ]);

  /* ================= GAME LOOP ================= */
  useEffect(() => {
    if (!started || gameOver) return;

    let animationFrameId = 0;
    let previousFrameAt = 0;
    let accumulator = 0;
    const FIXED_STEP_MS = 1000 / 60;

    const stepGame = () => {
      gameTime.current += 1;
      if (playerStatus.current.oilSlipTimer > 0) playerStatus.current.oilSlipTimer -= 1;
      if (playerStatus.current.empTimer > 0) playerStatus.current.empTimer -= 1;

      if (gameTime.current % 60 === 0) {
        setBoost(prev => Math.min(prev + 1, MAX_BOOST));
      }

      if (playerStatus.current.invincibleTimer > 0) {
        playerStatus.current.invincibleTimer -= 1;
      }

      // ================= 1. LÓGICA DO TIMER =================
      const elapsedSeconds = Math.floor((gameTime.current * 16) / 1000);
      const currentSecs = raceTimeRef.current - elapsedSeconds;
      const CAMERA_OFFSET_X = SCREEN_WIDTH * 0.35;


      if (currentSecs !== timeRemainingRef.current) {
        timeRemainingRef.current = currentSecs;
        setTimeRemaining(currentSecs);
      }

      // Fim de jogo pelo tempo esgotado
      if (currentSecs <= 0 && !gameOver) {
        setGameOver(true);
        return;
      }

      if (!isCameraLocked) {
        const CAMERA_OFFSET_X = SCREEN_WIDTH * 0.35;

        cameraTransformRef.current = {
          x: -playerXRef.current + CAMERA_OFFSET_X,
          scale: 1,
        };
      }

      // ================= VELOCIDADE EFETIVA DO PLAYER =================
      // Slow Slow deixa de ser um clamp aplicado no fim do cálculo. Em vez disso,
      // ele reduz toda a faixa de pilotagem. Assim acelerador e freio continuam
      // respondendo enquanto o debuff está ativo.
      const slowMultiplier = playerStatus.current.isSlowed
        ? SLOW_SPEED_MULTIPLIER
        : 1;

      const effectiveNormalMaxSpeed = DYNAMIC_MAX_SPEED * slowMultiplier;
      const effectiveMinSpeed = effectiveNormalMaxSpeed * BRAKE_MIN_SPEED_RATIO;

      const nitroCardActive = Boolean(
        activeEffectsTimers.current['nitro_power'] &&
        activeEffectsTimers.current['nitro_power']! > 0
      );

      if (playerStatus.current.isStunned) {
        playerSpeed.current = 0;
      } else if (nitroCardActive) {
        // Carta Nitro: acelera o teto efetivo. Se houver Slow Slow ao mesmo tempo,
        // o nitro ajuda, mas não apaga completamente o debuff.
        playerSpeed.current =
          effectiveNormalMaxSpeed * NITRO_CARD_SPEED_MULTIPLIER;
      } else if (isNitroActive.current) {
        // Nitro carregado pelo vácuo usa a mesma regra, com multiplicador próprio.
        playerSpeed.current =
          effectiveNormalMaxSpeed * NITRO_SPEED_MULTIPLIER;

        nitroTimer.current -= 1;
        if (nitroTimer.current <= 0) {
          isNitroActive.current = false;
          nitroCharge.current = 0;
          setNitroReady(false);
          setNitroPercent(0);
          playerSpeed.current = effectiveNormalMaxSpeed;

          // Se o jogador conquistou a largada perfeita, esperamos o impulso
          // terminar de verdade antes de congelar a corrida para ensinar
          // o acelerador. Assim o controle já estará disponível ao continuar.
          if (
            tutorialModeRef.current &&
            tutorialStepRef.current === 'perfect_start'
          ) {
            moveTutorialTo('perfect_start', 'accelerate');
          }
        }
      } else {
        // ================= CONTROLE ANALÓGICO =================
        // O teto e o piso usados pelo analógico já incluem Slow Slow quando ativo.
        playerSpeed.current = Math.min(
          playerSpeed.current,
          effectiveNormalMaxSpeed,
        );

        const rawAnalogInput = analogInputRef.current;
        const analogInput = playerStatus.current.controlsInverted
          ? -rawAnalogInput
          : rawAnalogInput;

        const magnitude = Math.abs(analogInput);

        if (magnitude > ANALOG_DEAD_ZONE) {
          const intensity = Math.min(
            1,
            (magnitude - ANALOG_DEAD_ZONE) / (1 - ANALOG_DEAD_ZONE),
          );

          if (analogInput > 0) {
            const accelerationPerTick =
              DYNAMIC_ACCELERATION_PER_TICK * intensity *
              (playerStatus.current.oilSlipTimer > 0 ? 0.35 : 1);

            playerSpeed.current = Math.min(
              effectiveNormalMaxSpeed,
              playerSpeed.current + accelerationPerTick,
            );
          } else {
            const brakePerTick = Math.max(
              0.055,
              DYNAMIC_ACCELERATION_PER_TICK * 1.55,
            );

            playerSpeed.current = Math.max(
              effectiveMinSpeed,
              playerSpeed.current - brakePerTick * intensity,
            );
          }
        }
        // Neutro = mantém a velocidade atual, inclusive durante Slow Slow.
      }

      if (playerStatus.current.oilSlipTimer > 0) {
        playerSpeed.current = Math.min(
          playerSpeed.current,
          effectiveNormalMaxSpeed * OIL_SPEED_MULTIPLIER,
        );
      }

      const dynamicSpeed = playerSpeed.current;
      let isDrafting = false;
      botsRef.current.forEach(bot => {
        const distanceToBot = bot.x - playerXRef.current;
        if (distanceToBot > 10 && distanceToBot < 120 && Math.abs(bot.y - y.current) < 30) isDrafting = true;
      });

      if (isDrafting && !isNitroActive.current && nitroCharge.current < 100) {
        if (
          tutorialModeRef.current &&
          tutorialStepRef.current === 'draft'
        ) {
          moveTutorialTo('draft', 'nitro');
        }

        nitroCharge.current += 0.8;
        if (nitroCharge.current >= 100) { nitroCharge.current = 100; if (!isNitroReadyRef.current) setNitroReady(true); }
        if (gameTime.current % 5 === 0) setNitroPercent(nitroCharge.current);
      } else if (!isDrafting && !isNitroActive.current && nitroCharge.current > 0) {
        nitroCharge.current = Math.max(nitroCharge.current - 0.2, 0);
        if (nitroCharge.current < 100 && isNitroReadyRef.current) setNitroReady(false);
        if (gameTime.current % 5 === 0) setNitroPercent(nitroCharge.current);
      }

      // Placar e Efeitos (Mantidos Iguais)
      if (gameTime.current % 30 === 0) {
        const allRacers = [{ id: 'player', name: 'Você (P1)', x: playerXRef.current }, ...botsRef.current.map(b => ({ id: b.id, name: b.name, x: b.x }))].sort((a, b) => b.x - a.x);
        const sampledPlayerPosition = allRacers.findIndex(r => r.id === 'player') + 1;
        if (sampledPlayerPosition > 0) {
          racePerformanceRef.current.worstPosition = Math.max(
            racePerformanceRef.current.worstPosition,
            sampledPlayerPosition,
          );
          racePerformanceRef.current.bestPosition = Math.min(
            racePerformanceRef.current.bestPosition,
            sampledPlayerPosition,
          );

          const previousPosition = lastSampledPlayerPositionRef.current;

          if (
            previousPosition !== null &&
            sampledPlayerPosition < previousPosition
          ) {
            racePerformanceRef.current.overtakes +=
              previousPosition - sampledPlayerPosition;
          }

          lastSampledPlayerPositionRef.current = sampledPlayerPosition;
          currentPlayerPositionRef.current = sampledPlayerPosition;
          syncRaceObjectivesHud(sampledPlayerPosition);
        }
        const currentOrder = allRacers.map(r => r.id).join(',');
        if (currentOrder !== lastOrderRef.current) {
          setLeaderboard(allRacers.map(r => ({ id: r.id, name: r.name })));
          lastOrderRef.current = currentOrder;
        }
      }

      // Tempo de domínio é contado uma vez por segundo, fora do render.
      if (gameTime.current % 60 === 0 && !playerIsDead.current) {
        const sampledPosition = currentPlayerPositionRef.current;
        if (sampledPosition <= 3) racePerformanceRef.current.timeInTop3Seconds += 1;
        if (sampledPosition === 1) racePerformanceRef.current.timeInFirstSeconds += 1;
        syncRaceObjectivesHud(sampledPosition);
      }

      for (const [effect, timeLeft] of Object.entries(activeEffectsTimers.current)) {
        if (timeLeft && timeLeft > 0) {
          activeEffectsTimers.current[effect as CardEffect] = timeLeft - 1;
          if (timeLeft - 1 === 0) {
            switch (effect) {
              case 'heavy_gravity': playerStatus.current.gravityMultiplier = 1; break;
              case 'invert_controls': playerStatus.current.controlsInverted = false; break;
              case 'blind': playerStatus.current.isBlind = false; setIsBlindActive(false); break;
              case 'panic': playerStatus.current.isPanicking = false; break;
              case 'ghost':
                playerStatus.current.isGhost = false;
                syncPlayerProtectionHud();
                break;
              case 'score_boost': playerStatus.current.scoreMultiplier = 1; break;
              case 'slow_slow': playerStatus.current.isSlowed = false; setIsSlowActive(false); break;
              case 'bubble_lift': playerStatus.current.isLevitating = false; playerStatus.current.bubbleLiftStartY = null; velocity.current = 0; break;
            }
          }
        }
      }

      if (playerStatus.current.isLevitating) {
        playerSpeed.current = 0;
        velocity.current = 0;
        isGrounded.current = false;

        const remaining =
          activeEffectsTimers.current.bubble_lift ?? 0;

        const elapsed = BUBBLE_DURATION - remaining;

        const startY =
          playerStatus.current.bubbleLiftStartY ?? y.current;

        const riseProgress =
          Math.min(elapsed / BUBBLE_RISE_DURATION, 1);

        // easeOutCubic
        const eased =
          1 - Math.pow(1 - riseProgress, 3);

        const targetY =
          startY - BUBBLE_LIFT_HEIGHT * eased;

        const floating =
          riseProgress >= 1
            ? Math.sin(gameTime.current * 0.12) * 6
            : 0;

        y.current = targetY + floating;
      } else {
        const currentGravity =
          GRAVITY * playerStatus.current.gravityMultiplier;

        velocity.current += currentGravity;
        y.current += velocity.current;
      }

      // --- 2. PISTA RETA ---
      // Não existem mais blocos/rampas. O chão inteiro usa GROUND_Y.
      // Isso remove geração procedural, deslocamento de blocos e cálculos de curva
      // do caminho crítico de 60 FPS.

      // --- 3. INTELIGÊNCIA DE CORRIDA DOS BOTS  ---
      botsRef.current.forEach(bot => {

        if (bot.status.invincibleTimer > 0) bot.status.invincibleTimer -= 1;

        if (bot.status.oilSlipTimer > 0) bot.status.oilSlipTimer -= 1;
        if (bot.status.empTimer > 0) bot.status.empTimer -= 1;

        if (bot.isDead) {
          bot.speed = Math.max(bot.speed - FRICTION, 0);
          bot.x += (bot.speed - dynamicSpeed);

          // Mantém o impulso recebido pela explosão e faz o carro destruído girar no ar.
          bot.velocity += GRAVITY;
          bot.y += bot.velocity;
          bot.angle = (bot.angle + 32) % 360;

          return; // ESSE RETURN IMPEDE A IA DO BOT DO LOOP SER EXECUTADA
        }

        // O alvo de velocidade não precisa ser sorteado 60 vezes por segundo por bot.
        // Atualizamos 4x/s: menos Math.random/GC e comportamento menos "nervoso".
        if (gameTime.current % 15 === 0) {
          bot.targetSpeed = bot.stats.maxSpeed * (bot.stats.cruiseMinRatio + Math.random() * (1 - bot.stats.cruiseMinRatio));

          if (bot.x < playerXRef.current - BOT_CATCHUP_DISTANCE) {
            bot.targetSpeed = bot.stats.maxSpeed * BOT_CATCHUP_MULTIPLIER;
          }
        }

        let targetSpeed = bot.targetSpeed;

        // ================= SLOW SLOW =================
        if (bot.status.isSlowed) {
          const slowMaxSpeed = bot.stats.maxSpeed * 0.4;
          targetSpeed = slowMaxSpeed;

          bot.speed = Math.min(bot.speed, slowMaxSpeed);
        }

        // ================= NITRO POWER =================
        else if (
          bot.activeEffectsTimers['nitro_power'] &&
          bot.activeEffectsTimers['nitro_power'] > 0
        ) {
          targetSpeed = bot.stats.maxSpeed * NITRO_POWER_MULTIPLIER;
          bot.speed = targetSpeed;
        }

        if (bot.status.oilSlipTimer > 0) {
          targetSpeed = Math.min(targetSpeed, bot.stats.maxSpeed * OIL_SPEED_MULTIPLIER);
          bot.speed = Math.min(bot.speed, targetSpeed);
        }

        // ================= ACELERAÇÃO NORMAL =================
        if (bot.speed < targetSpeed) {
          bot.speed += bot.stats.accelerationPerTick;
          bot.speed = Math.min(bot.speed, targetSpeed);
        }

        if (bot.speed > targetSpeed) {
          bot.speed = Math.max(
            bot.speed - FRICTION,
            targetSpeed
          );
        }

        bot.x += (bot.speed - dynamicSpeed);


        bot.deck.forEach(card => { if (card.currentCooldown > 0) card.currentCooldown -= 1; });

        for (const [effect, timeLeft] of Object.entries(bot.activeEffectsTimers)) {
          if (timeLeft && (timeLeft as number) > 0) {
            bot.activeEffectsTimers[effect as CardEffect] = (timeLeft as number) - 1;
            if ((timeLeft as number) - 1 === 0) {
              if (effect === 'heavy_gravity') bot.status.gravityMultiplier = 1;
              if (effect === 'panic') bot.status.isPanicking = false;
              if (effect === 'slow_slow') bot.status.isSlowed = false;
              if (effect === 'bubble_lift') bot.status.isLevitating = false; bot.status.bubbleLiftStartY = null; bot.velocity = 0;
              if (effect === 'ghost') bot.status.isGhost = false;
            }
          }
        }


        if (bot.status.isLevitating) {
          bot.speed = 0;
          bot.velocity = 0;

          const remaining =
            bot.activeEffectsTimers.bubble_lift ?? 0;

          const elapsed =
            BUBBLE_DURATION - remaining;

          const startY =
            bot.status.bubbleLiftStartY ?? bot.y;

          const riseProgress =
            Math.min(elapsed / BUBBLE_RISE_DURATION, 1);

          const eased =
            1 - Math.pow(1 - riseProgress, 3);

          const targetY =
            startY - BUBBLE_LIFT_HEIGHT * eased;

          const floating =
            riseProgress >= 1
              ? Math.sin(gameTime.current * 0.12) * 6
              : 0;

          bot.y = targetY + floating;
        } else {
          const currentBotGravity =
            GRAVITY * bot.status.gravityMultiplier;

          bot.velocity += currentBotGravity;
          bot.y += bot.velocity;
        }

        const botFootY = bot.y + PLAYER_SIZE;
        let targetBotAngle = 0;

        if (bot.status.isLevitating) {
          targetBotAngle = Math.sin(gameTime.current * 0.06) * 7;
        } else if (bot.status.isStunned) {
          targetBotAngle = (gameTime.current * 35) % 360;
        } else if (bot.status.oilSlipTimer > 0) {
          targetBotAngle = Math.sin(gameTime.current * 0.31) * 17;
        }
        // Pista reta: uma comparação substitui a busca do bloco + trigonometria.
        if (bot.velocity >= 0 && botFootY >= GROUND_Y - 25) {
          bot.y = GROUND_Y - PLAYER_SIZE + 6;
          bot.velocity = 0;
          bot.status.isStunned = false;
        }

        bot.angle = targetBotAngle;
      });

      botsRef.current = botsRef.current.filter(bot => bot.y <= SCREEN_HEIGHT + 100);

      // --- 4. AVALIAÇÃO DA INTELIGÊNCIA DOS BOTS ---
      if (gameTime.current % 15 === 0) processBotsAI();

      // --- 5. EFEITO DA CORRENTE (CHAINS) ---
      if (activeChainsStateRef.current && activeChainsStateRef.current.duration > 0) {
        const { callerId, targetId } = activeChainsStateRef.current;

        const callerX = callerId === 'player' ? playerXRef.current : botsRef.current.find(b => b.id === callerId)?.x || -1000;
        const targetX = targetId === 'player' ? playerXRef.current : botsRef.current.find(b => b.id === targetId)?.x || -1000;

        const distanceBetween = Math.abs(targetX - callerX);

        if (distanceBetween <= 20) {
          activeChainsStateRef.current = null;
          setActiveChainsState(null);
          setActiveChains(null);

        } else {
          const PULL_FORCE = 0.11;
          const POSITION_PULL = 0.4;

          if (callerId === 'player') {
            playerSpeed.current += PULL_FORCE;
            playerXRef.current += POSITION_PULL;
          } else {
            const callerBot = botsRef.current.find(b => b.id === callerId);
            if (callerBot) {
              callerBot.speed += PULL_FORCE;
              callerBot.x += POSITION_PULL;
            }
          }

          if (targetId === 'player') {
            playerSpeed.current -= PULL_FORCE;
            if (playerSpeed.current < 1) {
              playerSpeed.current = 1;
            }
            playerXRef.current -= POSITION_PULL;
          } else {
            const targetBot = botsRef.current.find(b => b.id === targetId);
            if (targetBot) {
              targetBot.speed -= PULL_FORCE;
              if (targetBot.speed < 1) {
                targetBot.speed = 1;
              }
              targetBot.x -= POSITION_PULL;
            }
          }

          // Diminui o tempo diretamente na referência (muito mais performático do que um setState a cada frame)
          activeChainsStateRef.current.duration -= 1;
        }
      } else if (activeChainsStateRef.current && activeChainsStateRef.current.duration <= 0) {
        activeChainsStateRef.current = null;
        setActiveChainsState(null);
        setActiveChains(null);
      }

      // --- 5.1. FÍSICA DO MÍSSIL GUIADO ---
      let remainingBullets: typeof activeBulletsRef.current = [];
      activeBulletsRef.current.forEach(bullet => {
        const getCoords = (id: string) => {
          if (id === 'player') return { x: playerXRef.current + PLAYER_SIZE / 2, y: y.current + PLAYER_SIZE / 2 };
          const bot = botsRef.current.find(b => b.id === id);
          return bot ? { x: bot.x + PLAYER_SIZE / 2, y: bot.y + PLAYER_SIZE / 2 } : null;
        };

        const targetCoords = getCoords(bullet.targetId);

        if (!targetCoords) return;

        const dx = targetCoords.x - bullet.x;
        const dy = targetCoords.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 25) {
          const JUMP_PENALTY = JUMP_FORCE * 1.2;
          const SPEED_PENALTY = 0;

          const hit = applyDamage(bullet.targetId, bullet.callerId)
          if (!hit) return;

          registerSuccessfulAttack(bullet.callerId, bullet.targetId);

          if (bullet.targetId === 'player') {
            playerSpeed.current = SPEED_PENALTY;
            velocity.current = JUMP_PENALTY;
            isGrounded.current = false;
            playerStatus.current.isStunned = true;
          } else {
            const targetBot = botsRef.current.find(b => b.id === bullet.targetId);
            if (targetBot) {
              targetBot.speed = SPEED_PENALTY;
              targetBot.velocity = JUMP_PENALTY;
              targetBot.status.isStunned = true;
            }
          }
        } else {
          const BULLET_SPEED = 25;
          bullet.angle = Math.atan2(dy, dx) * (180 / Math.PI);
          bullet.x += (dx / distance) * BULLET_SPEED;
          bullet.y += (dy / distance) * BULLET_SPEED;
          remainingBullets.push(bullet);
        }
      });
      activeBulletsRef.current = remainingBullets;

      // --- 5.2. FÍSICA DO TNT  ---
      let remainingTNT: TNTBox[] = [];
      activeTNTRef.current.forEach(tnt => {
        tnt.x -= dynamicSpeed;

        if (tnt.state === 'exploding') {
          tnt.timer -= 1;
          if (tnt.timer > 0) remainingTNT.push(tnt);
        } else {
          tnt.timer -= 1;

          // Pista reta: TNT cai diretamente para a altura fixa do chão.
          if (tnt.y + PLAYER_SIZE < GROUND_Y - 5) {
            tnt.y += GRAVITY * 6;
          } else {
            tnt.y = GROUND_Y - PLAYER_SIZE;
          }

          // --- 6 DETECÇÃO DE COLISÃO POR PROXIMIDADE ---
          let hitRacer = false;
          // Pequena janela de 15 frames (~0.2s) de imunidade para evitar que quem soltou exploda instantaneamente
          const safetyWindow = tnt.timer < (60 * 10) - 15;

          if (safetyWindow) {
            // Distância ao quadrado evita Math.sqrt no loop de física.
            const playerDx = playerXRef.current - tnt.x;
            const playerDy = y.current - tnt.y;
            if ((playerDx * playerDx) + (playerDy * playerDy) < 40 * 40) hitRacer = true;

            botsRef.current.forEach(bot => {
              if (!bot.isDead) {
                const botDx = bot.x - tnt.x;
                const botDy = bot.y - tnt.y;
                if ((botDx * botDx) + (botDy * botDy) < 40 * 40) hitRacer = true;
              }
            });
          }

          // EXPLOSÃO! (Ativa por tempo limite OU se algum corredor encostar)
          if (tnt.timer <= 0 || hitRacer) {
            tnt.state = 'exploding';
            tnt.timer = 34; // ~566 ms: tempo suficiente para os 8 frames da explosão

            const EXPLOSION_RADIUS = 160;
            const JUMP_PENALTY = JUMP_FORCE * 2.0;

            const applyBlast = (racerId: string, rx: number, ry: number) => {
              const dx = rx - tnt.x;
              const dy = ry - tnt.y;
              const distSq = (dx * dx) + (dy * dy);

              if (distSq < EXPLOSION_RADIUS * EXPLOSION_RADIUS) {
                const hit = applyDamage(racerId, tnt.callerId);
                if (!hit) return;

                registerSuccessfulAttack(tnt.callerId, racerId);

                if (racerId === 'player') {
                  playerSpeed.current = 0;
                  velocity.current = JUMP_PENALTY;
                  isGrounded.current = false;
                  playerStatus.current.isStunned = true;
                } else {
                  const bot = botsRef.current.find(b => b.id === racerId);
                  if (bot) {
                    bot.speed = 0;
                    bot.velocity = JUMP_PENALTY;
                    bot.status.isStunned = true;
                  }
                }
              }
            };

            applyBlast('player', playerXRef.current, y.current);
            botsRef.current.forEach(b => applyBlast(b.id, b.x, b.y));
          }
          remainingTNT.push(tnt);
        }
      });
      activeTNTRef.current = remainingTNT;


      // --- OIL SPIT: poças curtas, fixas na pista e de uso único ---
      // Mesma convenção de coordenadas do TNT. Não muda posição lógica dos carros.
      const remainingOil: OilPuddle[] = [];
      for (const oil of activeOilRef.current) {
        oil.x -= dynamicSpeed;
        oil.remainingFrames -= 1;
        if (oil.armFrames > 0) oil.armFrames -= 1;
        if (oil.remainingFrames <= 0 || oil.x < -100) continue;
        if (oil.armFrames > 0) { remainingOil.push(oil); continue; }

        let consumed = false;
        const playerGrounded = Math.abs(y.current + PLAYER_SIZE - (GROUND_Y + 6)) < 20;
        if (oil.callerId !== 'player' && !playerIsDead.current && playerGrounded &&
            Math.abs(playerXRef.current + PLAYER_SIZE / 2 - oil.x) < 34) {
          consumed = applyOilSpitHit('player', oil.callerId);
        }
        if (!consumed) {
          for (const bot of botsRef.current) {
            const grounded = Math.abs(bot.y + PLAYER_SIZE - (GROUND_Y + 6)) < 20;
            if (bot.isDead || !grounded || bot.id === oil.callerId) continue;
            if (Math.abs(bot.x + PLAYER_SIZE / 2 - oil.x) < 34) {
              consumed = applyOilSpitHit(bot.id, oil.callerId);
              if (consumed) break;
            }
          }
        }
        if (!consumed) remainingOil.push(oil);
      }
      activeOilRef.current = remainingOil;

      // --- 5.3 BUBBLE LIFT ---
      // Atualiza uma vez por frame, independentemente da quantidade de TNTs ativas.
      const remainingBubbles: typeof activeBubblesRef.current = [];
      activeBubblesRef.current.forEach(bubble => {
        const targetCoords = bubble.targetId === 'player'
          ? { x: playerXRef.current + PLAYER_SIZE / 2, y: y.current + PLAYER_SIZE / 2 }
          : (() => {
            const bot = botsRef.current.find(b => b.id === bubble.targetId);
            return bot ? { x: bot.x + PLAYER_SIZE / 2, y: bot.y + PLAYER_SIZE / 2 } : null;
          })();

        if (!targetCoords) return;

        const dx = targetCoords.x - bubble.x;
        const dy = targetCoords.y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 30) {
          applyCardEffect('bubble_lift', bubble.targetId, bubble.callerId);
          return;
        }

        const BUBBLE_SPEED = 18;
        bubble.x += (dx / distance) * BUBBLE_SPEED;
        bubble.y += (dy / distance) * BUBBLE_SPEED;
        remainingBubbles.push(bubble);
      });
      activeBubblesRef.current = remainingBubbles;

      // --- 7. COLISÃO DO PLAYER COM A PISTA RETA ---
      let landedOnGround = false;
      const playerFootY = y.current + PLAYER_SIZE;
      let targetAngle = 0;

      if (playerStatus.current.isLevitating) {
        targetAngle = Math.sin(gameTime.current * 0.06) * 7;
      } else if (playerStatus.current.isStunned) {
        targetAngle = (gameTime.current * 35) % 360;
      } else if (playerStatus.current.oilSlipTimer > 0) {
        targetAngle = Math.sin(gameTime.current * 0.31) * 17;
      }

      if (velocity.current >= 0 && playerFootY >= GROUND_Y - 25) {
        y.current = GROUND_Y - PLAYER_SIZE + 6;
        velocity.current = 0;
        landedOnGround = true;
        playerStatus.current.isStunned = false;
      }

      angleRenderRef.current = targetAngle;
      isGrounded.current = landedOnGround;

      if (y.current > SCREEN_HEIGHT + 100) {
        playerIsDead.current = true;
        setGameOver(true);
        return;
      }

      // --- 6 FÍSICA / LOOT / MAGNET: dados em refs, render de itens a 30 FPS ---
      const remainingPieces: DroppedPiece[] = [];
      const playerMagnet = !playerIsDead.current && (activeEffectsTimers.current.magnet ?? 0) > 0;
      const magnetBots = botsRef.current.filter(bot =>
        !bot.isDead && (bot.activeEffectsTimers.magnet ?? 0) > 0,
      );
      let playerCollected = false;

      activePiecesRef.current.forEach(piece => {
        piece.x -= dynamicSpeed;
        piece.velY += GRAVITY;
        piece.y += piece.velY;

        if (piece.y + 20 >= GROUND_Y) {
          piece.y = GROUND_Y - 20;
          piece.velY = 0;
        }

        // O ímã mais próximo dentro do raio é o dono da atração deste frame.
        // O drop é sempre o MESMO objeto: nunca duplicamos nem criamos recursos.
        let magnetX = 0;
        let magnetY = 0;
        let magnetOwner: string | null = null;
        let nearestSq = MAGNET_RADIUS_SQ;
        if (playerMagnet) {
          const dx = playerXRef.current - piece.x;
          const dy = y.current - piece.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < nearestSq) {
            nearestSq = distSq;
            magnetX = playerXRef.current;
            magnetY = y.current;
            magnetOwner = 'player';
          }
        }
        for (const bot of magnetBots) {
          const dx = bot.x - piece.x;
          const dy = bot.y - piece.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < nearestSq) {
            nearestSq = distSq;
            magnetX = bot.x;
            magnetY = bot.y;
            magnetOwner = bot.id;
          }
        }

        if (magnetOwner) {
          const dx = magnetX - piece.x;
          const dy = magnetY - piece.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const travel = Math.min(distance, Math.max(6, Math.min(22, distance * 0.13)));
          if (distance > 0) {
            piece.x += dx / distance * travel;
            piece.y += dy / distance * travel;
            piece.velY = Math.min(0, piece.velY);
          }
        }

        const pieceDx = playerXRef.current - piece.x;
        const pieceDy = y.current - piece.y;
        const pieceDistanceSq = pieceDx * pieceDx + pieceDy * pieceDy;
        if (!playerIsDead.current && pieceDistanceSq < PLAYER_SIZE * PLAYER_SIZE) {
          sessionPartsRef.current[piece.type] += 1;
          if (piece.type !== 'chips') {
            racePerformanceRef.current.collectedTotal += 1;
            if (piece.type === 'motor') racePerformanceRef.current.collectedMotor += 1;
            if (piece.type === 'spray') racePerformanceRef.current.collectedSpray += 1;
            if (piece.type === 'engrenagem') racePerformanceRef.current.collectedGears += 1;
          }
          playerCollected = true;
          return;
        }

        // Bots recolhem loot atraído pelo próprio ímã; isso não altera o saldo do player.
        if (magnetOwner && magnetOwner !== 'player' && nearestSq < MAGNET_PICKUP_RADIUS_SQ) {
          return;
        }
        if (piece.x > -100) remainingPieces.push(piece);
      });

      activePiecesRef.current = remainingPieces;
      if (playerCollected) {
        setSessionPartsHud({ ...sessionPartsRef.current });
        syncRaceObjectivesHud();
      }

      // ============================================================
      // PARALLAX DIRIGIDO PELA VELOCIDADE REAL
      // ============================================================
      // Usa a velocidade FINAL deste tick: analógico, Slow Slow, carta Nitro,
      // nitro do vácuo, stun e demais efeitos já foram aplicados acima.
      // Não há setState: apenas um Animated.Value extra por passo da física.
      if (started && !gameOver && !playerIsDead.current) {
        scenarioTravelRef.current +=
          Math.max(0, playerSpeed.current) * SCENARIO_TRAVEL_SCALE;

        // O fundo não precisa de 60 atualizações JS/native por segundo.
        // A distância continua acumulada a 60 Hz, mas é publicada a 30 Hz.
        if (gameTime.current % 2 === 0) {
          scenarioTravelAnim.setValue(scenarioTravelRef.current);
        }
      }

      // ============================================================
      // RENDER VISUAL
      // ============================================================
      // Posições dos corredores e câmera são sincronizadas a cada passo da física
      // SEM setState. Isso evita reconstruir o Mapa inteiro para mover 6 carros.
      const cameraX = cameraTransformRef.current.x;
      const cameraScale = cameraTransformRef.current.scale;

      if (!Number.isFinite(lastCameraVisualRef.current.x) || Math.abs(cameraX - lastCameraVisualRef.current.x) > 0.01) {
        cameraXAnim.setValue(cameraX);
        lastCameraVisualRef.current.x = cameraX;
      }
      if (!Number.isFinite(lastCameraVisualRef.current.scale) || Math.abs(cameraScale - lastCameraVisualRef.current.scale) > 0.001) {
        cameraScaleAnim.setValue(cameraScale);
        lastCameraVisualRef.current.scale = cameraScale;
      }

      const playerSkidX = playerStatus.current.oilSlipTimer > 0
        ? Math.sin(gameTime.current * 0.31) * 8
        : 0;
      if (Math.abs(playerSkidX - lastPlayerSkidXRef.current) > 0.05) {
        playerSkidXAnim.setValue(playerSkidX);
        lastPlayerSkidXRef.current = playerSkidX;
      }
      const playerAngle = angleRenderRef.current;
      if (!Number.isFinite(lastPlayerVisualRef.current.x) || Math.abs(playerXRef.current - lastPlayerVisualRef.current.x) > 0.01) {
        playerXAnim.setValue(playerXRef.current);
        lastPlayerVisualRef.current.x = playerXRef.current;
      }
      if (!Number.isFinite(lastPlayerVisualRef.current.y) || Math.abs(y.current - lastPlayerVisualRef.current.y) > 0.05) {
        playerYAnim.setValue(y.current);
        lastPlayerVisualRef.current.y = y.current;
      }
      if (!Number.isFinite(lastPlayerVisualRef.current.angle) || Math.abs(playerAngle - lastPlayerVisualRef.current.angle) > 0.05) {
        playerAngleAnim.setValue(playerAngle);
        lastPlayerVisualRef.current.angle = playerAngle;
      }

      botsRef.current.forEach(bot => {
        const visual = botVisualsRef.current[bot.id];
        if (!visual) return;

        // X muda praticamente todo tick e continua em 60 FPS.
        if (Math.abs(bot.x - visual.lastX) > 0.01) {
          visual.x.setValue(bot.x);
          visual.lastX = bot.x;
        }

        // Em pista reta, Y e angulo ficam iguais na maior parte da corrida.
        // Só atravessam a ponte quando salto/efeito/explosao realmente os altera.
        if (Math.abs(bot.y - visual.lastY) > 0.05) {
          visual.y.setValue(bot.y);
          visual.lastY = bot.y;
        }

        const skidX = bot.status.oilSlipTimer > 0
          ? Math.sin(gameTime.current * 0.31 + Number(bot.id.slice(-1))) * 8
          : 0;
        if (Math.abs(skidX - visual.lastSkidX) > 0.05) {
          visual.skidX.setValue(skidX);
          visual.lastSkidX = skidX;
        }

        const botAngle = bot.angle || 0;
        if (Math.abs(botAngle - visual.lastAngle) > 0.05) {
          visual.angle.setValue(botAngle);
          visual.lastAngle = botAngle;
        }
      });

      // HUD, minimapa, status e efeitos presos aos corredores não precisam de 60 FPS.
      // 60 / 6 = ~10 snapshots React por segundo.
      if (gameTime.current % 6 === 0) {
        setRaceSnapshotTick(tick => tick + 1);
      }

      // Projéteis/loot continuam em 30 FPS SOMENTE enquanto realmente existem.
      // Quando passam de 1+ para 0, enviamos um último [] para removê-los do JSX.
      if (gameTime.current % 2 === 0) {
        const counts = lastDynamicRenderCountRef.current;

        const piecesCount = activePiecesRef.current.length;
        if (piecesCount > 0 || counts.pieces > 0) {
          setPiecesToRender([...activePiecesRef.current]);
        }
        counts.pieces = piecesCount;

        const bulletsCount = activeBulletsRef.current.length;
        if (bulletsCount > 0 || counts.bullets > 0) {
          setBulletsToRender([...activeBulletsRef.current]);
        }
        counts.bullets = bulletsCount;

        const tntsCount = activeTNTRef.current.length;
        if (tntsCount > 0 || counts.tnts > 0) {
          setTntsToRender([...activeTNTRef.current]);
        }
        counts.tnts = tntsCount;

        const oilCount = activeOilRef.current.length;
        if (oilCount > 0 || counts.oil > 0) {
          setOilsToRender([...activeOilRef.current]);
        }
        counts.oil = oilCount;

        const bubblesCount = activeBubblesRef.current.length;
        if (bubblesCount > 0 || counts.bubbles > 0) {
          setBubblesToRender([...activeBubblesRef.current]);
        }
        counts.bubbles = bubblesCount;
      }
    };

    const loop = (timestamp: number) => {
      // Pausa real do tutorial: mantemos o RAF vivo para não desmontar a engine,
      // mas descartamos o tempo parado. Ao continuar não existe catch-up de física.
      if (tutorialPausedRef.current) {
        previousFrameAt = timestamp;
        accumulator = 0;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (previousFrameAt === 0) previousFrameAt = timestamp;

      const frameDelta = Math.min(timestamp - previousFrameAt, 50);
      previousFrameAt = timestamp;
      accumulator += frameDelta;

      // Limita a recuperação a três passos para evitar a espiral de travamento.
      let steps = 0;
      while (accumulator >= FIXED_STEP_MS && steps < 3) {
        stepGame();
        accumulator -= FIXED_STEP_MS;
        steps += 1;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [started, gameOver, SCREEN_WIDTH, SCREEN_HEIGHT]);

  /* ================= GERENCIADOR ÚNICO DE COOLDOWNS (UI) ================= */
  useEffect(() => {
    if (!started || gameOver) return;

    const tick = (value: number) => value > 0 ? Math.max(0, value - 100) : value;
    const globalInterval = setInterval(() => {
      if (tutorialPausedRef.current) return;

      setSwapCooldown(tick);
      setChainsCooldown(tick);
      setBulletCooldown(tick);
      setTntCooldown(tick);
      setOilSpitCooldown(tick);
      setEmpPulseCooldown(tick);
      setMagnetCooldown(tick);
      setTornadoCooldown(tick);
      setSlowCooldown(tick);
      setNitroCooldown(tick);
      setBubbleCooldown(tick);
      setShieldCooldown(tick);
      setQuickRepairCooldown(tick);
      setGhostCooldown(tick);
      setSecondChanceCooldown(tick);
      setArmorCooldown(tick);
    }, 100);

    return () => clearInterval(globalInterval);
  }, [started, gameOver]);

  /* ================= GERA NOME ALEATORIO DOS BOTS ================= */
  function getRandomName() {
    return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  }

  /* ================= GERA DECK DOS BOTS ================= */
  function getBotCardCooldown(effect: CardEffect) {
    // Cartas com duração/cooldown próprios usam o mesmo tempo para bot e player.
    if (effect === 'magnet') return Math.round(CARD_MAP.magnet.cooldownMs * 60 / 1000);
    if (effect === 'emp_pulse') return Math.round(CARD_MAP.emp_pulse.cooldownMs * 60 / 1000);
    if (CARD_CATEGORIES.DEFENSE_BUFF.includes(effect as any)) return COOLDOWNS.DEFENSE;
    if (CARD_CATEGORIES.HEAVY_ATTACK.includes(effect as any)) return COOLDOWNS.HEAVY;
    return COOLDOWNS.LIGHT;
  }

  function generateRandomDeck() {
    const attackEffects: CardEffect[] = ALL_CARDS
      .filter(card => card.category === 'attack')
      .map(card => card.id as CardEffect);
    const forwardAttackEffects = attackEffects.filter(effect =>
      getCardDefinition(effect)?.deployment !== 'rear',
    );
    const defenseEffects: CardEffect[] = ALL_CARDS
      .filter(card => card.category === 'defense')
      .map(card => card.id as CardEffect);

    const pickRandom = <T,>(items: T[]) =>
      items[Math.floor(Math.random() * items.length)];

    // Quatro cartas, como o player. Pelo menos um ataque sempre funciona para a frente,
    // evitando bots presos com TNT + defesa quando estão perseguindo o líder.
    const attackOne = pickRandom(forwardAttackEffects);
    const attackTwo = pickRandom(attackEffects.filter(effect => effect !== attackOne));
    const defenseOne = pickRandom(defenseEffects);
    const defenseTwo = pickRandom(defenseEffects.filter(effect => effect !== defenseOne));

    return [attackOne, attackTwo, defenseOne, defenseTwo].map(effect => ({
      effect,
      currentCooldown: 60 * 3 + Math.floor(Math.random() * 120),
      baseCooldown: getBotCardCooldown(effect),
    }));
  }

  /* ================= GERENCIADOR DO USO DE CARTAS COM BOOST ================= */
  function handleUseCard(effect: string) {
    const cardDefinition = getCardDefinition(effect);
    if (!cardDefinition) return;
    const cost = cardDefinition.cost;

    if (boost < cost) return;
    if (effect === 'swap' && swapCooldown > 0) return;
    if (effect === 'chains' && chainsCooldown > 0) return;
    if (effect === 'bullet' && bulletCooldown > 0) return;
    if (effect === 'tnt' && tntCooldown > 0) return;
    if (effect === 'oil_spit' && oilSpitCooldown > 0) return;
    if (effect === 'emp_pulse' && empPulseCooldown > 0) return;
    if (effect === 'magnet' && magnetCooldown > 0) return;
    if (effect === 'tornado' && tornadoCooldown > 0) return;
    if (effect === 'slow_slow' && slowCooldown > 0) return;
    if (effect === 'nitro_power' && nitroCooldown > 0) return;
    if (effect === 'bubble_lift' && bubbleCooldown > 0) return;
    if (effect === 'shield' && shieldCooldown > 0) return;
    if (effect === 'quick_repair' && quickRepairCooldown > 0) return;
    if (effect === 'ghost' && ghostCooldown > 0) return;
    if (effect === 'second_chance' && secondChanceCooldown > 0) return;
    if (effect === 'armor' && armorCooldown > 0) return;

    // Interferência: não consome boost nem cooldown ao tentar ativar eletrônicos.
    if (playerStatus.current.empTimer > 0 && (effect === 'nitro_power' || effect === 'shield')) return;
    if (effect === 'quick_repair' && playerLivesRef.current >= INITIAL_LIVES) return;
    if (effect === 'shield' && playerStatus.current.shieldCharges > 0) return;
    if (effect === 'armor' && playerStatus.current.armorCharges > 0) return;
    if (effect === 'ghost' && playerStatus.current.isGhost) return;
    if (effect === 'second_chance' && playerStatus.current.secondChanceReady) return;
    if (effect === 'magnet' && (activeEffectsTimers.current.magnet ?? 0) > 0) return;

    // Efeitos visuais globais ainda podem estar resolvendo uma carta anterior.
    // Não contamos a missão, não cobramos boost e não iniciamos cooldown se a carta não puder nascer.
    if (effect === 'chains' && activeChains) return;
    if (effect === 'bullet' && activeBulletEffect) return;
    if (effect === 'tornado' && activeTornado) return;

    // Não gasta boost/cooldown se o jogador já estiver em primeiro
    // ou se outro Swap ainda estiver resolvendo.
    if (effect === 'swap' && (activeSwapRef.current || !hasOpponentAhead('player'))) return;

    // EMP exige um adversário à frente. Sem alvo, não cobra boost nem entra em cooldown.
    if (effect === 'emp_pulse') {
      if (!triggerEmpPulse('player')) return;
      setBoost(prev => prev - cost);
      setEmpPulseCooldown(EMP_PULSE_COOLDOWN);
      registerPlayerCardUse(effect);
      return;
    }

    // Bubble Lift só cobra o boost se realmente conseguir lançar em um alvo.
    if (effect === 'bubble_lift') {
      const launched = triggerBubbleLift('player');
      if (!launched) return;

      setBoost(prev => prev - cost);
      setBubbleCooldown(BUBBLE_COOLDOWN);
      registerPlayerCardUse(effect);
      return;
    }

    setBoost(prev => prev - cost);
    registerPlayerCardUse(effect);

    if (effect === 'swap') {
      if (triggerSwap('player')) setSwapCooldown(SWAP_COOLDOWN);
    }
    if (effect === 'chains') { triggerChains('player'); setChainsCooldown(CHAINS_COOLDOWN); }
    if (effect === 'bullet') { triggerBullet('player'); setBulletCooldown(BULLET_COOLDOWN); }
    if (effect === 'tnt') { triggerTNT('player'); setTntCooldown(TNT_COOLDOWN); }
    if (effect === 'oil_spit') { triggerOilSpit('player'); setOilSpitCooldown(OIL_SPIT_COOLDOWN); }
    if (effect === 'magnet') { applyCardEffect('magnet', 'player', 'player'); setMagnetCooldown(MAGNET_COOLDOWN); }
    if (effect === 'tornado') { triggerTornado('player'); setTornadoCooldown(TORNADO_COOLDOWN); }
    if (effect === 'nitro_power') { triggerNitroPower('player'); setNitroCooldown(NITRO_COOLDOWN); }
    if (effect === 'shield') { applyCardEffect('shield', 'player', 'player'); setShieldCooldown(SHIELD_COOLDOWN); }
    if (effect === 'quick_repair') { applyCardEffect('quick_repair', 'player', 'player'); setQuickRepairCooldown(QUICK_REPAIR_COOLDOWN); }
    if (effect === 'ghost') { applyCardEffect('ghost', 'player', 'player'); setGhostCooldown(GHOST_COOLDOWN); }
    if (effect === 'second_chance') { applyCardEffect('second_chance', 'player', 'player'); setSecondChanceCooldown(SECOND_CHANCE_COOLDOWN); }
    if (effect === 'armor') { applyCardEffect('armor', 'player', 'player'); setArmorCooldown(ARMOR_COOLDOWN); }
    if (effect === 'slow_slow') {
      playCardSfx('slow_slow');

      botsRef.current.forEach(bot => {
        if (!bot.isDead) {
          applyCardEffect('slow_slow', bot.id, 'player');
        }
      });

      setSlowCooldown(SLOW_COOLDOWN);
    }
  }


  /* ================= DA O IMPULSO ================= */
  function handleAddImpulse() {
    if (gameOver || isNitroActive.current) return;
    playerSpeed.current = Math.min(
      playerSpeed.current + DYNAMIC_ACCELERATION_PER_TICK,
      DYNAMIC_MAX_SPEED,
    );
  }


  /* ================= HABILITA O SWAP ================= */
  function getRacerX(racerId: string) {
    if (racerId === 'player') {
      return playerIsDead.current ? null : playerXRef.current;
    }

    const bot = botsRef.current.find(b => b.id === racerId && !b.isDead);
    return bot?.x ?? null;
  }

  function hasOpponentAhead(callerId: string) {
    const callerX = getRacerX(callerId);
    if (callerX === null) return false;

    if (
      callerId !== 'player' &&
      !playerIsDead.current &&
      playerXRef.current > callerX
    ) {
      return true;
    }

    return botsRef.current.some(bot =>
      !bot.isDead &&
      bot.id !== callerId &&
      bot.x > callerX
    );
  }

  function finishSwap() {
    activeSwapRef.current = null;
    setCurrentSwapTarget(null);
    setActiveSwap(null);

    swapScaleAnim.stopAnimation();
    swapScaleAnim.setValue(1);
  }

  function triggerSwap(callerId: string) {
    // O processBotsAI roda dentro do game loop e pode carregar closures antigas.
    // A ref garante que nunca existam dois Swaps simultâneos.
    if (activeSwapRef.current) return false;

    // A carta só começa se houver pelo menos um corredor à frente.
    if (!hasOpponentAhead(callerId)) return false;

    const nextSwap = { callerId };

    activeSwapRef.current = nextSwap;
    swapScaleAnim.setValue(1);
    setActiveSwap(nextSwap);

    return true;
  }

  /* ================= HABILITA A CHAINS ================= */
  function triggerChains(callerId: string) {
    if (activeChains) return;
    setActiveChains({ callerId });
  }

  /* ================= HABILITA O MISSIL GUIADO ================= */
  function triggerBullet(callerId: string) {
    if (activeBulletEffect) return;
    setActiveBulletEffect({ callerId });
  }

  /* ================= HABILITA A CAIXA 'TNT' ================= */
  function handleTNTPress() {
    if (tntCooldown > 0) return;
    triggerTNT('player');
    setTntCooldown(TNT_COOLDOWN);
  }

  /* ================= HABILITA O TORNADO ================= */
  function triggerTornado(callerId: string) {
    if (activeTornado) return;
    setActiveTornado({ callerId });
  }

  function triggerNitroPower(callerId: string) {
    const status = callerId === 'player'
      ? playerStatus.current
      : botsRef.current.find(bot => bot.id === callerId)?.status;
    if (!status || status.empTimer > 0) return;
    applyCardEffect('nitro_power', callerId, callerId);
    if (callerId === 'player') setIsNitroPowerActive(true);
  }


  /* ================= IA DOS BOTS ================= */
  function isBotUnderThreat(bot: (typeof botsRef.current)[number]) {
    const guidedBulletComing = activeBulletsRef.current.some(bullet => bullet.targetId === bot.id);
    const nearbyTNT = activeTNTRef.current.some(tnt =>
      tnt.callerId !== bot.id &&
      tnt.state === 'counting' &&
      Math.abs(tnt.x - bot.x) < 220 &&
      Math.abs(tnt.y - bot.y) < 150
    );
    const chained = activeChainsStateRef.current?.targetId === bot.id;

    return guidedBulletComing || nearbyTNT || chained;
  }

  function shouldBotUseDefenseCard(bot: (typeof botsRef.current)[number], effect: CardEffect) {
    if (bot.status.empTimer > 0 && (effect === 'nitro_power' || effect === 'shield')) return false;
    const threatened = isBotUnderThreat(bot);
    const isReactiveDefense = effect === 'shield' || effect === 'armor' || effect === 'ghost';

    if (threatened && isReactiveDefense && Math.random() > BOT_DEFENSE_REACTION_CHANCE) {
      return false;
    }

    if (effect === 'quick_repair') return bot.lives <= bot.maxLives - 2;
    if (effect === 'second_chance') return !bot.status.secondChanceReady && bot.lives <= 2;
    if (effect === 'shield') return bot.status.shieldCharges === 0 && (threatened || bot.lives <= 3);
    if (effect === 'armor') return bot.status.armorCharges === 0 && (threatened || bot.lives <= 4);
    if (effect === 'ghost') return !bot.status.isGhost && (threatened || bot.lives <= 2);
    if (effect === 'nitro_power') return !threatened;
    if (effect === 'magnet') {
      if ((bot.activeEffectsTimers.magnet ?? 0) > 0) return false;
      return activePiecesRef.current.some(piece => {
        const dx = piece.x - bot.x;
        const dy = piece.y - bot.y;
        return dx * dx + dy * dy < MAGNET_RADIUS_SQ;
      });
    }

    return false;
  }

  function getBotLeaderTargetChance(
    bot: (typeof botsRef.current)[number],
    myRank: number,
    distanceToLeader: number,
  ) {
    const rankPressure = [
      0,
      0.92, // 2º colocado: quase sempre tenta derrubar o líder.
      0.82,
      0.70,
      0.58,
      0.48,
    ][myRank] ?? BOT_LEADER_TARGET_CHANCE;

    const difficultyModifier =
      bot.difficulty === 'easy'
        ? -0.12
        : bot.difficulty === 'rival'
          ? 0.08
          : 0;

    const distanceModifier =
      distanceToLeader <= BOT_CLOSE_LEADER_DISTANCE
        ? 0.06
        : distanceToLeader > 800
          ? -0.10
          : 0;

    return Math.max(
      BOT_PLAYER_TARGET_CHANCE,
      Math.min(0.96, rankPressure + difficultyModifier + distanceModifier),
    );
  }

  function chooseBotAttackTarget(
    bot: (typeof botsRef.current)[number],
    allRacers: { id: string; x: number; y: number; isPlayer: boolean }[],
    myRank: number,
  ) {
    const opponentsAhead = allRacers.slice(0, myRank);
    if (opponentsAhead.length === 0) return null;

    // O último elemento desta lista é o rival imediatamente à frente do bot.
    const nearestAhead = opponentsAhead[opponentsAhead.length - 1];
    const leader = allRacers[0];

    if (leader?.id === 'player') {
      const distanceToLeader = Math.max(0, playerXRef.current - bot.x);
      if (Math.random() < getBotLeaderTargetChance(bot, myRank, distanceToLeader)) {
        return 'player';
      }
    }

    // Se o player estiver à frente, mas não liderando, ainda pode virar alvo ocasional.
    const playerAhead = opponentsAhead.find(racer => racer.id === 'player');
    if (playerAhead) {
      const difficultyModifier =
        bot.difficulty === 'easy' ? -0.10 : bot.difficulty === 'rival' ? 0.10 : 0;

      const chance = Math.max(0.15, Math.min(0.65, BOT_PLAYER_TARGET_CHANCE + difficultyModifier));
      if (Math.random() < chance) return 'player';
    }

    return nearestAhead.id;
  }

  function getBotAttackCardScore(
    effect: CardEffect,
    bot: (typeof botsRef.current)[number],
    allRacers: { id: string; x: number; y: number; isPlayer: boolean }[],
    myRank: number,
  ) {
    const opponentsAhead = allRacers.slice(0, myRank);
    const opponentsBehind = allRacers.slice(myRank + 1);

    if (effect === 'tnt' || effect === 'oil_spit') {
      const nearestBehind = opponentsBehind[0];
      if (!nearestBehind) return Number.NEGATIVE_INFINITY;

      const rearDistance = bot.x - nearestBehind.x;
      if (rearDistance > BOT_TNT_REAR_RANGE) return Number.NEGATIVE_INFINITY;

      // TNT é uma arma de retaguarda. Liderando, passa a ser uma ótima escolha.
      return effect === 'tnt' ? (myRank === 0 ? 10 : 3) : (myRank === 0 ? 8 : 3.5);
    }

    // As demais cartas ofensivas precisam de alguém à frente.
    if (opponentsAhead.length === 0) return Number.NEGATIVE_INFINITY;

    switch (effect) {
      case 'tornado':
        return 6 + Math.min(3, opponentsAhead.length) * 1.5;
      case 'bullet':
        return 8.5;
      case 'emp_pulse':
        return 7.4;
      case 'swap':
        return myRank >= 2 ? 8 : 6.5;
      case 'chains':
        return 7.5;
      case 'bubble_lift':
        return 7.2;
      case 'slow_slow':
        return 6.5;
      case 'blind':
        return 5.5;
      default:
        return 5;
    }
  }

  function launchBotBullet(
    bot: (typeof botsRef.current)[number],
    targetId: string,
  ) {
    const targetAlive = targetId === 'player'
      ? !playerIsDead.current
      : Boolean(botsRef.current.find(racer => racer.id === targetId && !racer.isDead));

    if (!targetAlive) return false;

    activeBulletsRef.current.push({
      id: `bot-bullet-${Date.now()}-${Math.random()}`,
      callerId: bot.id,
      targetId,
      x: bot.x + PLAYER_SIZE / 2,
      y: bot.y + PLAYER_SIZE / 2,
      angle: 0,
    });

    return true;
  }

  function launchBotTornado(
    bot: (typeof botsRef.current)[number],
    allRacers: { id: string; x: number; y: number; isPlayer: boolean }[],
  ) {
    const victims = allRacers
      .filter(racer => racer.id !== bot.id && racer.x > bot.x)
      .map(racer => ({ id: racer.id, x: racer.x, y: racer.y }));

    if (victims.length === 0) return false;

    setTornadosToRender(prev => [
      ...prev,
      {
        id: `bot-tornado-${Date.now()}-${Math.random()}`,
        callerId: bot.id,
        callerX: bot.x,
        callerY: bot.y,
        victims,
      },
    ]);

    return true;
  }

  function processBotsAI() {
    const allRacers = [
      ...(!playerIsDead.current
        ? [{ id: 'player', x: playerXRef.current, y: y.current, isPlayer: true }]
        : []),
      ...botsRef.current
        .filter(bot => !bot.isDead)
        .map(bot => ({ id: bot.id, x: bot.x, y: bot.y, isPlayer: false })),
    ].sort((a, b) => b.x - a.x);

    botsRef.current.forEach(bot => {
      if (bot.isDead) return;
      if (bot.thinkTimer > 0) {
        bot.thinkTimer--;
        return;
      }

      const availableCards = bot.deck.filter(card => card.currentCooldown <= 0);
      if (availableCards.length === 0) return;

      const myRank = allRacers.findIndex(racer => racer.id === bot.id);
      if (myRank < 0) return;

      const underThreat = isBotUnderThreat(bot);

      // Nitro deixa de roubar a vez de um ataque. Defesas realmente urgentes continuam prioritárias.
      const urgentDefense = availableCards.find(card =>
        card.effect !== 'nitro_power' &&
        CARD_CATEGORIES.DEFENSE_BUFF.includes(card.effect as any) &&
        shouldBotUseDefenseCard(bot, card.effect as CardEffect)
      );

      const attackCandidates = availableCards
        .filter(card => !CARD_CATEGORIES.DEFENSE_BUFF.includes(card.effect as any))
        .map(card => ({
          card,
          score:
            getBotAttackCardScore(card.effect as CardEffect, bot, allRacers, myRank) +
            Math.random() * 1.5,
        }))
        .filter(candidate => Number.isFinite(candidate.score))
        .sort((a, b) => b.score - a.score);

      const nitroCard = availableCards.find(card =>
        card.effect === 'nitro_power' &&
        shouldBotUseDefenseCard(bot, 'nitro_power')
      );

      // Se a situação defensiva não é crítica, atacar vem antes de simplesmente buffar velocidade.
      const chosenCard = urgentDefense ?? attackCandidates[0]?.card ?? nitroCard;

      if (!chosenCard) {
        bot.thinkTimer = 6;
        return;
      }

      const isDefense = CARD_CATEGORIES.DEFENSE_BUFF.includes(chosenCard.effect as any);
      const target = isDefense
        ? bot.id
        : chooseBotAttackTarget(bot, allRacers, myRank);

      let executed = false;

      if (isDefense) {
        applyCardEffect(chosenCard.effect as CardEffect, bot.id, bot.id);
        executed = true;
      } else if (chosenCard.effect === 'tnt') {
        // TNT só chega aqui quando há um rival suficientemente perto atrás.
        triggerTNT(bot.id);
        executed = true;
      } else if (chosenCard.effect === 'oil_spit') {
        executed = triggerOilSpit(bot.id);
      } else if (!target) {
        executed = false;
      } else if (chosenCard.effect === 'swap') {
        // Mantém a animação especial do Swap. O efeito já escolhe um rival à frente.
        executed = triggerSwap(bot.id);
      } else if (chosenCard.effect === 'bullet') {
        // Bots lançam diretamente para o alvo decidido pela IA, permitindo vários mísseis simultâneos.
        executed = launchBotBullet(bot, target);
      } else if (chosenCard.effect === 'tornado') {
        // Tornado é naturalmente uma arma contra o pelotão à frente.
        executed = launchBotTornado(bot, allRacers);
      } else if (chosenCard.effect === 'bubble_lift') {
        executed = triggerBubbleLift(bot.id, target);
      } else if (chosenCard.effect === 'emp_pulse') {
        executed = triggerEmpPulse(bot.id, target);
      } else if (chosenCard.effect === 'chains') {
        // Uma corrente física por vez para não sobrescrever o estado existente.
        if (!activeChainsStateRef.current) {
          applyCardEffect('chains', target, bot.id);
          executed = true;
        }
      } else {
        applyCardEffect(chosenCard.effect as CardEffect, target, bot.id);
        executed = true;
      }

      // A carta só entra em cooldown se algo realmente aconteceu.
      if (!executed) {
        bot.thinkTimer = 4;
        return;
      }

      chosenCard.currentCooldown = chosenCard.baseCooldown;

      const thinkBase =
        bot.difficulty === 'easy'
          ? 12
          : bot.difficulty === 'rival'
            ? 5
            : 8;

      const thinkVariance =
        bot.difficulty === 'easy'
          ? 18
          : bot.difficulty === 'rival'
            ? 9
            : 13;

      // Ameaçado reage um pouco mais rápido; fora disso cada dificuldade mantém seu ritmo.
      bot.thinkTimer = Math.max(
        4,
        thinkBase + Math.floor(Math.random() * thinkVariance) - (underThreat ? 2 : 0),
      );
    });
  }


  /* ================= APLICA EFEITO DAS CARTAS (VAI SER REMOVIDO) ================= */
  function applyCardEffect(effect: CardEffect, targetId: string, sourceId: string) {
    const DURATION = 60 * 4;
    const CHAINS_DURATION = 60 * 5;

    if (effect === 'magnet') {
      if (targetId === 'player') {
        activeEffectsTimers.current.magnet = MAGNET_DURATION_FRAMES;
        playCardSfx('magnet');
      } else {
        const bot = botsRef.current.find(racer => racer.id === targetId && !racer.isDead);
        if (bot) bot.activeEffectsTimers.magnet = MAGNET_DURATION_FRAMES;
      }
      return;
    }

    const targetStatus = targetId === 'player'
      ? playerStatus.current
      : botsRef.current.find(b => b.id === targetId)?.status;
    // Proteção de última linha: qualquer chamador respeita o bloqueio eletrônico.
    if (targetStatus?.empTimer && (effect === 'nitro_power' || effect === 'shield')) return;
    const isHostileEffect = sourceId !== targetId && !CARD_CATEGORIES.DEFENSE_BUFF.includes(effect as any);
    if (isHostileEffect && targetStatus?.isGhost) {
      registerSuccessfulDefense(targetId, sourceId);
      return;
    }

    if (isHostileEffect) {
      registerSuccessfulAttack(sourceId, targetId);
    }

    if (effect === 'swap') {
      const sourceBot = botsRef.current.find(b => b.id === sourceId);
      if (sourceId === 'player') {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) {
          const tempY = y.current;
          const tempX = playerXRef.current;

          y.current = targetBot.y;
          playerXRef.current = targetBot.x;

          targetBot.y = tempY;
          targetBot.x = tempX;
        }
      } else if (sourceBot) {
        if (targetId === 'player') {
          const tempY = y.current;
          const tempX = playerXRef.current;
          y.current = sourceBot.y;
          playerXRef.current = sourceBot.x;
          sourceBot.y = tempY;
          sourceBot.x = tempX;
        } else {
          const targetBot = botsRef.current.find(b => b.id === targetId);
          if (targetBot) {
            const tempY = targetBot.y;
            const tempX = targetBot.x;
            targetBot.y = sourceBot.y;
            sourceBot.y = tempY;
            targetBot.x = sourceBot.x;
            sourceBot.x = tempX;
          }
        }
      }
      return;
    }

    if (effect === 'chains') {
      const newState = {
        callerId: sourceId,
        targetId: targetId,
        duration: CHAINS_DURATION
      };

      setActiveChainsState(newState); // Atualiza a tela
      activeChainsStateRef.current = newState; // Atualiza a física do loop
      return;
    }

    if (effect === 'quick_repair') {
      if (targetId === 'player') {
        const previousLives = playerLivesRef.current;
        playerLivesRef.current = Math.min(INITIAL_LIVES, playerLivesRef.current + 2);
        const repairedLives = playerLivesRef.current - previousLives;
        setPlayerLives(playerLivesRef.current);
        if (repairedLives > 0) triggerDefenseVisual('player', 'repair', repairedLives);
      } else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) {
          const previousLives = targetBot.lives;
          targetBot.lives = Math.min(targetBot.maxLives, targetBot.lives + 2);
          const repairedLives = targetBot.lives - previousLives;
          if (repairedLives > 0) triggerDefenseVisual(targetBot.id, 'repair', repairedLives);
        }
      }
      return;
    }

    if (effect === 'shield') {
      if (targetId === 'player') {
        playerStatus.current.shieldCharges = 1;
        syncPlayerProtectionHud();
      } else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) targetBot.status.shieldCharges = 1;
      }
      triggerDefenseVisual(targetId, 'shield_activate');
      return;
    }

    if (effect === 'armor') {
      if (targetId === 'player') {
        playerStatus.current.armorCharges = 2;
        syncPlayerProtectionHud();
      } else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) targetBot.status.armorCharges = 2;
      }
      triggerDefenseVisual(targetId, 'armor_activate');
      return;
    }

    if (effect === 'second_chance') {
      if (targetId === 'player') {
        playerStatus.current.secondChanceReady = true;
        syncPlayerProtectionHud();
      } else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) targetBot.status.secondChanceReady = true;
      }
      triggerDefenseVisual(targetId, 'second_chance_arm');
      return;
    }

    if (targetId === 'player') {
      activeEffectsTimers.current[effect] = effect === 'ghost' ? 60 * 3 : DURATION;
      switch (effect) {
        case 'blind':
          playerStatus.current.isBlind = true;
          setIsBlindActive(true);
          break;
        case 'score_boost':
          playerStatus.current.scoreMultiplier = 2;
          break;
        case 'slow_slow':
          playerStatus.current.isSlowed = true;
          setIsSlowActive(true);
          if (sourceId !== 'player') {
            playCardSfx('slow_slow');
          }
          break;
        case 'bubble_lift':
          playerStatus.current.isLevitating = true;
          playerStatus.current.bubbleLiftStartY = y.current;
          activeEffectsTimers.current.bubble_lift = BUBBLE_DURATION;

          velocity.current = 0;
          isGrounded.current = false;
          break;
        case 'ghost':
          playerStatus.current.isGhost = true;
          syncPlayerProtectionHud();
          triggerDefenseVisual('player', 'ghost_activate');
          break;
      }
    } else {
      const targetBot = botsRef.current.find(b => b.id === targetId);
      if (targetBot) {
        targetBot.activeEffectsTimers[effect] = DURATION;
        if (effect === 'blind') {
          targetBot.status.isBlind = true;
          targetBot.activeEffectsTimers.blind = DURATION;
        }
        if (effect === 'slow_slow') {
          targetBot.status.isSlowed = true;
          targetBot.activeEffectsTimers.slow_slow = DURATION;
        }
        if (effect === 'bubble_lift') {
          targetBot.status.isLevitating = true;
          targetBot.status.bubbleLiftStartY = targetBot.y;

          targetBot.activeEffectsTimers.bubble_lift =
            BUBBLE_DURATION;

          targetBot.velocity = 0;
        }
        if (effect === 'ghost') {
          targetBot.status.isGhost = true;
          targetBot.activeEffectsTimers.ghost = 60 * 3;
          triggerDefenseVisual(targetBot.id, 'ghost_activate');
        }
      }
    }
  }

  /* ================= DANO, PROTEÇÃO E SEGUNDA CHANCE ================= */
  function applyDamage(racerId: string, sourceId?: string) {
    if (racerId === 'player') {
      const status = playerStatus.current;
      if (status.invincibleTimer > 0 || playerIsDead.current) return false;

      if (status.isGhost) {
        registerSuccessfulDefense('player', sourceId);
        triggerDefenseVisual('player', 'ghost_evade');
        return false;
      }

      // Escudo bloqueia completamente o ataque e também o empurrão.
      if (status.shieldCharges > 0) {
        registerSuccessfulDefense('player', sourceId);
        status.shieldCharges -= 1;
        status.invincibleTimer = 20;
        syncPlayerProtectionHud();
        triggerDefenseVisual('player', 'shield_break');
        return false;
      }

      // Blindagem segura o coração, mas o impacto físico continua acontecendo.
      if (status.armorCharges > 0) {
        registerSuccessfulDefense('player', sourceId);
        status.armorCharges -= 1;
        status.invincibleTimer = 90;
        syncPlayerProtectionHud();
        triggerDefenseVisual('player', 'armor_hit');
        return true;
      }

      playerLivesRef.current -= 1;
      racePerformanceRef.current.livesLost += 1;
      status.invincibleTimer = 90;

      spawnPieces(playerXRef.current, y.current, 3);
      const types: PartType[] = ['motor', 'spray', 'engrenagem'];
      for (let i = 0; i < 3; i++) {
        const t = types[Math.floor(Math.random() * types.length)];
        sessionPartsRef.current[t] = Math.max(0, sessionPartsRef.current[t] - 1);
      }
      setSessionPartsHud({ ...sessionPartsRef.current });

      if (playerLivesRef.current <= 0 && status.secondChanceReady) {
        status.secondChanceReady = false;
        playerLivesRef.current = 1;
        status.invincibleTimer = 120;
        syncPlayerProtectionHud();
        triggerDefenseVisual('player', 'second_chance_revive');
      }

      setPlayerLives(playerLivesRef.current);
      syncRaceObjectivesHud();

      if (playerLivesRef.current <= 0) {
        playerIsDead.current = true;
        playerSpeed.current = 0;
        setTimeout(() => setGameOver(true), 1000);
      }
      return true;
    }

    const bot = botsRef.current.find(b => b.id === racerId);
    if (!bot) return false;

    const status = bot.status;
    if (status.invincibleTimer > 0 || bot.isDead) return false;

    if (status.isGhost) {
      triggerDefenseVisual(bot.id, 'ghost_evade');
      return false;
    }

    if (status.shieldCharges > 0) {
      status.shieldCharges -= 1;
      status.invincibleTimer = 20;
      triggerDefenseVisual(bot.id, 'shield_break');
      return false;
    }

    if (status.armorCharges > 0) {
      status.armorCharges -= 1;
      status.invincibleTimer = 90;
      triggerDefenseVisual(bot.id, 'armor_hit');
      return true;
    }

    bot.lives -= 1;
    status.invincibleTimer = 90;
    spawnPieces(bot.x, bot.y, 2, true);

    if (bot.lives <= 0 && status.secondChanceReady) {
      status.secondChanceReady = false;
      bot.lives = 1;
      status.invincibleTimer = 120;
      triggerDefenseVisual(bot.id, 'second_chance_revive');
    }

    if (bot.lives <= 0) {
      bot.isDead = true;
      bot.speed = 0;
      spawnPieces(bot.x, bot.y, 10, true, true);

      if (sourceId === 'player') {
        racePerformanceRef.current.opponentsEliminated += 1;
        syncRaceObjectivesHud();
      }
    }

    return true;
  }


  // /* ================= APLICA EFEITO DO SWAP (VAI SER REMOVIDO) ================= */
  // function handleSwapPress() {
  //   if (swapCooldown > 0) return;
  //   triggerSwap('player');
  //   setSwapCooldown(SWAP_COOLDOWN);
  // }

  // /* ================= APLICA EFEITO DO CHAINS (VAI SER REMOVIDO) ================= */
  // function handleChainsPress() {
  //   if (chainsCooldown > 0) return;
  //   triggerChains('player');
  //   setChainsCooldown(CHAINS_COOLDOWN);
  // }

  // /* ================= APLICA EFEITO DO MISSIL GUIADO (VAI SER REMOVIDO) ================= */
  // function handleBulletPress() {
  //   if (bulletCooldown > 0) return;
  //   triggerBullet('player');
  //   setBulletCooldown(BULLET_COOLDOWN);
  // }

  // /* ================= APLICA EFEITO DO TORNADO (VAI SER REMOVIDO) ================= */
  // function handleTornadoPress() {
  //   if (tornadoCooldown > 0) return;
  //   triggerTornado('player');
  //   setTornadoCooldown(TORNADO_COOLDOWN);
  // }

  // /* ================= APLICA EFEITO DO NITRO (VAI SER REMOVIDO) ================= */
  // function handleNitroPowerPress() {
  //   if (nitroCooldown > 0) return;
  //   triggerNitroPower('player');
  //   setNitroCooldown(NITRO_COOLDOWN);
  // }

  // /* ================= APLICA EFEITO DO SLOW SLOW (VAI SER REMOVIDO) ================= */
  // function handleSlowPress() {
  //   if (slowCooldown > 0) return;
  //   botsRef.current.forEach(bot => {
  //     applyCardEffect('slow_slow', bot.id, 'player');
  //   });

  //   setSlowCooldown(SLOW_COOLDOWN);
  // }

  /** Pulso individual no rival à frente. Não há explosão, dano ou hitbox em área.
   * Ghost evade, Shield já ativo absorve a descarga; Armor e Second Chance não
   * são removidos. Novo Shield/Nitro Power ficam bloqueados por dois segundos.
   */
  function triggerEmpPulse(callerId: string, preferredTargetId?: string): boolean {
    const callerX = getRacerX(callerId);
    if (callerX === null) return false;

    const isEligible = (id: string) => {
      const x = getRacerX(id);
      return id !== callerId && x !== null && x > callerX;
    };

    const targetId = preferredTargetId && isEligible(preferredTargetId)
      ? preferredTargetId
      : !preferredTargetId
        ? [
            ...(!playerIsDead.current ? ['player'] : []),
            ...botsRef.current.filter(bot => !bot.isDead).map(bot => bot.id),
          ]
            .filter(isEligible)
            .sort((a, b) => (getRacerX(a) ?? Infinity) - (getRacerX(b) ?? Infinity))[0]
        : undefined;

    if (!targetId) return false;
    const bot = targetId === 'player' ? null : botsRef.current.find(b => b.id === targetId);
    const status = targetId === 'player' ? playerStatus.current : bot?.status;
    if (!status) return false;

    // A carta foi disparada: mesmo quando defendida, cooldown e boost são cobrados.
    playCardSfx('emp_pulse');
    if (status.isGhost) {
      registerSuccessfulDefense(targetId, callerId);
      triggerDefenseVisual(targetId, 'ghost_evade');
      return true;
    }
    if (status.shieldCharges > 0) {
      status.shieldCharges -= 1;
      registerSuccessfulDefense(targetId, callerId);
      triggerDefenseVisual(targetId, 'shield_break');
      if (targetId === 'player') syncPlayerProtectionHud();
      return true;
    }

    // Reaplicar durante o efeito não prolonga a duração indefinidamente.
    if (status.empTimer > 0) return true;
    status.empTimer = EMP_DURATION_FRAMES;

    if (targetId === 'player') {
      // Nitro de vácuo/largada: cancelar somente se estava ativo.
      if (isNitroActive.current) {
        isNitroActive.current = false;
        nitroTimer.current = 0;
        nitroCharge.current = 0;
        setNitroReady(false);
        setNitroPercent(0);
      }
      // Nitro Power: remover o multiplicador imediatamente, sem apagar outros efeitos.
      activeEffectsTimers.current.nitro_power = 0;
      setIsNitroPowerActive(false);
      const normalLimit = DYNAMIC_MAX_SPEED *
        (playerStatus.current.isSlowed ? SLOW_SPEED_MULTIPLIER : 1);
      playerSpeed.current = Math.min(playerSpeed.current, normalLimit);
    } else if (bot) {
      bot.activeEffectsTimers.nitro_power = 0;
      bot.targetSpeed = Math.min(bot.targetSpeed, bot.stats.maxSpeed);
      bot.speed = Math.min(bot.speed, bot.stats.maxSpeed);
    }
    registerSuccessfulAttack(callerId, targetId);
    return true;
  }

  /** Resposta única ao contato: Ghost atravessa; Shield/Armor absorvem;
   * sem defesa a derrapagem reduz tração/velocidade sem remover corações.
   * A poça só é consumida em contato efetivo com um alvo válido.
   */
  function applyOilSpitHit(racerId: string, sourceId: string): boolean {
    const bot = racerId === 'player' ? null : botsRef.current.find(b => b.id === racerId);
    if (racerId !== 'player' && (!bot || bot.isDead)) return false;
    const status = racerId === 'player' ? playerStatus.current : bot!.status;
    if (status.isGhost || status.invincibleTimer > 0) return false;
    if (status.oilSlipTimer > 0) return true; // sem stacking/refresh infinito
    if (status.shieldCharges > 0) {
      status.shieldCharges -= 1;
      status.invincibleTimer = 20;
      registerSuccessfulDefense(racerId, sourceId);
      triggerDefenseVisual(racerId, 'shield_break');
      if (racerId === 'player') syncPlayerProtectionHud();
      return true;
    }
    if (status.armorCharges > 0) {
      status.armorCharges -= 1;
      status.invincibleTimer = 20;
      registerSuccessfulDefense(racerId, sourceId);
      triggerDefenseVisual(racerId, 'armor_hit');
      if (racerId === 'player') syncPlayerProtectionHud();
      return true;
    }
    status.oilSlipTimer = OIL_SLIP_FRAMES;
    registerSuccessfulAttack(sourceId, racerId);
    return true;
  }

  function triggerOilSpit(callerId: string): boolean {
    const callerBot = callerId === 'player' ? null : botsRef.current.find(bot => bot.id === callerId);
    if (callerId !== 'player' && (!callerBot || callerBot.isDead)) return false;
    if (callerId === 'player' && playerIsDead.current) return false;
    const callerX = callerId === 'player' ? playerXRef.current : callerBot!.x;
    const oil: OilPuddle = {
      id: ++oilSequenceRef.current,
      callerId,
      x: callerX - 45,
      remainingFrames: OIL_PUDDLE_FRAMES,
      armFrames: OIL_ARM_FRAMES,
    };
    // Limite fixo de poças ativas, mesmo com vários bots usando a carta.
    activeOilRef.current.push(oil);
    if (activeOilRef.current.length > OIL_MAX_PUDDLES) activeOilRef.current.shift();
    return true;
  }

  /* ================= APLICA O EFEITO DA CAIXA 'TNT' (VAI SER REMOVIDO) ================= */
  function triggerTNT(callerId: string) {
    const callerX = callerId === 'player' ? playerXRef.current : botsRef.current.find(b => b.id === callerId)?.x || 0;
    const callerY = callerId === 'player' ? y.current : botsRef.current.find(b => b.id === callerId)?.y || 0;

    activeTNTRef.current.push({
      id: Math.random().toString(),
      callerId,
      x: callerX - 60,
      y: callerY,
      timer: 60 * 10,
      state: 'counting'
    });
  }

  /* ================= APLICA O EFEITO DA BUBBLE LIFT (VAI SER REMOVIDO) ================= */
  function triggerBubbleLift(callerId: string, preferredTargetId?: string): boolean {
    const callerBot =
      callerId === 'player'
        ? null
        : botsRef.current.find(b => b.id === callerId);

    if (callerId !== 'player' && (!callerBot || callerBot.isDead)) {
      return false;
    }

    const callerX =
      callerId === 'player'
        ? playerXRef.current
        : callerBot!.x;

    const callerY =
      callerId === 'player'
        ? y.current
        : callerBot!.y;

    const racers = [
      {
        id: 'player',
        x: playerXRef.current,
        isDead: playerIsDead.current,
        isLevitating: playerStatus.current.isLevitating,
      },

      ...botsRef.current.map(bot => ({
        id: bot.id,
        x: bot.x,
        isDead: bot.isDead,
        isLevitating: bot.status.isLevitating,
      })),
    ];

    const targetsAhead = racers
      .filter(racer =>
        racer.id !== callerId &&
        !racer.isDead &&
        !racer.isLevitating &&
        racer.x > callerX + 20
      )
      .sort((a, b) => a.x - b.x);

    const preferredTarget = preferredTargetId
      ? targetsAhead.find(racer => racer.id === preferredTargetId)
      : undefined;

    const target = preferredTarget ?? targetsAhead[0];

    if (!target) {
      return false;
    }

    activeBubblesRef.current.push({
      id: `bubble-${Date.now()}-${Math.random()}`,
      callerId,
      targetId: target.id,
      x: callerX + PLAYER_SIZE,
      y: callerY + PLAYER_SIZE / 2,
      angle: 0,
      life: 60 * 4,
    });

    return true;
  }

  /* ================= RECEBE O IMPACTO DO TORNADO ================= */
  function handleTornadoHit(victimId: string, sourceId?: string) {
    const JUMP_PENALTY = JUMP_FORCE * 1.5;
    const hit = applyDamage(victimId, sourceId);

    // Respeita morte e o período de invencibilidade após outro impacto.
    if (!hit) return;

    if (sourceId) {
      registerSuccessfulAttack(sourceId, victimId);
    }

    if (victimId === 'player') {
      playerSpeed.current = 0;
      velocity.current = JUMP_PENALTY;
      isGrounded.current = false;
      playerStatus.current.isStunned = true;
    } else {
      const targetBot = botsRef.current.find(b => b.id === victimId);
      if (targetBot) {
        targetBot.speed = 0;
        targetBot.velocity = JUMP_PENALTY;
        targetBot.status.isStunned = true;

      }
    }
  }

  /* ================= ESPALHA PEÇAS NO CAMPO ================= */
  function spawnPieces(
    originX: number,
    originY: number,
    amount: number,
    canDropChips = false,
    guaranteedChip = false,
  ) {
    const resources: PartType[] = ['motor', 'spray', 'engrenagem'];
    for (let i = 0; i < amount; i++) {
      const isChip = canDropChips && (guaranteedChip && i === 0 || Math.random() < CHIP_DROP_CHANCE);
      const type: PartType = isChip ? 'chips' : resources[Math.floor(Math.random() * resources.length)];
      activePiecesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: originX + (Math.random() * 60) - 30,
        y: originY,
        type,
        velY: -5 - Math.random() * 5,
      });
    }
    // Não manter drop antigo fora de cena consumindo o loop de 60 Hz.
    if (activePiecesRef.current.length > MAX_DROPPED_ITEMS) {
      activePiecesRef.current.splice(0, activePiecesRef.current.length - MAX_DROPPED_ITEMS);
    }
  }


  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const focusOn = (targetX: number, zoom: boolean = true) => {
    const toScale = zoom ? 2 : 1;
    const targetCenter = targetX + (PLAYER_SIZE / 2);

    const offset = zoom
      ? (SCREEN_WIDTH / 2 - targetCenter) * toScale
      : 0;
    cameraTransformRef.current = { x: offset, scale: toScale };
    cameraXAnim.setValue(offset);
    cameraScaleAnim.setValue(toScale);
  };


  /* ================= SEQUENCIA DE PREPARAÇÃO DA CORRIDA ================= */
  const startRaceSequence = async () => {
    if (isCountingRef.current) return;
    isCountingRef.current = true;
    miniGameClicksRef.current = 0;
    if (tutorialModeRef.current) {
      setTutorialPerfectStartHits(0);
    }

    setCountdownStep('PREPARANDO');
    await sleep(1500);

    const triggerMiniGame = (slotIndex: number) => {
      const maxTop = SCREEN_HEIGHT - 120;
      const maxLeft = SCREEN_WIDTH - 120;

      if (tutorialModeRef.current) {
        // Na primeira corrida, os três raios continuam usando o minigame REAL,
        // mas aparecem em posições previsíveis e longe do HUD inferior.
        const tutorialPositions = [
          { left: SCREEN_WIDTH * 0.20, top: SCREEN_HEIGHT * 0.20 },
          { left: SCREEN_WIDTH * 0.48, top: SCREEN_HEIGHT * 0.28 },
          { left: SCREEN_WIDTH * 0.76, top: SCREEN_HEIGHT * 0.20 },
        ];

        const position = tutorialPositions[Math.min(slotIndex, 2)];

        setMiniGamePos({
          top: Math.max(44, Math.min(maxTop, position.top)),
          left: Math.max(44, Math.min(maxLeft, position.left)),
        });
      } else {
        setMiniGamePos({
          top: Math.max(50, Math.floor(Math.random() * maxTop)),
          left: Math.max(50, Math.floor(Math.random() * maxLeft)),
        });
      }

      setMiniGameVisible(true);
      setTimeout(() => setMiniGameVisible(false), 800);
    };

    if (botsRef.current[0]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(3);
      setFocusedDriver(null);
      setFocusedDriver(0);
      focusOn(botsRef.current[0].x);
      triggerMiniGame(0);
    }
    await sleep(1000);

    if (botsRef.current[1]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(2);
      setFocusedDriver(null);
      setFocusedDriver(1);
      focusOn(botsRef.current[1].x);
      triggerMiniGame(1);

    }
    await sleep(1000);

    if (botsRef.current[2]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(1);
      setFocusedDriver(null);
      setFocusedDriver(2);
      focusOn(botsRef.current[2].x);
      triggerMiniGame(2);
    }
    await sleep(1000);

    setFocusedDriver(null);
    setCountdownStep('JÁ!');

    playMusic(MAP_MUSIC, {
      volume: 0.5,
      loop: true,
      restart: true,
    });

    setIsCameraLocked(false);
    setStarted(true);

    isCountingRef.current = false;

    const earnedPerfectStart =
      miniGameClicksRef.current >= 3;

    if (earnedPerfectStart) {
      isNitroActive.current = true;
      nitroTimer.current = NITRO_DURATION;
    }

    if (
      tutorialModeRef.current &&
      tutorialStepRef.current === 'perfect_start' &&
      !earnedPerfectStart
    ) {
      // Sem Nitro de largada, já podemos ensinar o acelerador.
      // Se houve largada perfeita, a mudança acontece no instante exato
      // em que o nitro inicial termina dentro do game loop.
      moveTutorialTo('perfect_start', 'accelerate');
    }

    await sleep(800);
    setCountdownStep(null);
  };

  const handleTutorialContinue = () => {
    if (!tutorialModeRef.current || tutorialDoneRef.current) return;

    const currentStep = tutorialStepRef.current;

    // Na primeira dica, CONTINUAR é literalmente o gatilho da largada.
    if (currentStep === 'perfect_start' && !started && !isCountingRef.current) {
      setTutorialVisible(false);
      setTutorialPause(false);
      startRaceSequence();
      return;
    }

    // A última dica encerra o onboarding. A corrida segue livre dali em diante.
    if (currentStep === 'finish') {
      finishTutorial();
      return;
    }

    setTutorialVisible(false);
    setTutorialPause(false);
  };

  const handleSkipTutorial = () => {
    const shouldStartRace = !started && !isCountingRef.current;

    finishTutorial();

    // Se PULAR for usado antes da contagem, não deixamos a corrida parada.
    if (shouldStartRace) {
      startRaceSequence();
    }
  };

  /* ================= TRANSIÇÃO DE TELA APÓS TERMINO DA CORRIDA ================= */
  const handleFinishTransitionComplete =
    useCallback(() => {
      router.replace('/RaceResultScreen' as any,);
    }, [router]);


  /* ================= NITRO COMEÇO DA CORRIDA ================= */
  const handleMiniGamePress = () => {
    if (!miniGameVisible) return;

    miniGameClicksRef.current += 1;

    if (
      tutorialModeRef.current &&
      tutorialStepRef.current === 'perfect_start'
    ) {
      setTutorialPerfectStartHits(
        Math.min(miniGameClicksRef.current, 3),
      );
    }

    setMiniGameVisible(false);
  };

  function handleJump() {
    if (gameOver) return;

    if (playerStatus.current.controlsInverted) {
      isCrouchingRef.current = true; setIsCrouching(true);
      setTimeout(() => { isCrouchingRef.current = false; setIsCrouching(false); }, 500);
      return;
    }

    if (isGrounded.current) { velocity.current = DYNAMIC_JUMP_FORCE; isGrounded.current = false; }
  }

  /* ================= ATIVA O NITRO ================= */
  function handleActivateNitro() {
    if (playerStatus.current.empTimer > 0) return;
    if (isNitroReady && !isNitroActive.current) {
      isNitroActive.current = true;
      nitroTimer.current = NITRO_DURATION;
      setNitroReady(false);

      if (
        tutorialModeRef.current &&
        tutorialStepRef.current === 'nitro'
      ) {
        moveTutorialTo('nitro', 'finish');
      }
    }
  }

  /* ================= POSIÇÕES DOS PLAYERS E BOTS ================= */
  const allRacersPositions = [
    {
      id: 'player',
      x: playerXRef.current,
      y: y.current,
      color: selectedColorFront || '#00D084',
      isPlayer: true,
    },
    ...botsRef.current
      .filter(bot => !bot.isDead)
      .map(bot => ({
        id: bot.id,
        x: bot.x,
        y: bot.y,
        color: bot.carColorFront,
        isPlayer: false,
      })),
  ];

  const minMapX = Math.min(...allRacersPositions.map(r => r.x));
  const maxMapX = Math.max(...allRacersPositions.map(r => r.x));
  const mapSpan = Math.max(2000, maxMapX - minMapX);

  // Lista lateral baseada na mesma referência espacial da corrida/minimapa.
  // O roster é fixo: quem for eliminado permanece visível com 0 vidas.
  const raceHudPlayers = raceRoster
    .map((racer, rosterIndex) => {
      if (racer.isPlayer) {
        return {
          ...racer,
          rosterIndex,
          x: playerXRef.current,
          lives: Math.max(0, playerLives),
          isDead: playerIsDead.current || playerLives <= 0,
        };
      }

      const bot = botsRef.current.find(item => item.id === racer.id);
      return {
        ...racer,
        rosterIndex,
        x: bot?.x ?? Number.NEGATIVE_INFINITY,
        lives: Math.max(0, bot?.lives ?? 0),
        isDead: !bot || bot.isDead || (bot.lives ?? 0) <= 0,
      };
    })
    .sort((a, b) => {
      if (a.isDead !== b.isDead) return a.isDead ? 1 : -1;
      if (a.isDead && b.isDead) return a.rosterIndex - b.rosterIndex;
      return b.x - a.x;
    });

  const hasActiveProtection =
    playerProtectionHud.shieldCharges > 0 ||
    playerProtectionHud.armorCharges > 0 ||
    playerProtectionHud.secondChanceReady ||
    playerProtectionHud.isGhost;

  return (
    <View style={styles.container}>
      <MemoCenarioBackground
        isMoving={started && !gameOver && !tutorialPaused}
        mapId={selectedMapId}
        skyTheme={selectedSkyTheme}
        groundY={GROUND_Y}
        travelX={scenarioTravelAnim}
      />
      <View style={StyleSheet.absoluteFillObject} />

      {/* Pista única e reta: um único View substitui todos os blocos e fatias de curvas. */}
      <View
        pointerEvents="none"
        style={[
          styles.flatGround,
          {
            top: GROUND_Y,
            height: Math.max(100, SCREEN_HEIGHT - GROUND_Y),
          },
        ]}
      />

      {/* ================= HUD ESQUERDO: CORREDORES + LOOT ================= */}
      <View style={styles.leftHud} pointerEvents="none">
        <View style={styles.racersPanel}>
          {raceHudPlayers.map((racer, index) => (
            <View
              key={racer.id}
              style={[
                styles.racerHudRow,
                racer.isPlayer && styles.racerHudRowPlayer,
                racer.isDead && styles.racerHudRowDead,
              ]}
            >
              <Text style={styles.racerHudPosition}>{index + 1}</Text>
              <View style={[styles.racerHudDot, { backgroundColor: racer.color }]} />
              <Text
                numberOfLines={1}
                style={[
                  styles.racerHudName,
                  racer.isPlayer && styles.racerHudNamePlayer,
                ]}
              >
                {racer.name}
              </Text>
              <Text style={styles.racerHudHeart}>{racer.isDead ? '☠' : '♥'}</Text>
              <Text style={[styles.racerHudLives, { color: getLifeColor(racer.lives) }]}>
                {racer.lives}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.lootPanel}>
          {/* Esquerda: engrenagens + carteira e ganho provisório de CHIPs. */}
          <View style={styles.lootColumn}>
            <View style={styles.lootChip} accessibilityLabel={`Engrenagens coletadas: ${sessionPartsHud.engrenagem}`}>
              <Text style={styles.lootIcon}>⚙️</Text>
              <Text style={styles.lootValue} numberOfLines={1}>{sessionPartsHud.engrenagem}</Text>
            </View>
            <View style={[styles.lootChip, styles.lootChipsWallet]} accessibilityLabel={`Saldo de CHIPS: ${profile?.parts?.chips ?? 0}; coletados nesta corrida: ${sessionPartsHud.chips}`}>
              <Text style={styles.lootIcon}>🔳</Text>
              <Text style={styles.lootValue} numberOfLines={1}>{profile?.parts?.chips ?? 0}</Text>
              {sessionPartsHud.chips > 0 && <Text style={styles.lootChipsEarned}>+{sessionPartsHud.chips}</Text>}
            </View>
          </View>
          {/* Direita: peças e sprays coletados nesta corrida. */}
          <View style={styles.lootColumn}>
            <View style={styles.lootChip} accessibilityLabel={`Peças coletadas: ${sessionPartsHud.motor}`}>
              <Text style={styles.lootIcon}>🔧</Text>
              <Text style={styles.lootValue} numberOfLines={1}>{sessionPartsHud.motor}</Text>
            </View>
            <View style={styles.lootChip} accessibilityLabel={`Sprays coletados: ${sessionPartsHud.spray}`}>
              <Text style={styles.lootIcon}>🎨</Text>
              <Text style={styles.lootValue} numberOfLines={1}>{sessionPartsHud.spray}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= MINI-MAPA ================= */}
      <View style={styles.miniMapContainer}>
        <View style={styles.miniMapLine} />
        {activeTornado && (
          <TornadoEffect
            callerId={activeTornado.callerId}
            allRacers={allRacersPositions}
            onTornadoAnnounced={(victims, callerX, callerY) => {
              setTornadosToRender(prev => [
                ...prev,
                {
                  id: Math.random().toString(36).substring(2, 10),
                  callerId: activeTornado.callerId,
                  callerX,
                  callerY,
                  victims,
                },
              ]);
              setActiveTornado(null);
            }}
            onCancel={() => setActiveTornado(null)}
          />
        )}
        {allRacersPositions.map(racer => {
          const progress = (racer.x - minMapX) / mapSpan;
          const isSwapTarget = racer.id === currentSwapTarget;
          return (
            <View
              key={racer.id}
              style={[
                styles.miniMapDot,
                {
                  backgroundColor: racer.color,
                  left: `${progress * 100}%`,
                  zIndex: racer.isPlayer ? 10 : 1,
                  width: racer.isPlayer ? 14 : 10,
                  height: racer.isPlayer ? 14 : 10,
                  borderRadius: racer.isPlayer ? 7 : 5,
                  shadowColor: '#FF004D',
                  shadowOpacity: isSwapTarget ? 1 : 0,
                  shadowRadius: isSwapTarget ? 10 : 0,
                  elevation: isSwapTarget ? 12 : 0,
                  transform: [
                    {
                      translateX: racer.isPlayer ? -7 : -5
                    },
                    {
                      scale: isSwapTarget ? 1.8 : 1
                    }
                  ],
                  borderWidth:
                    isSwapTarget
                      ? 2
                      : racer.isPlayer
                        ? 1
                        : 0,

                  borderColor:
                    isSwapTarget
                      ? '#FF004D'
                      : '#FFF',
                }
              ]}
            />
          );
        })}
        {activeSwap && (
          <SwapEffect
            callerId={activeSwap.callerId}
            allRacers={allRacersPositions}
            scaleAnim={swapScaleAnim}
            onTargetChange={(targetId) => {
              setCurrentSwapTarget(targetId);
            }}
            onSwapExecute={(targetId) => {
              // As posições reais são invertidas quando os dois carros estão quase invisíveis.
              applyCardEffect('swap', targetId, activeSwap.callerId);
            }}
            onComplete={finishSwap}
            onCancel={finishSwap}
          />
        )}
        {activeChains && (
          <ChainsEffect
            callerId={activeChains.callerId}
            allRacers={allRacersPositions}
            onChainsExecute={(targetId) => {
              applyCardEffect('chains', targetId, activeChains.callerId);
              setActiveChains(null);
            }}
          />
        )}
      </View>

      {/* ================= HUD DIREITO: TEMPO + OBJETIVOS + PROTEÇÕES ================= */}
      <View style={styles.rightHud} pointerEvents="none">
        <Animated.View
          style={[
            styles.timerBadge,
            timeRemaining <= 30 && styles.timerBadgeDanger,
            timeRemaining <= 10 && styles.timerBadgeCritical,
            { transform: [{ scale: timerPulseAnim }] },
          ]}
        >
          <Text
            style={[
              styles.scoreText,
              timeRemaining <= 30 && styles.scoreTextDanger,
              timeRemaining <= 10 && styles.scoreTextCritical,
            ]}
          >
            ⏱ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </Text>
        </Animated.View>

        {!isTutorial && (
          <View style={styles.objectivesSlot}>
            <RaceObjectivesHUD objectives={raceObjectivesHud} />
          </View>
        )}

        {playerStatus.current.empTimer > 0 && (
          <View style={styles.empHudBadge}>
            <Text style={styles.empHudText}>⚡ EMP {Math.ceil(playerStatus.current.empTimer / 60)}s</Text>
          </View>
        )}

        {hasActiveProtection && (
          <View style={styles.protectionPanel}>
            {playerProtectionHud.shieldCharges > 0 && (
              <View style={styles.protectionChip}>
                <Text style={styles.protectionIcon}>🛡️</Text>
                <Text style={styles.protectionValue}>{playerProtectionHud.shieldCharges}</Text>
              </View>
            )}
            {playerProtectionHud.armorCharges > 0 && (
              <View style={styles.protectionChip}>
                <Text style={styles.protectionIcon}>🧱</Text>
                <Text style={styles.protectionValue}>{playerProtectionHud.armorCharges}</Text>
              </View>
            )}
            {playerProtectionHud.secondChanceReady && (
              <View style={styles.protectionChip}>
                <Text style={styles.protectionIcon}>↻</Text>
              </View>
            )}
            {playerProtectionHud.isGhost && (
              <View style={styles.protectionChip}>
                <Text style={styles.protectionIcon}>👻</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            zIndex: 2,
            transform: [
              { translateX: cameraXAnim },
              { scale: cameraScaleAnim },
            ],
          },
        ]}
      >
        {/* As poças pertencem à pista e são desenhadas atrás dos carros. */}
        {oilsToRender.map(oil => (
          <OilSpitVisual key={oil.id} x={oil.x} groundY={GROUND_Y} />
        ))}
        {botsRef.current.map((bot, index) => {
          const isSwapParticipant =
            activeSwap?.callerId === bot.id ||
            currentSwapTarget === bot.id;

          const visual = botVisualsRef.current[bot.id];
          if (!visual) return null;

          const rotation = visual.angle.interpolate({
            inputRange: [-360, 360],
            outputRange: ['-360deg', '360deg'],
          });

          return (
            <Animated.View
              key={bot.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 4,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                transform: [
                  { translateX: visual.x },
                  { translateY: visual.y },
                ],
              }}
            >
              <Animated.View
                style={{
                  width: PLAYER_SIZE,
                  height: PLAYER_SIZE,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  transform: [
                    { translateX: visual.skidX },
                    { rotate: rotation },
                    { scale: isSwapParticipant ? swapScaleAnim : 1 },
                  ],
                }}
              >
                {focusedDriver === index && (
                  <View style={styles.nameTag}>
                    <Text style={styles.nameTagText}>{bot.name || `BOT_${index + 1}`}</Text>
                    <View style={styles.nameTagArrow} />
                  </View>
                )}

                {bot.status?.isSlowed && (
                  <SlowSlowVisual variant="racer" size={PLAYER_SIZE} />
                )}
                {bot.status.empTimer > 0 && (
                  <EmpPulseVisual size={PLAYER_SIZE} paused={tutorialPaused} />
                )}

                {(bot.activeEffectsTimers.magnet ?? 0) > 0 && (
                  <View pointerEvents="none" style={styles.magnetAura}>
                    <Text style={styles.magnetAuraIcon}>🧲</Text>
                  </View>
                )}

                <DefenseCardVisual
                  size={PLAYER_SIZE}
                  shieldCharges={bot.status?.shieldCharges || 0}
                  armorCharges={bot.status?.armorCharges || 0}
                  isGhost={Boolean(bot.status?.isGhost)}
                  secondChanceReady={Boolean(bot.status?.secondChanceReady)}
                  isInvincible={(bot.status?.invincibleTimer || 0) > 0}
                  event={defenseVisualEvents[bot.id]}
                >
                  <View style={{ width: '200%', alignItems: 'center' }}>
                    <Carro
                      carType={bot.carType}
                      carColorFront={bot.carColorFront}
                      carColorBack={bot.carColorBack}
                      speed={bot.speed}
                      skin={bot.skin}
                      renderWidth={180}
                    />
                  </View>
                </DefenseCardVisual>
              </Animated.View>
            </Animated.View>
          );
        })}


        <Animated.View
          style={{
            position: 'absolute',
            zIndex: 5,
            left: 0,
            top: 0,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            transform: [
              { translateX: playerXAnim },
              { translateY: playerYAnim },
            ],
          }}
        >
          <Animated.View
            style={{
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              alignItems: 'center',
              justifyContent: 'flex-end',
              transform: [
                { translateX: playerSkidXAnim },
                {
                  rotate: playerAngleAnim.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  }),
                },
                {
                  scale:
                    activeSwap?.callerId === 'player' ||
                      currentSwapTarget === 'player'
                      ? swapScaleAnim
                      : 1,
                },
              ],
            }}
          >
            {focusedDriver === 'player' && (
              <View style={styles.nameTag}>
                <Text style={styles.nameTagText}>VOCÊ</Text>
                <View style={styles.nameTagArrow} />
              </View>
            )}

            {playerStatus.current.empTimer > 0 && (
              <EmpPulseVisual size={PLAYER_SIZE} paused={tutorialPaused} />
            )}

            {(activeEffectsTimers.current.magnet ?? 0) > 0 && (
              <View pointerEvents="none" style={styles.magnetAura}>
                <Text style={styles.magnetAuraIcon}>🧲</Text>
              </View>
            )}

            <DefenseCardVisual
              size={PLAYER_SIZE}
              shieldCharges={playerStatus.current.shieldCharges}
              armorCharges={playerStatus.current.armorCharges}
              isGhost={playerStatus.current.isGhost}
              secondChanceReady={playerStatus.current.secondChanceReady}
              isInvincible={playerStatus.current.invincibleTimer > 0}
              event={defenseVisualEvents.player}
            >
              <View style={{ width: '200%', alignItems: 'center' }}>
                <Carro
                  carType={selectedCar}
                  carColorFront={selectedColorFront}
                  carColorBack={selectedColorBack}
                  paintFinishId={selectedFinishId}
                  equipment={selectedEquipment}
                  speed={playerSpeed.current}
                  skin="default"
                  renderWidth={180}
                />
              </View>
            </DefenseCardVisual>
          </Animated.View>
        </Animated.View>


        {activeChainsState && activeChainsState.duration > 0 && (() => {
          // Precisamos achar as coordenadas X e Y do Caller e do Target
          const getCoords = (id: string) => {
            if (id === 'player') return { x: playerXRef.current, y: y.current };
            const bot = botsRef.current.find(b => b.id === id);
            if (bot) return { x: bot.x, y: bot.y };
            return null;
          };

          const callerCoords = getCoords(activeChainsState.callerId);
          const targetCoords = getCoords(activeChainsState.targetId);

          if (!callerCoords || !targetCoords) return null;

          return (
            <CorrenteVisual
              callerX={callerCoords.x}
              callerY={callerCoords.y}
              targetX={targetCoords.x}
              targetY={targetCoords.y}
            />
          );
        })()}

        {activeBulletEffect && (
          <GuidedBulletEffect
            callerId={activeBulletEffect.callerId}
            allRacers={allRacersPositions}
            onBulletExecute={(targetId) => {
              const callerX = activeBulletEffect.callerId === 'player'
                ? playerXRef.current
                : botsRef.current.find(b => b.id === activeBulletEffect.callerId)?.x || 0;
              const callerY = activeBulletEffect.callerId === 'player'
                ? y.current
                : botsRef.current.find(b => b.id === activeBulletEffect.callerId)?.y || 0;

              activeBulletsRef.current.push({
                id: Math.random().toString(),
                callerId: activeBulletEffect.callerId,
                targetId: targetId,
                x: callerX + PLAYER_SIZE / 2,
                y: callerY + PLAYER_SIZE / 2,
                angle: 0
              });
              setActiveBulletEffect(null);
            }}
          />
        )}

        {/* ================= RENDER DO MISSIL GUIADO ================= */}
        {bulletsToRender.map((bullet) => (
          <GuidedBulletVisual
            key={bullet.id}
            x={bullet.x}
            y={bullet.y}
            angle={bullet.angle}
          />
        ))}

        {/* ================= RENDER DAS BUBBLES VIAJANDO ================= */}
        {bubblesToRender.map((bubble) => (
          <BubbleLiftVisual
            key={`travel-${bubble.id}`}
            variant="travel"
            x={bubble.x}
            y={bubble.y}
            size={40}
          />
        ))}

        {/* ================= RENDER DO EFEITO PRESO NA BOLHA ================= */}
        {botsRef.current.map(bot => bot.status?.isLevitating && (
          <BubbleLiftVisual
            key={`trap-${bot.id}`}
            variant="trap"
            x={bot.x}
            y={bot.y}
            targetSize={PLAYER_SIZE}
            padding={10}
            angle={bot.angle || 0}
          />
        ))}
        {playerStatus.current.isLevitating && (
          <BubbleLiftVisual
            variant="trap"
            x={playerXRef.current}
            y={y.current}
            targetSize={PLAYER_SIZE}
            padding={10}
            angle={angleRenderRef.current}
          />
        )}

        {/* ================= RENDER DAS CAIXAS DE TNT ================= */}
        {tntsToRender.map((tnt) => {
          if (tnt.state === 'exploding') {
            return (
              <ExplosionVisual
                key={tnt.id}
                x={tnt.x}
                y={tnt.y}
              />
            );
          }

          {/* ================= RENDER DO SLOW_SLOW ================= */ }
          {
            isSlowActive && (
              <SlowSlowVisual variant="screen" />
            )
          }

          {/* ================= RENDER DO BLIND ================= */ }
          {
            isBlindActive &&
              <View style={styles.blindEffect} pointerEvents="none" />
          }



          return (
            <View key={tnt.id} style={{
              position: 'absolute', left: tnt.x, top: tnt.y,
              width: PLAYER_SIZE, height: PLAYER_SIZE,
              backgroundColor: '#B22222',
              borderWidth: 2, borderColor: '#8B0000',
              justifyContent: 'center', alignItems: 'center',
              zIndex: 3,
            }}>
              <View style={{ position: 'absolute', width: '100%', height: 4, backgroundColor: '#8B0000', top: 10 }} />
              <View style={{ position: 'absolute', width: '100%', height: 4, backgroundColor: '#8B0000', bottom: 10 }} />
              <Text style={{
                color: '#FFF', fontSize: 24, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
              }}>
                TNT
              </Text>
            </View>
          );
        })}

        {/* ================= RENDER DOS TORNADOS ================= */}
        {tornadosToRender.map((tornado) => (
          <TornadoVisual
            key={tornado.id}
            callerX={tornado.callerX}
            callerY={tornado.callerY}
            victims={tornado.victims}
            onHitVictim={(victimId) => handleTornadoHit(victimId, tornado.callerId)}
            onComplete={() => {
              setTornadosToRender(prev => prev.filter(t => t.id !== tornado.id));
            }}
          />
        ))}

        {/* ================= RENDER DAS PEÇAS ================= */}
        {piecesToRender.map((piece) => {
          const getIcon = (
            type: PartType,
          ) => {
            if (type === 'motor') {
              return '🔧';
            }

            if (type === 'spray') {
              return '🎨';
            }

            return type === 'chips' ? '🔳' : '⚙️';
          };

          return (
            <View key={piece.id} style={{
              position: 'absolute',
              left: piece.x,
              top: piece.y,
              width: 30,
              height: 30,
              backgroundColor: piece.type === 'chips' ? '#9146DB' : '#FFD700',
              borderRadius: 15, // Círculo perfeito
              borderWidth: 3,
              borderColor: '#000', // Borda preta sólida, sem blur/sombra
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
            }}>
              <Text style={{ fontSize: 14 }}>{getIcon(piece.type)}</Text>
            </View>
          );
        })}
      </Animated.View>




      {/* ================= HUD INFERIOR 70 / 30 ================= */}
      <View style={styles.bottomHud}>
        {/* ================= ESQUERDA 70%: CARTAS + BOOST ================= */}
        <View style={styles.bottomHudLeft}>
          <View style={styles.deckPanel}>
            <View style={styles.deckHandContainer}>
              {playerDeck.map((cardId, index) => {
                const card = getCardDefinition(cardId);
                if (!card) return null;
                const cost = card.cost;
                const hasboost = boost >= cost;
                const jammed = playerStatus.current.empTimer > 0 &&
                  (cardId === 'nitro_power' || cardId === 'shield');

                let currentCooldown = 0;
                let maxCooldown = 1;
                if (cardId === 'swap') { currentCooldown = swapCooldown; maxCooldown = SWAP_COOLDOWN; }
                if (cardId === 'chains') { currentCooldown = chainsCooldown; maxCooldown = CHAINS_COOLDOWN; }
                if (cardId === 'bullet') { currentCooldown = bulletCooldown; maxCooldown = BULLET_COOLDOWN; }
                if (cardId === 'tnt') { currentCooldown = tntCooldown; maxCooldown = TNT_COOLDOWN; }
                if (cardId === 'oil_spit') { currentCooldown = oilSpitCooldown; maxCooldown = OIL_SPIT_COOLDOWN; }
                if (cardId === 'emp_pulse') { currentCooldown = empPulseCooldown; maxCooldown = EMP_PULSE_COOLDOWN; }
                if (cardId === 'magnet') { currentCooldown = magnetCooldown; maxCooldown = MAGNET_COOLDOWN; }
                if (cardId === 'tornado') { currentCooldown = tornadoCooldown; maxCooldown = TORNADO_COOLDOWN; }
                if (cardId === 'slow_slow') { currentCooldown = slowCooldown; maxCooldown = SLOW_COOLDOWN; }
                if (cardId === 'nitro_power') { currentCooldown = nitroCooldown; maxCooldown = NITRO_COOLDOWN; }
                if (cardId === 'bubble_lift') { currentCooldown = bubbleCooldown; maxCooldown = BUBBLE_COOLDOWN; }
                if (cardId === 'shield') { currentCooldown = shieldCooldown; maxCooldown = SHIELD_COOLDOWN; }
                if (cardId === 'quick_repair') { currentCooldown = quickRepairCooldown; maxCooldown = QUICK_REPAIR_COOLDOWN; }
                if (cardId === 'ghost') { currentCooldown = ghostCooldown; maxCooldown = GHOST_COOLDOWN; }
                if (cardId === 'second_chance') { currentCooldown = secondChanceCooldown; maxCooldown = SECOND_CHANCE_COOLDOWN; }
                if (cardId === 'armor') { currentCooldown = armorCooldown; maxCooldown = ARMOR_COOLDOWN; }

                return (
                  <TouchableOpacity
                    key={`${cardId}-${index}`}
                    activeOpacity={0.9}
                    onPress={() => handleUseCard(cardId)}
                    style={[
                      styles.dynamicCardBtn,
                      (!hasboost || jammed) && styles.dynamicCardBtnDisabled,
                      isTutorial &&
                        tutorialStep === 'card' &&
                        index === 0 &&
                        styles.tutorialControlHighlight,
                    ]}
                  >
                    {currentCooldown > 0 && (
                      <View
                        style={[
                          styles.cardCooldownMask,
                          { height: `${(currentCooldown / maxCooldown) * 100}%` },
                        ]}
                      />
                    )}

                    <View style={styles.cardCostBadge}>
                      <Text style={styles.cardCostText}>💧{cost}</Text>
                    </View>

                    <Image
                      source={card.image}
                      resizeMode="contain"
                      style={styles.deckCardImage}
                    />
                    {jammed && (
                      <View pointerEvents="none" style={styles.empCardMask}>
                        <Text style={styles.empCardMaskText}>⚡ EMP</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Barra visual de boost com aparência de líquido. */}
            <View style={styles.boostBarContainer}>
              <View
                style={[
                  styles.boostLiquidFill,
                  { width: `${(boost / MAX_BOOST) * 100}%` },
                ]}
              >
                <View style={styles.boostLiquidSheen} />
                <View style={[styles.boostBubble, styles.boostBubbleOne]} />
                <View style={[styles.boostBubble, styles.boostBubbleTwo]} />
                <View style={[styles.boostBubble, styles.boostBubbleThree]} />
                <View style={[styles.boostBubble, styles.boostBubbleFour]} />
              </View>

              <View style={styles.boostBarGloss} />
              <Text style={styles.boostBarText}>BOOST  💧 {boost}/{MAX_BOOST}</Text>
            </View>
          </View>
        </View>

        {/* ================= DIREITA 30%: NITRO + VÁCUO + VELOCIDADE + ANALÓGICO ================= */}
        <View style={styles.bottomHudRight}>
          {started && !gameOver ? (
            <>
              <View style={styles.performanceRow}>
                <TouchableOpacity
                  activeOpacity={isNitroReady ? 0.72 : 1}
                  disabled={!isNitroReady || playerStatus.current.empTimer > 0}
                  onPress={handleActivateNitro}
                  style={[
                    styles.nitroBtn,
                    (!isNitroReady || playerStatus.current.empTimer > 0) && styles.nitroBtnDisabled,
                    isTutorial &&
                      tutorialStep === 'nitro' &&
                      styles.tutorialControlHighlight,
                  ]}
                >
                  <Text style={styles.nitroBtnIcon}>⚡</Text>
                  <Text style={styles.nitroBtnText}>NITRO</Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.vacuumRing,
                    {
                      borderTopColor: nitroPercent > 0 ? (isNitroReady ? '#00FFFF' : '#FFD60A') : 'rgba(255,255,255,0.16)',
                      borderRightColor: nitroPercent >= 25 ? (isNitroReady ? '#00FFFF' : '#FFD60A') : 'rgba(255,255,255,0.16)',
                      borderBottomColor: nitroPercent >= 50 ? (isNitroReady ? '#00FFFF' : '#FFD60A') : 'rgba(255,255,255,0.16)',
                      borderLeftColor: nitroPercent >= 75 ? (isNitroReady ? '#00FFFF' : '#FFD60A') : 'rgba(255,255,255,0.16)',
                    },
                  ]}
                >
                  <View style={styles.vacuumRingInner}>
                    <Text style={styles.vacuumPercent}>{Math.round(nitroPercent)}%</Text>
                    <Text style={styles.vacuumLabel}>VÁCUO</Text>
                  </View>
                </View>

                {/* Velocímetro = velocidade física real. Slow Slow, carta Nitro e
                    nitro do vácuo alteram playerSpeed.current antes deste snapshot. */}
                <View style={styles.speedometer}>
                  <Text
                    style={[
                      styles.speedometerValue,
                      playerStatus.current.isSlowed && styles.speedometerValueSlowed,
                      (isNitroActive.current || (activeEffectsTimers.current['nitro_power'] ?? 0) > 0) &&
                        styles.speedometerValueNitro,
                    ]}
                  >
                    {Math.max(0, Math.round(playerSpeed.current * KMH_PER_PHYSICS_UNIT))}
                  </Text>
                  <Text style={styles.speedometerUnit}>KM/H</Text>
                </View>
              </View>

              <View
                style={[
                  styles.analogPanel,
                  isTutorial &&
                    (tutorialStep === 'accelerate' ||
                      tutorialStep === 'brake') &&
                    styles.tutorialControlHighlight,
                ]}
              >
                <Text style={[styles.analogSideLabel, styles.analogBrakeLabel]}>FREIO</Text>
                <View
                  {...analogPanResponder.panHandlers}
                  style={styles.analogTrack}
                  onLayout={(event) => {
                    analogTrackWidthRef.current = event.nativeEvent.layout.width;
                  }}
                >
                  <View style={styles.analogBrakeZone} />
                  <View style={styles.analogThrottleZone} />
                  <View style={styles.analogCenterMark} />
                  <Animated.View
                    style={[
                      styles.analogKnob,
                      { transform: [{ translateX: analogKnobX }] },
                    ]}
                  >
                    <View style={styles.analogKnobInner} />
                  </Animated.View>
                </View>
                <Text style={[styles.analogSideLabel, styles.analogThrottleLabel]}>ACELERA</Text>
              </View>
            </>
          ) : (
            <View style={styles.controlsWaiting}>
              <Text style={styles.controlsWaitingText}>PILOTAGEM</Text>
            </View>
          )}
        </View>
      </View>

      {/* ================= BOTÃO DE LARGADA PERFEITA ================= */}
      {miniGameVisible && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMiniGamePress}
          style={[
            styles.miniGameBtn,
            isTutorial && tutorialStep === 'perfect_start' && styles.tutorialMiniGameBtn,
            { top: miniGamePos.top, left: miniGamePos.left }
          ]}
        >
          <Text style={styles.miniGameBtnText}>⚡</Text>
        </TouchableOpacity>
      )}

      {countdownStep && (
        <View style={styles.overlay} pointerEvents="none">
          {countdownStep === 'PREPARANDO' && <Text style={styles.titleText}>PREPARANDO...</Text>}
          {countdownStep === 'JÁ!' && <Text style={[styles.titleText, { color: '#00D084' }]}>JÁ!</Text>}

          {typeof countdownStep === 'number' && (
            <View style={styles.trafficLightContainer}>
              <View style={[styles.light, { backgroundColor: countdownStep <= 3 ? '#00D084' : '#FF3B30' }]} />
              <View style={[styles.light, { backgroundColor: countdownStep <= 2 ? '#00D084' : '#FF3B30' }]} />
              <View style={[styles.light, { backgroundColor: countdownStep <= 1 ? '#00D084' : '#FF3B30' }]} />
            </View>
          )}
        </View>
      )}


      <RaceTutorialOverlay
        visible={
          tutorialVisible &&
          !gameOver &&
          (tutorialStep === 'perfect_start' || started)
        }
        step={tutorialStep}
        perfectStartHits={tutorialPerfectStartHits}
        onContinue={handleTutorialContinue}
        onSkip={handleSkipTutorial}
      />

      <RaceFinishTransition
        visible={
          showFinishTransition
        }
        onFinished={
          handleFinishTransitionComplete
        }
      />

    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05ebfc', overflow: 'hidden' },
  flatGround: { position: 'absolute', left: 0, right: 0, zIndex: 1, backgroundColor: '#2e8b565b', borderTopWidth: 5, borderTopColor: '#34C759', },
  miniMapContainer: { position: 'absolute', top: 15, left: '25%', right: '25%', height: 16, justifyContent: 'center', zIndex: 20 },
  miniMapLine: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 2 },
  miniMapDot: { position: 'absolute', top: '50%', marginTop: -5 },

  // HUD superior dividido em dois clusters, deixando o minimapa respirar no centro.
  leftHud: { position: 'absolute', top: 10, left: 14, width: 152, zIndex: 30 },
  racersPanel: { paddingVertical: 5, paddingHorizontal: 5, borderRadius: 11, backgroundColor: 'rgba(8,8,12,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  racerHudRow: { height: 19, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, borderRadius: 6 },
  racerHudRowPlayer: { backgroundColor: 'rgba(255,214,10,0.13)', borderWidth: 1, borderColor: 'rgba(255,214,10,0.35)' },
  racerHudRowDead: { opacity: 0.42 },
  racerHudPosition: { width: 13, color: 'rgba(255,255,255,0.62)', fontSize: 8, fontWeight: '900' },
  racerHudDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' },
  racerHudName: { flex: 1, color: '#FFF', fontSize: 8, fontWeight: '800', marginRight: 4 },
  racerHudNamePlayer: { color: '#FFD60A', fontWeight: '900' },
  racerHudHeart: { width: 14, textAlign: 'center', color: '#FF4D67', fontSize: 9, fontWeight: '900' },
  racerHudLives: { width: 14, textAlign: 'right', fontSize: 9, fontWeight: '900' },
  // Mesmo width do HUD antigo (152): duas colunas verticais não invadem o minimapa.
  lootPanel: { marginTop: 6, flexDirection: 'row', gap: 5, padding: 5, borderRadius: 10, backgroundColor: 'rgba(8,8,12,0.52)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  lootColumn: { flex: 1, minWidth: 0, gap: 4 },
  lootChip: { height: 22, minWidth: 0, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)' },
  lootChipsWallet: { backgroundColor: 'rgba(155,82,217,0.22)', borderWidth: 1, borderColor: 'rgba(181,116,255,0.42)' },
  lootChipsEarned: { color: '#D7A3FF', fontSize: 8, fontWeight: '900', marginLeft: 3 },
  magnetAura: { position: 'absolute', width: PLAYER_SIZE + 26, height: PLAYER_SIZE + 26, left: -13, top: -13, borderRadius: (PLAYER_SIZE + 26) / 2, borderWidth: 2, borderColor: '#FF5865', backgroundColor: 'rgba(255,62,75,0.16)', zIndex: -1, alignItems: 'center' },
  magnetAuraIcon: { position: 'absolute', top: -15, right: -7, fontSize: 15 },
  lootIcon: { fontSize: 11, marginRight: 3 },
  lootValue: { color: '#FFF', fontSize: 10, fontWeight: '900', flexShrink: 1 },

  rightHud: { position: 'absolute', top: 10, right: 14, width: 154, zIndex: 30, alignItems: 'flex-end' },
  objectivesSlot: { width: '100%', marginTop: 6, alignItems: 'flex-end' },
  protectionPanel: { marginTop: 6, minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  protectionChip: { minWidth: 27, height: 27, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(8,8,12,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  protectionIcon: { fontSize: 12 },
  protectionValue: { color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 2 },

  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timerBadgeDanger: {
    backgroundColor: 'rgba(180, 20, 20, 0.78)',
    borderColor: '#FF453A',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  timerBadgeCritical: {
    backgroundColor: 'rgba(125, 0, 0, 0.90)',
    borderColor: '#FFD60A',
    borderWidth: 3,
    elevation: 12,
  },
  scoreText: { fontSize: 22, fontWeight: '900', color: '#FFF', zIndex: 20 },
  scoreTextDanger: {
    color: '#FFF',
    textShadowColor: '#FF3B30',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreTextCritical: {
    color: '#FFD60A',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  // HUD inferior: bloco contínuo que ocupa a faixa entre a pista e a base da tela.
  bottomHud: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BOTTOM_HUD_BOTTOM,
    height: BOTTOM_HUD_HEIGHT,
    zIndex: 35,
    flexDirection: 'row',
    gap: 0,
    backgroundColor: '#080A10',
  },
  bottomHudLeft: { flex: 7, minWidth: 0 },
  bottomHudRight: {
    flex: 3,
    minWidth: 188,
    borderRadius: 0,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 10, 16, 0.96)',
    borderWidth: 0,
    justifyContent: 'space-between',
    shadowOpacity: 0,
    elevation: 0,
  },
  deckPanel: {
    flex: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(8, 10, 16, 0.96)',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  deckHandContainer: {
    height: 73,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dynamicCardBtn: {
    width: 68,
    height: 66,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 21, 30, 0.96)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  dynamicCardBtnDisabled: { opacity: 0.42 },
  cardCooldownMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8, 10, 16, 0.72)',
    zIndex: 4,
  },
  deckCardImage: { width: '84%', height: '84%' },
  cardCostBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 27,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 122, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.80)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCostText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  // Boost líquido: sem imagens extras e sem state novo.
  boostBarContainer: {
    height: 23,
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostLiquidFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#FF007A',
  },
  boostLiquidSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 2,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  boostBarGloss: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 2,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  boostBubble: {
    position: 'absolute',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  boostBubbleOne: { width: 6, height: 6, left: '18%', bottom: 3 },
  boostBubbleTwo: { width: 4, height: 4, left: '39%', top: 4 },
  boostBubbleThree: { width: 7, height: 7, left: '62%', bottom: 2 },
  boostBubbleFour: { width: 4, height: 4, left: '82%', top: 3 },
  boostBarText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.7,
    zIndex: 5,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  performanceRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  nitroBtn: {
    width: 54,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#00F0FF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FFFF',
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 5,
  },
  nitroBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
    shadowOpacity: 0,
  },
  nitroBtnIcon: { fontSize: 15, marginBottom: -2 },
  nitroBtnText: { color: '#071014', fontWeight: '900', fontSize: 8, fontStyle: 'italic' },
  vacuumRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 5,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  vacuumRingInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(4, 7, 12, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  vacuumPercent: { color: '#FFF', fontSize: 11, fontWeight: '900', lineHeight: 13 },
  vacuumLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 6, fontWeight: '900', letterSpacing: 0.5 },
  speedometer: {
    minWidth: 60,
    height: 48,
    paddingHorizontal: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedometerValue: {
    color: '#FFD60A',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  speedometerValueSlowed: {
    color: '#64D2FF',
  },
  speedometerValueNitro: {
    color: '#00FFFF',
  },
  speedometerUnit: { color: 'rgba(255,255,255,0.62)', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 },

  analogPanel: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  analogSideLabel: {
    width: 35,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 6,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  analogTrack: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analogBrakeLabel: { color: 'rgba(255,107,107,0.76)' },
  analogThrottleLabel: { color: 'rgba(0,208,132,0.82)' },
  analogBrakeZone: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    width: '47%',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.07)',
  },
  analogThrottleZone: {
    position: 'absolute',
    right: 3,
    top: 3,
    bottom: 3,
    width: '47%',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 208, 132, 0.07)',
  },
  analogCenterMark: {
    position: 'absolute',
    width: 2,
    top: 5,
    bottom: 5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  analogKnob: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1D2430',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.36,
    shadowRadius: 4,
  },
  analogKnobInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D084',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  controlsWaiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tutorialControlHighlight: {
    borderWidth: 2,
    borderColor: '#FFD60A',
    elevation: 12,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
  },

  controlsWaitingText: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  jumpArea: { position: 'absolute', backgroundColor: '#fff', left: 40, bottom: 30, height: 90, width: 90, borderRadius: 45, zIndex: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
  block: { position: 'absolute', zIndex: 3 },
  miniGameBtn: { position: 'absolute', width: 64, height: 64, backgroundColor: '#FFCC00', borderWidth: 4, borderColor: '#1C1C1E', borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 9999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.4, shadowRadius: 3, },
  tutorialMiniGameBtn: {
    borderColor: '#FFFFFF',
    borderWidth: 5,
    elevation: 18,
    shadowOpacity: 0.75,
    shadowRadius: 9,
  },
  miniGameBtnText: { fontSize: 28, },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  titleText: { fontSize: 48, fontWeight: '900', color: '#FFD700', textShadowColor: '#FF4500', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 5, },
  nameTag: {
    position: 'absolute',
    top: -65,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  nameTagText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  nameTagArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderTopWidth: 8,
    borderTopColor: '#00D084',
  },
  trafficLightContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 60,
    gap: 20,
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#333',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
  },
  light: {
    width: 40,
    height: 40,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.4)',
  }, empHudBadge: {
    alignSelf: 'flex-end', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(42, 14, 75, 0.94)', borderWidth: 1, borderColor: '#A96DFF',
  },
  empHudText: { color: '#BDFBFF', fontWeight: '900', fontSize: 11 },
  empCardMask: {
    ...StyleSheet.absoluteFillObject, zIndex: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(42, 14, 75, 0.72)', borderRadius: 8,
  },
  empCardMaskText: { color: '#BDFBFF', fontSize: 10, fontWeight: '900' },
  blindEffect: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgb(255, 255, 255)', zIndex: 15 },
});
