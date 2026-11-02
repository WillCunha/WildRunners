const es = {
  language: {
    title: 'Elige tu idioma',
    subtitle: 'Podrás cambiar el idioma más tarde en los ajustes.',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español',
    continue: 'CONTINUAR',
  },

  loading: {
    title: 'CARGANDO...',
    preloadTimeoutTitle: 'Problema al cargar',
    preloadTimeoutMessage:
      'Algunos archivos del juego tardaron más de lo esperado en cargar. Inténtalo de nuevo.',
    retry: 'INTENTAR DE NUEVO',
    tips: {
      cardsTiming: '¡Usa tus cartas en el momento adecuado para darle la vuelta a la carrera!',
      raceStrategy: 'La velocidad no lo es todo — ¡una buena estrategia puede cambiar la carrera!',
      preparingRace: 'Calentando motores y barajando el mazo...',
      tightTurns: '¡Cuidado con las rampas! Un buen control puede marcar la diferencia.',

      saveYourCards: 'No uses todas tus cartas demasiado pronto — ¡el final de la carrera puede traer sorpresas!',
      defendYourself: 'Una buena defensa en el momento adecuado puede ser tan poderosa como un ataque.',
      watchYourRivals: 'Vigila a tus rivales — ¡el momento perfecto para atacar puede aparecer en cualquier instante!',
      finalSeconds: '¡En los últimos segundos, una sola carta puede decidir la carrera!',
      comeback: '¡Nunca te rindas! Una buena jugada puede cambiar completamente tu posición.',
    },
  },

  start: {
    pressToStart: 'PRESIONA PARA EMPEZAR',
  },

  common: {
    play: 'JUGAR',
    continue: 'CONTINUAR',
    back: 'VOLVER',
    confirm: 'CONFIRMAR',
    cancel: 'CANCELAR',
    close: 'CERRAR',
    yes: 'SÍ',
    no: 'NO',
    loading: 'CARGANDO...',
  },

  settings: {
    title: 'AJUSTES',
    language: 'IDIOMA',
  },

  race: {
    position: 'POSICIÓN',
    time: 'TIEMPO',
    finalStretch: '¡RECTA FINAL!',
    finished: 'CARRERA FINALIZADA',
    slowDown: 'FREAR',
    speedUp: 'ACELERAR',
    pilotagem: 'PILOTAGE',
    victory: '¡VICTORIA!',
    defeat: 'DERROTA',
  },

  result: {
    title: 'RESULTADOS DE LA CARRERA',
    xpEarned: 'XP OBTENIDA',
    positionBonus: 'Bonificación por posición',
    performanceBonus: 'Bonificación por rendimiento',
    continue: 'CONTINUAR',
  },

  carSelection: {
    title: 'RACE GARAGE',
    subtitle: 'ELIGE Y PREPARA TU MÁQUINA',

    pilot: 'PILOTO',
    level: 'NIVEL',
    trophies: 'TROFEOS',

    yourGarage: 'TU GARAJE',

    carsCount: {
      one: '%{count} COCHE',
      other: '%{count} COCHES',
    },

    ready: 'LISTO',
    unavailable: 'NO DISPONIBLE',

    newCar: 'COCHE NUEVO',
    openStore: 'ABRIR TIENDA',

    emptyGarage: 'GARAJE VACÍO',

    emptyGarageMessage:
      'VISITA LA TIENDA PARA COMPRAR TU PRIMER COCHE',

    primaryColor: 'COLOR PRINCIPAL',
    secondaryColor: 'COLOR SECUNDARIO',

    equippedVehicle: 'VEHÍCULO EQUIPADO',
    noVehicle: 'SIN VEHÍCULO',

    category: 'CATEGORÍA',
    status: 'ESTADO',

    installedUpgrades: 'MEJORAS INSTALADAS',

    speed: 'VELOCIDAD',
    acceleration: 'ACELERACIÓN',
    jumpPower: 'POTENCIA DE SALTO',
    defense: 'DEFENSA',

    garageStock: 'INVENTARIO DEL GARAJE',

    engine: 'MOTOR',
    spray: 'SPRAY',
    parts: 'PIEZAS',

    workshop: 'TALLER',

    equipAndContinue: 'EQUIPAR Y CONTINUAR',
    buyCar: 'COMPRAR UN COCHE',

    emptyGarageAlertTitle: 'Garaje vacío',

    emptyGarageAlertMessage:
      'Compra un vehículo en la tienda antes de continuar a la carrera.',

    carNotPurchasedAlertTitle: "Coche no comprado",
    carNotPurchasedAlertMessage:
      'Compra el vehículo antes de abrir el taller.',

    equippedPaint: "PINTURA EQUIPADA",
    personalizePaint: "Personaliza en el taller",
  },

  carStore: {
    title: 'WILD GARAGE',
    subtitle: 'STREET MARKET / ELIGE TU MÁQUINA',

    level: 'NIVEL',
    levelShort: 'NV.',
    gears: 'ENGRANAJES',

    garage: 'GARAJE',
    locked: 'BLOQUEADO',
    purchased: 'COMPRADO',
    available: 'DISPONIBLE',

    accessLocked: 'ACCESO BLOQUEADO',

    requiresLevel:
      'REQUIERE NIVEL %{level}',

    primaryColor: 'COLOR PRINCIPAL',
    secondaryColor: 'COLOR SECUNDARIO',

    requirement: 'REQUISITO',
    price: 'PRECIO',
    inGarage: 'EN EL GARAJE',

    factoryPerformance:
      'RENDIMIENTO DE FÁBRICA',

    speed: 'VELOCIDAD',
    acceleration: 'ACELERACIÓN',
    potential: 'POTENCIAL',

    upgrades: 'MEJORAS',
    engine: 'MOTOR',
    launch: 'ACELERACIÓN',
    defense: 'DEFENSA',

    workshop: 'TALLER',

    equipAndContinue:
      'EQUIPAR Y CONTINUAR',

    buy: 'COMPRAR',
    missing: 'FALTAN',

    lockedLevel:
      'BLOQUEADO • NIVEL %{level}',

    profileUnavailableTitle:
      'Perfil no disponible',

    profileUnavailableMessage:
      'Crea o carga tu perfil antes de realizar una compra.',

    vehicleLockedTitle:
      'Vehículo bloqueado',

    vehicleLockedMessage:
      'Alcanza el nivel %{level} para desbloquear %{car}.',

    insufficientGearsTitle:
      'Engranajes insuficientes',

    insufficientGearsMessage:
      'Todavía te faltan %{count} engranajes para comprar %{car}.',

    buyConfirmTitle:
      '¿Comprar %{car}?',

    buyConfirmMessage:
      'Se descontarán %{price} engranajes de tu saldo.',

    cancel: 'CANCELAR',

    purchaseFailedTitle:
      'Compra no completada',

    purchaseFailedMessage:
      'Comprueba tu nivel, tu saldo o si el coche ya está en tu garaje.',

    purchaseSuccessTitle:
      '¡NUEVO COCHE EN TU GARAJE!',

    purchaseSuccessMessage:
      '%{car} se ha comprado correctamente.',

    carNotPurchasedTitle:
      'Coche no comprado',

    carNotPurchasedMessage:
      'Compra el vehículo antes de abrir el taller.',
    carDescriptions: {
      buggy:
        'El primer coche del garaje: ligero, sencillo y listo para correr.',

      kombi:
        'Resistente, carismática y con una gran presencia en las calles.',

      uno:
        'Ligero y rápido en las recuperaciones. Una excelente primera mejora.',

      fusca:
        'Un clásico equilibrado, fiable y fácil de controlar.',

      astor:
        'Ofrece alta velocidad y mantiene una buena aceleración.',

      ferrari:
        'Velocidad máxima para quienes han llegado a lo más alto de la competición.',

      monster:
        'Aceleración brutal y una presencia dominante para el endgame.',

      lamborghini:
        'Potencia de aceleración y diseño icónico para los pilotos más exigentes.',

      caravana:
        'Espacio y comodidad para el viaje con amigos.',
    },
  },

  deckSelection: {
    title: 'ARMA TU MAZO',

    subtitle:
      'Elige cuatro cartas y combina ataque con supervivencia.',

    cards: 'CARTAS',

    availableCards:
      'CARTAS DISPONIBLES',

    availableHint:
      'Toca una carta para añadirla.',

    noOwnedCards: 'Aún no has desbloqueado cartas en esta categoría.',

    categories: {
      attack: 'ATAQUE',
      defense: 'DEFENSA',
    },

    yourDeck: 'TU MAZO',

    removeHint:
      'Toca para eliminar.',

    emptySlot: 'ESPACIO VACÍO',

    race: '¡A CORRER!',

    chooseMore:
      'ELIGE %{count} MÁS',

    fullDeckTitle:
      '¡Mazo completo!',

    fullDeckMessage:
      'Solo puedes seleccionar %{count} cartas para la carrera.',

    incompleteDeckTitle:
      '¡Mazo incompleto!',

    incompleteDeckMessage:
      'Debes seleccionar %{count} cartas para la carrera.',

    cardDescriptions: {
      chains:
        'Arrastra a un rival hacia atrás y reduce su ventaja.',

      tnt:
        'Deja una caja explosiva en la pista.',

      swap:
        'Intercambia tu posición con otro corredor.',

      slow_slow:
        'Reduce temporalmente la velocidad de tus rivales.',

      blind:
        'Dificulta la visión de un rival.',

      bullet:
        'Dispara un misil guiado contra un rival.',

      tornado:
        'Lanza un tornado contra los oponentes que van delante.',

      bubble_lift:
        'Eleva a un rival por el aire e interrumpe su carrera.',

      nitro_power:
        'Aceleración de emergencia para escapar de amenazas.',

      shield:
        'Bloquea completamente el próximo ataque.',

      armor:
        'Absorbe dos ataques sin perder vidas.',

      quick_repair:
        'Recupera hasta dos vidas del coche.',

      ghost:
        'Otorga inmunidad temporal contra ataques.',

      second_chance:
        'Evita la eliminación y recupera una vida.',

      oil_spit:
        'Derrama aceite en la pista para hacer que los rivales derrapen y pierdan velocidad temporalmente.',
    },
  },

  mapSelection: {
    title: 'STREET CIRCUITS',
    subtitle: 'ELIGE TU PRÓXIMO DESTINO',

    pilot: 'PILOTO',
    level: 'NIVEL',
    levelShort: 'NV.',
    trophies: 'TROFEOS',

    track: 'PISTA',

    circuit: 'WILD RUNNERS CIRCUIT',

    lockedTrack: 'PISTA BLOQUEADA',

    requiresLevel:
      'REQUIERE NIVEL %{level}',

    status: 'ESTADO',
    requirement: 'REQUISITO',

    unlocked: 'DESBLOQUEADA',
    locked: 'BLOQUEADA',

    selectedTrack:
      'PISTA SELECCIONADA',

    noTrack: 'SIN PISTA',

    raceOnTrack:
      'CORRER EN ESTA PISTA',

    lockedButton:
      'BLOQUEADA • NV. %{level}',
  },

  workshop: {
    title: 'WILD WORKSHOP',

    subtitle:
      'PERFORMANCE LAB / MEJORA TU MÁQUINA',

    level: 'NIVEL',
    levelShort: 'NV.',

    maxLevel:
      'NIVEL MÁXIMO %{level}',

    engine: 'MOTOR',
    parts: 'PIEZAS',
    spray: 'SPRAY',

    vehicleInMaintenance:
      'VEHÍCULO EN MANTENIMIENTO',

    category: 'CATEGORÍA',
    status: 'ESTADO',
    rarity: 'RAREZA',

    onBench: 'EN EL BANCO',

    installedConfiguration:
      'CONFIGURACIÓN INSTALADA',

    speed: 'VELOCIDAD',
    acceleration: 'ACELERACIÓN',
    jumpPower: 'POTENCIA DE SALTO',
    defense: 'DEFENSA',

    technicalBench:
      'BANCO TÉCNICO',

    upgrades: 'MEJORAS',
    online: 'EN LÍNEA',

    upgradesDescription:
      'Instala mejoras permanentes usando las piezas obtenidas en las carreras.',

    nextLevelCost:
      'COSTO DEL PRÓXIMO NIVEL',

    balance: 'SALDO',

    upgradeComplete:
      'MEJORA COMPLETA',

    install: 'INSTALAR',
    maximum: 'MÁXIMO',
    noParts: 'SIN PIEZAS',

    insufficientResourcesTitle:
      'RECURSOS INSUFICIENTES',

    insufficientResourcesMessage:
      'Necesitas %{cost} %{resource} para esta mejora.',

    resources: {
      engineParts:
        'piezas de motor',

      gears:
        'engranajes',

      sprays:
        'sprays',
    },

    upgradeItems: {
      maxSpeed: {
        title:
          'Velocidad Máxima',

        subtitle:
          'Aumenta la velocidad máxima del vehículo',
      },

      acceleration: {
        title:
          'Aceleración',

        subtitle:
          'Mejora la aceleración y la recuperación de velocidad',
      },

      jumpPower: {
        title:
          'Potencia de Salto',

        subtitle:
          'Aumenta la potencia de los saltos',
      },

      defense: {
        title:
          'Defensa / Resistencia',

        subtitle:
          'Refuerza el vehículo contra los ataques',
      },

      rarity: {
        title:
          'Estilo y Rareza',

        subtitle:
          'Mejora el nivel visual y la rareza del coche',
      },
    },

    carNotFound: {
      eyebrow: 'WILD WORKSHOP',

      title:
        'COCHE NO ENCONTRADO',

      message:
        'Selecciona un vehículo de tu garaje antes de abrir el taller.',
    },
    paint: 'PINTURA',

    visualStudio: 'ESTUDIO VISUAL',
    customization: 'PERSONALIZACIÓN',
    back: 'VOLVER',

    customizationDescription:
      'Elige pintura, acabado y componentes. El coche de la izquierda muestra una vista previa en tiempo real.',

    customize: 'PERSONALIZAR',
    customizeDescription: 'Pintura, acabado y componentes visuales',

    primaryColor: 'COLOR PRIMARIO',
    secondaryColor: 'COLOR SECUNDARIO',
    finish: 'ACABADO',

    apply: 'APLICAR',

    original: 'ORIGINAL',
    equipFree: 'EQUIPAR GRATIS',
    equipped: 'EQUIPADO',
    owned: 'COMPRADO',
    equip: 'EQUIPAR',
    buy: 'COMPRAR',

    availableFromLevel: 'Disponible a partir del nivel %{level}.',

    paintLockedTitle: 'PINTURA BLOQUEADA',
    partLockedTitle: 'PIEZA BLOQUEADA',

    insufficientSprayTitle: 'SPRAY INSUFICIENTE',
    insufficientSprayMessage: 'Necesitas 🎨 %{price}.',

    applyPaintErrorTitle: 'NO SE PUDO APLICAR',
    applyPaintErrorMessage: 'Comprueba el vehículo e inténtalo de nuevo.',

    equipErrorTitle: 'NO SE PUDO EQUIPAR',
    equipErrorMessage: 'Inténtalo de nuevo.',
  },

  raceResult: {
    surpriseChest: '🎁 ¡SORPRESA! ABRIR COFRE',
    raceCompleted:
      'CARRERA COMPLETADA',

    winner: '¡GANADOR!',

    positionPlace:
      '%{position}º PUESTO',

    newRecord:
      '✨ ¡NUEVO RÉCORD!',

    rewards: 'RECOMPENSAS',

    gears: 'ENGRANAJES',
    trophies: 'TROFEOS',
    engine: 'MOTOR',
    spray: 'SPRAY',

    raceXp: '⭐ XP DE LA CARRERA',

    level: 'NIVEL',

    levelUp:
      '✨ ¡SUBISTE DE NIVEL! NIVEL %{level}',

    xpBonus: {
      position: '🏁 POSICIÓN',
      perfectStart: '⚡ SALIDA',
      attacks: '🎯 ATAQUES',
      defenses: '🛡️ DEFENSAS',
      flawless: '❤️ INTACTO',
      comeback: '🔥 REMONTADA',
      survived: '🏁 SOBREVIVISTE',
    },

    newUnlock:
      '🔓 NUEVO DESBLOQUEO',

    unlockTypes: {
      card: 'CARTA',
      car: 'COCHE',
      map: 'PISTA',
    },

    raceAgain:
      'CORRER DE NUEVO',

    continue: 'CONTINUAR →',

    noResult:
      'No hay ningún resultado de carrera disponible',

    continueSimple:
      'CONTINUAR',
    nextTarget: 'PRÓXIMO OBJETIVO',
    xpRemaining: 'FALTAN %{xp} XP',
    targetLevel: 'NIVEL %{level}',

  },
  registration: {
    heroEyebrow: 'WILD RUNNERS // ID DEL PILOTO',
    heroTitle: 'ENTRA EN LA PARRILLA.',
    heroText:
      'Elige el nombre que los demás pilotos verán en las calles y vincula un correo electrónico a tu perfil.',
    localProfile: 'PERFIL LOCAL // MVP',

    newDriver: 'NUEVO PILOTO',
    createIdentity: 'CREA TU IDENTIDAD',

    usernameLabel: 'NOMBRE DE PILOTO',
    usernamePlaceholder: 'tu_nombre',
    usernameError:
      'Usa 3–12 caracteres: letras, números, _ o -.',
    usernameHint:
      'Este será tu nombre durante las carreras.',

    emailLabel: 'CORREO ELECTRÓNICO',
    emailPlaceholder: 'tu@email.com',
    validated: 'VALIDADO',
    account: 'CUENTA',
    emailError:
      'Introduce un correo electrónico válido.',
    emailHint:
      'Durante el MVP se guarda localmente. Después se migrará a tu cuenta del servidor.',

    driverReady: 'PILOTO LISTO',
    startAdventure: 'COMENZAR AVENTURA',


    messageTitle: 'NUEVO PILOTO',
    messageStart: 'Vamos a crear una cuenta WF ID y un nuevo progreso guardado para este piloto.',
    messageEnd: 'Si ya tienes una cuenta con este mismo correo electrónico, selecciona INICIAR SESIÓN para cargar tu progreso guardado.',
    confirmation: 'CREAR NUEVO PILOTO',
    cancelation: 'CANCELAR',
    already: 'YA TENGO UNA CUENTA',

    localNote:
      'Tus datos y tu progreso permanecen en este dispositivo durante el MVP.',
  },
  auth: {
    errorTitle: 'NO FUE POSSIBLE CONTINUAR',

    errors: {
      emailAlreadyInUse:
        'Este correo electrónico ya está vinculado a un WF ID. Intenta iniciar sesión en lugar de crear una nueva cuenta.',
      invalidEmail:
        'Ingresa una dirección de correo electrónico válida.',
      weakPassword:
        'Tu contraseña es muy débil. Usa al menos 6 caracteres.',
      invalidCredential:
        'Correo electrónico o contraseña incorrectos. Verifica tus datos e intenta de nuevo.',
      wrongPassword:
        'Contraseña incorrecta. Verifica tu contraseña e intenta de nuevo.',
      userNotFound:
        'No encontramos una cuenta WF ID con este correo electrónico.',
      userDisabled:
        'Esta cuenta ha sido deshabilitada. Ponte en contacto con el soporte técnico.',
      tooManyRequests:
        'Se han realizado demasiados intentos en poco tiempo. Espera un momento e intenta de nuevo.',
      networkRequestFailed:
        'No fue posible conectarse al servidor de WF. Verifica tu conexión a internet e intenta de nuevo.',
      operationNotAllowed:
        'Este método de inicio de sesión no está disponible en este momento.',
      accountExistsWithDifferentCredential:
        'Ya existe una cuenta WF ID con este correo electrónico usando otro método de inicio de sesión.',
      credentialAlreadyInUse:
        'Esta credencial ya está vinculada a otra cuenta.',
      requiresRecentLogin:
        'Por seguridad, vuelve a iniciar sesión en tu cuenta para continuar.',
      generic:
        'No se pudo completar la autenticación. Intenta de nuevo.',
    },
  },
  chest: {
    "event": "WILD RUNNERS · EVENTO SORPRESA",
    "win": "¡PREMIO CONSEGUIDO!",
    "choose": "¡SORPRESA! ELIGE TU COFRE",
    "secured": "TU RECOMPENSA ESTÁ ASEGURADA",
    "prepare": "PREPÁRATE PARA LA REVELACIÓN",
    "secret": "UNO ESCONDE UN PREMIO ESPECIAL",
    "preview": "🧪 VISTA PREVIA LOCAL · SIN RECOMPENSAS EN FIREBASE",
    "loading": "PREPARANDO LA SORPRESA...",
    "unavailable": "NO HAY EVENTO SORPRESA EN ESTA CARRERA.",
    "retry": "REINTENTAR",
    "continue": "CONTINUAR",
    "chestNumber": "COFRE 0%{number}",
    "tap": "TOCA PARA ABRIR",
    "common": "COMÚN",
    "rare": "RARO",
    "epic": "ÉPICO",
    "legendary": "LEGENDARIO",
    "newCard": "NUEVA CARTA",
    "newCar": "NUEVO COCHE",
    "newEquipment": "NUEVO COMPONENTE",
    "jackpot": "PREMIO MAYOR DE RECURSOS",
    "resources": "RECURSOS RECIBIDOS",
    "cardDetail": "Añadida a tu inventario de cartas",
    "carDetail": "Disponible en tu garaje",
    "equipmentDetail": "Disponible para equipar en el Taller",
    "resourceDetail": "Añadido a tu saldo de recursos",
    "motor": "PIEZAS DE MOTOR",
    "spray": "SPRAY",
    "engrenagem": "ENGRANAJES",
    "chips": "CHIPs",
    "demo": "Premio de prueba · no abonado",
    "chooseHint": "Elige con cuidado: solo puedes abrir un cofre.",
    "confirming": "CONFIRMANDO TU PREMIO...",
    "opening": "EL COFRE SE ESTÁ ABRIENDO",
    "revealing": "REVELANDO TU RECOMPENSA",
    "focus": "TU PREMIO ES EL PROTAGONISTA",
    "deferred": "Premio guardado en Firebase. El inventario se actualizará en la próxima sincronización.",
    "testAnother": "↻ PROBAR OTRO PREMIO",
    "exitPreview": "SALIR DE LA VISTA PREVIA",
    "back": "VOLVER",
    "loadError": "No se pudieron cargar los cofres.",
    "openError": "No se pudo abrir el cofre. Inténtalo de nuevo.",
    "raceMissing": "No se encontró el identificador de carrera.",
    "notConfirmed": "No se pudo confirmar el premio.",
    "openA11y": "Abrir cofre %{number}"
  },
  onlineLab: {
    "phase": {
      "waiting": "ESPERANDO CONFIRMACIÓN",
      "countdown": "SALIDA",
      "racing": "CARRERA EN CURSO",
      "paused": "PAUSADA — RECONECTANDO",
      "finished": "CARRERA FINALIZADA"
    },
    "disconnected": "DESCONECTADO",
    "connected": "CONECTADO",
    "reconnecting": "RECONECTANDO...",
    "introDetail": "Crea una sala o introduce el código de otro dispositivo.",
    "inputMissing": "El control de la sala no está disponible.",
    "inputFailure": "No se pudo preparar el control: %{error}",
    "joinedDetail": "Sala conectada. Espera al segundo jugador y pulsa LISTO.",
    "lostDetail": "Conexión perdida. Tu plaza se reserva durante 10 segundos.",
    "recovered": "Sesión recuperada.",
    "closedCode": "Conexión cerrada (%{code}).",
    "noCar": "No hay un coche válido seleccionado. Vuelve a CAR SELECTION antes de correr en línea.",
    "invalidDeck": "Mazo no válido. Vuelve a DECK SELECTION.",
    "existingSession": "Ya hay una sesión en línea activa. Retómala o ciérrala primero.",
    "roomCodeMissing": "Introduce primero el código de la sala.",
    "connecting": "Verificando la cuenta y conectando a Servidor de WF...",
    "transferUnavailable": "La sala anterior ya no está disponible. Entra en otra.",
    "readyError": "No se pudo confirmar la revancha: %{error}",
    "waitingReconnect": "La sala se está reconectando. Espera antes de pedir la revancha.",
    "transferEnded": "Sesión transferida cerrada. Puedes crear otra sala.",
    "leftRoom": "Has salido de la sala.",
    "commandError": "Comando no enviado: %{error}",
    "shareText": "🏎️ ¡Vamos a correr en Wild Runners!\nEntra en una sala privada con el código: %{code}\nAbre Wild Online y elige ENTRAR EN SALA.",
    "shareError": "No se pudo compartir: %{error}",
    "deckExactly": "Elige exactamente cuatro cartas en DECK SELECTION.",
    "deckDifferent": "Tu mazo necesita cuatro cartas diferentes.",
    "deckUnsupported": "Cartas no disponibles en esta Alpha: %{cards}. Vuelve a DECK SELECTION.",
    "deckUnavailable": "Inventario de cartas no disponible. Espera a que se sincronice tu perfil.",
    "deckNotOwned": "Faltan cartas en el inventario: %{cards}. Revisa la compra y la sincronización.",
    "rotate": "GIRA PARA JUGAR",
    "rotateInfo": "El lobby de Wild Online está diseñado para pantalla horizontal.",
    "back": "VOLVER",
    "subtitle": "SALA MULTIJUGADOR / ALPHA 17",
    "nextRace": "PRÓXIMA CARRERA · MISMA SALA",
    "sessionOngoing": "SESIÓN EN CURSO",
    "againQuestion": "¿Listo para volver a correr?",
    "stillActive": "Tu carrera sigue activa",
    "sameRoomInfo": "Tu sala sigue abierta. Pulsa LISTO PARA REVANCHA; Servidor de WF esperará a ambos pilotos.",
    "resumeInfo": "Retoma la misma conexión sin duplicar al jugador en Servidor de WF.",
    "readyRematch": "LISTO PARA REVANCHA",
    "resumeRace": "RETOMAR CARRERA",
    "endSession": "CERRAR SESIÓN",
    "chooseRoom": "ELIGE TU SALA",
    "private2": "2 PILOTOS · PRIVADA",
    "createRoom": "CREAR SALA",
    "joinCode": "ENTRAR CON CÓDIGO",
    "createInfoTitle": "Crea vuestra sala privada.",
    "createInfo": "Comparte el código con un amigo y esperad hasta que ambos estéis listos.",
    "inviteCode": "CÓDIGO DE INVITACIÓN",
    "joinRoom": "ENTRAR EN SALA",
    "createPrivate": "CREAR SALA PRIVADA",
    "previewOffline": "VISTA PREVIA SIN CONEXIÓN",
    "demoNoAws": "MODO DEMOSTRACIÓN · SIN Servidor de WF",
    "privateInvite": "SALA PRIVADA / INVITACIÓN",
    "share": "COMPARTIR",
    "you": "TÚ",
    "noCarShort": "SIN COCHE",
    "waiting": "ESPERANDO",
    "demoRival": "RIVAL DEMO",
    "rival": "RIVAL",
    "freeSlot": "PLAZA LIBRE",
    "awaitingDriver": "ESPERANDO PILOTO",
    "inRoom": "EN SALA",
    "free": "LIBRE",
    "waitingRival": "ESPERANDO AL RIVAL",
    "win": "VICTORIA",
    "lose": "DERROTA",
    "draw": "EMPATE",
    "ready": "LISTO",
    "hideRival": "OCULTAR RIVAL",
    "simulateRival": "SIMULAR RIVAL",
    "exitPreview": "SALIR DE VISTA PREVIA",
    "rematch": "REVANCHA",
    "imReady": "¡ESTOY LISTO!",
    "openTrack": "ABRIR PISTA",
    "leave": "SALIR",
    "localPreviewInfo": "Vista previa local: ningún jugador conectado a Servidor de WF.",
    "testChests": "PROBAR COFRES",
    "telemetry": "TELEMETRÍA",
    "yourVehicle": "TU VEHÍCULO",
    "garage": "GARAJE",
    "noSelection": "SIN SELECCIÓN",
    "selectCar": "SELECCIONA UN COCHE",
    "activeVehicle": "CAR SELECTION · COCHE ACTIVO",
    "awsSpeed": "VELOCIDAD Servidor de WF",
    "estimatedSpeed": "VELOCIDAD ESTIMADA",
    "engineSpeed": "MOTOR · VELOCIDAD",
    "levelAbbr": "NV.",
    "garageStats": "✓ Servidor de WF / Firestore: Acel. NV.%{accel} · Salto NV.%{jump} · Defensa NV.%{defense} · %{lives} vidas",
    "localProfileInfo": "Vista previa del perfil local. Servidor de WF verificará el Taller en Firestore al entrar.",
    "yourDeck": "TU MAZO",
    "bound": "VINCULADAS",
    "slot": "ESPACIO 0%{number}",
    "deckInfo": "Mazo guardado en DECK SELECTION. Servidor de WF valida costes y recargas; la propiedad en Firestore se verificará antes de producción.",
    "footer": "SALA PRIVADA • 2 JUGADORES • ALPHA 17",
    "onlineRoom": "SALA ONLINE / Servidor de WF",
    "labTools": "HERRAMIENTAS DE LABORATORIO",
    "close": "CERRAR",
    "officialPositions": "POSICIONES OFICIALES",
    "connectedShort": "CONECTADO",
    "reconnection": "RECONECTANDO",
    "max": "MÁX",
    "testCommands": "COMANDOS DE PRUEBA · 30 HZ",
    "brake": "FRENAR",
    "accelerate": "ACELERAR",
    "awsAuthority": "Servidor de WF sigue siendo responsable de física, posición, nitro y resultados.",
    "session": "SESIÓN"
    ,
    'firebaseAuthMissing': 'No se encontró la sesión de Firebase. Inicia sesión de nuevo antes de correr online.',
    'garageNotOwned': 'El coche seleccionado no está en tu garaje verificado de Firestore.',
    'cloudSaveMissing': 'No se encontró tu partida en Firebase. Sincroniza el perfil antes de entrar.',
    'invalidGarage': 'Los niveles del Taller guardados en Firebase no son válidos.',
    'garageMismatch': 'La partida remota no pertenece a la cuenta de Firebase conectada.',
    'loginRequired': 'Se requiere autenticación de Firebase. Inicia sesión de nuevo.',
    'connectionError': 'Error de conexión: %{error}',
    'serverError': 'Servidor %{code}: %{message}'
  },
  onlineMap: {
    "phase": {
      "waiting": "ESPERANDO JUGADORES",
      "countdown": "SALIDA",
      "racing": "CARRERA ONLINE",
      "paused": "PAUSADA POR Servidor de WF",
      "finished": "CARRERA FINALIZADA"
    },
    "you": "TÚ",
    "rival": "RIVAL",
    "receivingRacers": "Recibiendo corredores...",
    "noSession": "SIN SESIÓN",
    "reconnecting": "RECONECTANDO",
    "raceChips": "CHIPs de carrera",
    "unconfirmed": "NO CONFIRMADA",
    "leave": "SALIR",
    "unknownCar": "COCHE NO RECONOCIDO",
    "noId": "SIN ID",
    "inAir": "EN EL AIRE",
    "preparing": "PREPARANDO...",
    "go": "¡YA!",
    "waitingReconnect": "ESPERANDO RECONEXIÓN",
    "noLocalMovement": "No se calcula ningún movimiento local.",
    "confirmedResult": "Resultado confirmado por el servidor",
    "pendingCredit": "Esperando el abono oficial de Servidor de WF/Firebase...",
    "syncAgain": "REINTENTAR SINCRONIZACIÓN",
    "readyQuestion": "¿LISTO PARA CORRER?",
    "imReady": "ESTOY LISTO",
    "waitingDriver": "ESPERANDO AL OTRO PILOTO...",
    "schemaMissing": "⚠️ ESTADO ALPHA 12 NO RECIBIDO DE Servidor de WF",
    "jump": "SALTAR",
    "vacuum": "REBUFO",
    "awsSpeed": "VEL. Servidor de WF",
    "brake": "FRENO",
    "accelerate": "ACELERA",
    "sameRound": "Informe de carrera ya guardado. Esperando la próxima carrera...",
    "confirming": "Confirmando objetos y resultado con Servidor de WF...",
    "receiptMissing": "Servidor de WF aún no ha confirmado el recibo en Firestore. Reintenta la sincronización.",
    "roundRestart": "La sala se reinició antes del resultado oficial. Inténtalo de nuevo.",
    "invalidWallet": "El recibo de Servidor de WF contiene objetos no válidos. Inténtalo de nuevo.",
    "invalidRank": "Clasificación oficial no válida. Inténtalo de nuevo.",
    "checkingCredit": "Verificando recompensa ACREDITADA por Servidor de WF en Firebase...",
    "creditError": "Pago aún no confirmado. Reintenta la sincronización: %{error}",
    "cardDisabled": "Carta aún no habilitada online.",
    "cardAwaitBuild": "Esperando servidor Alpha 15 confirmado.",
    "cardAwaitPlayer": "Esperando los datos del jugador enviados por Servidor de WF.",
    "cardSchemaMissing": "Falta el estado Alpha 12. Verifica el despliegue de Schema y WildRaceRoom en Servidor de WF.",
    "inputNoConfirm": "Sin confirmación de Servidor de WF. Comprueba tu conexión.",
    "connectionLost": "Conexión perdida. Intentando recuperar la sesión con Servidor de WF...",
    "sessionClosed": "Servidor de WF ha cerrado la sala (código %{code}).",
    "commandFailed": "Comando no enviado: %{error}",
    "notTransferred": "No se ha transferido ninguna sesión Alpha 9. Abre primero WildOnlineLab.",
    "inputMissing": "El control de sala no está disponible.",
    "win": "🏆 ¡VICTORIA!",
    "loss": "🏁 DERROTA",
    "draw": "🏁 EMPATE"
    ,
    'disconnectCard': 'Conexión perdida. Espera a la reconexión.',
    'beforeStart': 'Disponible solo después de la salida (fase: %{phase}).',
    'waitCard': 'Esperando la confirmación de Servidor de WF de la carta anterior.',
    'unknownCard': 'Carta desconocida en el catálogo.',
    'cooldown': 'Recarga: %{seconds} segundo(s).',
    'boostCost': 'BOOST insuficiente: %{current}/%{cost} gotas. Servidor de WF recupera 1 gota cada 2s de carrera.',
    'inputError': 'Error al preparar los controles: %{error}',
    'notOnline': 'No hay sesión conectada. Vuelve a la sala online.',
  },
  mapa: {
    finishRace: "FIN DE LA CARRERA",
    computingResults: "CALCULANDO RESULTADO...",
    preparingRewards: "PREPARANDO TUS RECOMPENSAS",
  },
  raceObjectives: {
    title: 'MISIONES DE CARRERA',
    top3: 'TOP 3',
    attacks: '2 ATAQUES',
    overtakes: '3 ADELANTAMIENTOS',
  },
  tutorial: {
    preparingFirstRace: 'PREPARANDO PRIMERA CARRERA...',
  }
};

export default es;