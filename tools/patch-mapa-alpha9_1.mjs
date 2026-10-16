/**
 * Wild Alpha 9.1 — safe route mode recovery for an existing Alpha 9 installation.
 * Run: node tools/patch-mapa-alpha9_1.mjs app/Mapa.tsx
 * Idempotent; backs up before writing; never modifies offline internals.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve(process.argv[2] ?? 'app/Mapa.tsx');
if (!existsSync(target)) throw new Error(`Mapa não encontrado: ${target}`);
const original = readFileSync(target, 'utf8');
const added = "import { getWildAlpha9Room } from '@/src/online/wildOnlineAlpha9Session';";
const before = "  if (mode === 'onlineAlpha9') return <WildOnlineMapaView />;";
const after = "  if (mode === 'onlineAlpha9' || getWildAlpha9Room() !== null) return <WildOnlineMapaView />;";

if (!original.includes('import WildOnlineMapaView from')) {
  throw new Error('Alpha 9 ainda não está integrado nesta rota. Não modifiquei o Mapa.');
}
if (original.includes(added) && original.includes(after)) {
  console.log('[WILD ALPHA 9.1] Patch já aplicado.');
  process.exit(0);
}
if (original.includes(added) || !original.includes(before) || original.includes(after)) {
  throw new Error('Wrapper do Mapa divergente. Não modifiquei o arquivo; revisão manual necessária.');
}
const updated = original.replace('import WildOnlineMapaView from',
  `${added}\nimport WildOnlineMapaView from`).replace(before, after);
if (updated === original) throw new Error('Nenhuma alteração realizada.');
const backup = `${target}.alpha9_1.bak`;
if (!existsSync(backup)) writeFileSync(backup, original);
writeFileSync(target, updated);
console.log('[WILD ALPHA 9.1] Mapa protegido contra perda do parâmetro mode.');
console.log('[WILD ALPHA 9.1] Backup:', backup);
