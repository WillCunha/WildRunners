/**
 * Alpha 17.3 — trava contra lost update de recibos quando a AWS credita uma
 * partida em paralelo a uma escrita de snapshot originada no aparelho.
 *
 * NÃO resolve divergências de saldo nem remove dados locais. Uma pendência
 * deve ser conciliada no fluxo de sincronização ANTES de voltar a salvar.
 */
export function assertNoRemoteRaceHistoryLoss(
  remoteIds: unknown,
  localIds: readonly string[],
): void {
  if (!Array.isArray(remoteIds) || !remoteIds.every(id => typeof id === 'string')) {
    throw new Error('WILD_REMOTE_RACE_HISTORY_INVALID');
  }
  if (!Array.isArray(localIds) || !localIds.every(id => typeof id === 'string')) {
    throw new Error('WILD_LOCAL_RACE_HISTORY_INVALID');
  }
  const local = new Set(localIds);
  if (remoteIds.some(id => !local.has(id))) {
    // A Loading/syncCoordinator deve ler o estado remoto e decidir como
    // preservar a outbox. Não escrever um snapshot que perderia créditos AWS.
    throw new Error('WILD_REMOTE_RACE_CREDIT_UNSEEN');
  }
}
