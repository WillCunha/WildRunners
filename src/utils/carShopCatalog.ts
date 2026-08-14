export const CAR_SHOP_ORDER = [
  'buggy',
  'kombi',
  'uno',
  'fusca',
  'astor',
  'ferrari',
  'monster',
] as const;

export type ShopCarId = (typeof CAR_SHOP_ORDER)[number];

export type CarShopDefinition = {
  name: string;
  shortName: string;
  className: string;
  price: number;
  accent: string;
  description: string;
};

/**
 * Economia inicial sugerida:
 * - Nível 1: Buggy inicial e primeiras compras próximas do saldo inicial.
 * - Nível 2: primeira compra que exige algumas partidas.
 * - Nível 3: veículos de médio prazo.
 * - Nível 4: objetivos de endgame.
 *
 * Os preços ficam centralizados aqui para facilitar o balanceamento depois
 * que vocês medirem a média de engrenagens recebidas por corrida.
 */
export const CAR_SHOP_CATALOG: Record<ShopCarId, CarShopDefinition> = {
  buggy: {
    name: 'BUGGY',
    shortName: 'BUGGY',
    className: 'STARTER',
    price: 0,
    accent: '#FFD60A',
    description: 'O primeiro carro da garagem: leve, simples e pronto para correr.',
  },
  kombi: {
    name: 'KOMBI',
    shortName: 'KOMBI',
    className: 'VAN',
    price: 200,
    accent: '#FFD60A',
    description: 'Resistente, carismática e com presença forte nas ruas.',
  },
  uno: {
    name: 'UNO',
    shortName: 'UNO',
    className: 'COMPACT',
    price: 150,
    accent: '#32D74B',
    description: 'Leve e rápido nas retomadas. Um ótimo primeiro upgrade.',
  },
  fusca: {
    name: 'FUSCA',
    shortName: 'FUSCA',
    className: 'CLASSIC',
    price: 280,
    accent: '#64D2FF',
    description: 'Um clássico equilibrado, confiável e fácil de controlar.',
  },
  astor: {
    name: 'ASTOR',
    shortName: 'ASTOR',
    className: 'SPORT',
    price: 550,
    accent: '#BF5AF2',
    description: 'Entrega velocidade alta e mantém boa aceleração.',
  },
  ferrari: {
    name: 'FERRARI',
    shortName: 'FERRARI',
    className: 'SUPERCAR',
    price: 950,
    accent: '#FF453A',
    description: 'Velocidade máxima para quem chegou ao topo da competição.',
  },
  monster: {
    name: 'MONSTER',
    shortName: 'MONSTER',
    className: 'OFF-ROAD',
    price: 1080,
    accent: '#30D158',
    description: 'Aceleração brutal e visual dominante para o endgame.',
  },
};
