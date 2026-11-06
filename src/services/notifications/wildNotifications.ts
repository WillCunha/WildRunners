/**
 * Wild Runners — notificações locais de retorno + base para push remoto.
 *
 * - Lembretes locais funcionam sem AWS e sem ExpoPushToken.
 * - O sistema operacional pede permissão uma vez na primeira entrada da garagem.
 * - Uma recusa é respeitada; sem botões de ativar/desativar na garagem.
 * - O token remoto NÃO é enviado ao backend neste arquivo: registrar por UID
 *   numa rota autenticada da AWS é um passo separado.
 * - Ao reabrir a garagem, os lembretes antigos são cancelados/reagendados.
 * - Nunca cancela notificações de outros recursos do jogo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Novo canal: a importância de um canal Android já existente não pode ser
// aumentada pelo aplicativo após sua primeira criação.
export const WILD_PUSH_CHANNEL_ID = 'wild-runners-updates-v2';
// Mantém a preferência antiga apenas para respeitar quem já desativou avisos.
const WILD_RETURN_PREFERENCE_KEY = 'wild-runners:return-notifications:opt-in:v1';
const WILD_PERMISSION_ASKED_KEY = 'wild-runners:notification-permission-asked:v1';
const WILD_RETURN_MARKER = 'wild-return-v1';
const REMINDER_HOUR = 19; // horário local do aparelho, sem avisos de madrugada

export type WildNotificationLanguage = 'pt' | 'es' | 'en';
export type WildReturnCategory = 'offline' | 'online' | 'garage' | 'deck';
export type WildNotificationMessage = { title: string; body: string };

/** Catálogo para lembretes locais e, no futuro, campanhas selecionadas da AWS. */
export const WILD_RETURN_MESSAGES: Record<
  WildNotificationLanguage,
  Record<WildReturnCategory, readonly WildNotificationMessage[]>
> = {
  pt: {
    offline: [
      { title: '🏁 A pista sentiu sua falta!', body: 'Que tal uma corrida offline para aquecer os motores?' },
      { title: '⚡ Três minutinhos de adrenalina?', body: 'Entre no modo offline e mostre suas melhores ultrapassagens.' },
      { title: '🚗 Seu carro quer sair da garagem!', body: 'A pista offline está pronta quando você estiver.' },
      { title: '💨 A próxima ultrapassagem é sua', body: 'Treine suas cartas numa corrida offline e volte com tudo.' },
    ],
    online: [
      { title: '🔥 Topa um desafio online?', body: 'Monte seu deck e enfrente outros pilotos no Wild Runners.' },
      { title: '🏆 Bora disputar troféus?', body: 'Entre no modo online e coloque sua estratégia à prova.' },
      { title: '⚔️ Hora de testar seu deck', body: 'Uma corrida online pode mudar com a carta certa!' },
      { title: '🎮 Partiu correr com a galera?', body: 'Convide outro piloto para uma disputa online.' },
    ],
    garage: [
      { title: '🔧 Sua garagem tem planos!', body: 'Um upgrade no motor pode mudar sua próxima corrida.' },
      { title: '🎨 Que tal um novo visual?', body: 'Passe na oficina e personalize seu carro antes da largada.' },
      { title: '🚗 Tá faltando barulho de motor', body: 'Seu próximo desafio começa na garagem do Wild Runners.' },
      { title: '⚙️ Já conferiu suas peças?', body: 'Veja se você consegue melhorar seu carro antes de correr.' },
    ],
    deck: [
      { title: '🃏 Uma carta muda tudo!', body: 'Reveja seu deck e prepare uma estratégia surpresa.' },
      { title: '🌪️ Preparado para virar o jogo?', body: 'Escolha suas cartas e entre em uma nova corrida.' },
      { title: '🛡️ Ataque ou defesa?', body: 'Seu próximo deck pode fazer toda a diferença na pista.' },
      { title: '🚀 Nitro ou estratégia?', body: 'Ajuste seu deck para a próxima disputa.' },
    ],
  },
  es: {
    offline: [
      { title: '🏁 ¡La pista te echa de menos!', body: '¿Qué tal una carrera sin conexión para calentar motores?' },
      { title: '⚡ ¿Tres minutos de adrenalina?', body: 'Entra en el modo sin conexión y demuestra tus adelantamientos.' },
      { title: '🚗 ¡Tu coche quiere salir!', body: 'La pista sin conexión te espera cuando quieras.' },
      { title: '💨 El próximo adelantamiento es tuyo', body: 'Practica tus cartas en una carrera sin conexión.' },
    ],
    online: [
      { title: '🔥 ¿Aceptas un desafío online?', body: 'Prepara tu mazo y enfréntate a otros pilotos.' },
      { title: '🏆 ¿Vamos a por los trofeos?', body: 'Entra en el modo online y pon a prueba tu estrategia.' },
      { title: '⚔️ Es hora de probar tu mazo', body: '¡Una carta puede cambiar una carrera online!' },
      { title: '🎮 ¿Una carrera con amigos?', body: 'Invita a otro piloto a competir online.' },
    ],
    garage: [
      { title: '🔧 ¡Tu garaje tiene planes!', body: 'Una mejora del motor puede cambiar tu próxima carrera.' },
      { title: '🎨 ¿Un nuevo estilo?', body: 'Pasa por el taller y personaliza tu coche.' },
      { title: '🚗 Falta el rugido de tu motor', body: 'Tu próximo desafío empieza en el garaje.' },
      { title: '⚙️ ¿Has revisado tus piezas?', body: 'Mira si puedes mejorar tu coche antes de correr.' },
    ],
    deck: [
      { title: '🃏 ¡Una carta lo cambia todo!', body: 'Revisa tu mazo y prepara una sorpresa.' },
      { title: '🌪️ ¿Listo para cambiar la carrera?', body: 'Elige tus cartas y vuelve a la pista.' },
      { title: '🛡️ ¿Ataque o defensa?', body: 'Tu próximo mazo puede marcar la diferencia.' },
      { title: '🚀 ¿Nitro o estrategia?', body: 'Ajusta tu mazo para la próxima carrera.' },
    ],
  },
  en: {
    offline: [
      { title: '🏁 The track misses you!', body: 'How about an offline race to warm up your engine?' },
      { title: '⚡ Three minutes of adrenaline?', body: 'Jump into offline mode and show off your overtakes.' },
      { title: '🚗 Your car wants out of the garage!', body: 'The offline track is ready when you are.' },
      { title: '💨 Your next overtake is waiting', body: 'Practice your cards in a quick offline race.' },
    ],
    online: [
      { title: '🔥 Up for an online challenge?', body: 'Build your deck and race against other drivers.' },
      { title: '🏆 Ready to chase trophies?', body: 'Jump online and put your strategy to the test.' },
      { title: '⚔️ Time to test that deck', body: 'The right card can turn an online race around!' },
      { title: '🎮 Race with a friend?', body: 'Invite another driver to an online showdown.' },
    ],
    garage: [
      { title: '🔧 Your garage has plans!', body: 'An engine upgrade could change your next race.' },
      { title: '🎨 Time for a new look?', body: 'Visit the workshop and customize your ride.' },
      { title: '🚗 Your engine sounds too quiet', body: 'Your next challenge starts in the Wild Runners garage.' },
      { title: '⚙️ Checked your spare parts?', body: 'See whether your car is ready for an upgrade.' },
    ],
    deck: [
      { title: '🃏 One card changes everything!', body: 'Review your deck and plan a surprise move.' },
      { title: '🌪️ Ready to turn the race around?', body: 'Pick your cards and hit the track again.' },
      { title: '🛡️ Attack or defense?', body: 'Your next deck could make all the difference.' },
      { title: '🚀 Nitro or strategy?', body: 'Tune your deck for your next race.' },
    ],
  },
};

let raceInProgress = false;
let scheduleQueue: Promise<number> = Promise.resolve(0);
let firstEntryPermissionPromise: Promise<boolean> | null = null;

/** Chamar no início/fim da corrida para não sobrepor o HUD. */
export function setWildRaceNotificationSilence(active: boolean): void {
  raceInProgress = active;
}

export function getWildNotificationLanguage(): WildNotificationLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('es')) return 'es';
    if (locale.startsWith('en')) return 'en';
  } catch {
    // Alguns ambientes antigos podem não expor Intl completo.
  }
  return 'pt';
}

/** Registra handler e canal sem solicitar permissão. */
export async function prepareWildNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: !raceInProgress,
      shouldShowList: true,
      // No Android, false também impede o aviso suspenso (heads-up).
      shouldPlaySound: !raceInProgress,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WILD_PUSH_CHANNEL_ID, {
      name: 'Wild Runners • Avisos',
      description: 'Lembretes de corrida, notícias e eventos do Wild Runners.',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      lightColor: '#FFD60A',
    });
  }
}

async function hasSystemPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted;
}

export async function hasWildReturnNotificationsEnabledAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const preference = await AsyncStorage.getItem(WILD_RETURN_PREFERENCE_KEY);
  // O estado do sistema é a fonte de verdade para instalações novas.
  // Preservamos um 'no' explícito de versões anteriores.
  return preference !== 'no' && (await hasSystemPermission());
}

async function removeWildRemindersOnly(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(item => item.content.data?.wildReminder === WILD_RETURN_MARKER)
      .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

function reminderDate(daysSinceVisit: number): Date {
  const now = Date.now();
  const date = new Date(now);
  date.setDate(date.getDate() + daysSinceVisit);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  // Não antecipar a janela mínima (24h, 72h ou 7 dias) por causa da hora local.
  if (date.getTime() < now + daysSinceVisit * 24 * 60 * 60 * 1000) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

/**
 * Agenda até três mensagens após a ÚLTIMA visita: 1, 3 e 7 dias.
 * Chamado na entrada da garagem para renovar a janela de inatividade.
 */
export function scheduleWildReturnNotificationsAsync(
  language: WildNotificationLanguage = getWildNotificationLanguage(),
): Promise<number> {
  const schedule = async (): Promise<number> => {
    if (!(await hasWildReturnNotificationsEnabledAsync())) return 0;
    await prepareWildNotifications();
    await removeWildRemindersOnly();

    const Notifications = await import('expo-notifications');
    const plans: Array<{ days: number; category: WildReturnCategory }> = [
      { days: 1, category: 'offline' },
      { days: 3, category: 'online' },
      { days: 7, category: 'garage' },
    ];

    for (const [index, plan] of plans.entries()) {
      const choices = WILD_RETURN_MESSAGES[language][plan.category];
      const rotation = Math.floor(Date.now() / 86400000 / 7);
      const message = choices[(rotation + index) % choices.length];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: 'default',
          data: { wildReminder: WILD_RETURN_MARKER, category: plan.category },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate(plan.days),
          channelId: WILD_PUSH_CHANNEL_ID,
        },
      });
    }
    return plans.length;
  };

  // Evita duplicidade se foco e botão executarem simultaneamente.
  scheduleQueue = scheduleQueue.catch(() => 0).then(schedule);
  return scheduleQueue;
}

/** Reagenda sem mostrar prompt; útil após navegar de volta para o jogo. */
export async function syncWildReturnNotificationsAsync(): Promise<number> {
  if (!(await hasWildReturnNotificationsEnabledAsync())) return 0;
  return scheduleWildReturnNotificationsAsync();
}

/**
 * Primeiro acesso: o próprio Android/iOS mostra o pedido padrão de permissão.
 * Nunca mostra um Alert customizado nem repete o pedido após uma recusa.
 * A decisão do usuário é mantida pelo sistema, mesmo ao fechar o aplicativo.
 *
 * Pode ser chamada no LoadingScreen (fluxo de entrada) e também na garagem;
 * chamadas simultâneas são deduplicadas.
 */
export function requestWildNotificationPermissionOnEntryAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  if (firstEntryPermissionPromise) return firstEntryPermissionPromise;

  const run = async (): Promise<boolean> => {
    await prepareWildNotifications(); // Android 13+ exige canal antes da permissão.
    const Notifications = await import('expo-notifications');
    let permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      const askedBefore = await AsyncStorage.getItem(WILD_PERMISSION_ASKED_KEY);
      if (askedBefore !== 'yes' && permission.canAskAgain) {
        // Grava ANTES de pedir: evita perguntas duplicadas em navegações rápidas.
        await AsyncStorage.setItem(WILD_PERMISSION_ASKED_KEY, 'yes');
        permission = await Notifications.requestPermissionsAsync();
      }
    }

    if (!permission.granted) {
      // Se perdeu a autorização nas configurações, retire lembretes pendentes.
      await cancelWildReturnNotificationsAsync();
      return false;
    }

    // Também respeita um opt-out explícito feito na UI anterior à migração.
    if (await hasWildReturnNotificationsEnabledAsync()) {
      await scheduleWildReturnNotificationsAsync();
    }
    return true;
  };

  firstEntryPermissionPromise = run().finally(() => {
    firstEntryPermissionPromise = null;
  });
  return firstEntryPermissionPromise;
}

/**
 * Compatibilidade: versões antigas chamavam essa função por botão.
 * A UI nova chama requestWildNotificationPermissionOnEntryAsync no primeiro acesso.
 */
export async function activateWildReturnNotificationsAsync(): Promise<boolean> {
  return requestWildNotificationPermissionOnEntryAsync();
}

/** API reservada para eventual tela de configurações do jogo. */
export async function disableWildReturnNotificationsAsync(): Promise<void> {
  await AsyncStorage.setItem(WILD_RETURN_PREFERENCE_KEY, 'no');
  await cancelWildReturnNotificationsAsync();
}

/** Cancelar lembretes ao sair da conta; preserva o opt-in do aparelho. */
export async function cancelWildReturnNotificationsAsync(): Promise<void> {
  await scheduleQueue.catch(() => 0);
  await removeWildRemindersOnly();
}

/** Teste LOCAL: aparece mesmo com o aplicativo aberto, depois de 6 segundos. */
export async function scheduleWildLocalTestNotificationAsync(): Promise<string> {
  if (!(await hasSystemPermission())) throw new Error('Permissão de notificações não concedida.');
  await prepareWildNotifications();
  const Notifications = await import('expo-notifications');
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '🏁 Teste Wild Runners!',
      body: 'Uhuuul! As notificações locais estão funcionando! 🔔',
      sound: 'default',
      data: { wildTest: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 6,
      channelId: WILD_PUSH_CHANNEL_ID,
    },
  });
}

/**
 * Token para FUTURO push pela AWS. Não confundir com lembretes locais.
 * Envio/armazenamento por UID, desregistro no logout e recibos Expo
 * precisam de endpoints autenticados no servidor.
 */
export async function requestWildPushTokenAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  await prepareWildNotifications();

  const Notifications = await import('expo-notifications');
  // Obter o token não deve disparar um segundo pedido de permissão.
  // Primeiro chame requestWildNotificationPermissionOnEntryAsync no fluxo de entrada.
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return null;

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (typeof projectId !== 'string' || !projectId.trim()) {
    throw new Error('[WildNotifications] EAS projectId ausente.');
  }

  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  return result.data;
}
