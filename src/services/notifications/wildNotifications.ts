/**
 * Wild Runners — infraestrutura de notificações para o primeiro AAB com OTA.
 * Nenhum consentimento é pedido automaticamente e nenhum token é enviado daqui.
 * Futuramente uma tela específica chamará requestWildPushTokenAsync() após
 * informar a finalidade das notificações e associará o token ao UID no backend.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const WILD_PUSH_CHANNEL_ID = 'wild-runners-general';

/** Inicializa o canal Android e evita avisos sonoros durante uma corrida ativa. */
export async function prepareWildNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // Durante o jogo, a mensagem fica na lista e não cobre os controles.
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // Android 13+: o canal deve existir ANTES do pedido de token/permissão.
    await Notifications.setNotificationChannelAsync(WILD_PUSH_CHANNEL_ID, {
      name: 'Presentes e novidades',
      description: 'Presentes, novidades e avisos do Wild Runners.',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FFD60A',
    });
  }
}

/**
 * Chame somente após uma ação explícita do jogador, como "Ativar avisos".
 * Retorna null se o jogador não autorizar ou estiver na web.
 * A persistência com UID + autenticação e o envio do push ficam no backend.
 */
export async function requestWildPushTokenAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  await prepareWildNotifications();

  const Notifications = await import('expo-notifications');
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
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
