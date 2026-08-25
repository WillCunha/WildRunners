const en = {
  language: {
    title: 'Choose your language',
    subtitle: 'You can change the language later in settings.',
    portuguese: 'Português',
    english: 'English',
    continue: 'CONTINUE',
  },
  start: {
    pressToStart: 'PRESS TO START',
  },
  common: {
    play: 'PLAY',
    continue: 'CONTINUE',
    back: 'BACK',
    confirm: 'CONFIRM',
    cancel: 'CANCEL',
    close: 'CLOSE',
    yes: 'YES',
    no: 'NO',
    loading: 'LOADING...',
  },

  settings: {
    title: 'SETTINGS',
    language: 'LANGUAGE',
  },

  race: {
    position: 'POSITION',
    time: 'TIME',
    finalStretch: 'FINAL STRETCH!',
    finished: 'RACE FINISHED',
    victory: 'VICTORY!',
    defeat: 'DEFEAT',
  },

  result: {
    title: 'RACE RESULTS',
    xpEarned: 'XP EARNED',
    positionBonus: 'Position bonus',
    performanceBonus: 'Performance bonus',
    continue: 'CONTINUE',
  },

  carSelection: {
    title: 'RACE GARAGE',
    subtitle: 'CHOOSE AND PREPARE YOUR RIDE',

    pilot: 'DRIVER',
    level: 'LEVEL',
    trophies: 'TROPHIES',

    yourGarage: 'YOUR GARAGE',

    carsCount: {
      one: '%{count} CAR',
      other: '%{count} CARS',
    },

    ready: 'READY',
    unavailable: 'UNAVAILABLE',

    newCar: 'NEW CAR',
    openStore: 'OPEN STORE',

    emptyGarage: 'EMPTY GARAGE',
    emptyGarageMessage:
      'VISIT THE STORE TO BUY YOUR FIRST CAR',

    primaryColor: 'PRIMARY COLOR',
    secondaryColor: 'SECONDARY COLOR',

    equippedVehicle: 'EQUIPPED VEHICLE',
    noVehicle: 'NO VEHICLE',

    category: 'CATEGORY',
    status: 'STATUS',

    installedUpgrades: 'INSTALLED UPGRADES',

    speed: 'SPEED',
    acceleration: 'ACCELERATION',
    jumpPower: 'JUMP POWER',
    defense: 'DEFENSE',

    garageStock: 'GARAGE INVENTORY',

    engine: 'ENGINE',
    spray: 'SPRAY',
    parts: 'PARTS',

    workshop: 'WORKSHOP',

    equipAndContinue: 'EQUIP & CONTINUE',
    buyCar: 'BUY A CAR',

    emptyGarageAlertTitle: 'Empty garage',
    emptyGarageAlertMessage:
      'Buy a vehicle from the store before continuing to the race.',
  },

  carStore: {
    title: 'WILD GARAGE',
    subtitle: 'STREET MARKET / CHOOSE YOUR RIDE',

    level: 'LEVEL',
    levelShort: 'LV.',
    gears: 'GEARS',

    garage: 'GARAGE',
    locked: 'LOCKED',
    purchased: 'PURCHASED',
    available: 'AVAILABLE',

    accessLocked: 'ACCESS LOCKED',
    requiresLevel: 'REQUIRES LEVEL %{level}',

    primaryColor: 'PRIMARY COLOR',
    secondaryColor: 'SECONDARY COLOR',

    requirement: 'REQUIREMENT',
    price: 'PRICE',
    inGarage: 'IN GARAGE',

    factoryPerformance: 'FACTORY PERFORMANCE',
    speed: 'SPEED',
    acceleration: 'ACCELERATION',
    potential: 'POTENTIAL',

    upgrades: 'UPGRADES',
    engine: 'ENGINE',
    launch: 'ACCELERATION',
    defense: 'DEFENSE',

    workshop: 'WORKSHOP',

    equipAndContinue: 'EQUIP & CONTINUE',
    buy: 'BUY',
    missing: 'MISSING',
    lockedLevel: 'LOCKED • LEVEL %{level}',

    profileUnavailableTitle: 'Profile unavailable',
    profileUnavailableMessage:
      'Create or load your profile before making a purchase.',

    vehicleLockedTitle: 'Vehicle locked',
    vehicleLockedMessage:
      'Reach level %{level} to unlock %{car}.',

    insufficientGearsTitle: 'Not enough gears',
    insufficientGearsMessage:
      'You still need %{count} gears to buy %{car}.',

    buyConfirmTitle: 'Buy %{car}?',
    buyConfirmMessage:
      '%{price} gears will be deducted from your balance.',

    cancel: 'CANCEL',

    purchaseFailedTitle: 'Purchase failed',
    purchaseFailedMessage:
      'Check your level, balance, or whether the car is already in your garage.',

    purchaseSuccessTitle: 'NEW CAR IN YOUR GARAGE!',
    purchaseSuccessMessage:
      '%{car} was purchased successfully.',

    carNotPurchasedTitle: 'Car not purchased',
    carNotPurchasedMessage:
      'Buy the vehicle before opening the workshop.',
  },

  deckSelection: {
    title: 'BUILD YOUR DECK',
    subtitle: 'Choose four cards and balance offense with survival.',

    cards: 'CARDS',

    availableCards: 'AVAILABLE CARDS',
    availableHint: 'Tap a card to add it.',

    categories: {
      attack: 'ATTACK',
      defense: 'DEFENSE',
    },

    yourDeck: 'YOUR DECK',
    removeHint: 'Tap to remove.',

    emptySlot: 'EMPTY SLOT',

    race: 'RACE!',
    chooseMore: 'CHOOSE %{count} MORE',

    fullDeckTitle: 'Deck full!',
    fullDeckMessage:
      'You can only select %{count} cards for the race.',

    incompleteDeckTitle: 'Incomplete deck!',
    incompleteDeckMessage:
      'You must select %{count} cards for the race.',

    cardDescriptions: {
      chains: 'Pulls an opponent back and reduces their advantage.',
      tnt: 'Drops an explosive crate on the track.',
      swap: 'Swaps your position with another racer.',
      slow_slow:
        'Temporarily reduces your rivals’ speed.',
      blind: 'Obstructs an opponent’s vision.',
      bullet: 'Fires a guided missile at a rival.',
      tornado:
        'Launches a tornado at opponents ahead.',
      bubble_lift:
        'Lifts an opponent into the air and interrupts their race.',

      nitro_power:
        'Emergency acceleration to escape incoming threats.',
      shield:
        'Completely blocks the next attack.',
      armor:
        'Absorbs two attacks without losing lives.',
      quick_repair:
        'Restores up to two car lives.',
      ghost:
        'Grants temporary immunity against attacks.',
      second_chance:
        'Prevents elimination and restores one life.',
    },
  },

  mapSelection: {
    title: 'STREET CIRCUITS',
    subtitle: 'CHOOSE YOUR NEXT DESTINATION',

    pilot: 'DRIVER',
    level: 'LEVEL',
    levelShort: 'LV.',
    trophies: 'TROPHIES',

    track: 'TRACK',

    circuit: 'WILD RUNNERS CIRCUIT',

    lockedTrack: 'TRACK LOCKED',
    requiresLevel: 'REQUIRES LEVEL %{level}',

    status: 'STATUS',
    requirement: 'REQUIREMENT',

    unlocked: 'UNLOCKED',
    locked: 'LOCKED',

    selectedTrack: 'SELECTED TRACK',
    noTrack: 'NO TRACK',

    raceOnTrack: 'RACE THIS TRACK',
    lockedButton: 'LOCKED • LV. %{level}',
  },
};

export default en;