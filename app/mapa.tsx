// PARA TESTES REMOVA SEMPRE O "USE EFFECT DE PREPARAÇÃO DO INICIO"

import Carro from '@/components/Carro';
import ChainsEffect from '@/components/Decks/ChainsEffect';
import GuidedBulletEffect from '@/components/Decks/GuidedBulletEffect';
import SwapEffect from '@/components/Decks/SwapEffect';
import TornadoEffect from '@/components/Decks/TornadoEffect';
import CorrenteVisual from '@/components/ui/CorrenteVisual';
import GuidedBulletVisual from '@/components/ui/GuidedBulletVisual';
import TornadoVisual from '@/components/ui/TornadoVisual';
import { useCarSelection } from '@/context/CarContext';
import { carMaps } from '@/src/utils/carMaps';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View, useWindowDimensions } from 'react-native';

type CarKey = keyof typeof carMaps;

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

export default function Mapa() {

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const { selectedCar, selectedColor } = useCarSelection();

  const BASE_PLAYER_X = SCREEN_WIDTH * 0.4;
  const GAP_BETWEEN_RACERS = 130;
  const TOTAL_RACERS = 6;

  type CardEffect = 'swap' | 'chains' | 'heavy_gravity' | 'invert_controls' |
    'blind' | 'panic' | 'ghost' | 'score_boost' | 'tnt' |
    'bullet' | 'tornado' | 'slow_slow' | 'nitro_power';

  type TNTBox = {
    id: string;
    callerId: string;
    x: number;
    y: number;
    timer: number;
    state: 'counting' | 'exploding';
  };


  type Block = {
    id: any;
    type: 'flat' | 'ramp';
    x: number;
    width: number;
    y?: number;
    startY?: number;
    endY?: number;
  };

  const BOT_NAMES = [
    'Relâmpago', 'Marquinhos', 'Trovão', 'Faísca', 'Brisa',
    'Ventania', 'Cometa', 'Nitro', 'Sombra', 'Turbina', 'Rex'
  ];

  const CARD_CATEGORIES = {
    HEAVY_ATTACK: ['swap', 'bullet', 'chains', 'tnt', 'tornado'],
    TIME_ATTACK: ['slow_slow'],
    LIGHT_ATTACK: ['invert_controls', 'panic'],
    DEFENSE_BUFF: ['ghost', 'score_boost', 'nitro_power']
  };

  const COOLDOWNS = { HEAVY: 60 * 15, LIGHT: 60 * 8, DEFENSE: 60 * 12 };

  const defaultStatus = {
    gravityMultiplier: 1, controlsInverted: false, isBlind: false, isPanicking: false,
    isGhost: false, scoreMultiplier: 1, isStunned: false,
    isSlowed: false, invincibleTimer: 0
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


  const blocksRef = useRef<Block[]>([
    { id: 1, type: 'flat', x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH * 1.5 }
  ]);

  const getRandomColor = () => AVAILABLE_BOT_COLORS[Math.floor(Math.random() * AVAILABLE_BOT_COLORS.length)];
  const getRandomCarType = (): CarKey => {
    const carKeys: CarKey[] = Object.keys(carMaps) as CarKey[];
    return carKeys[Math.floor(Math.random() * carKeys.length)];
  };

  const botsRef = useRef([
    { id: 'bot1', name: getRandomName(), lives: 5, isDead: false, deck: generateRandomDeck(), angle: 0, x: 0, y: SCREEN_HEIGHT / 2, speed: 0, targetSpeed: MAX_SPEED, skin: 'default', isCrouching: false, velocity: 0, score: 0, thinkTimer: 0, status: { ...defaultStatus }, activeEffectsTimers: {}, carType: getRandomCarType(), carColor: getRandomColor() },
    { id: 'bot2', name: getRandomName(), lives: 5, isDead: false, deck: generateRandomDeck(), angle: 0, x: 0, y: SCREEN_HEIGHT / 2, speed: 0, targetSpeed: MAX_SPEED, skin: 'gangster', isCrouching: false, velocity: 0, score: 0, thinkTimer: 0, status: { ...defaultStatus }, activeEffectsTimers: {}, carType: getRandomCarType(), carColor: getRandomColor() },
    { id: 'bot3', name: getRandomName(), lives: 5, isDead: false, deck: generateRandomDeck(), angle: 0, x: 0, y: SCREEN_HEIGHT / 2, speed: 0, targetSpeed: MAX_SPEED, skin: 'ninja', isCrouching: false, velocity: 0, score: 0, thinkTimer: 0, status: { ...defaultStatus }, activeEffectsTimers: {}, carType: getRandomCarType(), carColor: getRandomColor() },
    { id: 'bot4', name: getRandomName(), lives: 5, isDead: false, deck: generateRandomDeck(), angle: 0, x: 0, y: SCREEN_HEIGHT / 2, speed: 0, targetSpeed: MAX_SPEED, skin: 'pirate', isCrouching: false, velocity: 0, score: 0, thinkTimer: 0, status: { ...defaultStatus }, activeEffectsTimers: {}, carType: getRandomCarType(), carColor: getRandomColor() },
    { id: 'bot5', name: getRandomName(), lives: 5, isDead: false, deck: generateRandomDeck(), angle: 0, x: 0, y: SCREEN_HEIGHT / 2, speed: 0, targetSpeed: MAX_SPEED, skin: 'surfer', isCrouching: false, velocity: 0, score: 0, thinkTimer: 0, status: { ...defaultStatus }, activeEffectsTimers: {}, carType: getRandomCarType(), carColor: getRandomColor() },
  ]);


  // ---- CRONOMETRO DA PARTIDA ---- //
  const [timeRemaining, setTimeRemaining] = useState(0);

  // ---- NITRO ---- //
  const [nitroPercent, setNitroPercent] = useState(0);
  const [isNitroReady, setIsNitroReady] = useState(false);
  const [angle, setAngle] = useState(0);

  // ---- DADOS DO PLAYER  ---- //
  const [playerY, setPlayerY] = useState(y.current);
  const [playerX, setPlayerX] = useState(playerXRef.current);
  const [playerLives, setPlayerLives] = useState(5);
  const playerLivesRef = useRef(5);
  const playerIsDead = useRef(false);


  const [bots, setBots] = useState(botsRef.current);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const [countdownStep, setCountdownStep] = useState<number | string | null>(null);

  const [cameraTransform, setCameraTransform] = useState({ x: 0, scale: 1 });
  const [focusedDriver, setFocusedDriver] = useState<number | string | null>(null);

  const [leaderboard, setLeaderboard] = useState<{ id: string, name: string }[]>([]);
  const lastOrderRef = useRef('');

  const [blocks, setBlocks] = useState(blocksRef.current);
  const [isBlindActive, setIsBlindActive] = useState(false);
  const [isGhostActive, setIsGhostActive] = useState(false);

  const [isCameraLocked, setIsCameraLocked] = useState(false);

  // ---- DECKS ---- //
  // SWAP
  const SWAP_COOLDOWN = 8000;
  const [activeSwap, setActiveSwap] = useState<{ callerId: string; targetId?: string; } | null>(null);
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
  const [tornadosToRendar, setTornadosToRender] = useState<{ id: string; callerX: number; victims: any[] }[]>([]);

  // SLOW SLOW
  const SLOW_COOLDOWN = 10000;
  const [slowCooldown, setSlowCooldown] = useState(0);
  const [isSlowActive, setIsSlowActive] = useState(false);

  // NITRO POWER
  const NITRO_COOLDOWN = 4000;
  const [nitroCooldown, setNitroCooldown] = useState(0);
  const [isNitroPowerActive, setIsNitroPowerActive] = useState(false);

  /* ================= CORES DE VIDAS QUE IRÃO PARA O PLACAR DE POSIÇÕES ================= */
  const getLifeColor = (lives: number) => {
    if (lives >= 4) return '#00D084'; // Verde (Saudável)
    if (lives === 3) return '#FFD700'; // Amarelo (Atenção)
    if (lives === 2) return '#FF8C00'; // Laranja (Perigo)
    if (lives === 1) return '#FF4500'; // Vermelho (Por um fio)
    return '#888888';                  // Cinza (Eliminado)
  };

  /* ================= SETA AS POSIÇÕES DE MODO ALEATORIO ================= */
  const setupPositions = () => {
    const positions = Array.from({ length: TOTAL_RACERS }, (_, i) => BASE_PLAYER_X - (i * GAP_BETWEEN_RACERS));
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    playerXRef.current = positions[0];
    setPlayerX(positions[0]);

    const groundY = SCREEN_HEIGHT - 100;
    const startY = groundY - PLAYER_SIZE;

    const newBots = [...botsRef.current];
    for (let i = 0; i < 5; i++) {
      newBots[i].x = positions[i + 1];
      newBots[i].y = startY;
      newBots[i].velocity = 0;
      newBots[i].speed = MIN_SPEED;
      newBots[i].status = { ...defaultStatus };
      newBots[i].activeEffectsTimers = {};
      newBots[i].deck = generateRandomDeck();
      newBots[i].carType = getRandomCarType();
      newBots[i].carColor = getRandomColor();
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
      const groundY = SCREEN_HEIGHT - 100;
      const startY = groundY - PLAYER_SIZE;

      y.current = startY;
      setPlayerY(y.current);

      blocksRef.current = [{ id: 1, type: 'flat', x: -2000, y: groundY, width: SCREEN_WIDTH * 5 + 2000 }];
      setBlocks(blocksRef.current);

      setupPositions();

      setTimeout(() => {
        startRaceSequence();
      }, 2000);
    }
  }, [SCREEN_HEIGHT, SCREEN_WIDTH]);

  /* ================= GAME LOOP ================= */
  useEffect(() => {
    if (!started || gameOver) return;

    const loop = setInterval(() => {
      gameTime.current += 1;

      if (playerStatus.current.invincibleTimer > 0) {
        playerStatus.current.invincibleTimer -= 1;
      }

      // ================= LÓGICA DO TIMER =================
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
      }

      if (!isCameraLocked) {
        const CAMERA_OFFSET_X = SCREEN_WIDTH * 0.35;

        setCameraTransform({
          x: -playerXRef.current + CAMERA_OFFSET_X,
          scale: 1,
        });
      }

      if (playerStatus.current.isStunned) {
        playerSpeed.current = 0;
      } else if (activeEffectsTimers.current['nitro_power'] && activeEffectsTimers.current['nitro_power'] > 0) {
          playerSpeed.current = NITRO_SPEED * 1.3;
      } else if (isNitroActive.current) {
        playerSpeed.current = NITRO_SPEED;
        nitroTimer.current -= 1;
        if (nitroTimer.current <= 0) {
          isNitroActive.current = false;
          nitroCharge.current = 0;
          setIsNitroReady(false);
          setNitroPercent(0);
        }
      } else {
        playerSpeed.current = Math.max(playerSpeed.current - FRICTION, MIN_SPEED);
      }

      if (playerStatus.current.isSlowed) {
        playerSpeed.current = Math.min(playerSpeed.current, MAX_SPEED * 0.4);
      }

      const dynamicSpeed = playerSpeed.current;
      let isDrafting = false;
      botsRef.current.forEach(bot => {
        const distanceToBot = bot.x - playerXRef.current;
        if (distanceToBot > 10 && distanceToBot < 120 && Math.abs(bot.y - y.current) < 30) isDrafting = true;
      });

      if (isDrafting && !isNitroActive.current && nitroCharge.current < 100) {
        nitroCharge.current += 0.8;
        if (nitroCharge.current >= 100) { nitroCharge.current = 100; if (!isNitroReady) setIsNitroReady(true); }
        if (gameTime.current % 5 === 0) setNitroPercent(nitroCharge.current);
      } else if (!isDrafting && !isNitroActive.current && nitroCharge.current > 0) {
        nitroCharge.current = Math.max(nitroCharge.current - 0.2, 0);
        if (nitroCharge.current < 100 && isNitroReady) setIsNitroReady(false);
        if (gameTime.current % 5 === 0) setNitroPercent(nitroCharge.current);
      }

      // Placar e Efeitos (Mantidos Iguais)
      if (gameTime.current % 10 === 0) {
        const allRacers = [{ id: 'player', name: 'Você (P1)', x: playerXRef.current }, ...botsRef.current.map(b => ({ id: b.id, name: b.name, x: b.x }))].sort((a, b) => b.x - a.x);
        const currentOrder = allRacers.map(r => r.id).join(',');
        if (currentOrder !== lastOrderRef.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
              case 'ghost': playerStatus.current.isGhost = false; setIsGhostActive(false); break;
              case 'score_boost': playerStatus.current.scoreMultiplier = 1; break;
              case 'slow_slow': playerStatus.current.isSlowed = false; setIsSlowActive(false); break;
            }
          }
        }
      }

      if (playerStatus.current.isPanicking && isGrounded.current && gameTime.current % 30 === 0) {
        velocity.current = JUMP_FORCE;
        isGrounded.current = false;
      }

      const currentGravity = GRAVITY * playerStatus.current.gravityMultiplier;
      velocity.current += currentGravity;
      y.current += velocity.current;

      // --- 4. GERAÇÃO E MOVIMENTO DOS BLOCOS (AGORA COM BURACOS INTELIGENTES) ---
      let updatedBlocks = blocksRef.current.map(block => ({ ...block, x: block.x - dynamicSpeed }));
      const lastBlock = updatedBlocks[updatedBlocks.length - 1];

      if (lastBlock && lastBlock.x + lastBlock.width < SCREEN_WIDTH + 1500) {
        const minWidth = 150;
        const maxWidth = 350;
        const newWidth = Math.random() * (maxWidth - minWidth) + minWidth;

        let direction = Math.floor(Math.random() * 3) - 1;
        const currentY = lastBlock.type === 'ramp' ? lastBlock.endY! : lastBlock.y!;
        let nextY = currentY + (direction * 80);

        if (nextY < 150) nextY = 150;
        if (nextY > SCREEN_HEIGHT - 100) nextY = SCREEN_HEIGHT - 100;

        const heightDiff = nextY - currentY;
        const newId = Math.random().toString(36).substr(2, 9);

        if (Math.abs(heightDiff) > 20) {
          // No RN, Y maior significa mais para baixo na tela.
          // Só geramos buraco se a próxima plataforma for mais BAIXA (heightDiff > 0)
          if (heightDiff > 0 && Math.random() > 0.4) {
            // Gera um buraco de 160px adicionando espaço VAZIO ao 'x' do próximo bloco
            updatedBlocks.push({
              id: newId,
              type: 'flat',
              x: lastBlock.x + lastBlock.width + 160,
              y: nextY,
              width: newWidth,
            });
          } else {
            // Se for subida (heightDiff < 0) ou se a chance de buraco falhou, gera uma rampa
            updatedBlocks.push({
              id: newId,
              type: 'ramp',
              x: lastBlock.x + lastBlock.width,
              startY: currentY,
              endY: nextY,
              width: 250,
            });
          }
        } else {
          updatedBlocks.push({
            id: newId,
            type: 'flat',
            x: lastBlock.x + lastBlock.width,
            y: currentY,
            width: newWidth,
          });
        }
      }

      blocksRef.current = updatedBlocks.filter(block => block.x + block.width > -200);

      // --- 5. INTELIGÊNCIA DE CORRIDA DOS BOTS  ---
      botsRef.current.forEach(bot => {

        if (bot.status.invincibleTimer > 0) bot.status.invincibleTimer -= 1;

        if (bot.isDead) {
          bot.speed = Math.max(bot.speed - FRICTION, 0);
          bot.x += (bot.speed - dynamicSpeed);
          bot.velocity = GRAVITY;
          bot.y += bot.velocity;
          return; // ESSE RETURN IMPEDE A IA DO BOT DO LOOP SER EXECUTADA
        }

        let targetSpeed = MAX_SPEED * (0.8 + Math.random() * 0.2);
        if (bot.x < playerXRef.current - 150) targetSpeed = MAX_SPEED * 1.1;

        if (bot.speed < targetSpeed) bot.speed += ACCELERATION * 0.8;
        if (bot.speed > targetSpeed) bot.speed -= FRICTION;

        if (bot.status.isSlowed) {
          targetSpeed = MAX_SPEED * 0.3;
        } else if (bot.activeEffectsTimers['nitro_power'] && bot.activeEffectsTimers['nitro_power'] > 0) {
          targetSpeed = NITRO_SPEED * 1.3;
          bot.speed = targetSpeed;
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
            }
          }
        }

        if (bot.status.isPanicking && bot.velocity === 0 && gameTime.current % 30 === 0) bot.velocity = JUMP_FORCE;

        const currentBotGravity = GRAVITY * bot.status.gravityMultiplier;
        bot.velocity += currentBotGravity;
        bot.y += bot.velocity;

        const botFootY = bot.y + PLAYER_SIZE;
        const botCenterX = bot.x + (PLAYER_SIZE / 2);

        let targetBotAngle = 0;

        // Novo cálculo de colisão do Bot baseado no "find" em vez de um for loop falho
        const currentBotBlock = blocksRef.current.find(
          block => botCenterX >= block.x && botCenterX <= block.x + block.width
        );

        if (currentBotBlock) {
          let groundYAtX = currentBotBlock.y || 0;

          if (currentBotBlock.type === 'flat') {
            groundYAtX = currentBotBlock.y!;
            targetBotAngle = 0;
          } else if (currentBotBlock.type === 'ramp') {
            const progress = (botCenterX - currentBotBlock.x) / currentBotBlock.width;
            groundYAtX = currentBotBlock.startY! + ((currentBotBlock.endY! - currentBotBlock.startY!) * progress);
            const dy = currentBotBlock.endY! - currentBotBlock.startY!;
            targetBotAngle = Math.atan2(dy, currentBotBlock.width) * (180 / Math.PI);
          }

          if (bot.status.isStunned) {
            targetBotAngle = (gameTime.current * 35) % 360; // Ajuste o 35 para girar mais rápido/devagar
          }

          // Verificação sólida cravando no chão
          if (bot.velocity >= 0 && botFootY >= groundYAtX - 25) {
            bot.y = groundYAtX - PLAYER_SIZE + 6;
            bot.velocity = 0;
            bot.status.isStunned = false;

            // IA para Pular de plataforma se estiver acabando
            if (currentBotBlock.type === 'flat') {
              const distanceToEnd = (currentBotBlock.x + currentBotBlock.width) - bot.x;
              let reactionDistance = 80 + (Math.random() * 40);
              if (!bot.status.isBlind && distanceToEnd < reactionDistance) {
                bot.velocity = JUMP_FORCE;
              }
            }
          }
        }
        bot.angle = targetBotAngle;
      });

      botsRef.current = botsRef.current.filter(bot => bot.y <= SCREEN_HEIGHT + 100);

      if (gameTime.current % 30 === 0) processBotsAI();

      // --- 6. EFEITO DA CORRENTE (CHAINS) ---
      if (activeChainsStateRef.current && activeChainsStateRef.current.duration > 0) {
        const { callerId, targetId } = activeChainsStateRef.current;

        const callerX = callerId === 'player' ? playerXRef.current : botsRef.current.find(b => b.id === callerId)?.x || -1000;
        const targetX = targetId === 'player' ? playerXRef.current : botsRef.current.find(b => b.id === targetId)?.x || -1000;

        // Math.abs garante que a distância seja positiva, mesmo se o caller passar o target
        const distanceBetween = Math.abs(targetX - callerX);

        if (distanceBetween <= 20) {
          // Os carros colidiram/se passaram. Limpamos o estado!
          activeChainsStateRef.current = null;
          setActiveChainsState(null);
          setActiveChains(null);

          // REMOVIDO: O "return;" perigoso que travava o jogo sumiu daqui.
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

      // --- 6.1. FÍSICA DO MÍSSIL GUIADO ---
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

          const hit = applyDamage(bullet.targetId)
          if (!hit) return;

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

      // --- 6.2. FÍSICA DO TNT (CRASH BANDICOOT BOX) ---
      let remainingTNT: TNTBox[] = [];
      activeTNTRef.current.forEach(tnt => {
        // Move a caixa junto com o cenário para trás
        tnt.x -= dynamicSpeed;

        if (tnt.state === 'exploding') {
          // Mantém a explosão na tela por alguns frames para o visual
          tnt.timer -= 1;
          if (tnt.timer > 0) remainingTNT.push(tnt);
        } else {
          tnt.timer -= 1;

          // Encontra o chão debaixo da caixa para ela cair e fixar
          const currentTntBlock = blocksRef.current.find(b => tnt.x + (PLAYER_SIZE / 2) >= b.x && tnt.x + (PLAYER_SIZE / 2) <= b.x + b.width);
          if (currentTntBlock) {
            let groundY = currentTntBlock.y || 0;
            if (currentTntBlock.type === 'ramp') {
              const progress = (tnt.x + (PLAYER_SIZE / 2) - currentTntBlock.x) / currentTntBlock.width;
              groundY = currentTntBlock.startY! + ((currentTntBlock.endY! - currentTntBlock.startY!) * progress);
            }
            // Crava no chão ou cai
            if (tnt.y + PLAYER_SIZE < groundY - 5) {
              tnt.y += GRAVITY * 6; // Cai rápido
            } else {
              tnt.y = groundY - PLAYER_SIZE;
            }
          }

          // EXPLOSÃO!
          if (tnt.timer <= 0) {
            tnt.state = 'exploding';
            tnt.timer = 15;

            const EXPLOSION_RADIUS = 160;
            const JUMP_PENALTY = JUMP_FORCE * 1.6;

            const applyBlast = (racerId: string, rx: number, ry: number) => {
              const dx = rx - tnt.x;
              const dy = ry - tnt.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < EXPLOSION_RADIUS) {

                const hit = applyDamage(racerId)
                if (!hit) return;


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

      // --- 7. COLISÕES DO PLAYER
      let landedOnBlock = false;
      const playerFootY = y.current + PLAYER_SIZE;
      const playerCenterX = playerXRef.current + (PLAYER_SIZE / 2);
      let targetAngle = 0;

      // Encontra exatamente qual bloco está debaixo do centro do jogador
      const currentBlock = blocksRef.current.find(
        block => playerCenterX >= block.x && playerCenterX <= block.x + block.width
      );

      if (currentBlock) {
        let groundYAtX = currentBlock.y || 0;

        if (currentBlock.type === 'flat') {
          groundYAtX = currentBlock.y!;
          targetAngle = 0;
        } else if (currentBlock.type === 'ramp') {
          const progress = (playerCenterX - currentBlock.x) / currentBlock.width;
          groundYAtX = currentBlock.startY! + ((currentBlock.endY! - currentBlock.startY!) * progress);
          const dy = currentBlock.endY! - currentBlock.startY!;
          targetAngle = Math.atan2(dy, currentBlock.width) * (180 / Math.PI);
        }

        if (playerStatus.current.isStunned) {
          targetAngle = (gameTime.current * 35) % 360;
        }

        // CRAVA NO CHÃO se estiver caindo e passou/chegou da linha do chão 
        if (velocity.current >= 0 && playerFootY >= groundYAtX - 25) {
          y.current = groundYAtX - PLAYER_SIZE + 6;
          velocity.current = 0;
          landedOnBlock = true;
          playerStatus.current.isStunned = false;
        }
      }

      setAngle(targetAngle);
      isGrounded.current = landedOnBlock;

      if (y.current > SCREEN_HEIGHT + 100) setGameOver(true);

      if (gameTime.current % 10 === 0) setScore(s => s + Math.floor(playerSpeed.current / 3));

      setPlayerY(y.current);
      setPlayerX(playerXRef.current);
      setBlocks(blocksRef.current);
      setBots([...botsRef.current])

      setBulletsToRender([...activeBulletsRef.current]);
      setTntsToRender([...activeTNTRef.current]);
    }, 16);

    return () => clearInterval(loop);
  }, [started, gameOver, SCREEN_WIDTH, SCREEN_HEIGHT]);

  /* ================= GERENCIADOR ÚNICO DE COOLDOWNS (UI) ================= */
  useEffect(() => {
    const hasActiveCooldown = swapCooldown > 0 || chainsCooldown > 0 || bulletCooldown > 0 || tntCooldown > 0 || tornadoCooldown > 0 || slowCooldown > 0 || nitroPowerCooldown > 0;
    
    if (!hasActiveCooldown) return;

    const globalInterval = setInterval(() => {
      // Reduz o Swap
      if (swapCooldown > 0) {
        setSwapCooldown(prev => Math.max(0, prev - 100));
      }
      // Reduz a Corrente (Chains)
      if (chainsCooldown > 0) {
        setChainsCooldown(prev => Math.max(0, prev - 100));
      }
      // Reduz o Míssil (Bullet)
      if (bulletCooldown > 0) {
        setBulletCooldown(prev => Math.max(0, prev - 100));
      }
      // Reduz a TNT
      if (tntCooldown > 0) {
        setTntCooldown(prev => Math.max(0, prev - 100));
      }
      // Reduz o Tornado
      if (tornadoCooldown > 0) {
        setTornadoCooldown(prev => Math.max(0, prev - 100));
      }
      // Reduz o Slow
      if (slowCooldown > 0) {
        setSlowCooldown(prev => Math.max(0, prev - 100));
      }

      // Reduz o Nitro Power
      if (nitroCooldown > 0) {
        setNitroCooldown(prev => Math.max(0, prev - 100));
      }
    }, 100);

    return () => clearInterval(globalInterval);
  }, [swapCooldown, chainsCooldown, bulletCooldown, tntCooldown, tornadoCooldown, slowCooldown, nitroCooldown]);

  /* ================= GERA NOME ALEATORIO DOS BOTS ================= */
  function getRandomName() {
    return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  }

  /* ================= GERA CARTA ALEATORIA QUE OS BOTS VÃO ATACAR ================= */
  function generateRandomDeck() {
    const allEffects: CardEffect[] = ['swap', 'blind', 'score_boost', 'bullet', 'chains', 'tnt', 'tornado', 'nitro_power'];
    const shuffled = allEffects.sort(() => 0.5 - Math.random());
    return [
      { effect: shuffled[0], currentCooldown: 60 * 3 + Math.floor(Math.random() * 120), baseCooldown: COOLDOWNS.HEAVY },
      { effect: shuffled[1], currentCooldown: 60 * 3 + Math.floor(Math.random() * 120), baseCooldown: COOLDOWNS.LIGHT }
    ];
  }

  /* ================= DA O IMPULSO ================= */
  function handleAddImpulse() {
    if (gameOver || isNitroActive.current) return;
    playerSpeed.current = Math.min(playerSpeed.current + IMPULSE_FORCE, MAX_SPEED);
  }


  /* ================= HABILITA O SWAP ================= */
  function triggerSwap(callerId: string) {
    if (activeSwap) return;

    setActiveSwap({
      callerId,
    });
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
    applyCardEffect('nitro_power', 'player', 'player')
    setIsNitroPowerActive(true);
  }




  /* ================= IA DOS BOTS ================= */
  function processBotsAI() {
    const allRacers = [{ id: 'player', x: playerXRef.current, isPlayer: true }, ...botsRef.current.map(b => ({ id: b.id, x: b.x, isPlayer: false }))].sort((a, b) => b.x - a.x);

    botsRef.current.forEach(bot => {
      if (bot.thinkTimer > 0) { bot.thinkTimer--; return; }

      const availableCards = bot.deck.filter(card => card.currentCooldown <= 0);

      if (availableCards.length === 0) return;

      const myRank = allRacers.findIndex(r => r.id === bot.id);
      const chosenCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      let target = bot.id;

      if (!CARD_CATEGORIES.DEFENSE_BUFF.includes(chosenCard.effect as any)) {
        const opponentsAhead = allRacers.slice(0, myRank);

        if (opponentsAhead.length > 0) {
          if (chosenCard.effect === 'swap') {
            target = Math.random() > 0.4 ? opponentsAhead[0].id : opponentsAhead[Math.floor(Math.random() * opponentsAhead.length)].id;
          } else {
            target = Math.random() > 0.3 ? opponentsAhead[opponentsAhead.length - 1].id : opponentsAhead[Math.floor(Math.random() * opponentsAhead.length)].id;
          }
        } else {
          const opponentsBehind = allRacers.slice(myRank + 1);
          if (opponentsBehind.length > 0) target = opponentsBehind[0].id;
          else return;
        }
      }

      if (chosenCard.effect === 'swap') {
        const targetRacer = allRacers.find(r => r.id === target);
        if (targetRacer && targetRacer.x <= bot.x) { bot.thinkTimer = 30; return; }
      }

      if (chosenCard.effect === 'swap') {
        triggerSwap(bot.id);
      } else if (chosenCard.effect === 'tnt') {
        triggerTNT(bot.id);
      } else if (chosenCard.effect === 'bullet') {
        triggerBullet(bot.id);
      } else if (chosenCard.effect === 'tornado') {
        triggerTornado(bot.id);
      } else {
        applyCardEffect(chosenCard.effect as CardEffect, target, bot.id);
      }

      chosenCard.currentCooldown = chosenCard.baseCooldown;
      bot.thinkTimer = 60 + Math.floor(Math.random() * 120);
    });
  }

  /* ================= APLICA EFEITO DAS CARTAS (VAI SER REMOVIDO) ================= */
  function applyCardEffect(effect: CardEffect, targetId: string, sourceId: string) {
    const DURATION = 60 * 4;
    const CHAINS_DURATION = 60 * 5;

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
          const tempY = y.current; const tempX = playerXRef.current;
          y.current = sourceBot.y; playerXRef.current = sourceBot.x;
          sourceBot.y = tempY; sourceBot.x = tempX;
        } else {
          const targetBot = botsRef.current.find(b => b.id === targetId);
          if (targetBot) {
            const tempY = targetBot.y; const tempX = targetBot.x;
            targetBot.y = sourceBot.y; sourceBot.y = tempY;
            targetBot.x = sourceBot.x; sourceBot.x = tempX;
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

    if (targetId === 'player') {
      activeEffectsTimers.current[effect] = DURATION;
      switch (effect) {
        case 'blind': playerStatus.current.isBlind = true; setIsBlindActive(true); break;
        case 'score_boost': playerStatus.current.scoreMultiplier = 2; break;
        case 'slow_slow': playerStatus.current.isSlowed = true; setIsSlowActive(true); break;
      }
    } else {
      const targetBot = botsRef.current.find(b => b.id === targetId);
      if (targetBot) {
        targetBot.activeEffectsTimers[effect] = DURATION;
        if (effect === 'panic') targetBot.status.isPanicking = true;
        if (effect === 'blind') { targetBot.status.isBlind = true; targetBot.activeEffectsTimers.blind = DURATION; }
        if (effect === 'slow_slow') { targetBot.status.isSlowed = true; targetBot.activeEffectsTimers.slow_slow = DURATION; }
      }
    }
  }

  /* ================= APLICA DANDO E INVENCIBILIDADE ================= */
  function applyDamage(racerId: string) {
    if (racerId === 'player') {
      if (playerStatus.current.invincibleTimer > 0 || playerIsDead.current) return false;

      playerLivesRef.current -= 1;
      setPlayerLives(playerLivesRef.current);
      playerStatus.current.invincibleTimer = 90 // 1.5 segundos a 60 FPS piscando

      if (playerLives.current <= 0) {
        playerIsDead.current = true;
        playerSpeed.current = 0; // PARA O CARRO
        setTimeout(() => setGameOver(true), 1000);
      }
      return true;
    } else {
      const bot = botsRef.current.find(b => b.id === racerId);
      if (bot) {
        if (bot.status.invincibleTimer > 0 || bot.isDead) return false;

        bot.lives -= 1;
        bot.status.invincibleTimer = 90;

        if (bot.lives <= 0) {
          bot.isDead = true;
          bot.speed = 0;
        }
        return true;
      }
    }

    return false;
  }

  /* ================= APLICA EFEITO DO SWAP (VAI SER REMOVIDO) ================= */
  function handleSwapPress() {
    if (swapCooldown > 0) return;
    triggerSwap('player');
    setSwapCooldown(SWAP_COOLDOWN);
  }

  /* ================= APLICA EFEITO DO CHAINS (VAI SER REMOVIDO) ================= */
  function handleChainsPress() {
    if (chainsCooldown > 0) return;
    triggerChains('player');
    setChainsCooldown(CHAINS_COOLDOWN);
  }

  /* ================= APLICA EFEITO DO MISSIL GUIADO (VAI SER REMOVIDO) ================= */
  function handleBulletPress() {
    if (bulletCooldown > 0) return;
    triggerBullet('player');
    setBulletCooldown(BULLET_COOLDOWN);
  }

  /* ================= APLICA EFEITO DO TORNADO (VAI SER REMOVIDO) ================= */
  function handleTornadoPress() {
    if (tornadoCooldown > 0) return;
    triggerTornado('player');
    setTornadoCooldown(TORNADO_COOLDOWN);
  }

  /* ================= APLICA EFEITO DO NITRO (VAI SER REMOVIDO) ================= */
  function handleNitroPowerPress() {
    if (nitroCooldown > 0) return;
    triggerNitroPower('player');
    setNitroCooldown(NITRO_COOLDOWN);
  }

  /* ================= APLICA EFEITO DO SLOW SLOW (VAI SER REMOVIDO) ================= */
  function handleSlowPress() {
    if (slowCooldown > 0) return;
    botsRef.current.forEach(bot => {
      applyCardEffect('slow_slow', bot.id, 'player');
    });

    setSlowCooldown(SLOW_COOLDOWN);
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
      timer: 180,
      state: 'counting'
    });
  }

  /* ================= RECEBE O IMPACTO DO TORNADO ================= */
  function handleTornadoHit(victimId: string) {
    const JUMP_PENALTY = JUMP_FORCE * 1.5;

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


  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const focusOn = (targetX: number, zoom: boolean = true) => {
    const toScale = zoom ? 2 : 1;
    const targetCenter = targetX + (PLAYER_SIZE / 2);

    const offset = zoom
      ? (SCREEN_WIDTH / 2 - targetCenter) * toScale
      : 0;
    setCameraTransform({ x: offset, scale: toScale });
  };

  const startRaceSequence = async () => {
    if (isCountingRef.current) return;
    isCountingRef.current = true;

    setCountdownStep('PREPARANDO');
    await sleep(1500);

    if (botsRef.current[0]) {
      setIsCameraLocked(true);
      setCountdownStep(3);
      setFocusedDriver(null);
      setFocusedDriver(0);
      focusOn(botsRef.current[0].x);
    }
    await sleep(1000);

    if (botsRef.current[1]) {
      setIsCameraLocked(true);
      setCountdownStep(2);
      setFocusedDriver(null);
      setFocusedDriver(1);
      focusOn(botsRef.current[1].x);
    }
    await sleep(1000);

    if (botsRef.current[2]) {
      setIsCameraLocked(true);
      setCountdownStep(1);
      setFocusedDriver(null);
      setFocusedDriver(2);
      focusOn(botsRef.current[2].x);
    }
    await sleep(1000);

    setFocusedDriver(null);
    setCountdownStep('JÁ!');
    setIsCameraLocked(false);
    setStarted(true);

    isCountingRef.current = false;
    await sleep(800);
    setCountdownStep(null);
  };

  function handleJump() {
    if (gameOver) {

      const groundY = SCREEN_HEIGHT - 100;
      const startY = groundY - PLAYER_SIZE;

      setGameOver(false);
      cameraOffset.setValue(0);
      setCountdownStep(null);
      setStarted(false);
      setScore(0);
      gameTime.current = 0;
      nitroCharge.current = 0;
      setNitroPercent(0);
      setIsNitroReady(false);
      isNitroActive.current = false;
      y.current = startY;
      velocity.current = 0;
      blocksRef.current = [{ id: Date.now(), type: 'flat', x: 0, y: groundY, width: SCREEN_WIDTH * 1.5 }];
      setBlocks(blocksRef.current); setupPositions();
      return;
    }

    if (playerStatus.current.controlsInverted) {
      isCrouchingRef.current = true; setIsCrouching(true);
      setTimeout(() => { isCrouchingRef.current = false; setIsCrouching(false); }, 500);
      return;
    }

    if (isGrounded.current) { velocity.current = JUMP_FORCE; isGrounded.current = false; }
  }

  function handleActivateNitro() {
    if (isNitroReady && !isNitroActive.current) { isNitroActive.current = true; nitroTimer.current = NITRO_DURATION; setIsNitroReady(false); }
  }

  // Preparação do Mini-mapa
  const allRacersPositions = [
    { id: 'player', x: playerX, color: selectedColor || '#00D084', isPlayer: true },
    ...bots.map(b => ({ id: b.id, x: b.x, color: b.carColor, isPlayer: false }))
  ];

  const minMapX = Math.min(...allRacersPositions.map(r => r.x));
  const maxMapX = Math.max(...allRacersPositions.map(r => r.x));
  const mapSpan = Math.max(2000, maxMapX - minMapX);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject} />

      <View style={styles.leaderboardContainer} pointerEvents="none">
        <Text style={styles.leaderboardTitle}>RANKING</Text>
        {leaderboard.map((racer, index) => {
          // Resgata a quantidade de vidas de acordo com o ID
          const currentLives = racer.id === 'player'
            ? playerLives
            : bots.find(b => b.id === racer.id)?.lives || 0;

          return (
            <View
              key={racer.id}
              style={[
                styles.leaderboardItem,
                racer.id === 'player' && styles.leaderboardItemPlayer,
                currentLives <= 0 && { opacity: 0.5 } // Deixa o corredor apagadinho se for eliminado
              ]}
            >
              <Text style={styles.leaderboardRank}>{index + 1}º</Text>
              <Text style={styles.leaderboardName} numberOfLines={1}>{racer.name}</Text>

              {/* Ícone e número de vidas com cor dinâmica */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                <Text style={{ fontSize: 10, marginRight: 2 }}>❤️</Text>
                <Text
                  style={{
                    color: getLifeColor(currentLives), // <--- A mágica acontece aqui
                    fontSize: 12,
                    fontWeight: '900',
                    textShadowColor: 'rgba(0,0,0,0.5)', // Um sombreado leve ajuda a leitura da cor
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 1
                  }}
                >
                  {currentLives}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ================= MINI-MAPA ================= */}
      <View style={styles.miniMapContainer}>
        <View style={styles.miniMapLine} />
        {activeTornado && (
          <TornadoEffect
            callerId={activeTornado.callerId}
            allRacers={allRacersPositions}
            onTornadoAnnounced={(victims, callerX) => {
              setTornadosToRender(prev => [
                ...prev,
                { id: Math.random().toString(), callerX, victims }
              ]);
              setActiveTornado(null);
            }}
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
              applyCardEffect('swap', targetId, activeSwap.callerId);
              setCurrentSwapTarget(null);
              setActiveSwap(null);
            }}
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

      <View style={styles.hud}>
        <Text style={styles.scoreText}>⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</Text>
        <View
          style={{ flexDirection: 'row', marginTop: 10, alignSelf: 'flex-end', gap: 2 }}
        >
          {[1, 2, 3, 4, 5].map((life) => (
            <Text key={life}
              style={{
                fontSize: 20,
                opacity: life <= playerLives ? 1 : 0.3,
                textShadowColor: '#000',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2
              }} >
              ❤️
            </Text>
          ))}
        </View>
        <View style={styles.nitroBarContainer}>
          <View style={[styles.nitroBarFill, { width: `${nitroPercent}%`, backgroundColor: isNitroReady ? '#00FFFF' : '#FFD700' }]} />
          <Text style={styles.nitroBarText}>VÁCUO</Text>
        </View>
      </View>

      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [
              { translateX: cameraTransform.x },
              { scale: cameraTransform.scale }
            ]
          }
        ]}
      >
        {blocks.map((b) => {
          if (b.type === 'flat') {
            return <View key={`flat-${b.id}`} style={[styles.block, { left: b.x, top: b.y, width: b.width }]} />;
          } else if (b.type === 'ramp') {
            const dy = b.endY! - b.startY!;
            const dx = b.width;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const midX = b.x + dx / 2;
            const midY = (b.startY! + b.endY!) / 2;

            return (
              <View
                key={`ramp-${b.id}`}
                style={[
                  styles.block,
                  {
                    left: midX - length / 2,
                    top: midY - 1000,
                    width: length,
                    height: 2000,
                    transform: [{ rotate: `${angle}deg` }, { translateY: 1000 }]
                  }
                ]}
              />
            );
          }
        })}

        {bots.map((bot, index) => (
          <View
            key={bot.id}
            style={{
              position: 'absolute',
              top: bot.y,
              left: bot.x,
              zIndex: 4,
              transform: [{ rotate: `${bot.angle || 0}deg` }],
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
            <View style={{ width: '200%', alignItems: 'center' }}>

              <Carro
                carType={"fusca"}
                carColor={bot.carColor}
                speed={bot.speed}
                skin={bot.skin} />
            </View>
          </View>
        ))}

        <View
          style={{
            position: 'absolute',
            zIndex: 5,
            opacity: isGhostActive ? 0.4 : 1,
            left: playerX,
            top: playerY,
            transform: [{ rotate: `${angle}deg` }],
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
          <View style={{ width: '200%', alignItems: 'center' }}>
            <Carro
              carType={selectedCar}
              carColor={selectedColor}
              speed={playerSpeed.current}
              skin="default" />
          </View>
        </View>

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

        {/* ================= RENDER DAS CAIXAS DE TNT ================= */}
        {tntsToRender.map((tnt) => {
          const numberToShow = Math.ceil(tnt.timer / 60);

          if (tnt.state === 'exploding') {
            return (
              <View key={tnt.id} style={{
                position: 'absolute', left: tnt.x - 50, top: tnt.y - 50,
                width: PLAYER_SIZE + 100, height: PLAYER_SIZE + 100,
                backgroundColor: 'rgba(255, 69, 0, 0.8)',
                borderRadius: 100,
                justifyContent: 'center', alignItems: 'center',
                zIndex: 6,
                borderWidth: 4, borderColor: '#FFFF00'
              }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFF' }}>BOOM!</Text>
              </View>
            );
          }

          return (
            <View key={tnt.id} style={{
              position: 'absolute', left: tnt.x, top: tnt.y,
              width: PLAYER_SIZE, height: PLAYER_SIZE,
              backgroundColor: '#B22222',
              borderWidth: 3, borderColor: '#8B0000',
              justifyContent: 'center', alignItems: 'center',
              zIndex: 3,
            }}>
              <View style={{ position: 'absolute', width: '100%', height: 4, backgroundColor: '#8B0000', top: 10 }} />
              <View style={{ position: 'absolute', width: '100%', height: 4, backgroundColor: '#8B0000', bottom: 10 }} />
              <Text style={{
                color: '#FFF', fontSize: 24, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
              }}>
                {numberToShow > 0 ? numberToShow : 0}
              </Text>
            </View>
          );
        })}

        {/* ================= RENDER DOS TORNADOS ================= */}
        {tornadosToRendar.map((tornado) => (
          <TornadoVisual
            key={tornado.id}
            callerX={tornado.callerX}
            victims={tornado.victims}
            onHitVictim={handleTornadoHit}
            onComplete={() => {
              setTornadosToRender(prev => prev.filter(t => t.id !== tornado.id));
            }}
          />
        ))}
      </View>

      {isBlindActive && <View style={styles.blindEffect} pointerEvents="none" />}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSwapPress}
        style={{
          width: 82,
          height: 82,
          borderRadius: 41,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1B1B1B',
          borderWidth: 3,
          borderColor: '#FF004D',
          position: 'absolute',
          bottom: 2,
          left: 5
        }}
      >
        {/* PROGRESSO DO COOLDOWN */}
        {swapCooldown > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${(swapCooldown / SWAP_COOLDOWN) * 100}%`,
              backgroundColor: 'rgba(255,0,77,0.45)',
            }}
          />
        )}

        {/* TEXTO */}
        <Text
          style={{
            color: 'white',
            fontWeight: '900',
            fontSize: 18,
            letterSpacing: 1,
          }}
        >
          SWAP
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleBulletPress}
        style={{
          width: 82,
          height: 82,
          borderRadius: 41,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1B1B1B',
          borderWidth: 3,
          borderColor: '#FF004D',
          position: 'absolute',
          bottom: 2,
          left: 30 + 82
        }}
      >
        {/* PROGRESSO DO COOLDOWN */}
        {bulletCooldown > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${(bulletCooldown / BULLET_COOLDOWN) * 100}%`,
              backgroundColor: 'rgba(255,0,77,0.45)',
            }}
          />
        )}

        {/* TEXTO */}
        <Text
          style={{
            color: 'white',
            fontWeight: '900',
            fontSize: 18,
            letterSpacing: 1,
          }}
        >
          MÍSSIL
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleChainsPress}
        style={{
          width: 82,
          height: 82,
          borderRadius: 41,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1B1B1B',
          borderWidth: 3,
          borderColor: '#FF004D',
          position: 'absolute',
          bottom: 2,
          left: 30 + 82 * 2
        }}
      >
        {/* PROGRESSO DO COOLDOWN */}
        {chainsCooldown > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${(chainsCooldown / CHAINS_COOLDOWN) * 100}%`,
              backgroundColor: 'rgba(255,0,77,0.45)',
            }}
          />
        )}

        {/* TEXTO */}
        <Text
          style={{
            color: 'white',
            fontWeight: '900',
            fontSize: 18,
            letterSpacing: 1,
          }}
        >
          CHAINS
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleTNTPress}
        style={{
          width: 82, height: 82, borderRadius: 41, overflow: 'hidden',
          justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#1B1B1B', borderWidth: 3, borderColor: '#FF4500',
          position: 'absolute', bottom: 2,
          left: 30 + 82 * 3 // Posicionado como o 4º botão
        }}
      >
        {tntCooldown > 0 && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(tntCooldown / TNT_COOLDOWN) * 100}%`,
            backgroundColor: 'rgba(255,69,0,0.45)',
          }}
          />
        )}
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
          TNT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleTornadoPress}
        style={{
          width: 82, height: 82, borderRadius: 41, overflow: 'hidden',
          justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#1B1B1B', borderWidth: 3, borderColor: '#FF4500',
          position: 'absolute', bottom: 2,
          left: 30 + 82 * 4 // Posicionado como o 4º botão
        }}
      >
        {tntCooldown > 0 && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(tntCooldown / TNT_COOLDOWN) * 100}%`,
            backgroundColor: 'rgba(255,69,0,0.45)',
          }}
          />
        )}
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
          TORNADO
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleSlowPress}
        style={{
          width: 82, height: 82, borderRadius: 41, overflow: 'hidden',
          justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#1B1B1B', borderWidth: 3, borderColor: '#FF4500',
          position: 'absolute', bottom: 2,
          left: 30 + 82 * 5 // Posicionado como o 4º botão
        }}
      >
        {tntCooldown > 0 && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(tntCooldown / TNT_COOLDOWN) * 100}%`,
            backgroundColor: 'rgba(255,69,0,0.45)',
          }}
          />
        )}
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
          SLOW
        </Text>
      </TouchableOpacity>
    
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleNitroPowerPress}
        style={{
          width: 82, height: 82, borderRadius: 41, overflow: 'hidden',
          justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#1B1B1B', borderWidth: 3, borderColor: '#FF4500',
          position: 'absolute', bottom: 2,
          left: 30 + 82 * 6
        }}
      >
        {nitroCooldown > 0 && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(nitroCooldown / NITRO_COOLDOWN) * 100}%`,
            backgroundColor: 'rgba(255,69,0,0.45)',
          }}
          />
        )}
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
          NTITRO POWER
        </Text>
      </TouchableOpacity>

      {started && !gameOver && (
        <View style={styles.drivingControls}>
          {isNitroReady && (
            <View style={styles.nitroBtn} onTouchStart={handleActivateNitro}><Text style={styles.nitroBtnText}>NITRO</Text></View>
          )}
          <View style={styles.throttleBtn} onTouchStart={handleAddImpulse}>
            <Text style={styles.throttleBtnText}>Acelerar</Text>
          </View>
        </View>
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

      {gameOver && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.titleText}>CAIU!</Text>
          <Text style={{ color: '#fff', fontSize: 20 }}>Você correu {score}m</Text>
          <Text style={{ color: '#aaa', marginTop: 20 }}>Toque para tentar de novo</Text>
        </View>
      )}
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05ebfc', overflow: 'hidden' },
  miniMapContainer: { position: 'absolute', top: 20, alignSelf: 'center', width: '60%', height: 20, justifyContent: 'center', zIndex: 10 },
  miniMapLine: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 2 },
  miniMapDot: { position: 'absolute', top: '50%', marginTop: -5 },
  hud: { position: 'absolute', top: 60, right: 50, zIndex: 10 },
  scoreText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  leaderboardContainer: { position: 'absolute', top: 60, left: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 10, borderRadius: 10, zIndex: 10, width: 150 },
  leaderboardTitle: { color: '#FFD700', fontWeight: '900', fontStyle: 'italic', marginBottom: 5, textAlign: 'center', fontSize: 12 },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 5 },
  leaderboardItemPlayer: { backgroundColor: 'rgba(0, 208, 132, 0.4)', borderWidth: 1, borderColor: '#00D084' },
  leaderboardRank: { color: '#FFF', fontWeight: 'bold', width: 25, fontSize: 12 },
  leaderboardName: { color: '#FFF', fontSize: 12, flex: 1 },
  nitroBarContainer: { marginTop: '3%', alignSelf: 'center', width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, borderWidth: 2, borderColor: '#FFF', overflow: 'hidden', zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  nitroBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  nitroBarText: { color: '#FFF', fontWeight: 'bold', fontSize: 10, fontStyle: 'italic', zIndex: 2 },
  jumpArea: { position: 'absolute', backgroundColor: '#fff', left: 40, bottom: 30, height: 90, width: 90, borderRadius: 45, zIndex: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
  drivingControls: { position: 'absolute', bottom: 30, right: 40, flexDirection: 'row', alignItems: 'center', gap: 20, zIndex: 30 },
  throttleBtn: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0, 208, 132, 0.8)', borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
  throttleBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, fontStyle: 'italic' },
  nitroBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0, 255, 255, 0.9)', borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  nitroBtnText: { color: '#000', fontWeight: '900', fontSize: 14, fontStyle: 'italic' },
  block: { position: 'absolute', height: 2000, borderTopWidth: 5, borderColor: '#FFF', zIndex: 3 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#FF4500',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
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
});