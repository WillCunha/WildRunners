const en = {
  language: {
    title: 'Choose your language',
    subtitle: 'You can change the language later in settings.',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español',
    continue: 'CONTINUE',
  },
  loading: {
    title: 'LOADING...',
    tips: {
      cardsTiming: 'Use your racing cards at the right moment to turn the race around!',
      catsAndDogs: 'Cats run faster, but do dogs have more stamina?',
      preparingRace: 'Revving the engines and shuffling the deck...',
      tightTurns: 'Tip: Tight turns require more control!',
    },
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

    carDescriptions: {
      buggy:
        'Your first garage car: light, simple, and ready to race.',

      kombi:
        'Tough, charismatic, and impossible to ignore on the streets.',

      uno:
        'Light and quick off the line. A great first upgrade.',

      fusca:
        'A balanced classic that is reliable and easy to control.',

      astor:
        'Delivers high speed while maintaining strong acceleration.',

      ferrari:
        'Top speed for racers who have reached the highest level of competition.',

      monster:
        'Brutal acceleration and a dominant look built for the endgame.',

      lamborghini:
        'Powerful acceleration and iconic design for the most demanding racers.',

      caravana:
        'Space and comfort for the journey with friends.',
    },
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

  workshop: {
    title: 'WILD WORKSHOP',
    subtitle: 'PERFORMANCE LAB / UPGRADE YOUR RIDE',

    level: 'LEVEL',
    levelShort: 'LV.',
    maxLevel: 'MAX LEVEL %{level}',

    engine: 'ENGINE',
    parts: 'PARTS',
    spray: 'SPRAY',

    vehicleInMaintenance: 'VEHICLE IN SERVICE',
    category: 'CATEGORY',
    status: 'STATUS',
    rarity: 'RARITY',
    onBench: 'ON THE BENCH',

    installedConfiguration: 'INSTALLED SETUP',

    speed: 'SPEED',
    acceleration: 'ACCELERATION',
    jumpPower: 'JUMP POWER',
    defense: 'DEFENSE',

    technicalBench: 'TECH BENCH',
    upgrades: 'UPGRADES',
    online: 'ONLINE',

    upgradesDescription:
      'Install permanent upgrades using parts collected during races.',

    nextLevelCost: 'NEXT LEVEL COST',
    balance: 'BALANCE',
    upgradeComplete: 'UPGRADE COMPLETE',

    install: 'INSTALL',
    maximum: 'MAX',
    noParts: 'NO PARTS',


    insufficientResourcesTitle: 'NOT ENOUGH RESOURCES',
    insufficientResourcesMessage:
      'You need %{cost} %{resource} for this upgrade.',

    resources: {
      engineParts: 'engine parts',
      gears: 'gears',
      sprays: 'sprays',
    },

    upgradeItems: {
      maxSpeed: {
        title: 'Top Speed',
        subtitle: 'Increases the vehicle’s maximum speed',
      },

      acceleration: {
        title: 'Acceleration',
        subtitle: 'Improves acceleration and speed recovery',
      },

      jumpPower: {
        title: 'Jump Power',
        subtitle: 'Increases jumping power',
      },

      defense: {
        title: 'Defense / Durability',
        subtitle: 'Strengthens the vehicle against attacks',
      },

      rarity: {
        title: 'Style & Rarity',
        subtitle: 'Improves the car’s visual level and rarity',
      },
    },

    carNotFound: {
      eyebrow: 'WILD WORKSHOP',
      title: 'CAR NOT FOUND',
      message:
        'Select a vehicle from your garage before opening the workshop.',
    },
  },
  raceResult: {
    raceCompleted: 'RACE COMPLETE',

    winner: 'WINNER!',
    positionPlace: '%{position}%{suffix} PLACE',

    newRecord: '✨ NEW RECORD!',

    rewards: 'REWARDS',

    gears: 'GEARS',
    trophies: 'TROPHIES',
    engine: 'ENGINE',
    spray: 'SPRAY',

    raceXp: '⭐ RACE XP',
    level: 'LEVEL',
    levelUp: '✨ LEVEL UP! LEVEL %{level}',

    xpBonus: {
      position: '🏁 POSITION',
      perfectStart: '⚡ START',
      attacks: '🎯 ATTACKS',
      defenses: '🛡️ DEFENSES',
      flawless: '❤️ FLAWLESS',
      comeback: '🔥 COMEBACK',
      survived: '🏁 SURVIVED',
    },

    newUnlock: '🔓 NEW UNLOCK',

    unlockTypes: {
      card: 'CARD',
      car: 'CAR',
      map: 'TRACK',
    },

    raceAgain: 'RACE AGAIN',
    continue: 'CONTINUE →',

    noResult: 'No race result available',
    continueSimple: 'CONTINUE',
  },
  registration: {
    heroEyebrow: 'WILD RUNNERS // DRIVER ID',
    heroTitle: 'JOIN THE GRID.',
    heroText:
      'Choose the name other drivers will see on the streets and link an email to your profile.',
    localProfile: 'LOCAL PROFILE // MVP',

    newDriver: 'NEW DRIVER',
    createIdentity: 'CREATE YOUR IDENTITY',

    usernameLabel: 'DRIVER NAME',
    usernamePlaceholder: 'your_name',
    usernameError:
      'Use 3–12 characters: letters, numbers, _ or -.',
    usernameHint:
      'This will be your name during races.',

    emailLabel: 'EMAIL',
    emailPlaceholder: 'you@email.com',
    validated: 'VALIDATED',
    account: 'ACCOUNT',
    emailError:
      'Enter a valid email address.',
    emailHint:
      'For the MVP it is saved locally. Later it will be migrated to your server account.',

    driverReady: 'DRIVER READY',
    startAdventure: 'START ADVENTURE',

    localNote:
      'Your data and progress remain on this device during the MVP.',
  },
};

export default en;