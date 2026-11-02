// Seleção temporária de cenário para o handoff OnlineLab -> Mapa.
// O servidor AWS deve tornar o mapId autoritativo antes de permitir
// que vários jogadores escolham mapas independentes na mesma sala.
import type { CenarioId, SkyTheme } from '@/components/Cenarios/CenarioBackground';

export type OnlineRaceMapSelection = {
  mapId: CenarioId;
  skyTheme: SkyTheme;
};

export type OfflineRaceSelection = OnlineRaceMapSelection & { deck: string[] };

let pendingOnlineRaceMap: OnlineRaceMapSelection | null = null;
let pendingOfflineRace: OfflineRaceSelection | null = null;

export function setOnlineRaceMapSelection(selection: OnlineRaceMapSelection): void {
  pendingOnlineRaceMap = selection;
}

export function getOnlineRaceMapSelection(): OnlineRaceMapSelection | null {
  return pendingOnlineRaceMap;
}

// A RaceResultScreen atual abre '/mapa' sem params no botão "Correr de novo".
// Manter o mapa e o deck do offline em memória preserva a revanche sem
// editar a RaceResultScreen ou as regras de recompensa do Alpha 17.
export function setOfflineRaceSelection(selection: OfflineRaceSelection): void {
  pendingOfflineRace = { ...selection, deck: [...selection.deck] };
}

export function getOfflineRaceSelection(): OfflineRaceSelection | null {
  return pendingOfflineRace;
}
