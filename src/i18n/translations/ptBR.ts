const ptBR = {
  language: {
    title: 'Escolha seu idioma',
    subtitle: 'Você poderá alterar o idioma depois nas configurações.',
    setup: 'Configuração do idioma.',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español',
    continue: 'CONTINUAR',
  },
  loading: {
    title: 'CARREGANDO...',
    preloadTimeoutTitle: 'Problema ao carregar',
    preloadTimeoutMessage:
      'Alguns arquivos do jogo demoraram mais que o esperado para carregar. Tente novamente.',
    retry: 'TENTAR NOVAMENTE',
    tips: {
      cardsTiming: 'Use suas cartas no momento certo para virar a corrida!',
      raceStrategy: 'Velocidade não é tudo — uma boa estratégia pode mudar a corrida!',
      preparingRace: 'Aquecendo os motores e embaralhando o deck...',
      tightTurns: 'Cuidado nas rampas! Um bom controle pode fazer toda a diferença.',

      saveYourCards: 'Não gaste todas as cartas cedo demais — o fim da corrida pode reservar surpresas!',
      defendYourself: 'Uma boa defesa no momento certo pode valer tanto quanto um ataque.',
      watchYourRivals: 'Fique de olho nos adversários — o melhor momento para atacar pode surgir a qualquer instante!',
      finalSeconds: 'Nos últimos segundos, qualquer carta pode decidir a corrida!',
      comeback: 'Nunca desista! Uma única jogada pode mudar completamente a sua posição.',
    },
  },
  start: {
    pressToStart: 'PRESSIONE PARA COMEÇAR',
  },
  common: {
    play: 'JOGAR',
    continue: 'CONTINUAR',
    back: 'VOLTAR',
    confirm: 'CONFIRMAR',
    cancel: 'CANCELAR',
    close: 'FECHAR',
    yes: 'SIM',
    no: 'NÃO',
    loading: 'CARREGANDO...',
  },

  settings: {
    title: 'CONFIGURAÇÕES',
    language: 'IDIOMA',
  },

  race: {
    position: 'POSIÇÃO',
    time: 'TEMPO',
    finalStretch: 'RETA FINAL!',
    finished: 'CORRIDA FINALIZADA',
    victory: 'VITÓRIA!',
    slowDown: 'FREAR',
    speedUp: 'ACELERAR',
    pilotagem: 'PILOTAGEM',
    defeat: 'DERROTA',
  },

  result: {
    title: 'RESULTADO DA CORRIDA',
    xpEarned: 'XP GANHO',
    positionBonus: 'Bônus de posição',
    performanceBonus: 'Bônus de desempenho',
    continue: 'CONTINUAR',
  },

  carSelection: {
    title: 'RACE GARAGE',
    subtitle: 'ESCOLHA E PREPARE SUA MÁQUINA',

    pilot: 'PILOTO',
    level: 'NÍVEL',
    trophies: 'TROFÉUS',

    yourGarage: 'SUA GARAGEM',

    carsCount: {
      one: '%{count} CARRO',
      other: '%{count} CARROS',
    },

    ready: 'PRONTO',
    unavailable: 'INDISPONÍVEL',

    newCar: 'NOVO CARRO',
    openStore: 'ABRIR LOJA',

    emptyGarage: 'GARAGEM VAZIA',
    emptyGarageMessage:
      'VISITE A LOJA PARA COMPRAR SEU PRIMEIRO CARRO',

    primaryColor: 'COR PRINCIPAL',
    secondaryColor: 'COR SECUNDÁRIA',

    equippedVehicle: 'VEÍCULO EQUIPADO',
    noVehicle: 'SEM VEÍCULO',

    category: 'CATEGORIA',
    status: 'ESTADO',

    installedUpgrades: 'UPGRADES INSTALADOS',

    speed: 'VELOCIDADE',
    acceleration: 'ACELERAÇÃO',
    jumpPower: 'FORÇA DO PULO',
    defense: 'DEFESA',

    garageStock: 'ESTOQUE DA GARAGEM',

    engine: 'MOTOR',
    spray: 'SPRAY',
    parts: 'PEÇAS',

    workshop: 'OFICINA',

    equipAndContinue: 'EQUIPAR E CONTINUAR',
    buyCar: 'COMPRAR UM CARRO',

    emptyGarageAlertTitle: 'Garagem vazia',
    emptyGarageAlertMessage:
      'Compre um veículo na loja antes de continuar para a corrida.',

    carNotPurchasedAlertTitle: 'Carro não comprado',
    carNotPurchasedAlertMessage:
      'Compre o veículo antes de abrir a oficina.',

    equippedPaint: "PINTURA EQUIPADA",
    personalizePaint: "Personalize na oficina",
  },

  carStore: {
    title: 'WILD GARAGE',
    subtitle: 'STREET MARKET / ESCOLHA SUA MÁQUINA',

    level: 'NÍVEL',
    levelShort: 'NV.',
    gears: 'ENGRENAGENS',

    garage: 'GARAGEM',
    locked: 'BLOQUEADO',
    purchased: 'COMPRADO',
    available: 'DISPONÍVEL',

    accessLocked: 'ACESSO BLOQUEADO',
    requiresLevel: 'REQUER NÍVEL %{level}',

    primaryColor: 'COR PRINCIPAL',
    secondaryColor: 'COR SECUNDÁRIA',

    requirement: 'REQUISITO',
    price: 'VALOR',
    inGarage: 'NA GARAGEM',

    factoryPerformance: 'PERFORMANCE DE FÁBRICA',
    speed: 'VELOCIDADE',
    acceleration: 'ACELERAÇÃO',
    potential: 'POTENCIAL',

    upgrades: 'UPGRADES',
    engine: 'MOTOR',
    launch: 'ARRANCADA',
    defense: 'DEFESA',

    workshop: 'OFICINA',

    equipAndContinue: 'EQUIPAR E CONTINUAR',
    buy: 'COMPRAR',
    missing: 'FALTAM',
    lockedLevel: 'BLOQUEADO • NÍVEL %{level}',

    profileUnavailableTitle: 'Perfil indisponível',
    profileUnavailableMessage:
      'Crie ou carregue seu perfil antes de comprar.',

    vehicleLockedTitle: 'Veículo bloqueado',
    vehicleLockedMessage:
      'Alcance o nível %{level} para liberar o %{car}.',

    insufficientGearsTitle: 'Engrenagens insuficientes',
    insufficientGearsMessage:
      'Ainda faltam %{count} engrenagens para comprar o %{car}.',

    buyConfirmTitle: 'Comprar %{car}?',
    buyConfirmMessage:
      '%{price} engrenagens serão retiradas do seu saldo.',

    cancel: 'CANCELAR',

    purchaseFailedTitle: 'Compra não concluída',
    purchaseFailedMessage:
      'Verifique seu nível, seu saldo ou se o carro já está na garagem.',

    purchaseSuccessTitle: 'NOVO CARRO NA GARAGEM!',
    purchaseSuccessMessage:
      '%{car} foi comprado com sucesso.',

    carNotPurchasedTitle: 'Carro não comprado',
    carNotPurchasedMessage:
      'Compre o veículo antes de abrir a oficina.',

    carDescriptions: {
      buggy:
        'O primeiro carro da garagem: leve, simples e pronto para correr.',

      kombi:
        'Resistente, carismática e com presença forte nas ruas.',

      uno:
        'Leve e rápido nas retomadas. Um ótimo primeiro upgrade.',

      fusca:
        'Um clássico equilibrado, confiável e fácil de controlar.',

      astor:
        'Entrega velocidade alta e mantém boa aceleração.',

      ferrari:
        'Velocidade máxima para quem chegou ao topo da competição.',

      monster:
        'Aceleração brutal e visual dominante para o endgame.',

      lamborghini:
        'Poder de aceleração e design icônico para os mais exigentes.',

      caravana:
        'Espaço e conforto para a jornada com amigos.',
    },
  },

  deckSelection: {
    title: 'MONTE O SEU DECK',
    subtitle: 'Escolha quatro cartas e combine ataque com sobrevivência.',

    cards: 'CARTAS',

    availableCards: 'CARTAS DISPONÍVEIS',
    availableHint: 'Toque em uma carta para adicioná-la.',

    noOwnedCards: 'Você ainda não desbloqueou cartas dessa categoria.',

    categories: {
      attack: 'ATAQUE',
      defense: 'DEFESA',
    },

    yourDeck: 'SEU DECK',
    removeHint: 'Toque para remover.',

    emptySlot: 'SLOT VAZIO',

    race: 'CORRER!',
    chooseMore: 'ESCOLHA MAIS %{count}',

    fullDeckTitle: 'Deck cheio!',
    fullDeckMessage:
      'Só é permitido selecionar %{count} cartas para a partida.',

    incompleteDeckTitle: 'Deck incompleto!',
    incompleteDeckMessage:
      'É preciso selecionar %{count} cartas para a partida.',

    cardDescriptions: {
      chains: 'Puxa um adversário e reduz sua vantagem.',
      tnt: 'Deixa uma caixa explosiva na pista.',
      swap: 'Troca sua posição com outro corredor.',
      slow_slow:
        'Reduz temporariamente a velocidade dos rivais.',
      blind: 'Prejudica a visão do adversário.',
      bullet: 'Dispara um míssil guiado contra um rival.',
      tornado:
        'Lança um tornado contra os oponentes à frente.',
      bubble_lift:
        'Suspende o adversário e interrompe sua corrida.',

      nitro_power:
        'Aceleração de emergência para escapar de ameaças.',
      shield:
        'Bloqueia completamente o próximo ataque.',
      armor:
        'Absorve dois ataques sem perder vidas.',
      quick_repair:
        'Recupera até duas vidas do carro.',
      ghost:
        'Concede imunidade temporária contra ataques.',
      second_chance:
        'Evita uma eliminação e devolve uma vida.',

      oil_spit: 'Derrame óleo na pista para fazer adversários derraparem e perderem velocidade temporariamente.',
    },
  },

  mapSelection: {
    title: 'STREET CIRCUITS',
    subtitle: 'ESCOLHA O PRÓXIMO DESTINO',

    pilot: 'PILOTO',
    level: 'NÍVEL',
    levelShort: 'NV.',
    trophies: 'TROFÉUS',

    track: 'PISTA',

    circuit: 'WILD RUNNERS CIRCUIT',

    lockedTrack: 'PISTA BLOQUEADA',
    requiresLevel: 'REQUER NÍVEL %{level}',

    status: 'STATUS',
    requirement: 'REQUISITO',

    unlocked: 'LIBERADA',
    locked: 'BLOQUEADA',

    selectedTrack: 'PISTA SELECIONADA',
    noTrack: 'SEM PISTA',

    raceOnTrack: 'CORRER NESTA PISTA',
    lockedButton: 'BLOQUEADA • NV. %{level}',
  },

  workshop: {
    title: 'WILD WORKSHOP',
    subtitle: 'PERFORMANCE LAB / EVOLUA SUA MÁQUINA',

    level: 'NÍVEL',
    levelShort: 'NV.',
    maxLevel: 'NÍVEL MÁXIMO %{level}',

    engine: 'MOTOR',
    parts: 'PEÇAS',
    spray: 'SPRAY',

    vehicleInMaintenance: 'VEÍCULO EM MANUTENÇÃO',
    category: 'CATEGORIA',
    status: 'STATUS',
    rarity: 'RARIDADE',
    onBench: 'NA BANCADA',

    installedConfiguration: 'CONFIGURAÇÃO INSTALADA',

    speed: 'VELOCIDADE',
    acceleration: 'ACELERAÇÃO',
    jumpPower: 'FORÇA DO PULO',
    defense: 'DEFESA',

    technicalBench: 'BANCADA TÉCNICA',
    upgrades: 'UPGRADES',
    online: 'ONLINE',

    upgradesDescription:
      'Instale melhorias permanentes usando as peças coletadas nas corridas.',

    nextLevelCost: 'CUSTO DO PRÓXIMO NÍVEL',
    balance: 'SALDO',
    upgradeComplete: 'UPGRADE COMPLETO',

    install: 'INSTALAR',
    maximum: 'MÁXIMO',
    noParts: 'SEM PEÇAS',

    insufficientResourcesTitle: 'RECURSOS INSUFICIENTES',
    insufficientResourcesMessage:
      'Você precisa de %{cost} %{resource} para este upgrade.',

    resources: {
      engineParts: 'peças de motor',
      gears: 'engrenagens',
      sprays: 'sprays',
    },

    upgradeItems: {
      maxSpeed: {
        title: 'Velocidade Máxima',
        subtitle: 'Aumenta a velocidade final do veículo',
      },

      acceleration: {
        title: 'Aceleração',
        subtitle: 'Melhora a resposta e retomada de velocidade',
      },

      jumpPower: {
        title: 'Força do Pulo',
        subtitle: 'Aumenta a potência dos saltos',
      },

      defense: {
        title: 'Defesa / Resistência',
        subtitle: 'Fortalece o veículo contra ataques',
      },

      rarity: {
        title: 'Estética e Raridade',
        subtitle: 'Eleva o nível visual e a raridade do carro',
      },
    },

    carNotFound: {
      eyebrow: 'WILD WORKSHOP',
      title: 'CARRO NÃO ENCONTRADO',
      message:
        'Selecione um veículo da sua garagem antes de abrir a oficina.',
    },
    paint: 'PINTURA',

    visualStudio: 'ESTÚDIO VISUAL',
    customization: 'PERSONALIZAÇÃO',
    back: 'VOLTAR',

    customizationDescription:
      'Escolha pintura, acabamento e componentes. O carro à esquerda mostra a prévia em tempo real.',

    customize: 'PERSONALIZAR',
    customizeDescription: 'Pintura, acabamento e componentes visuais',

    primaryColor: 'COR PRIMÁRIA',
    secondaryColor: 'COR SECUNDÁRIA',
    finish: 'ACABAMENTO',

    apply: 'APLICAR',

    original: 'ORIGINAL',
    equipFree: 'EQUIPAR GRÁTIS',
    equipped: 'EQUIPADO',
    owned: 'COMPRADO',
    equip: 'EQUIPAR',
    buy: 'COMPRAR',

    availableFromLevel: 'Disponível a partir do nível %{level}.',

    paintLockedTitle: 'PINTURA BLOQUEADA',
    partLockedTitle: 'PEÇA BLOQUEADA',

    insufficientSprayTitle: 'SPRAY INSUFICIENTE',
    insufficientSprayMessage: 'Você precisa de 🎨 %{price}.',

    applyPaintErrorTitle: 'NÃO FOI POSSÍVEL APLICAR',
    applyPaintErrorMessage: 'Confira o veículo e tente novamente.',

    equipErrorTitle: 'NÃO FOI POSSÍVEL EQUIPAR',
    equipErrorMessage: 'Tente novamente.',
  },
  raceResult: {
    surpriseChest: '🎁 SURPRESA! ABRIR BAÚ',
    raceCompleted: 'CORRIDA CONCLUÍDA',

    winner: 'VENCEDOR!',
    positionPlace: '%{position}º LUGAR',

    newRecord: '✨ NOVO RECORDE!',

    rewards: 'RECOMPENSAS',

    gears: 'ENGRENAGENS',
    trophies: 'TROFÉUS',
    engine: 'MOTOR',
    spray: 'SPRAY',

    raceXp: '⭐ XP DA CORRIDA',
    level: 'NÍVEL',
    levelUp: '✨ SUBIU DE NÍVEL! NÍVEL %{level}',

    xpBonus: {
      position: '🏁 POSIÇÃO',
      perfectStart: '⚡ LARGADA',
      attacks: '🎯 ATAQUES',
      defenses: '🛡️ DEFESAS',
      flawless: '❤️ INTACTO',
      comeback: '🔥 COMEBACK',
      survived: '🏁 SOBREVIVEU',
    },

    newUnlock: '🔓 NOVO DESBLOQUEIO',

    unlockTypes: {
      card: 'CARTA',
      car: 'CARRO',
      map: 'PISTA',
    },

    raceAgain: 'CORRER NOVAMENTE',
    continue: 'CONTINUAR →',

    noResult: 'Nenhum resultado disponível',
    continueSimple: 'CONTINUAR',
    nextTarget: 'PRÓXIMO ALVO',
    xpRemaining: 'FALTAM %{xp} XP',
    targetLevel: 'NÍVEL %{level}',
  },
  registration: {
    heroEyebrow: 'WILD RUNNERS // ID DO PILOTO',
    heroTitle: 'ENTRE NO GRID.',
    heroText:
      'Escolha o nome que os outros pilotos verão nas ruas e vincule um e-mail ao seu perfil.',
    localProfile: 'PERFIL LOCAL // MVP',

    newDriver: 'NOVO PILOTO',
    createIdentity: 'CRIE SUA IDENTIDADE',

    usernameLabel: 'NOME DE PILOTO',
    usernamePlaceholder: 'seu_nome',
    usernameError:
      'Use 3–12 caracteres: letras, números, _ ou -.',
    usernameHint:
      'Esse será seu nome dentro das corridas.',

    emailLabel: 'E-MAIL',
    emailPlaceholder: 'voce@email.com',
    validated: 'VALIDADO',
    account: 'CONTA',
    emailError:
      'Digite um endereço de e-mail válido.',
    emailHint:
      'No MVP ele fica salvo localmente. Depois será migrado para sua conta no servidor.',

    messageTitle: 'NOVO PILOTO',
    messageStart: 'Vamos criar uma conta WF ID e um save novo para este piloto.',
    messageEnd: 'Se você já possui uma conta com este mesmo e- mail, use ENTRAR para carregar o save existente.',
    confirmation: 'CONTINUAR',
    cancelation: 'CANCELAR',
    already: 'JÁ TENHO CONTA',

    driverReady: 'PILOTO PRONTO',
    startAdventure: 'COMEÇAR AVENTURA',

    localNote:
      'Seus dados e progresso permanecem neste dispositivo durante o MVP.',
  },
  errors: {
    emailAlreadyInUse:
      'Este e-mail já está vinculado a um WF ID. Tente entrar em vez de criar uma nova conta.',
    invalidEmail:
      'Digite um endereço de e-mail válido.',
    weakPassword:
      'Sua senha é muito fraca. Use pelo menos 6 caracteres.',
    invalidCredential:
      'E-mail ou senha incorretos. Confira seus dados e tente novamente.',
    wrongPassword:
      'Senha incorreta. Confira sua senha e tente novamente.',
    userNotFound:
      'Não encontramos uma conta com este e-mail.',
    userDisabled:
      'Esta conta foi desativada. Entre em contato com o suporte.',
    tooManyRequests:
      'Muitas tentativas foram feitas em pouco tempo. Aguarde um momento e tente novamente.',
    networkRequestFailed:
      'Não foi possível conectar ao servidor da WF. Verifique sua conexão com a internet e tente novamente.',
    operationNotAllowed:
      'Este método de login não está disponível no momento.',
    accountExistsWithDifferentCredential:
      'Já existe uma conta com este e-mail usando outro método de login.',
    credentialAlreadyInUse:
      'Esta credencial já está vinculada a outra conta.',
    requiresRecentLogin:
      'Por segurança, entre novamente na sua conta para continuar.',
    generic:
      'Não foi possível concluir a autenticação. Tente novamente.',
  },
  auth: {
    errorTitle: 'NÃO FOI POSSÍVEL CONTINUAR',

    errors: {
      emailAlreadyInUse:
        'Este e-mail já está vinculado a um WF ID. Tente entrar em vez de criar uma nova conta.',
      invalidEmail:
        'Digite um endereço de e-mail válido.',
      weakPassword:
        'Sua senha é muito fraca. Use pelo menos 6 caracteres.',
      invalidCredential:
        'E-mail ou senha incorretos. Confira seus dados e tente novamente.',
      wrongPassword:
        'Senha incorreta. Confira sua senha e tente novamente.',
      userNotFound:
        'Não encontramos uma conta WF ID com este e-mail.',
      userDisabled:
        'Esta conta foi desativada. Entre em contato com o suporte.',
      tooManyRequests:
        'Muitas tentativas foram feitas em pouco tempo. Aguarde um momento e tente novamente.',
      networkRequestFailed:
        'Não foi possível conectar ao servidor da WF. Verifique sua conexão com a internet e tente novamente.',
      operationNotAllowed:
        'Este método de login não está disponível no momento.',
      accountExistsWithDifferentCredential:
        'Já existe uma WF ID com este e-mail usando outro método de login.',
      credentialAlreadyInUse:
        'Esta credencial já está vinculada a outra conta.',
      requiresRecentLogin:
        'Por segurança, entre novamente na sua conta para continuar.',
      generic:
        'Não foi possível concluir a autenticação. Tente novamente.',
    },
  },
  chest: {
    "event": "WILD RUNNERS · EVENTO SURPRESA",
    "win": "PRÊMIO CONQUISTADO!",
    "choose": "SURPRESA! ESCOLHA SEU BAÚ",
    "secured": "SUA RECOMPENSA ESTÁ GARANTIDA",
    "prepare": "PREPARE-SE PARA A REVELAÇÃO",
    "secret": "UM DELES ESCONDE UM PRÊMIO ESPECIAL",
    "preview": "🧪 PRÉVIA LOCAL · SEM CRÉDITOS NO FIREBASE",
    "loading": "PREPARANDO A SURPRESA...",
    "unavailable": "NENHUM EVENTO SURPRESA NESTA CORRIDA.",
    "retry": "TENTAR NOVAMENTE",
    "continue": "CONTINUAR",
    "chestNumber": "BAÚ 0%{number}",
    "tap": "TOQUE PARA ABRIR",
    "common": "COMUM",
    "rare": "RARO",
    "epic": "ÉPICO",
    "legendary": "LENDÁRIO",
    "newCard": "NOVA CARTA",
    "newCar": "NOVO CARRO",
    "newEquipment": "NOVO COMPONENTE",
    "jackpot": "JACKPOT DE RECURSOS",
    "resources": "RECURSOS RECEBIDOS",
    "cardDetail": "Adicionada ao seu inventário de cartas",
    "carDetail": "Disponível na sua garagem",
    "equipmentDetail": "Disponível para equipar na Oficina",
    "resourceDetail": "Adicionado à sua carteira de recursos",
    "motor": "PEÇAS DE MOTOR",
    "spray": "SPRAY",
    "engrenagem": "ENGRENAGENS",
    "chips": "CHIPs",
    "demo": "Prêmio demonstrativo · não creditado",
    "chooseHint": "Escolha com carinho: apenas um baú pode ser aberto.",
    "confirming": "CONFIRMANDO SEU PRÊMIO...",
    "opening": "O BAÚ ESTÁ SE ABRINDO",
    "revealing": "REVELANDO SUA RECOMPENSA",
    "focus": "SEU PRÊMIO É O DESTAQUE",
    "deferred": "Prêmio salvo no Firebase. O inventário será atualizado na próxima sincronização.",
    "testAnother": "↻ TESTAR OUTRO PRÊMIO",
    "exitPreview": "SAIR DA PRÉVIA",
    "back": "VOLTAR",
    "loadError": "Falha ao carregar os baús.",
    "openError": "Erro ao abrir o baú. Tente novamente.",
    "raceMissing": "Identificador da corrida não encontrado.",
    "notConfirmed": "O prêmio não pôde ser confirmado.",
    "openA11y": "Abrir baú %{number}"
  },
  onlineLab: {
    "phase": {
      "waiting": "AGUARDANDO READY",
      "countdown": "LARGADA",
      "racing": "CORRIDA EM ANDAMENTO",
      "paused": "PAUSADA — RECONEXÃO",
      "finished": "CORRIDA FINALIZADA"
    },
    "disconnected": "DESCONECTADO",
    "connected": "CONECTADO",
    "reconnecting": "RECONECTANDO...",
    "introDetail": "Crie uma sala ou entre com o código de outro dispositivo.",
    "inputMissing": "A sala não disponibilizou defineInput().",
    "inputFailure": "Falha ao preparar input: %{error}",
    "joinedDetail": "Sala conectada. Agora aguarde o segundo jogador e pressione READY.",
    "lostDetail": "Conexão perdida. O servidor reserva a vaga por até 10 segundos.",
    "recovered": "Sessão recuperada.",
    "closedCode": "Conexão encerrada (%{code}).",
    "noCar": "Nenhum carro válido selecionado. Volte a CAR SELECTION e escolha um veículo antes de correr online.",
    "invalidDeck": "Deck inválido. Volte à DECK SELECTION.",
    "existingSession": "Já existe uma sessão no mapa online. Retome ou encerre antes de criar outra.",
    "roomCodeMissing": "Digite o código da sala antes de entrar.",
    "connecting": "Validando conta Firebase e conectando ao Servidor da WF...",
    "transferUnavailable": "A sala anterior não está mais disponível. Entre em outra sala.",
    "readyError": "Não foi possível marcar READY para a revanche: %{error}",
    "waitingReconnect": "A sala está em reconexão. Aguarde recuperar a conexão antes de pedir revanche.",
    "transferEnded": "Sessão transferida encerrada. Pode criar outra sala.",
    "leftRoom": "Você saiu da sala.",
    "commandError": "Comando não enviado: %{error}",
    "shareText": "🏎️ Bora correr no Wild Runners!\nEntre em uma sala privada com o código: %{code}\nAbra o Wild Online e escolha ENTRAR EM SALA.",
    "shareError": "Não foi possível abrir o compartilhamento: %{error}",
    "deckExactly": "Escolha exatamente quatro cartas em DECK SELECTION.",
    "deckDifferent": "Seu deck precisa ter quatro cartas diferentes.",
    "deckUnsupported": "Carta não habilitada neste Alpha: %{cards}. Volte à DECK SELECTION.",
    "deckUnavailable": "Inventário de cartas indisponível. Aguarde a sincronização do seu perfil.",
    "deckNotOwned": "Cartas não encontradas no inventário: %{cards}. Confira a compra/sincronização.",
    "rotate": "GIRE PARA JOGAR",
    "rotateInfo": "O lobby do Wild Online foi projetado para a tela horizontal.",
    "back": "VOLTAR",
    "subtitle": "SALA MULTIPLAYER / ALPHA 17",
    "nextRace": "PRÓXIMA CORRIDA · MESMA SALA",
    "sessionOngoing": "SESSÃO EM ANDAMENTO",
    "againQuestion": "Pronto para correr de novo?",
    "stillActive": "Sua corrida continua ativa",
    "sameRoomInfo": "Sua sala continua aberta. Pressione READY PARA REVANCHE: ao Servidor da WF aguardará os dois pilotos.",
    "resumeInfo": "Retome a mesma conexão sem criar um jogador duplicado no Servidor da WF.",
    "readyRematch": "READY PARA REVANCHE",
    "resumeRace": "RETOMAR CORRIDA",
    "endSession": "ENCERRAR SESSÃO",
    "chooseRoom": "ESCOLHA SUA SALA",
    "private2": "2 PILOTOS · PRIVADA",
    "createRoom": "CRIAR SALA",
    "joinCode": "ENTRAR COM CÓDIGO",
    "createInfoTitle": "Crie uma sala só de vocês.",
    "createInfo": "Compartilhe o código com um amigo e espere os dois pilotos ficarem prontos.",
    "inviteCode": "CÓDIGO DO CONVITE",
    "joinRoom": "ENTRAR NA SALA",
    "createPrivate": "CRIAR SALA PRIVADA",
    "previewOffline": "PRÉVIA OFFLINE",
    "demoNoAws": "MODO DEMONSTRAÇÃO · SEM Servidor da WF",
    "privateInvite": "SALA PRIVADA / CONVITE",
    "share": "COMPARTILHAR",
    "you": "VOCÊ",
    "noCarShort": "SEM CARRO",
    "waiting": "AGUARDANDO",
    "demoRival": "RIVAL DEMO",
    "rival": "RIVAL",
    "freeSlot": "VAGA LIVRE",
    "awaitingDriver": "AGUARDANDO PILOTO",
    "inRoom": "NA SALA",
    "free": "LIVRE",
    "waitingRival": "AGUARDANDO RIVAL",
    "win": "VITÓRIA",
    "lose": "DERROTA",
    "draw": "EMPATE",
    "ready": "PRONTO",
    "hideRival": "OCULTAR RIVAL",
    "simulateRival": "SIMULAR RIVAL",
    "exitPreview": "SAIR DA PRÉVIA",
    "rematch": "REVANCHE",
    "imReady": "ESTOU PRONTO!",
    "openTrack": "ABRIR PISTA",
    "leave": "SAIR",
    "localPreviewInfo": "Prévia local: nenhum jogador conectado ao Servidor da WF.",
    "testChests": "TESTAR BAÚS",
    "telemetry": "TELEMETRIA",
    "yourVehicle": "SEU VEÍCULO",
    "garage": "GARAGEM",
    "noSelection": "SEM SELEÇÃO",
    "selectCar": "SELECIONE UM CARRO",
    "activeVehicle": "CAR SELECTION · VEÍCULO ATIVO",
    "awsSpeed": "VELOCIDADE de conexão com o Servidor da WF",
    "estimatedSpeed": "VELOCIDADE PREVISTA",
    "engineSpeed": "MOTOR · VELOCIDADE",
    "levelAbbr": "NV.",
    "garageStats": "✓ Servidor da WF / Firestore: Acel. NV.%{accel} · Salto NV.%{jump} · Defesa NV.%{defense} · %{lives} vidas",
    "localProfileInfo": "Prévia do perfil local. Ao entrar na sala, ao Servidor da WF verificará a Oficina no Firestore.",
    "yourDeck": "SEU DECK",
    "bound": "VINCULADAS",
    "slot": "SLOT 0%{number}",
    "deckInfo": "Deck salvo em DECK SELECTION. O Servidor da WF valida custos e recargas; a posse no Firestore será verificada antes da produção.",
    "footer": "LOBBY PRIVADO • 2 JOGADORES • ALPHA 17",
    "onlineRoom": "SALA ONLINE / Servidor da WF",
    "labTools": "FERRAMENTAS DE LABORATÓRIO",
    "close": "FECHAR",
    "officialPositions": "POSIÇÕES OFICIAIS",
    "connectedShort": "CONECTADO",
    "reconnection": "RECONEXÃO",
    "max": "MAX",
    "testCommands": "COMANDOS DE TESTE · 30 HZ",
    "brake": "FREAR",
    "accelerate": "ACELERAR",
    "awsAuthority": "A Servidor da WF continua responsável pela física, posição, nitro e resultado.",
    "session": "SESSÃO"
    ,
    'firebaseAuthMissing': 'Sessão Firebase não encontrada. Faça login novamente antes de correr online.',
    'garageNotOwned': 'O carro selecionado não está na garagem confirmada no Firestore.',
    'cloudSaveMissing': 'Seu save não foi encontrado no Firebase. Sincronize o perfil antes de entrar.',
    'invalidGarage': 'Os níveis da Oficina salvos no Firebase são inválidos.',
    'garageMismatch': 'O save remoto não pertence à conta Firebase conectada.',
    'loginRequired': 'Autenticação Firebase necessária. Faça login novamente.',
    'connectionError': 'Erro de conexão: %{error}',
    'serverError': 'Servidor %{code}: %{message}'
  },
  onlineMap: {
    "phase": {
      "waiting": "AGUARDANDO JOGADORES",
      "countdown": "LARGADA",
      "racing": "CORRIDA ONLINE",
      "paused": "PAUSADA PELA Servidor da WF",
      "finished": "CORRIDA FINALIZADA"
    },
    "you": "VOCÊ",
    "rival": "RIVAL",
    "receivingRacers": "Recebendo corredores...",
    "noSession": "SEM SESSÃO",
    "reconnecting": "RECONECTANDO",
    "raceChips": "CHIPs da corrida",
    "unconfirmed": "NÃO CONFIRMADA",
    "leave": "SAIR",
    "unknownCar": "CARRO NÃO RECONHECIDO",
    "noId": "SEM ID",
    "inAir": "NO AR",
    "preparing": "PREPARANDO...",
    "go": "JÁ!",
    "waitingReconnect": "AGUARDANDO RECONEXÃO",
    "noLocalMovement": "Nenhum movimento local é calculado.",
    "confirmedResult": "Resultado confirmado pelo servidor",
    "pendingCredit": "Aguardando crédito oficial Servidor da WF/Firebase...",
    "syncAgain": "REPETIR SINCRONIZAÇÃO",
    "readyQuestion": "PRONTO PARA CORRER?",
    "imReady": "ESTOU PRONTO · READY",
    "waitingDriver": "AGUARDANDO O OUTRO PILOTO...",
    "schemaMissing": "⚠️ STATE ALPHA 12 NÃO RECEBIDO DO Servidor da WF",
    "jump": "PULAR",
    "vacuum": "VÁCUO",
    "awsSpeed": "VEL. Servidor da WF",
    "brake": "FREIO",
    "accelerate": "ACELERA",
    "sameRound": "Relatório desta rodada já salvo. Aguardando a próxima corrida...",
    "confirming": "Confirmando itens e resultado com o Servidor da WF...",
    "receiptMissing": "O Servidor da WF ainda não confirmou o recibo no Firestore. Tente sincronizar novamente.",
    "roundRestart": "A sala reiniciou antes do resultado oficial. Tente novamente.",
    "invalidWallet": "Recibo do Servidor da WF com itens inválidos. Tente novamente.",
    "invalidRank": "Classificação oficial inválida. Tente novamente.",
    "checkingCredit": "Conferindo recompensa CREDITADA pelo Servidor da WF no Firebase...",
    "creditError": "Pagamento ainda não confirmado. Tente sincronizar novamente: %{error}",
    "cardDisabled": "Carta ainda não habilitada online.",
    "cardAwaitBuild": "Aguardando servidor Alpha 15 confirmado.",
    "cardAwaitPlayer": "Aguardando dados do jogador enviados pelo Servidor da WF.",
    "cardSchemaMissing": "Estado Alpha 12 ausente. Confirme o deploy do Schema e WildRaceRoom no Servidor da WF.",
    "inputNoConfirm": "Sem confirmação do Servidor da WF. Verifique sua conexão.",
    "connectionLost": "Conexão interrompida. Tentando recuperar a sessão com o Servidor da WF...",
    "sessionClosed": "Sala encerrada pelo Servidor da WF (código %{code}).",
    "commandFailed": "Comando não enviado: %{error}",
    "notTransferred": "Nenhuma sessão Alpha 9 foi transferida. Entre no WildOnlineLab primeiro.",
    "inputMissing": "defineInput() não está disponível na sala.",
    "win": "🏆 VITÓRIA!",
    "loss": "🏁 DERROTA",
    "draw": "🏁 EMPATE"
    ,
    'disconnectCard': 'Conexão interrompida. Aguarde a reconexão.',
    'beforeStart': 'Disponível somente depois da largada (fase: %{phase}).',
    'waitCard': 'Aguardando confirmação da carta anterior pelo Servidor da WF.',
    'unknownCard': 'Carta desconhecida pelo catálogo.',
    'cooldown': 'Recarga: %{seconds} segundo(s).',
    'boostCost': 'BOOST insuficiente: %{current}/%{cost} gotas. O Servidor da WF recupera 1 gota a cada 2s de corrida.',
    'inputError': 'Erro ao preparar a pilotagem: %{error}',
    'notOnline': 'Sem sessão conectada. Volte à sala online.',
  },
  mapa: {
    finishRace: "FIM DE CORRIDA",
    computingResults: "CALCULANDO RESULTADO...",
    preparingRewards: "PREPARANDO SUAS RECOMPENSAS",
  },
  raceObjectives: {
    title: 'MISSÕES DA CORRIDA',
    top3: 'TOP 3',
    attacks: '2 ATAQUES',
    overtakes: '3 ULTRAPASSAGENS',
  },
  tutorial: {
    preparingFirstRace: 'PREPARANDO PRIMEIRA CORRIDA...',
  }
};

export default ptBR;