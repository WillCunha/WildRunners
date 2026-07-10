export const CITY_MAPS = [
  {
    id: 'saopaulo',
    city: 'São Paulo', // Sua cidade natal como mapa inicial!
    levelRequired: 1,
    image: 'https://via.placeholder.com/400x400/87CEFA/000000?text=São+Paulo',
    // Propriedades futuras para o mapa:
    gameplay: {
      trackLength: 1500, // Tamanho da pista
      baseSpeed: 5,
      hazards: ['buraco', 'cone'], // Obstáculos específicos dessa pista
      boostDropRate: 0.8, // Configuração da taxa de spawn de Boost (antigo elixir)
    }
  },
  {
    id: 'rio',
    city: 'Rio de Janeiro',
    levelRequired: 2,
    image: 'https://via.placeholder.com/400x400/FFB6C1/000000?text=Rio+de+Janeiro',
    gameplay: {
      trackLength: 2500,
      baseSpeed: 7,
      hazards: ['pombo', 'barricada'],
      boostDropRate: 0.5,
    }
  },
  {
    id: 'salvador',
    city: 'Salvador', // Sua outra viagem planejada
    levelRequired: 4,
    image: 'https://via.placeholder.com/400x400/98FB98/000000?text=Salvador',
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, // Mais difícil achar Boost aqui
    }
  },
  {
    id: 'Manaus',
    city: 'Manaus', // Sua outra viagem planejada
    levelRequired: 7,
    image: 'https://via.placeholder.com/400x400/98FB98/000000?text=Manaus',
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, // Mais difícil achar Boost aqui
    }
  },
  {
    id: 'brasilia',
    city: 'Brasília', // Sua outra viagem planejada
    levelRequired: 8,
    image: 'https://via.placeholder.com/400x400/98FB98/000000?text=Brasília',
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, // Mais difícil achar Boost aqui
    }
  },
];