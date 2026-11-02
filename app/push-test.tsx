/**
 * Wild Runners — teste manual de Push Notifications (Alpha 17.4)
 * Coloque este arquivo em app/push-test.tsx.
 * Acesse a rota push-test no app de testes (ex.: deep link runnergame://push-test).
 * Sem Firebase Admin SDK, Firestore, credenciais privadas ou envios automáticos.
 */
import { requestWildPushTokenAsync } from '@/src/services/firebase/wildNotifications';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PushTestScreen() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const getToken = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await requestWildPushTokenAsync();
      if (result) {
        setToken(result);
      } else {
        setToken('');
        setError('Permissão não concedida ou plataforma sem suporte. Confira as permissões do app.');
      }
    } catch (e) {
      setToken('');
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.header}>WILD RUNNERS · PUSH TEST</Text>
        <Text style={styles.help}>Teste manual: gere seu token, copie e cole em expo.dev/notifications. Depois, minimize o jogo para ver o aviso na bandeja do Android.</Text>
        <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={getToken} disabled={busy}>
          {busy ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>GERAR TOKEN DE TESTE</Text>}
        </TouchableOpacity>
        {!!token && (
          <View style={styles.result}>
            <Text style={styles.label}>TOKEN EXPO (pressione e segure para copiar):</Text>
            <Text selectable selectionColor="#FFE16B" style={styles.token}>{token}</Text>
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.note}>Não envia nenhuma notificação automaticamente. Não publique este token em redes sociais.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: '#0E1020', justifyContent: 'center', alignItems: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 620, borderRadius: 18, padding: 20, backgroundColor: '#1C2037', gap: 13 },
  header: { fontSize: 17, fontWeight: '900', color: '#FFD60A', textAlign: 'center' },
  help: { fontSize: 13, lineHeight: 19, color: '#F3F5FF', textAlign: 'center' },
  button: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#FFD60A', alignItems: 'center', justifyContent: 'center', borderRadius: 11, minHeight: 50 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#10121D', fontSize: 13, fontWeight: '900' },
  result: { padding: 11, borderRadius: 10, backgroundColor: '#0A0C17', gap: 8 },
  label: { fontSize: 11, fontWeight: '800', color: '#FFD60A' },
  token: { fontSize: 12, color: '#FFFFFF' },
  error: { fontSize: 12, color: '#FF9999', textAlign: 'center' },
  note: { fontSize: 11, color: '#A8B1CC', textAlign: 'center' },
});
