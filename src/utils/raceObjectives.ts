export type RaceObjectiveDifficulty = 'easy' | 'medium' | 'hard';
export type RaceObjectiveCategory =
  | 'position'
  | 'combat'
  | 'defense'
  | 'collection'
  | 'cards'
  | 'start'
  | 'survival'
  | 'comeback';

export type RaceObjectiveLanguage = 'pt-BR' | 'en' | 'es';

type LocalizedText = Record<RaceObjectiveLanguage, string>;

export type RacePerformanceStats = {
  perfectStart: boolean;
  successfulAttacks: number;
  successfulDefenses: number;
  overtakes?: number;
  livesLost: number;
  worstPosition: number;
  survived: boolean;

  // Métricas novas para o catálogo dinâmico de missões.
  bestPosition?: number;
  timeInTop3Seconds?: number;
  timeInFirstSeconds?: number;
  cardsUsed?: number;
  offensiveCardsUsed?: number;
  defensiveCardsUsed?: number;
  uniqueCardsUsed?: string[];
  uniqueOffensiveCardsUsed?: string[];
  opponentsEliminated?: number;
  collectedMotor?: number;
  collectedSpray?: number;
  collectedGears?: number;
  collectedTotal?: number;
  selectedObjectiveIds?: RaceObjectiveId[];
};

export type RaceObjectiveResult = {
  id: RaceObjectiveId;
  icon: string;
  current: number;
  target: number;
  completed: boolean;
  xpReward: number;
  xpPossible: number;
  difficulty: RaceObjectiveDifficulty;
  category: RaceObjectiveCategory;
  progressText: string;
};

export type RaceObjectiveSelectionContext = {
  deck: string[];
  totalRacers: number;
};

type EvalContext = {
  position: number;
  totalRacers: number;
  performance: RacePerformanceStats;
  isFinal: boolean;
};

type EvalValue = {
  current: number;
  target: number;
  completed: boolean;
  progressText?: string;
};

type RaceObjectiveDefinition = {
  id: string;
  difficulty: RaceObjectiveDifficulty;
  category: RaceObjectiveCategory;
  icon: string;
  xp: number;
  label: LocalizedText;
  shortLabel: LocalizedText;
  evaluate: (ctx: EvalContext) => EvalValue;
  eligible?: (ctx: RaceObjectiveSelectionContext) => boolean;
};

export const OFFENSIVE_CARD_IDS = [
  'swap',
  'bullet',
  'chains',
  'tnt',
  'tornado',
  'slow_slow',
  'blind',
  'bubble_lift',
] as const;

export const DEFENSIVE_CARD_IDS = [
  'nitro_power',
  'shield',
  'quick_repair',
  'ghost',
  'second_chance',
  'armor',
] as const;

const offensiveSet = new Set<string>(OFFENSIVE_CARD_IDS);
const defensiveSet = new Set<string>(DEFENSIVE_CARD_IDS);

export const isOffensiveRaceCard = (cardId: string) => offensiveSet.has(cardId);
export const isDefensiveRaceCard = (cardId: string) => defensiveSet.has(cardId);

const n = (value: number | undefined) => Math.max(0, Math.floor(value ?? 0));
const b = (value: boolean) => (value ? 1 : 0);
const count = (value: number, target: number): EvalValue => ({
  current: Math.min(n(value), target),
  target,
  completed: n(value) >= target,
});
const finalCount = (value: number, target: number, isFinal: boolean): EvalValue => ({
  current: Math.min(n(value), target),
  target,
  completed: isFinal && n(value) >= target,
});
const finalBoolean = (condition: boolean, isFinal: boolean, text = '—'): EvalValue => ({
  current: condition ? 1 : 0,
  target: 1,
  completed: isFinal && condition,
  progressText: text,
});
const instantBoolean = (condition: boolean, text = '—'): EvalValue => ({
  current: condition ? 1 : 0,
  target: 1,
  completed: condition,
  progressText: text,
});

const labels = (
  pt: string,
  en: string,
  es: string,
): LocalizedText => ({ 'pt-BR': pt, en, es });

const hasOffense = (ctx: RaceObjectiveSelectionContext) =>
  ctx.deck.some(isOffensiveRaceCard);
const hasDefense = (ctx: RaceObjectiveSelectionContext) =>
  ctx.deck.some(isDefensiveRaceCard);
const hasTwoDifferentOffense = (ctx: RaceObjectiveSelectionContext) =>
  new Set(ctx.deck.filter(isOffensiveRaceCard)).size >= 2;
const hasFourUniqueCards = (ctx: RaceObjectiveSelectionContext) =>
  new Set(ctx.deck).size >= 4;

export const RACE_OBJECTIVES = [
  // ==================== FÁCEIS (18) ====================
  {
    id: 'survive_race', difficulty: 'easy', category: 'survival', icon: '❤️', xp: 8,
    label: labels('Termine a corrida vivo', 'Finish the race alive', 'Termina la carrera con vida'),
    shortLabel: labels('Sobreviva', 'Survive', 'Sobrevive'),
    evaluate: ({ performance, isFinal }) => finalBoolean(performance.survived, isFinal),
  },
  {
    id: 'finish_top5', difficulty: 'easy', category: 'position', icon: '🏁', xp: 8,
    label: labels('Termine em 5º ou melhor', 'Finish 5th or better', 'Termina 5.º o mejor'),
    shortLabel: labels('Top 5', 'Top 5', 'Top 5'),
    evaluate: ({ position, isFinal }) => ({ current: position, target: 5, completed: isFinal && position <= 5, progressText: `#${position}` }),
  },
  {
    id: 'finish_top4', difficulty: 'easy', category: 'position', icon: '🏁', xp: 9,
    label: labels('Termine em 4º ou melhor', 'Finish 4th or better', 'Termina 4.º o mejor'),
    shortLabel: labels('Top 4', 'Top 4', 'Top 4'),
    evaluate: ({ position, isFinal }) => ({ current: position, target: 4, completed: isFinal && position <= 4, progressText: `#${position}` }),
  },
  {
    id: 'hit_1_attack', difficulty: 'easy', category: 'combat', icon: '🎯', xp: 8,
    label: labels('Acerte 1 ataque', 'Land 1 attack', 'Acierta 1 ataque'),
    shortLabel: labels('1 ataque', '1 hit', '1 ataque'),
    evaluate: ({ performance }) => count(performance.successfulAttacks, 1),
  },
  {
    id: 'defend_1_attack', difficulty: 'easy', category: 'defense', icon: '🛡️', xp: 9,
    label: labels('Bloqueie ou evite 1 ataque', 'Block or evade 1 attack', 'Bloquea o evita 1 ataque'),
    shortLabel: labels('1 defesa', '1 defense', '1 defensa'),
    evaluate: ({ performance }) => count(performance.successfulDefenses, 1),
    eligible: hasDefense,
  },
  {
    id: 'make_1_overtake', difficulty: 'easy', category: 'position', icon: '⚡', xp: 8,
    label: labels('Faça 1 ultrapassagem', 'Make 1 overtake', 'Haz 1 adelantamiento'),
    shortLabel: labels('1 ultrap.', '1 overtake', '1 adelanto'),
    evaluate: ({ performance }) => count(performance.overtakes ?? 0, 1),
  },
  {
    id: 'make_2_overtakes', difficulty: 'easy', category: 'position', icon: '⚡', xp: 10,
    label: labels('Faça 2 ultrapassagens', 'Make 2 overtakes', 'Haz 2 adelantamientos'),
    shortLabel: labels('2 ultrap.', '2 overtakes', '2 adelantos'),
    evaluate: ({ performance }) => count(performance.overtakes ?? 0, 2),
  },
  {
    id: 'lose_max_2_lives', difficulty: 'easy', category: 'survival', icon: '❤️', xp: 9,
    label: labels('Perca no máximo 2 vidas', 'Lose no more than 2 lives', 'Pierde como máximo 2 vidas'),
    shortLabel: labels('Máx. 2 vidas', 'Max 2 lives', 'Máx. 2 vidas'),
    evaluate: ({ performance, isFinal }) => ({ current: n(performance.livesLost), target: 2, completed: isFinal && performance.livesLost <= 2, progressText: `${n(performance.livesLost)}/2` }),
  },
  {
    id: 'perfect_start', difficulty: 'easy', category: 'start', icon: '🚦', xp: 10,
    label: labels('Faça uma largada perfeita', 'Get a perfect start', 'Haz una salida perfecta'),
    shortLabel: labels('Largada perfeita', 'Perfect start', 'Salida perfecta'),
    evaluate: ({ performance }) => instantBoolean(performance.perfectStart),
  },
  {
    id: 'collect_2_parts', difficulty: 'easy', category: 'collection', icon: '🔧', xp: 8,
    label: labels('Colete 2 peças', 'Collect 2 parts', 'Recoge 2 piezas'),
    shortLabel: labels('2 peças', '2 parts', '2 piezas'),
    evaluate: ({ performance }) => count(performance.collectedMotor ?? 0, 2),
  },
  {
    id: 'collect_2_gears', difficulty: 'easy', category: 'collection', icon: '⚙️', xp: 8,
    label: labels('Colete 2 engrenagens', 'Collect 2 gears', 'Recoge 2 engranajes'),
    shortLabel: labels('2 engrenagens', '2 gears', '2 engranajes'),
    evaluate: ({ performance }) => count(performance.collectedGears ?? 0, 2),
  },
  {
    id: 'collect_2_sprays', difficulty: 'easy', category: 'collection', icon: '🎨', xp: 8,
    label: labels('Colete 2 sprays', 'Collect 2 sprays', 'Recoge 2 sprays'),
    shortLabel: labels('2 sprays', '2 sprays', '2 sprays'),
    evaluate: ({ performance }) => count(performance.collectedSpray ?? 0, 2),
  },
  {
    id: 'collect_4_resources', difficulty: 'easy', category: 'collection', icon: '📦', xp: 9,
    label: labels('Colete 4 recursos', 'Collect 4 resources', 'Recoge 4 recursos'),
    shortLabel: labels('4 recursos', '4 resources', '4 recursos'),
    evaluate: ({ performance }) => count(performance.collectedTotal ?? 0, 4),
  },
  {
    id: 'use_1_card', difficulty: 'easy', category: 'cards', icon: '🃏', xp: 8,
    label: labels('Use pelo menos 1 carta', 'Use at least 1 card', 'Usa al menos 1 carta'),
    shortLabel: labels('Use 1 carta', 'Use 1 card', 'Usa 1 carta'),
    evaluate: ({ performance }) => count(performance.cardsUsed ?? 0, 1),
  },
  {
    id: 'use_offensive_card', difficulty: 'easy', category: 'cards', icon: '💥', xp: 8,
    label: labels('Use uma carta ofensiva', 'Use an offensive card', 'Usa una carta ofensiva'),
    shortLabel: labels('Carta ofensiva', 'Attack card', 'Carta ofensiva'),
    evaluate: ({ performance }) => count(performance.offensiveCardsUsed ?? 0, 1),
    eligible: hasOffense,
  },
  {
    id: 'use_defensive_card', difficulty: 'easy', category: 'cards', icon: '🛡️', xp: 8,
    label: labels('Use uma carta defensiva', 'Use a defensive card', 'Usa una carta defensiva'),
    shortLabel: labels('Carta defensiva', 'Defense card', 'Carta defensiva'),
    evaluate: ({ performance }) => count(performance.defensiveCardsUsed ?? 0, 1),
    eligible: hasDefense,
  },
  {
    id: 'reach_top3', difficulty: 'easy', category: 'position', icon: '🏁', xp: 10,
    label: labels('Alcance o Top 3', 'Reach the Top 3', 'Alcanza el Top 3'),
    shortLabel: labels('Alcance Top 3', 'Reach Top 3', 'Alcanza Top 3'),
    evaluate: ({ performance }) => instantBoolean((performance.bestPosition ?? 99) <= 3),
  },
  {
    id: 'stay_top3_10s', difficulty: 'easy', category: 'position', icon: '⏱️', xp: 10,
    label: labels('Permaneça 10 s no Top 3', 'Stay in the Top 3 for 10s', 'Mantente 10 s en el Top 3'),
    shortLabel: labels('10s no Top 3', '10s Top 3', '10s Top 3'),
    evaluate: ({ performance }) => count(performance.timeInTop3Seconds ?? 0, 10),
  },

  // ==================== MÉDIAS (18) ====================
  {
    id: 'finish_top3', difficulty: 'medium', category: 'position', icon: '🏁', xp: 14,
    label: labels('Termine no Top 3', 'Finish in the Top 3', 'Termina en el Top 3'),
    shortLabel: labels('Termine Top 3', 'Finish Top 3', 'Termina Top 3'),
    evaluate: ({ position, isFinal }) => ({ current: position, target: 3, completed: isFinal && position <= 3, progressText: `#${position}` }),
  },
  {
    id: 'finish_top2', difficulty: 'medium', category: 'position', icon: '🥈', xp: 16,
    label: labels('Termine no Top 2', 'Finish in the Top 2', 'Termina en el Top 2'),
    shortLabel: labels('Termine Top 2', 'Finish Top 2', 'Termina Top 2'),
    evaluate: ({ position, isFinal }) => ({ current: position, target: 2, completed: isFinal && position <= 2, progressText: `#${position}` }),
  },
  {
    id: 'survive_max_1_life_lost', difficulty: 'medium', category: 'survival', icon: '❤️', xp: 16,
    label: labels('Sobreviva perdendo no máximo 1 vida', 'Survive losing at most 1 life', 'Sobrevive perdiendo como máximo 1 vida'),
    shortLabel: labels('Máx. 1 vida', 'Max 1 life', 'Máx. 1 vida'),
    evaluate: ({ performance, isFinal }) => finalBoolean(performance.survived && performance.livesLost <= 1, isFinal, `${n(performance.livesLost)}/1`),
  },
  {
    id: 'hit_2_attacks', difficulty: 'medium', category: 'combat', icon: '🎯', xp: 14,
    label: labels('Acerte 2 ataques', 'Land 2 attacks', 'Acierta 2 ataques'),
    shortLabel: labels('2 ataques', '2 hits', '2 ataques'),
    evaluate: ({ performance }) => count(performance.successfulAttacks, 2),
  },
  {
    id: 'defend_2_attacks', difficulty: 'medium', category: 'defense', icon: '🛡️', xp: 15,
    label: labels('Faça 2 defesas bem-sucedidas', 'Make 2 successful defenses', 'Haz 2 defensas exitosas'),
    shortLabel: labels('2 defesas', '2 defenses', '2 defensas'),
    evaluate: ({ performance }) => count(performance.successfulDefenses, 2),
    eligible: hasDefense,
  },
  {
    id: 'make_3_overtakes', difficulty: 'medium', category: 'position', icon: '⚡', xp: 15,
    label: labels('Faça 3 ultrapassagens', 'Make 3 overtakes', 'Haz 3 adelantamientos'),
    shortLabel: labels('3 ultrap.', '3 overtakes', '3 adelantos'),
    evaluate: ({ performance }) => count(performance.overtakes ?? 0, 3),
  },
  {
    id: 'make_4_overtakes', difficulty: 'medium', category: 'position', icon: '⚡', xp: 17,
    label: labels('Faça 4 ultrapassagens', 'Make 4 overtakes', 'Haz 4 adelantamientos'),
    shortLabel: labels('4 ultrap.', '4 overtakes', '4 adelantos'),
    evaluate: ({ performance }) => count(performance.overtakes ?? 0, 4),
  },
  {
    id: 'comeback_top3_from_5th', difficulty: 'medium', category: 'comeback', icon: '🔥', xp: 18,
    label: labels('Caia para 5º ou 6º e termine no Top 3', 'Drop to 5th/6th and finish Top 3', 'Cae al 5.º/6.º y termina Top 3'),
    shortLabel: labels('Comeback Top 3', 'Top 3 comeback', 'Remonta Top 3'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(performance.worstPosition >= 5 && position <= 3, isFinal),
  },
  {
    id: 'collect_4_parts', difficulty: 'medium', category: 'collection', icon: '🔧', xp: 14,
    label: labels('Colete 4 peças', 'Collect 4 parts', 'Recoge 4 piezas'),
    shortLabel: labels('4 peças', '4 parts', '4 piezas'),
    evaluate: ({ performance }) => count(performance.collectedMotor ?? 0, 4),
  },
  {
    id: 'collect_4_gears', difficulty: 'medium', category: 'collection', icon: '⚙️', xp: 14,
    label: labels('Colete 4 engrenagens', 'Collect 4 gears', 'Recoge 4 engranajes'),
    shortLabel: labels('4 engrenagens', '4 gears', '4 engranajes'),
    evaluate: ({ performance }) => count(performance.collectedGears ?? 0, 4),
  },
  {
    id: 'collect_4_sprays', difficulty: 'medium', category: 'collection', icon: '🎨', xp: 14,
    label: labels('Colete 4 sprays', 'Collect 4 sprays', 'Recoge 4 sprays'),
    shortLabel: labels('4 sprays', '4 sprays', '4 sprays'),
    evaluate: ({ performance }) => count(performance.collectedSpray ?? 0, 4),
  },
  {
    id: 'collect_8_resources', difficulty: 'medium', category: 'collection', icon: '📦', xp: 15,
    label: labels('Colete 8 recursos', 'Collect 8 resources', 'Recoge 8 recursos'),
    shortLabel: labels('8 recursos', '8 resources', '8 recursos'),
    evaluate: ({ performance }) => count(performance.collectedTotal ?? 0, 8),
  },
  {
    id: 'use_3_cards', difficulty: 'medium', category: 'cards', icon: '🃏', xp: 14,
    label: labels('Use 3 cartas durante a corrida', 'Use 3 cards during the race', 'Usa 3 cartas durante la carrera'),
    shortLabel: labels('Use 3 cartas', 'Use 3 cards', 'Usa 3 cartas'),
    evaluate: ({ performance }) => count(performance.cardsUsed ?? 0, 3),
  },
  {
    id: 'use_2_unique_offensive_cards', difficulty: 'medium', category: 'cards', icon: '💥', xp: 15,
    label: labels('Use 2 cartas ofensivas diferentes', 'Use 2 different offensive cards', 'Usa 2 cartas ofensivas distintas'),
    shortLabel: labels('2 ofensivas', '2 attack cards', '2 ofensivas'),
    evaluate: ({ performance }) => count(performance.uniqueOffensiveCardsUsed?.length ?? 0, 2),
    eligible: hasTwoDifferentOffense,
  },
  {
    id: 'use_2_defensive_cards', difficulty: 'medium', category: 'cards', icon: '🛡️', xp: 15,
    label: labels('Use 2 cartas defensivas', 'Use 2 defensive cards', 'Usa 2 cartas defensivas'),
    shortLabel: labels('2 defensivas', '2 defense cards', '2 defensivas'),
    evaluate: ({ performance }) => count(performance.defensiveCardsUsed ?? 0, 2),
    eligible: hasDefense,
  },
  {
    id: 'stay_top3_25s', difficulty: 'medium', category: 'position', icon: '⏱️', xp: 16,
    label: labels('Permaneça 25 s no Top 3', 'Stay in the Top 3 for 25s', 'Mantente 25 s en el Top 3'),
    shortLabel: labels('25s no Top 3', '25s Top 3', '25s Top 3'),
    evaluate: ({ performance }) => count(performance.timeInTop3Seconds ?? 0, 25),
  },
  {
    id: 'stay_first_15s', difficulty: 'medium', category: 'position', icon: '👑', xp: 17,
    label: labels('Permaneça 15 s em 1º lugar', 'Stay in 1st place for 15s', 'Mantente 15 s en 1.er lugar'),
    shortLabel: labels('15s em 1º', '15s in 1st', '15s en 1.º'),
    evaluate: ({ performance }) => count(performance.timeInFirstSeconds ?? 0, 15),
  },
  {
    id: 'eliminate_1_opponent', difficulty: 'medium', category: 'combat', icon: '💀', xp: 18,
    label: labels('Elimine 1 adversário', 'Eliminate 1 opponent', 'Elimina 1 rival'),
    shortLabel: labels('1 eliminação', '1 elimination', '1 eliminación'),
    evaluate: ({ performance }) => count(performance.opponentsEliminated ?? 0, 1),
    eligible: ctx => ctx.totalRacers >= 2,
  },

  // ==================== DIFÍCEIS (14) ====================
  {
    id: 'win_race', difficulty: 'hard', category: 'position', icon: '🏆', xp: 22,
    label: labels('Vença a corrida', 'Win the race', 'Gana la carrera'),
    shortLabel: labels('Vença', 'Win', 'Gana'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(position === 1 && performance.survived, isFinal),
  },
  {
    id: 'win_flawless', difficulty: 'hard', category: 'survival', icon: '👑', xp: 30,
    label: labels('Vença sem perder nenhuma vida', 'Win without losing a life', 'Gana sin perder ninguna vida'),
    shortLabel: labels('Vitória intacta', 'Flawless win', 'Victoria intacta'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(position === 1 && performance.survived && performance.livesLost === 0, isFinal),
  },
  {
    id: 'top2_flawless', difficulty: 'hard', category: 'survival', icon: '💎', xp: 25,
    label: labels('Termine no Top 2 sem perder vidas', 'Finish Top 2 without losing lives', 'Termina Top 2 sin perder vidas'),
    shortLabel: labels('Top 2 intacto', 'Flawless Top 2', 'Top 2 intacto'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(position <= 2 && performance.survived && performance.livesLost === 0, isFinal),
  },
  {
    id: 'hit_4_attacks', difficulty: 'hard', category: 'combat', icon: '🎯', xp: 22,
    label: labels('Acerte 4 ataques', 'Land 4 attacks', 'Acierta 4 ataques'),
    shortLabel: labels('4 ataques', '4 hits', '4 ataques'),
    evaluate: ({ performance }) => count(performance.successfulAttacks, 4),
  },
  {
    id: 'defend_3_attacks', difficulty: 'hard', category: 'defense', icon: '🛡️', xp: 22,
    label: labels('Faça 3 defesas bem-sucedidas', 'Make 3 successful defenses', 'Haz 3 defensas exitosas'),
    shortLabel: labels('3 defesas', '3 defenses', '3 defensas'),
    evaluate: ({ performance }) => count(performance.successfulDefenses, 3),
    eligible: hasDefense,
  },
  {
    id: 'make_5_overtakes', difficulty: 'hard', category: 'position', icon: '⚡', xp: 22,
    label: labels('Faça 5 ultrapassagens', 'Make 5 overtakes', 'Haz 5 adelantamientos'),
    shortLabel: labels('5 ultrap.', '5 overtakes', '5 adelantos'),
    evaluate: ({ performance }) => count(performance.overtakes ?? 0, 5),
  },
  {
    id: 'comeback_win_from_6th', difficulty: 'hard', category: 'comeback', icon: '🔥', xp: 30,
    label: labels('Caia para 6º e depois vença', 'Drop to 6th and then win', 'Cae al 6.º y luego gana'),
    shortLabel: labels('6º → vitória', '6th → win', '6.º → victoria'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(performance.worstPosition >= 6 && position === 1 && performance.survived, isFinal),
  },
  {
    id: 'collect_12_and_survive', difficulty: 'hard', category: 'collection', icon: '📦', xp: 24,
    label: labels('Colete 12 recursos e sobreviva', 'Collect 12 resources and survive', 'Recoge 12 recursos y sobrevive'),
    shortLabel: labels('12 + sobreviva', '12 + survive', '12 + sobrevive'),
    evaluate: ({ performance, isFinal }) => ({ current: Math.min(n(performance.collectedTotal), 12), target: 12, completed: isFinal && n(performance.collectedTotal) >= 12 && performance.survived, progressText: `${Math.min(n(performance.collectedTotal), 12)}/12` }),
  },
  {
    id: 'collect_3_each_resource', difficulty: 'hard', category: 'collection', icon: '🎒', xp: 25,
    label: labels('Colete pelo menos 3 de cada recurso', 'Collect at least 3 of each resource', 'Recoge al menos 3 de cada recurso'),
    shortLabel: labels('3 de cada', '3 of each', '3 de cada'),
    evaluate: ({ performance }) => {
      const minimum = Math.min(n(performance.collectedMotor), n(performance.collectedGears), n(performance.collectedSpray));
      return { current: Math.min(minimum, 3), target: 3, completed: minimum >= 3, progressText: `${Math.min(minimum, 3)}/3` };
    },
  },
  {
    id: 'lead_30s_finish_top3', difficulty: 'hard', category: 'position', icon: '👑', xp: 25,
    label: labels('Fique 30 s em 1º e termine no Top 3', 'Lead for 30s and finish Top 3', 'Lidera 30 s y termina Top 3'),
    shortLabel: labels('30s líder + Top 3', '30s lead + Top 3', '30s líder + Top 3'),
    evaluate: ({ position, performance, isFinal }) => ({ current: Math.min(n(performance.timeInFirstSeconds), 30), target: 30, completed: isFinal && n(performance.timeInFirstSeconds) >= 30 && position <= 3, progressText: `${Math.min(n(performance.timeInFirstSeconds), 30)}/30s` }),
  },
  {
    id: 'win_after_losing_2_lives', difficulty: 'hard', category: 'comeback', icon: '🔥', xp: 28,
    label: labels('Vença depois de perder pelo menos 2 vidas', 'Win after losing at least 2 lives', 'Gana después de perder al menos 2 vidas'),
    shortLabel: labels('Vitória sofrida', 'Battle win', 'Victoria sufrida'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(position === 1 && performance.survived && performance.livesLost >= 2, isFinal, `${n(performance.livesLost)}/2`),
  },
  {
    id: 'eliminate_2_opponents', difficulty: 'hard', category: 'combat', icon: '💀', xp: 28,
    label: labels('Elimine 2 adversários', 'Eliminate 2 opponents', 'Elimina 2 rivales'),
    shortLabel: labels('2 eliminações', '2 eliminations', '2 eliminaciones'),
    evaluate: ({ performance }) => count(performance.opponentsEliminated ?? 0, 2),
    eligible: ctx => ctx.totalRacers >= 3,
  },
  {
    id: 'use_all_4_deck_cards', difficulty: 'hard', category: 'cards', icon: '🃏', xp: 24,
    label: labels('Use as 4 cartas diferentes do seu deck', 'Use all 4 different cards in your deck', 'Usa las 4 cartas diferentes de tu mazo'),
    shortLabel: labels('Use as 4 cartas', 'Use all 4 cards', 'Usa las 4 cartas'),
    evaluate: ({ performance }) => count(performance.uniqueCardsUsed?.length ?? 0, 4),
    eligible: hasFourUniqueCards,
  },
  {
    id: 'win_with_2_attacks', difficulty: 'hard', category: 'combat', icon: '🏆', xp: 26,
    label: labels('Vença acertando pelo menos 2 ataques', 'Win after landing at least 2 attacks', 'Gana acertando al menos 2 ataques'),
    shortLabel: labels('Vença + 2 ataques', 'Win + 2 hits', 'Gana + 2 ataques'),
    evaluate: ({ position, performance, isFinal }) => finalBoolean(position === 1 && performance.survived && performance.successfulAttacks >= 2, isFinal, `${Math.min(n(performance.successfulAttacks), 2)}/2`),
  },
] as const satisfies readonly RaceObjectiveDefinition[];

export type RaceObjectiveId = (typeof RACE_OBJECTIVES)[number]['id'];

const definitionsById = new Map<RaceObjectiveId, RaceObjectiveDefinition>(
  RACE_OBJECTIVES.map(objective => [objective.id as RaceObjectiveId, objective]),
);

export const DEFAULT_RACE_OBJECTIVE_IDS: RaceObjectiveId[] = [
  'finish_top3',
  'hit_2_attacks',
  'make_3_overtakes',
];

let previousSelection: RaceObjectiveId[] = [];

const shuffled = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

function candidatesFor(
  difficulty: RaceObjectiveDifficulty,
  context: RaceObjectiveSelectionContext,
) {
  const catalog = RACE_OBJECTIVES as readonly RaceObjectiveDefinition[];
  const eligible = catalog.filter(objective =>
    objective.difficulty === difficulty &&
    (!objective.eligible || objective.eligible(context)),
  );

  const withoutPrevious = eligible.filter(
    objective => !previousSelection.includes(objective.id as RaceObjectiveId),
  );

  return shuffled(withoutPrevious.length > 0 ? withoutPrevious : eligible);
}

export function selectRaceObjectives(
  context: RaceObjectiveSelectionContext,
): RaceObjectiveId[] {
  const difficulties: RaceObjectiveDifficulty[] = ['easy', 'medium', 'hard'];
  const selected: RaceObjectiveId[] = [];
  const usedCategories = new Set<RaceObjectiveCategory>();

  for (const difficulty of difficulties) {
    const candidates = candidatesFor(difficulty, context);
    const distinctCategory = candidates.find(
      objective => !usedCategories.has(objective.category),
    );
    const picked = distinctCategory ?? candidates[0];

    if (!picked) continue;

    selected.push(picked.id as RaceObjectiveId);
    usedCategories.add(picked.category);
  }

  // Segurança: o catálogo sempre deveria fornecer 3, mas mantém fallback determinístico.
  for (const fallback of DEFAULT_RACE_OBJECTIVE_IDS) {
    if (selected.length >= 3) break;
    if (!selected.includes(fallback)) selected.push(fallback);
  }

  previousSelection = [...selected];
  return selected.slice(0, 3);
}

function normalizeLanguage(language?: string): RaceObjectiveLanguage {
  if (language === 'en') return 'en';
  if (language === 'es') return 'es';
  return 'pt-BR';
}

export function getRaceObjectiveLabel(
  id: RaceObjectiveId | string,
  language?: string,
  short = false,
) {
  const definition = definitionsById.get(id as RaceObjectiveId);
  if (!definition) return id;
  const lang = normalizeLanguage(language);
  return (short ? definition.shortLabel : definition.label)[lang];
}

export function getRaceObjectiveDefinition(id: RaceObjectiveId | string) {
  return definitionsById.get(id as RaceObjectiveId);
}

export function evaluateSelectedRaceObjectives(
  position: number,
  totalRacers: number,
  performance: RacePerformanceStats,
  selectedIds?: RaceObjectiveId[],
  isFinal = true,
): RaceObjectiveResult[] {
  const safeTotal = Math.max(1, Math.floor(totalRacers));
  const safePosition = Math.max(1, Math.min(safeTotal, Math.floor(position)));
  const ids = selectedIds?.length
    ? selectedIds
    : performance.selectedObjectiveIds?.length
      ? performance.selectedObjectiveIds
      : DEFAULT_RACE_OBJECTIVE_IDS;

  return ids
    .map(id => {
      const definition = definitionsById.get(id);
      if (!definition) return null;

      const value = definition.evaluate({
        position: safePosition,
        totalRacers: safeTotal,
        performance,
        isFinal,
      });

      const current = Math.max(0, Math.floor(value.current));
      const target = Math.max(1, Math.floor(value.target));
      const completed = Boolean(value.completed);

      return {
        id,
        icon: definition.icon,
        current,
        target,
        completed,
        xpReward: completed ? definition.xp : 0,
        xpPossible: definition.xp,
        difficulty: definition.difficulty,
        category: definition.category,
        progressText: value.progressText ?? `${Math.min(current, target)}/${target}`,
      } satisfies RaceObjectiveResult;
    })
    .filter((objective): objective is RaceObjectiveResult => Boolean(objective));
}

export function evaluateRaceObjectivesLive(
  position: number,
  totalRacers: number,
  performance: RacePerformanceStats,
  selectedIds?: RaceObjectiveId[],
) {
  return evaluateSelectedRaceObjectives(
    position,
    totalRacers,
    performance,
    selectedIds,
    false,
  );
}
