const NativeWebSocket = globalThis.WebSocket;

if (!NativeWebSocket) {
  throw new Error(
    '[WILD ONLINE] React Native WebSocket global não está disponível.'
  );
}

export default NativeWebSocket;