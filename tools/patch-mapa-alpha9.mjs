/**
 * Run: node tools/patch-mapa-alpha9.mjs app/Mapa.tsx
 * Adds an Alpha 9 branch to the SAME Mapa route, preserving MapaOffline intact.
 * Fails without modifying the file if its structure isn't recognized.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve(process.argv[2] ?? 'app/Mapa.tsx');
if (!existsSync(target)) throw new Error(`Mapa não encontrado: ${target}`);
const original = readFileSync(target, 'utf8');
const marker = "import WildOnlineMapaView from '@/src/online/WildOnlineMapaView';";
if (original.includes(marker)) {
  console.log('[WILD ALPHA 9] Mapa já integrado, nenhuma alteração necessária.');
  process.exit(0);
}
const decl = /export default function Mapa\(\{ initialDeck = \['swap', 'bullet', 'chains', 'tnt'\] \}: MapaProps\) \{/;
const match = original.match(decl);
if (!match) throw new Error('Assinatura do Mapa mudou; ajuste o wrapper manualmente. Original NÃO alterado.');
if (!original.includes("import Carro from")) {
  throw new Error('Importação do Carro não localizada; mapa não modificado.');
}
if (!original.includes("import React, {")) {
  throw new Error('Importação do React não localizada. Original NÃO alterado.');
}
const wrapper = `// ALPHA 9: mesmo endereço /Mapa, mas motor Colyseus isolado do offline.\n` +
  `export default function Mapa(props: MapaProps) {\n` +
  `  const { mode } = useLocalSearchParams<{ mode?: string }>();\n` +
  `  if (mode === 'onlineAlpha9') return <WildOnlineMapaView />;\n` +
  `  return <MapaOffline {...props} />;\n` +
  `}\n\n`;
let updated = original.replace(
  'import Carro from', `${marker}\nimport Carro from`
).replace(decl, wrapper + match[0].replace('export default function Mapa(', 'function MapaOffline('));
if (updated === original || !updated.includes('function MapaOffline(')) {
  throw new Error('Patch incompleto; nenhum arquivo alterado.');
}
const backup = `${target}.alpha9.bak`; // extension intentionally not .tsx: won't create an Expo route
if (!existsSync(backup)) writeFileSync(backup, original);
writeFileSync(target, updated);
console.log(`[WILD ALPHA 9] Rota integrada: ${target}`);
console.log(`[WILD ALPHA 9] Backup offline: ${backup}`);
