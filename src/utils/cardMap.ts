import type { ImageSourcePropType } from 'react-native';

/** Fonte única dos dados estáticos das cartas. IDs antigos nunca são renomeados:
 * DeckSelection e Mapa transportam os mesmos IDs na rota.
 * Efeitos e estado de partida continuam na engine (Mapa.tsx).
 */
export type CardCategory = 'attack' | 'defense';
export type BotCooldownTier = 'heavy' | 'time' | 'light' | 'defense';
export type CardDeployment = 'rear' | 'forward' | 'self';
export type CardDefinition = {
  id: string;
  name: string;
  cost: number; // 💧 boost consumido durante a corrida
  purchasePrice: number; // CHIPS para comprar na loja
  requiredLevel: number; // nível do jogador para comprar
  color: string;
  category: CardCategory;
  image: ImageSourcePropType;
  cooldownMs: number | null;
  botCooldownTier: BotCooldownTier;
  deployment: CardDeployment;
};

export const MAX_DECK_SIZE = 4;

// Mesmo deck utilizado como fallback pela engine atual (Mapa.tsx).
// IDs estáveis: nunca traduzir ou renomear estes identificadores.
export const STARTER_CARD_IDS = ['swap', 'bullet', 'chains', 'tnt'] as const;
export const CARD_MAP = {
  chains: { id: 'chains', name: 'CHAINS', cost: 3, purchasePrice: 0, requiredLevel: 1, color: '#AF52DE', category: 'attack', image: require('@/assets/images/cards/chains.png'), cooldownMs: 8000, botCooldownTier: 'heavy', deployment: 'forward' },
  tnt: { id: 'tnt', name: 'TNT', cost: 4, purchasePrice: 0, requiredLevel: 1, color: '#FF4500', category: 'attack', image: require('@/assets/images/cards/tnt.png'), cooldownMs: 10000, botCooldownTier: 'heavy', deployment: 'rear' },
  oil_spit: { id: 'oil_spit', name: 'OIL SPIT', cost: 4, purchasePrice: 80, requiredLevel: 1, color: '#EA9D11', category: 'attack', image: require('@/assets/images/cards/oil_spit.png'), cooldownMs: 9000, botCooldownTier: 'heavy', deployment: 'rear' },
  magnet: { id: 'magnet', name: 'MAGNET', cost: 3, purchasePrice: 100, requiredLevel: 3, color: '#FF3B30', category: 'defense', image: require('@/assets/images/cards/magnet.png'), cooldownMs: 24000, botCooldownTier: 'defense', deployment: 'self' },
  emp_pulse: { id: 'emp_pulse', name: 'EMP PULSE', cost: 5, purchasePrice: 450, requiredLevel: 9, color: '#9B5CFF', category: 'attack', image: require('@/assets/images/cards/emp_pulse.png'), cooldownMs: 32000, botCooldownTier: 'heavy', deployment: 'forward' },
  swap: { id: 'swap', name: 'SWAP', cost: 4, purchasePrice: 0, requiredLevel: 1, color: '#FF004D', category: 'attack', image: require('@/assets/images/cards/swap.png'), cooldownMs: 8000, botCooldownTier: 'heavy', deployment: 'forward' },
  slow_slow: { id: 'slow_slow', name: 'SLOW SLOW', cost: 5, purchasePrice: 160, requiredLevel: 3, color: '#FF9500', category: 'attack', image: require('@/assets/images/cards/slow_slow.png'), cooldownMs: 10000, botCooldownTier: 'time', deployment: 'forward' },
  blind: { id: 'blind', name: 'BLIND', cost: 5, purchasePrice: 100, requiredLevel: 2, color: '#FFCC80', category: 'attack', image: require('@/assets/images/cards/blind.png'), cooldownMs: null, botCooldownTier: 'light', deployment: 'forward' },
  bullet: { id: 'bullet', name: 'BULLET', cost: 3, purchasePrice: 0, requiredLevel: 1, color: '#007AFF', category: 'attack', image: require('@/assets/images/cards/bullet.png'), cooldownMs: 8000, botCooldownTier: 'heavy', deployment: 'forward' },
  tornado: { id: 'tornado', name: 'TORNADO', cost: 4, purchasePrice: 190, requiredLevel: 5, color: '#03009e', category: 'attack', image: require('@/assets/images/cards/tornado.png'), cooldownMs: 12000, botCooldownTier: 'heavy', deployment: 'forward' },
  bubble_lift: { id: 'bubble_lift', name: 'BUBBLE LIFT', cost: 4, purchasePrice: 130, requiredLevel: 3, color: '#32CD32', category: 'attack', image: require('@/assets/images/cards/bubble_lift.png'), cooldownMs: 9000, botCooldownTier: 'light', deployment: 'forward' },
  nitro_power: { id: 'nitro_power', name: 'NITRO POWER', cost: 2, purchasePrice: 60, requiredLevel: 1, color: '#00FFFF', category: 'defense', image: require('@/assets/images/cards/nitro_power.png'), cooldownMs: 4000, botCooldownTier: 'defense', deployment: 'self' },
  shield: { id: 'shield', name: 'SHIELD', cost: 3, purchasePrice: 85, requiredLevel: 2, color: '#4DA3FF', category: 'defense', image: require('@/assets/images/cards/shield.png'), cooldownMs: 8000, botCooldownTier: 'defense', deployment: 'self' },
  armor: { id: 'armor', name: 'ARMOR', cost: 4, purchasePrice: 145, requiredLevel: 4, color: '#9AA0A6', category: 'defense', image: require('@/assets/images/cards/armor.png'), cooldownMs: 12000, botCooldownTier: 'defense', deployment: 'self' },
  quick_repair: { id: 'quick_repair', name: 'QUICK REPAIR', cost: 4, purchasePrice: 110, requiredLevel: 3, color: '#FFD60A', category: 'defense', image: require('@/assets/images/cards/repair_quick.png'), cooldownMs: 14000, botCooldownTier: 'defense', deployment: 'self' },
  ghost: { id: 'ghost', name: 'GHOST', cost: 5, purchasePrice: 210, requiredLevel: 6, color: '#B388FF', category: 'defense', image: require('@/assets/images/cards/ghost.png'), cooldownMs: 12000, botCooldownTier: 'defense', deployment: 'self' },
  second_chance: { id: 'second_chance', name: 'SECOND CHANCE', cost: 5, purchasePrice: 240, requiredLevel: 7, color: '#FF6B9A', category: 'defense', image: require('@/assets/images/cards/second_chance.png'), cooldownMs: 18000, botCooldownTier: 'defense', deployment: 'self' },
} as const satisfies Record<string, CardDefinition>;

export type CardId = keyof typeof CARD_MAP;
export const ALL_CARDS: readonly CardDefinition[] = Object.values(CARD_MAP);
export function getCardDefinition(id: string): CardDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(CARD_MAP, id)
    ? CARD_MAP[id as CardId]
    : undefined;
}

// Mantém o contrato atual da IA, mas os arrays agora são derivados do catálogo.
export const CARD_CATEGORIES = {
  HEAVY_ATTACK: ALL_CARDS.filter(card => card.botCooldownTier === 'heavy').map(card => card.id),
  TIME_ATTACK: ALL_CARDS.filter(card => card.botCooldownTier === 'time').map(card => card.id),
  LIGHT_ATTACK: ALL_CARDS.filter(card => card.botCooldownTier === 'light').map(card => card.id),
  DEFENSE_BUFF: ALL_CARDS.filter(card => card.botCooldownTier === 'defense').map(card => card.id),
};
