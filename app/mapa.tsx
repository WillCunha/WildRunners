// PARA TESTES REMOVA SEMPRE O "USE EFFECT DE PREPARAÇÃO DO INICIO"
import Carro from '@/components/Carro';
import CenarioBackground from '@/components/Cenarios/CenarioBackground';
import BubbleLiftVisual from '@/components/Decks/BubbleLiftVisual';
import ChainsEffect from '@/components/Decks/ChainsEffect';
import DefenseCardVisual, { DefenseVisualEvent, DefenseVisualKind } from '@/components/Decks/DefenseCardVisual';
import GuidedBulletEffect from '@/components/Decks/GuidedBulletEffect';
import SlowSlowVisual from '@/components/Decks/SlowSlowVisual';
import SwapEffect from '@/components/Decks/SwapEffect';
import TornadoEffect from '@/components/Decks/TornadoEffect';
import CorrenteVisual from '@/components/ui/CorrenteVisual';
import ExplosionVisual from '@/components/ui/ExplosionVisual';
import GuidedBulletVisual from '@/components/ui/GuidedBulletVisual';
import RaceFinishTransition from '@/components/ui/RaceFinishTransition';
import RaceObjectivesHUD from '@/components/ui/RaceObjectivesHUD';
import TornadoVisual from '@/components/ui/TornadoVisual';
import { AudioContext } from '@/context/AudioContext';
import { useCarSelection } from '@/context/CarContext';
import { raceRewardsService } from '@/src/services/raceRewardsService';
import { useLoadingStore } from '@/src/store/LoadingStore';
import { usePlayerStore } from '@/src/store/playerStore';
import { carMaps } from '@/src/utils/carMaps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

type CarKey = keyof typeof carMaps;

type PartType = 'motor' | 'spray' | 'engrenagem';

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

const CARD_IMAGES: Record<string, any> = {
  chains: require('@/assets/images/cards/chains.png'),
  tnt: require('@/assets/images/cards/tnt.png'),
  swap: require('@/assets/images/cards/swap.png'),
  slow_slow: require('@/assets/images/cards/slow_slow.png'),
  blind: require('@/assets/images/cards/blind.png'),
  bullet: require('@/assets/images/cards/bullet.png'),
  tornado: require('@/assets/images/cards/tornado.png'),
  bubble_lift: require('@/assets/images/cards/bubble_lift.png'),
  nitro_power: require('@/assets/images/cards/nitro_power.png'),
  shield: require('@/assets/images/cards/shield.png'),
  armor: require('@/assets/images/cards/armor.png'),
  quick_repair: require('@/assets/images/cards/repair_quick.png'),
  ghost: require('@/assets/images/cards/ghost.png'),
  second_chance: require('@/assets/images/cards/second_chance.png'),
};


/* ================= CONFIGURAÇÕES DA FÍSICA E VELOCIDADE ================= */
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const PLAYER_SIZE = 50;

// Novas constantes de Corrida
const MAX_SPEED = 12;
const MIN_SPEED = 3;
const IMPULSE_FORCE = 1.5;
const ACCELERATION = 0.3;
const FRICTION = 0.15;
const NITRO_SPEED = 22;
const NITRO_DURATION = 60 * 3;

/* ================= CORES DISPONÍVEIS ================= */
const AVAILABLE_BOT_COLORS = [
  '#FF3B30', '#34C759', '#007AFF', '#FFCC00', '#FF9500', '#AF52DE', '#1C1C1E', '#F2F2F7',
];

type BotDifficulty = 'easy' | 'balanced' | 'rival';

// Balanceamento da IA: 2 bots mais acessíveis, 2 equilibrados e 1 rival forte.
const BOT_DIFFICULTIES: BotDifficulty[] = ['easy', 'easy', 'balanced', 'balanced', 'rival'];
const BOT_CATCHUP_DISTANCE = 180;
const BOT_CATCHUP_MULTIPLIER = 1.10;
const BOT_PLAYER_TARGET_CHANCE = 0.35;
const BOT_DEFENSE_REACTION_CHANCE = 0.75;
const NITRO_POWER_MULTIPLIER = 1.25;

export default function Mapa({ initialDeck = ['swap', 'bullet', 'chains', 'tnt'] }: MapaProps) {

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const GROUND_Y = SCREEN_HEIGHT - 100;
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


  const params = useLocalSearchParams<{ deck?: string; mapId?: string; skyTheme?: string; }>();
  const { selectedCar, selectedColorFront, selectedColorBack } = useCarSelection();

  const fallbackDeck = ['swap', 'bullet', 'chains', 'tnt'];
  const finalDeck = params.deck ? JSON.parse(params.deck as string) : fallbackDeck;

  const profile = usePlayerStore((state) => state.profile);

  const carKey = (selectedCar || 'buggy') as string;

  const carStats = profile?.garage?.[carKey as any] || {
    motor: { speedLevel: 1, accelerationLevel: 1, jumpPowerLevel: 1 },
    engrenagem: { defenseLevel: 1 },
  };

  const DYNAMIC_MAX_SPEED = MAX_SPEED + ((carStats.motor.speedLevel - 1) * 0.8);
  const DYNAMIC_IMPULSE = IMPULSE_FORCE + ((carStats.motor.accelerationLevel - 1) * 0.15);
  const DYNAMIC_JUMP_FORCE = JUMP_FORCE - ((carStats.motor.jumpPowerLevel - 1) * 0.6);
  // Nível 1 = 5 Vidas, Nível 2 = 6 Vidas...
  const INITIAL_LIVES = 4 + carStats.engrenagem.defenseLevel;

  const BASE_PLAYER_X = SCREEN_WIDTH * 0.4;
  const GAP_BETWEEN_RACERS = 130;
  const TOTAL_RACERS = 6;


  type CardEffect = 'swap' | 'chains' | 'blind' | 'score_boost' | 'tnt' |
    'bullet' | 'tornado' | 'slow_slow' | 'nitro_power' | 'bubble_lift' |
    'shield' | 'quick_repair' | 'ghost' | 'second_chance' | 'armor';

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


  const CARD_CATEGORIES = {
    HEAVY_ATTACK: ['swap', 'bullet', 'chains', 'tnt', 'tornado'],
    TIME_ATTACK: ['slow_slow'],
    LIGHT_ATTACK: ['blind', 'bubble_lift'],
    DEFENSE_BUFF: ['nitro_power', 'shield', 'quick_repair', 'ghost', 'second_chance', 'armor']
  };
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

  const playerSpeed = useRef(MIN_SPEED);
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

  const getRandomColor = () => AVAILABLE_BOT_COLORS[Math.floor(Math.random() * AVAILABLE_BOT_COLORS.length)];
  const getRandomCarType = (): CarKey => {
    const carKeys: CarKey[] = Object.keys(carMaps) as CarKey[];
    return carKeys[Math.floor(Math.random() * carKeys.length)];
  };

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
        skin: skins[index],
        isCrouching: false,
        velocity: 0,
        score: 0,
        thinkTimer: 0,
        status: { ...defaultStatus },
        activeEffectsTimers: {} as Partial<Record<CardEffect, number>>,
        carType: getRandomCarType(),
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
  const [angle, setAngle] = useState(0);

  // ---- DADOS DO PLAYER  ---- //
  const [playerY, setPlayerY] = useState(y.current);
  const [playerX, setPlayerX] = useState(playerXRef.current);
  const [playerLives, setPlayerLives] = useState(INITIAL_LIVES);
  const playerLivesRef = useRef(INITIAL_LIVES);
  const playerIsDead = useRef(false);

  // ---- DECK ---- //
  const CARD_COSTS: Record<string, number> = {
    chains: 3, tnt: 4, swap: 4, slow_slow: 5, blind: 5,
    bullet: 3, tornado: 4, nitro_power: 2, bubble_lift: 4,
    shield: 3, quick_repair: 4, ghost: 5, second_chance: 5, armor: 4
  }
  const [boost, setBoost] = useState<number>(5);
  const MAX_BOOST = 10;
  const [playerDeck, setPlayerDeck] = useState<string[]>(finalDeck);

  const [bots, setBots] = useState(botsRef.current);
  const [score, setScore] = useState(0);


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

  const [cameraTransform, setCameraTransform] = useState({ x: 0, scale: 1 });
  const cameraTransformRef = useRef({ x: 0, scale: 1 });
  const angleRenderRef = useRef(0);
  const [focusedDriver, setFocusedDriver] = useState<number | string | null>(null);

  const [leaderboard, setLeaderboard] = useState<{ id: string, name: string }[]>([]);
  const lastOrderRef = useRef('');

  const [isBlindActive, setIsBlindActive] = useState(false);

  const [isCameraLocked, setIsCameraLocked] = useState(false);

  // ---- DECKS ---- //
  // SWAP
  const SWAP_COOLDOWN = 8000;
  const [activeSwap, setActiveSwap] = useState<{ callerId: string; targetId?: string; } | null>(null);
  // Ref usada pelo game loop para não depender de closures antigas do React.
  const activeSwapRef = useRef<{ callerId: string; targetId?: string; } | null>(null);
  const [currentSwapTarget, setCurrentSwapTarget] = useState<string | null>(null);
  const [swapCooldown, setSwapCooldown] = useState(0);
  const swapScaleAnim = useRef(new Animated.Value(1)).current;

  // CHAINS
  const CHAINS_COOLDOWN = 8000;
  const [activeChains, setActiveChains] = useState<{ callerId: string } | null>(null);
  const [activeChainsState, setActiveChainsState] = useState<{ callerId: string; targetId: string; duration: number; } | null>(null);
  const activeChainsStateRef = useRef<{ callerId: string; targetId: string; duration: number; } | null>(null);
  const [chainsCooldown, setChainsCooldown] = useState(0);

  // GUIDED BULLET
  const BULLET_COOLDOWN = 8000;
  const activeBulletsRef = useRef<{ id: string; callerId: string; targetId: string; x: number; y: number; angle: number }[]>([]);
  const [activeBulletEffect, setActiveBulletEffect] = useState<{ callerId: string } | null>(null);
  const [bulletCooldown, setBulletCooldown] = useState(0);
  const [bulletsToRender, setBulletsToRender] = useState(activeBulletsRef.current);

  // TNT BOX
  const TNT_COOLDOWN = 10000;
  const activeTNTRef = useRef<TNTBox[]>([]);
  const [tntCooldown, setTntCooldown] = useState(0);
  const [tntsToRender, setTntsToRender] = useState<TNTBox[]>([]);

  // TORNADO
  const TORNADO_COOLDOWN = 12000;
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
  const SLOW_COOLDOWN = 10000;
  const [slowCooldown, setSlowCooldown] = useState(0);
  const [isSlowActive, setIsSlowActive] = useState(false);

  // NITRO POWER
  const NITRO_COOLDOWN = 4000;
  const [nitroCooldown, setNitroCooldown] = useState(0);
  const [isNitroPowerActive, setIsNitroPowerActive] = useState(false);

  // BUBBLE LIFT
  const BUBBLE_COOLDOWN = 9000;
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
  const SHIELD_COOLDOWN = 8000;
  const QUICK_REPAIR_COOLDOWN = 14000;
  const GHOST_COOLDOWN = 12000;
  const SECOND_CHANCE_COOLDOWN = 18000;
  const ARMOR_COOLDOWN = 12000;
  const [shieldCooldown, setShieldCooldown] = useState(0);
  const [quickRepairCooldown, setQuickRepairCooldown] = useState(0);
  const [ghostCooldown, setGhostCooldown] = useState(0);
  const [secondChanceCooldown, setSecondChanceCooldown] = useState(0);
  const [armorCooldown, setArmorCooldown] = useState(0);

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

  // Caixa da partida: motor = peças, spray = pinturas e engrenagem = engrenagens.
  const sessionPartsRef = useRef({ motor: 0, spray: 0, engrenagem: 0 });

  // ID da partida
  const raceIdRef = useRef('');
  // Evita creditar a mesma partida mais de uma vez.
  const gameOverHandledRef = useRef(false);

  // Métricas objetivas usadas pelo sistema de XP e pelas missões da corrida.
  const racePerformanceRef = useRef({
    successfulAttacks: 0,
    successfulDefenses: 0,
    overtakes: 0,
    livesLost: 0,
    worstPosition: 1,
  });

  // A posição é amostrada junto do leaderboard. Quando ela melhora,
  // contabilizamos quantas posições o player ganhou naquele intervalo.
  const lastSampledPlayerPositionRef = useRef<number | null>(null);

  // Snapshot leve para o HUD das missões.
  // Só atualiza quando ataque/posição/ultrapassagem realmente mudam.
  const [raceObjectivesLive, setRaceObjectivesLive] = useState({
    position: TOTAL_RACERS,
    attacks: 0,
    overtakes: 0,
  });

  const registerSuccessfulAttack = (sourceId: string, targetId: string) => {
    if (sourceId === 'player' && targetId !== 'player') {
      racePerformanceRef.current.successfulAttacks += 1;

      const attacks = racePerformanceRef.current.successfulAttacks;
      setRaceObjectivesLive(prev =>
        prev.attacks === attacks
          ? prev
          : { ...prev, attacks },
      );
    }
  };

  const registerSuccessfulDefense = (racerId: string, sourceId?: string) => {
    if (racerId === 'player' && sourceId && sourceId !== 'player') {
      racePerformanceRef.current.successfulDefenses += 1;
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


  /* ================= CONFIGURA OS MULTIPLICADORES DE FISICA DOS BOTS ================= */
  function generateBotsStats(playerStats: typeof carStats, difficulty: BotDifficulty = 'balanced') {
    const getLevelOffset = () => {
      const roll = Math.random();

      if (difficulty === 'easy') return roll < 0.75 ? -1 : 0;
      if (difficulty === 'rival') return roll < 0.65 ? 0 : 1;
      if (roll < 0.20) return -1;
      if (roll < 0.80) return 0;
      return 1;
    };

    const botSpeedLevel = Math.max(1, playerStats.motor.speedLevel + getLevelOffset());
    const botAccelLevel = Math.max(1, playerStats.motor.accelerationLevel + getLevelOffset());
    const botJumpLevel = Math.max(1, playerStats.motor.jumpPowerLevel + getLevelOffset());
    const botDefenseLevel = Math.max(1, playerStats.engrenagem.defenseLevel + getLevelOffset());

    // Pequena diferença de pilotagem mantém os perfis distintos até no nível 1,
    // onde um offset -1 seria limitado de volta para o nível mínimo.
    const paceMultiplier = difficulty === 'easy' ? 0.97 : difficulty === 'rival' ? 1.015 : 1;
    const accelMultiplier = difficulty === 'easy' ? 0.98 : difficulty === 'rival' ? 1.01 : 1;

    return {
      maxSpeed: (MAX_SPEED + ((botSpeedLevel - 1) * 0.8)) * paceMultiplier,
      impulse: (IMPULSE_FORCE + ((botAccelLevel - 1) * 0.15)) * accelMultiplier,
      jumpForce: JUMP_FORCE - ((botJumpLevel - 1) * 0.6),
      maxLives: 4 + botDefenseLevel,
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
    setPlayerX(positions[0]);
    playerLivesRef.current = INITIAL_LIVES;
    setPlayerLives(INITIAL_LIVES);
    playerIsDead.current = false;
    playerStatus.current = { ...defaultStatus };
    activeEffectsTimers.current = {};
    setDefenseVisualEvents({});
    setIsSlowActive(false);
    playerSpeed.current = MIN_SPEED;
    gameTime.current = 0;
    racePerformanceRef.current = {
      successfulAttacks: 0,
      successfulDefenses: 0,
      overtakes: 0,
      livesLost: 0,
      worstPosition: 1,
    };

    const initialPlayerPosition =
      1 + positions.filter(position => position > positions[0]).length;

    lastSampledPlayerPositionRef.current = initialPlayerPosition;
    setRaceObjectivesLive({
      position: initialPlayerPosition,
      attacks: 0,
      overtakes: 0,
    });

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
      newBots[i].speed = MIN_SPEED;
      newBots[i].stats = refreshedStats;
      newBots[i].maxLives = refreshedStats.maxLives;
      newBots[i].lives = refreshedStats.maxLives;
      newBots[i].isDead = false;
      newBots[i].status = { ...defaultStatus };
      newBots[i].activeEffectsTimers = {} as Partial<Record<CardEffect, number>>;
      newBots[i].deck = generateRandomDeck();
      newBots[i].carType = getRandomCarType();
      newBots[i].carColorFront = getRandomColor();
      newBots[i].carColorBack = getRandomColor();
      newBots[i].angle = 0;
    }
    botsRef.current = newBots;
    setBots(newBots);

    const randomSeconds = Math.floor(Math.random() * (180 - 60 + 1)) + 60;
    raceTimeRef.current = randomSeconds;
    timeRemainingRef.current = randomSeconds;
    setTimeRemaining(randomSeconds);
  };


  /* ================= USE EFFECT DE PREPARAÇÃO DO INICIO ================= */
  useEffect(() => {
    if (!started && !isCountingRef.current && !gameOver) {
      sessionPartsRef.current = { motor: 0, spray: 0, engrenagem: 0 };
      gameOverHandledRef.current = false;
      setShowFinishTransition(false);

      raceIdRef.current =
        `race-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;


      const startY = GROUND_Y - PLAYER_SIZE;

      y.current = startY;
      setPlayerY(y.current);

      setupPositions();

      setTimeout(() => {
        hideLoading();
        startRaceSequence();
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

    const performance = {
      perfectStart: miniGameClicksRef.current >= 3,
      successfulAttacks: racePerformanceRef.current.successfulAttacks,
      successfulDefenses: racePerformanceRef.current.successfulDefenses,
      overtakes: racePerformanceRef.current.overtakes,
      livesLost: racePerformanceRef.current.livesLost,
      worstPosition: racePerformanceRef.current.worstPosition,
      survived: !playerIsDead.current,
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

      trophies:
        getTrophyReward(
          playerPosition,
          !playerIsDead.current,
        ),
    };

    /* ================================
       3. REGISTRA RESULTADO
    ================================ */

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

    /* ================================
       5. TRANSIÇÃO VISUAL
    ================================ */

    setShowFinishTransition(true);

  }, [
    gameOver,
    pauseMusic,
    router,
    carKey,
    selectedColorFront,
    selectedColorBack,
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

      if (playerStatus.current.isStunned) {
        playerSpeed.current = 0;
      } else if (activeEffectsTimers.current['nitro_power'] && activeEffectsTimers.current['nitro_power'] > 0) {
        playerSpeed.current = DYNAMIC_MAX_SPEED * NITRO_POWER_MULTIPLIER;
      } else if (isNitroActive.current) {
        playerSpeed.current = NITRO_SPEED;
        nitroTimer.current -= 1;
        if (nitroTimer.current <= 0) {
          isNitroActive.current = false;
          nitroCharge.current = 0;
          setNitroReady(false);
          setNitroPercent(0);
        }
      } else {
        playerSpeed.current = Math.min(playerSpeed.current + ACCELERATION, DYNAMIC_MAX_SPEED);
      }


      if (playerStatus.current.isSlowed) {
        playerSpeed.current = Math.min(playerSpeed.current, DYNAMIC_MAX_SPEED * 0.4);
      }

      const dynamicSpeed = playerSpeed.current;
      let isDrafting = false;
      botsRef.current.forEach(bot => {
        const distanceToBot = bot.x - playerXRef.current;
        if (distanceToBot > 10 && distanceToBot < 120 && Math.abs(bot.y - y.current) < 30) isDrafting = true;
      });

      if (isDrafting && !isNitroActive.current && nitroCharge.current < 100) {
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

          const previousPosition = lastSampledPlayerPositionRef.current;

          if (
            previousPosition !== null &&
            sampledPlayerPosition < previousPosition
          ) {
            racePerformanceRef.current.overtakes +=
              previousPosition - sampledPlayerPosition;
          }

          lastSampledPlayerPositionRef.current = sampledPlayerPosition;

          const overtakes = racePerformanceRef.current.overtakes;
          setRaceObjectivesLive(prev =>
            prev.position === sampledPlayerPosition &&
            prev.overtakes === overtakes
              ? prev
              : {
                  ...prev,
                  position: sampledPlayerPosition,
                  overtakes,
                },
          );
        }
        const currentOrder = allRacers.map(r => r.id).join(',');
        if (currentOrder !== lastOrderRef.current) {
          setLeaderboard(allRacers.map(r => ({ id: r.id, name: r.name })));
          lastOrderRef.current = currentOrder;
        }
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
              case 'ghost': playerStatus.current.isGhost = false; break;
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
          bot.targetSpeed = bot.stats.maxSpeed * (0.85 + Math.random() * 0.2);

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

        // ================= ACELERAÇÃO NORMAL =================
        if (bot.speed < targetSpeed) {
          bot.speed += (
            ACCELERATION *
            (1 + (bot.stats.impulse - IMPULSE_FORCE))
          );

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

      if (gameTime.current % 10 === 0) setScore(s => s + Math.floor(playerSpeed.current / 3));

      // --- 6 FÍSICA E COLETA DAS PEÇAS ---
      let remainingPieces: DroppedPiece[] = [];

      activePiecesRef.current.forEach(piece => {
        piece.x -= dynamicSpeed;

        piece.velY += GRAVITY;
        piece.y += piece.velY;

        if (piece.y + 20 >= GROUND_Y) {
          piece.y = GROUND_Y - 20;
          piece.velY = 0;
        }

        const pieceDx = playerXRef.current - piece.x;
        const pieceDy = y.current - piece.y;
        const pieceDistanceSq = (pieceDx * pieceDx) + (pieceDy * pieceDy);

        if (pieceDistanceSq < PLAYER_SIZE * PLAYER_SIZE) {
          sessionPartsRef.current[piece.type] += 1;
        } else {
          if (piece.x > -100) {
            remainingPieces.push(piece);
          }
        }
      });

      activePiecesRef.current = remainingPieces;

      // O React recebe snapshots visuais a 30 FPS; a física continua rodando a ~60 FPS.
      if (gameTime.current % 2 === 0) {
        setCameraTransform(cameraTransformRef.current);
        setAngle(angleRenderRef.current);
        setPiecesToRender([...activePiecesRef.current]);
        setPlayerY(y.current);
        setPlayerX(playerXRef.current);
        setBots([...botsRef.current]);
        setBulletsToRender([...activeBulletsRef.current]);
        setTntsToRender([...activeTNTRef.current]);
        setBubblesToRender([...activeBubblesRef.current]);
      }
    };

    const loop = (timestamp: number) => {
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
      setSwapCooldown(tick);
      setChainsCooldown(tick);
      setBulletCooldown(tick);
      setTntCooldown(tick);
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
    if (CARD_CATEGORIES.DEFENSE_BUFF.includes(effect as any)) return COOLDOWNS.DEFENSE;
    if (CARD_CATEGORIES.HEAVY_ATTACK.includes(effect as any)) return COOLDOWNS.HEAVY;
    return COOLDOWNS.LIGHT;
  }

  function generateRandomDeck() {
    const attackEffects: CardEffect[] = [
      'swap', 'bullet', 'chains', 'tnt', 'tornado', 'slow_slow', 'blind', 'bubble_lift'
    ];
    const defenseEffects: CardEffect[] = [
      'nitro_power', 'shield', 'quick_repair', 'ghost', 'second_chance', 'armor'
    ];

    const attack = attackEffects[Math.floor(Math.random() * attackEffects.length)];
    const defense = defenseEffects[Math.floor(Math.random() * defenseEffects.length)];

    return [attack, defense].map(effect => ({
      effect,
      currentCooldown: 60 * 3 + Math.floor(Math.random() * 120),
      baseCooldown: getBotCardCooldown(effect),
    }));
  }

  /* ================= GERENCIADOR DO USO DE CARTAS COM BOOST ================= */
  function handleUseCard(effect: string) {
    const cost = CARD_COSTS[effect] || 0;

    if (boost < cost) return;
    if (effect === 'swap' && swapCooldown > 0) return;
    if (effect === 'chains' && chainsCooldown > 0) return;
    if (effect === 'bullet' && bulletCooldown > 0) return;
    if (effect === 'tnt' && tntCooldown > 0) return;
    if (effect === 'tornado' && tornadoCooldown > 0) return;
    if (effect === 'slow_slow' && slowCooldown > 0) return;
    if (effect === 'nitro_power' && nitroCooldown > 0) return;
    if (effect === 'bubble_lift' && bubbleCooldown > 0) return;
    if (effect === 'shield' && shieldCooldown > 0) return;
    if (effect === 'quick_repair' && quickRepairCooldown > 0) return;
    if (effect === 'ghost' && ghostCooldown > 0) return;
    if (effect === 'second_chance' && secondChanceCooldown > 0) return;
    if (effect === 'armor' && armorCooldown > 0) return;

    if (effect === 'quick_repair' && playerLivesRef.current >= INITIAL_LIVES) return;
    if (effect === 'shield' && playerStatus.current.shieldCharges > 0) return;
    if (effect === 'armor' && playerStatus.current.armorCharges > 0) return;
    if (effect === 'ghost' && playerStatus.current.isGhost) return;
    if (effect === 'second_chance' && playerStatus.current.secondChanceReady) return;

    // Não gasta boost/cooldown se o jogador já estiver em primeiro
    // ou se outro Swap ainda estiver resolvendo.
    if (effect === 'swap' && (activeSwapRef.current || !hasOpponentAhead('player'))) return;

    // Bubble Lift só cobra o boost se realmente conseguir lançar em um alvo.
    if (effect === 'bubble_lift') {
      const launched = triggerBubbleLift('player');
      if (!launched) return;

      setBoost(prev => prev - cost);
      setBubbleCooldown(BUBBLE_COOLDOWN);
      return;
    }

    setBoost(prev => prev - cost);

    if (effect === 'swap') {
      if (triggerSwap('player')) setSwapCooldown(SWAP_COOLDOWN);
    }
    if (effect === 'chains') { triggerChains('player'); setChainsCooldown(CHAINS_COOLDOWN); }
    if (effect === 'bullet') { triggerBullet('player'); setBulletCooldown(BULLET_COOLDOWN); }
    if (effect === 'tnt') { triggerTNT('player'); setTntCooldown(TNT_COOLDOWN); }
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
    playerSpeed.current = Math.min(playerSpeed.current + DYNAMIC_IMPULSE, DYNAMIC_MAX_SPEED);
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

    return false;
  }

  function processBotsAI() {
    const allRacers = [
      { id: 'player', x: playerXRef.current, isPlayer: true },
      ...botsRef.current.map(b => ({ id: b.id, x: b.x, isPlayer: false }))
    ].sort((a, b) => b.x - a.x);

    botsRef.current.forEach(bot => {
      if (bot.isDead) return;
      if (bot.thinkTimer > 0) { bot.thinkTimer--; return; }

      const availableCards = bot.deck.filter(card => card.currentCooldown <= 0);
      if (availableCards.length === 0) return;

      const usableDefense = availableCards.find(card =>
        CARD_CATEGORIES.DEFENSE_BUFF.includes(card.effect as any) &&
        shouldBotUseDefenseCard(bot, card.effect as CardEffect)
      );
      const attackCards = availableCards.filter(card =>
        !CARD_CATEGORIES.DEFENSE_BUFF.includes(card.effect as any)
      );
      const chosenCard = usableDefense ?? attackCards[Math.floor(Math.random() * attackCards.length)];

      if (!chosenCard) {
        bot.thinkTimer = 8;
        return;
      }

      const myRank = allRacers.findIndex(r => r.id === bot.id);
      let target = bot.id;

      if (!CARD_CATEGORIES.DEFENSE_BUFF.includes(chosenCard.effect as any)) {
        const opponentsAhead = allRacers.slice(0, myRank);

        if (opponentsAhead.length > 0) {
          const playerAhead = opponentsAhead.find(r => r.id === 'player');
          if (playerAhead && Math.random() < BOT_PLAYER_TARGET_CHANCE) {
            target = 'player';
          } else {
            target = opponentsAhead[opponentsAhead.length - 1].id;
          }
        } else {
          const opponentsBehind = allRacers.slice(myRank + 1);
          if (opponentsBehind.length > 0) target = opponentsBehind[0].id;
          else return;
        }
      }

      if (chosenCard.effect === 'swap') {
        const targetRacer = allRacers.find(r => r.id === target);
        if (targetRacer && targetRacer.x <= bot.x) return;

        if (!triggerSwap(bot.id)) {
          bot.thinkTimer = 8;
          return;
        }
      } else if (chosenCard.effect === 'tnt') {
        triggerTNT(bot.id);
      } else if (chosenCard.effect === 'bullet') {
        triggerBullet(bot.id);
      } else if (chosenCard.effect === 'tornado') {
        triggerTornado(bot.id);
      } else if (chosenCard.effect === 'bubble_lift') {
        triggerBubbleLift(bot.id);
      } else {
        applyCardEffect(chosenCard.effect as CardEffect, target, bot.id);
      }

      chosenCard.currentCooldown = chosenCard.baseCooldown;
      bot.thinkTimer = 15 + Math.floor(Math.random() * 25);
    });
  }


  /* ================= APLICA EFEITO DAS CARTAS (VAI SER REMOVIDO) ================= */
  function applyCardEffect(effect: CardEffect, targetId: string, sourceId: string) {
    const DURATION = 60 * 4;
    const CHAINS_DURATION = 60 * 5;

    const targetStatus = targetId === 'player'
      ? playerStatus.current
      : botsRef.current.find(b => b.id === targetId)?.status;
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
      if (targetId === 'player') playerStatus.current.shieldCharges = 1;
      else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) targetBot.status.shieldCharges = 1;
      }
      triggerDefenseVisual(targetId, 'shield_activate');
      return;
    }

    if (effect === 'armor') {
      if (targetId === 'player') playerStatus.current.armorCharges = 2;
      else {
        const targetBot = botsRef.current.find(b => b.id === targetId);
        if (targetBot) targetBot.status.armorCharges = 2;
      }
      triggerDefenseVisual(targetId, 'armor_activate');
      return;
    }

    if (effect === 'second_chance') {
      if (targetId === 'player') playerStatus.current.secondChanceReady = true;
      else {
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
        triggerDefenseVisual('player', 'shield_break');
        return false;
      }

      // Blindagem segura o coração, mas o impacto físico continua acontecendo.
      if (status.armorCharges > 0) {
        registerSuccessfulDefense('player', sourceId);
        status.armorCharges -= 1;
        status.invincibleTimer = 90;
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

      if (playerLivesRef.current <= 0 && status.secondChanceReady) {
        status.secondChanceReady = false;
        playerLivesRef.current = 1;
        status.invincibleTimer = 120;
        triggerDefenseVisual('player', 'second_chance_revive');
      }

      setPlayerLives(playerLivesRef.current);

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
    spawnPieces(bot.x, bot.y, 2);

    if (bot.lives <= 0 && status.secondChanceReady) {
      status.secondChanceReady = false;
      bot.lives = 1;
      status.invincibleTimer = 120;
      triggerDefenseVisual(bot.id, 'second_chance_revive');
    }

    if (bot.lives <= 0) {
      bot.isDead = true;
      bot.speed = 0;
      spawnPieces(bot.x, bot.y, 10);
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
  function triggerBubbleLift(callerId: string): boolean {
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

    const target = targetsAhead[0];

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
  function spawnPieces(originX: number, originY: number, amount: number) {
    const types: PartType[] = ['motor', 'spray', 'engrenagem'];

    for (let i = 0; i < amount; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];
      // Espalha as peças um pouco no eixo X
      const offsetX = (Math.random() * 60) - 30;

      activePiecesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: originX + offsetX,
        y: originY,
        type: randomType,
        velY: -5 - Math.random() * 5, // Pulo inicial do drop
      });
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
    setCameraTransform(cameraTransformRef.current);
  };


  /* ================= SEQUENCIA DE PREPARAÇÃO DA CORRIDA ================= */
  const startRaceSequence = async () => {
    if (isCountingRef.current) return;
    isCountingRef.current = true;
    miniGameClicksRef.current = 0;

    setCountdownStep('PREPARANDO');
    await sleep(1500);

    const triggerMiniGame = () => {
      const maxTop = SCREEN_HEIGHT - 120;
      const maxLeft = SCREEN_WIDTH - 120;

      setMiniGamePos({
        top: Math.max(50, Math.floor(Math.random() * maxTop)),
        left: Math.max(50, Math.floor(Math.random() * maxLeft))
      })
      setMiniGameVisible(true)

      setTimeout(() => setMiniGameVisible(false), 800);
    }

    if (botsRef.current[0]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(3);
      setFocusedDriver(null);
      setFocusedDriver(0);
      focusOn(botsRef.current[0].x);
      triggerMiniGame();
    }
    await sleep(1000);

    if (botsRef.current[1]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(2);
      setFocusedDriver(null);
      setFocusedDriver(1);
      focusOn(botsRef.current[1].x);
      triggerMiniGame();

    }
    await sleep(1000);

    if (botsRef.current[2]) {
      playBeep();
      setIsCameraLocked(true);
      setCountdownStep(1);
      setFocusedDriver(null);
      setFocusedDriver(2);
      focusOn(botsRef.current[2].x);
      triggerMiniGame();
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

    if (miniGameClicksRef.current >= 3) {
      isNitroActive.current = true;
      nitroTimer.current = NITRO_DURATION;
    }

    await sleep(800);
    setCountdownStep(null);
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
    if (isNitroReady && !isNitroActive.current) { isNitroActive.current = true; nitroTimer.current = NITRO_DURATION; setNitroReady(false); }
  }

  /* ================= POSIÇÕES DOS PLAYERS E BOTS ================= */
  const allRacersPositions = [
    {
      id: 'player',
      x: playerX,
      y: playerY,
      color: selectedColorFront || '#00D084',
      isPlayer: true,
    },
    ...bots
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

  return (
    <View style={styles.container}>
      <MemoCenarioBackground
        isMoving={started && !gameOver}
        mapId="sao_paulo"
        skyTheme="day"
        groundY={GROUND_Y}
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

      {/* HUD LIMPO: posição instantânea substitui o ranking de 6 linhas.
          O mini-mapa já mostra a ordem completa dos corredores. */}
      <View style={styles.positionBadge} pointerEvents="none">
        <Text style={styles.positionBadgeValue}>
          {Math.max(
            1,
            leaderboard.findIndex(racer => racer.id === 'player') + 1 ||
              raceObjectivesLive.position,
          )}º
        </Text>
        <Text style={styles.positionBadgeTotal}>/ {TOTAL_RACERS}</Text>
      </View>

      <RaceObjectivesHUD
        position={raceObjectivesLive.position}
        attacks={raceObjectivesLive.attacks}
        overtakes={raceObjectivesLive.overtakes}
      />

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

      {/* STATUS DO PLAYER: tempo + vida + buffs em um único bloco compacto. */}
      <View style={styles.hud}>
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

        <View style={styles.playerStatusRow}>
          <View style={styles.lifeCompact}>
            <Text style={styles.lifeCompactIcon}>❤️</Text>
            <Text style={[styles.lifeCompactValue, { color: getLifeColor(playerLives) }]}>
              {playerLives}
            </Text>
          </View>

          {playerStatus.current.shieldCharges > 0 && (
            <Text style={styles.statusEffectIcon}>🛡️{playerStatus.current.shieldCharges}</Text>
          )}
          {playerStatus.current.armorCharges > 0 && (
            <Text style={styles.statusEffectIcon}>🧱{playerStatus.current.armorCharges}</Text>
          )}
          {playerStatus.current.secondChanceReady && (
            <Text style={styles.statusEffectIcon}>↻</Text>
          )}
          {playerStatus.current.isGhost && (
            <Text style={styles.statusEffectIcon}>👻</Text>
          )}
        </View>
      </View>

      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            zIndex: 2,
            transform: [
              { translateX: cameraTransform.x },
              { scale: cameraTransform.scale }
            ]
          }
        ]}
      >
        {bots.map((bot, index) => {
          const isSwapParticipant =
            activeSwap?.callerId === bot.id ||
            currentSwapTarget === bot.id;

          return (
            <Animated.View
              key={bot.id}
              style={{
                position: 'absolute',
                top: bot.y,
                left: bot.x,
                zIndex: 4,
                transform: [
                  { rotate: `${bot.angle || 0}deg` },
                  { scale: isSwapParticipant ? swapScaleAnim : 1 },
                ],
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
                alignItems: 'center',
                justifyContent: 'flex-end',
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
          );
        })}

        <Animated.View
          style={{
            position: 'absolute',
            zIndex: 5,
            left: playerX,
            top: playerY,
            transform: [
              { rotate: `${angle}deg` },
              {
                scale:
                  activeSwap?.callerId === 'player' ||
                    currentSwapTarget === 'player'
                    ? swapScaleAnim
                    : 1,
              },
            ],
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {focusedDriver === 'player' && (
            <View style={styles.nameTag}>
              <Text style={styles.nameTagText}>VOCÊ</Text>
              <View style={styles.nameTagArrow} />
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
                speed={playerSpeed.current}
                skin="default"
                renderWidth={180}
              />
            </View>
          </DefenseCardVisual>
        </Animated.View>

        {activeChainsState && activeChainsState.duration > 0 && (() => {
          // Precisamos achar as coordenadas X e Y do Caller e do Target
          const getCoords = (id: string) => {
            if (id === 'player') return { x: playerX, y: playerY };
            const bot = bots.find(b => b.id === id);
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
              const callerX = activeBulletEffect.callerId === 'player' ? playerX : bots.find(b => b.id === activeBulletEffect.callerId)?.x || 0;
              const callerY = activeBulletEffect.callerId === 'player' ? playerY : bots.find(b => b.id === activeBulletEffect.callerId)?.y || 0;

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
        {bots.map(bot => bot.status?.isLevitating && (
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
            x={playerX}
            y={playerY}
            targetSize={PLAYER_SIZE}
            padding={10}
            angle={angle}
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

            return '⚙️';
          };

          return (
            <View key={piece.id} style={{
              position: 'absolute',
              left: piece.x,
              top: piece.y,
              width: 30,
              height: 30,
              backgroundColor: '#FFD700', // Dourado Flat
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
      </View>




      <View style={styles.boostBarContainer}>
        <View style={[styles.boostBarFill, { width: `${(boost / MAX_BOOST) * 100}%` }]} />
        <Text style={styles.boostBarText}>💧 {boost}/{MAX_BOOST}</Text>
      </View>


      <View style={styles.deckHandContainer}>
        {playerDeck.map((cardId, index) => {
          const cost = CARD_COSTS[cardId] || 0;
          const hasboost = boost >= cost;

          // Recupera o estado atual de cooldown do card específico
          let currentCooldown = 0;
          let maxCooldown = 1;
          if (cardId === 'swap') { currentCooldown = swapCooldown; maxCooldown = SWAP_COOLDOWN; }
          if (cardId === 'chains') { currentCooldown = chainsCooldown; maxCooldown = CHAINS_COOLDOWN; }
          if (cardId === 'bullet') { currentCooldown = bulletCooldown; maxCooldown = BULLET_COOLDOWN; }
          if (cardId === 'tnt') { currentCooldown = tntCooldown; maxCooldown = TNT_COOLDOWN; }
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
                !hasboost && { opacity: 0.4 } // Fica apagadinha/cinza sem boost!
              ]}
            >
              {currentCooldown > 0 && (
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: `${(currentCooldown / maxCooldown) * 100}%`,
                  backgroundColor: 'rgba(255,0,77,0.45)',
                }} />
              )}

              <View style={styles.cardCostBadge}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>💧{cost}</Text>
              </View>

              <Image
                source={CARD_IMAGES[cardId]}
                resizeMode="contain"
                style={styles.deckCardImage}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {started && !gameOver && (
        <View style={styles.drivingCluster}>
          <View style={styles.nitroBarContainer}>
            <View
              style={[
                styles.nitroBarFill,
                {
                  width: `${nitroPercent}%`,
                  backgroundColor: isNitroReady ? '#00FFFF' : '#FFD700',
                },
              ]}
            />
            <Text style={styles.nitroBarText}>VÁCUO</Text>
          </View>

          <View style={styles.drivingControls}>
            {isNitroReady && (
              <View style={styles.nitroBtn} onTouchStart={handleActivateNitro}>
                <Text style={styles.nitroBtnText}>NITRO</Text>
              </View>
            )}
            <View style={styles.throttleBtn} onTouchStart={handleAddImpulse}>
              <Text style={styles.throttleBtnText}>ACELERAR</Text>
            </View>
          </View>
        </View>
      )}

      {/* ================= BOTÃO DE LARGADA PERFEITA ================= */}
      {miniGameVisible && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMiniGamePress}
          style={[
            styles.miniGameBtn,
            { top: miniGamePos.top, left: miniGamePos.left }
          ]}
        >
          <Text style={styles.miniGameBtnText}>⚡</Text>
        </TouchableOpacity>
      )}

      {countdownStep && (
        <View style={styles.overlay} pointerEvents="none">
          {countdownStep === 'PREPARANDO' && <Text style={styles.titleText}>PREPARANDO...</Text>}
          {countdownStep === 'GO' && <Text style={[styles.titleText, { color: '#00D084' }]}>JÁ!</Text>}

          {typeof countdownStep === 'number' && (
            <View style={styles.trafficLightContainer}>
              <View style={[styles.light, { backgroundColor: countdownStep <= 3 ? '#00D084' : '#FF3B30' }]} />
              <View style={[styles.light, { backgroundColor: countdownStep <= 2 ? '#00D084' : '#FF3B30' }]} />
              <View style={[styles.light, { backgroundColor: countdownStep <= 1 ? '#00D084' : '#FF3B30' }]} />
            </View>
          )}
        </View>
      )}


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
  hud: { position: 'absolute', top: 12, right: 20, zIndex: 30, alignItems: 'flex-end' },
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
  positionBadge: { position: 'absolute', top: 12, left: 20, zIndex: 30, minWidth: 78, height: 42, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(8,8,12,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  positionBadgeValue: { color: '#FFD60A', fontSize: 23, fontWeight: '900', fontStyle: 'italic' },
  positionBadgeTotal: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '900', marginLeft: 4 },
  playerStatusRow: { marginTop: 5, minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  lifeCompact: { height: 24, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(8,8,12,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  lifeCompactIcon: { fontSize: 13, marginRight: 3 },
  lifeCompactValue: { fontSize: 13, fontWeight: '900' },
  statusEffectIcon: { minWidth: 24, height: 24, textAlign: 'center', textAlignVertical: 'center', color: '#FFF', fontSize: 11, fontWeight: '900', borderRadius: 8, backgroundColor: 'rgba(8,8,12,0.55)', overflow: 'hidden' },
  nitroBarContainer: { width: 150, height: 12, marginBottom: 7, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  nitroBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  nitroBarText: { color: '#FFF', fontWeight: '900', fontSize: 8, fontStyle: 'italic', letterSpacing: 0.8, zIndex: 2 },
  jumpArea: { position: 'absolute', backgroundColor: '#fff', left: 40, bottom: 30, height: 90, width: 90, borderRadius: 45, zIndex: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
  drivingCluster: { position: 'absolute', bottom: 14, right: 20, zIndex: 30, alignItems: 'flex-end' },
  drivingControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  throttleBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(0, 208, 132, 0.82)', borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 4, zIndex: 20 },
  throttleBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11, fontStyle: 'italic' },
  nitroBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(0, 255, 255, 0.9)', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 20 },
  nitroBtnText: { color: '#000', fontWeight: '900', fontSize: 11, fontStyle: 'italic' },
  block: { position: 'absolute', zIndex: 3 },
  miniGameBtn: { position: 'absolute', width: 64, height: 64, backgroundColor: '#FFCC00', borderWidth: 4, borderColor: '#1C1C1E', borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 9999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.4, shadowRadius: 3, },
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
  }, blindEffect: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgb(255, 255, 255)', zIndex: 15 },
  boostBarContainer: { position: 'absolute', bottom: 78, left: 20, width: 110, height: 14, backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  boostBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#FF007A' },
  boostBarText: { color: '#FFF', fontWeight: '900', fontSize: 10, zIndex: 5 },
  deckHandContainer: {
    position: 'absolute',
    bottom: 7,
    left: 140,
    right: 190,
    height: 72,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7
  },
  dynamicCardBtn: {
    width: 72,
    height: 68,
    borderRadius: 13,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
    borderWidth: 3,
    borderColor: '#FF004D'
  },
  deckCardImage: { width: '82%', height: '82%' },
  cardCostBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF007A', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#FFF', zIndex: 10 },
});