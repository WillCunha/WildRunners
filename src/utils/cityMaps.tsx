export const CITY_MAPS = [
  {
    id: 'saopaulo',
    city: 'São Paulo', 
    levelRequired: 1,
    icon: require('@/assets/images/components/cityMaps/sao_paulo.png'),
    background: require('@/assets/images/components/cenarios/sao_pauloV4.png'),
    gameplay: {
      trackLength: 1500, 
      baseSpeed: 5,
      hazards: ['buraco', 'cone'],
      boostDropRate: 0.8, 
    }
  },
  {
    id: 'rio',
    city: 'Rio de Janeiro',
    levelRequired: 2,
    icon: require('@/assets/images/components/cityMaps/rio.png'),
    iconGRAY: require('@/assets/images/components/cityMaps/rioGRAY.png'),
    background: require('@/assets/images/components/cenarios/rioV1.png'),
    gameplay: {
      trackLength: 2500,
      baseSpeed: 7,
      hazards: ['pombo', 'barricada'],
      boostDropRate: 0.5,
    }
  },
  {
    id: 'salvador',
    city: 'Salvador', 
    levelRequired: 4,
    icon: require('@/assets/images/components/cityMaps/salvador.png'),
    iconGRAY: require('@/assets/images/components/cityMaps/salvadorGRAY.png'),
    background: require('@/assets/images/components/cenarios/salvadorV1.png'),
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3,
    }
  },
  {
    id: 'Manaus',
    city: 'Manaus',
    levelRequired: 7,
    icon: require('@/assets/images/components/cityMaps/manaus.png'),
    iconGRAY: require('@/assets/images/components/cityMaps/manausGRAY.png'),
    background: require('@/assets/images/components/cenarios/manausV1.png'),
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, 
    }
  },
  {
    id: 'brasilia',
    city: 'Brasília',
    levelRequired: 8,
    icon: require('@/assets/images/components/cityMaps/brasilia.png'),
    iconGRAY: require('@/assets/images/components/cityMaps/brasiliaGRAY.png'),
    background: require('@/assets/images/components/cenarios/brasiliaV1.png'),
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, 
    }
  },
  {
    id: 'balenario',
    city: 'Balneário Camboriú',
    levelRequired: 8,
    icon: require('@/assets/images/components/cityMaps/balneario_camburiu.png'),
    iconGRAY: require('@/assets/images/components/cityMaps/balneario_camburiuGRAY.png'),
    background: require('@/assets/images/components/cenarios/balnearioV1.png'),
    gameplay: {
      trackLength: 3000,
      baseSpeed: 9,
      hazards: ['chuva', 'onibus_vermelho'],
      boostDropRate: 0.3, 
    }
  },
];