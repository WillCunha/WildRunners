/**
 * ALPHA 17.2 — Leitura de recompensa ONLINE creditada pela AWS.
 * Não escreve no Firestore. Não chama claimRaceRewardsInCloud (exclusiva do offline).
 * Não usa a antiga fila/Cloud Functions e jamais cria crédito local.
 */
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { getCurrentLocalPlayerSnapshot } from './playerCloud';
import { installPlayerSnapshot, normalizePlayerSaveSnapshot } from '@/src/store/playerStore';
import { useRaceResultStore } from '@/src/store/raceResultStore';
import type { RaceResult } from '@/src/types/raceTypes';
import { getPlayerLevel } from '@/src/utils/progression';

export type OnlineRaceReceiptView = {
  raceId:string; roomId:string; position:number; totalRacers:number;
  carId:string; finishedAt:number; wallet:{motor:number;spray:number;engrenagem:number;chips:number};
};
export type ConfirmedOnlineRace = {status:'confirmed'|'confirmed_refresh_deferred'; result:RaceResult;chips:number};
const safeInt=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;

export async function showConfirmedOnlineRace(
  receipt:OnlineRaceReceiptView,
  visuals:{mapId:string;colorFront:string;colorBack:string},
):Promise<ConfirmedOnlineRace> {
  const user=auth.currentUser;
  if(!user)throw new Error('WILD_ONLINE_AUTH_REQUIRED');
  if(!/^race-onl-[A-Za-z0-9_-]{8,80}$/.test(receipt.raceId))
    throw new Error('WILD_ONLINE_RACE_ID_NOT_AUTHORITATIVE');
  const claimRef=doc(db,'playerSaves',user.uid,'raceClaims',receipt.raceId);
  // getDocFromServer evita confirmar uma recompensa só por cache local antigo.
  const claimSnap=await getDocFromServer(claimRef);
  if(!claimSnap.exists())throw new Error('WILD_ONLINE_CREDIT_PENDING');
  const claim=claimSnap.data();
  if(claim.source!=='aws-online-v1'||claim.ownerUid!==user.uid||
      claim.raceId!==receipt.raceId||claim.status!=='applied')
    throw new Error('WILD_ONLINE_CREDIT_UNTRUSTED');
  if(claim.position!==receipt.position||claim.totalRacers!==receipt.totalRacers||
      claim.carId!==receipt.carId)throw new Error('WILD_ONLINE_RACE_RESULT_MISMATCH');
  const rw=claim.rewards;
  const before=claim.before;
  const after=claim.after;
  const xpBreakdown=claim.xpBreakdown;
  if(!rw||!before||!after||!xpBreakdown||
      ![rw.motor,rw.spray,rw.engrenagem,rw.chips,rw.trophies,rw.xp,
        before.xp,after.xp,before.trophies,after.trophies].every(safeInt)||
      xpBreakdown.total!==rw.xp)
    throw new Error('WILD_ONLINE_CREDIT_INVALID');

  // Só instalar snapshot remoto se o jogador não alterou o perfil local depois
  // da versão paga. Caso contrário preservamos o progresso local até conciliação.
  // IMPORTANTE: a outbox offline (não enviada aqui) ainda requer avaliação.
  const remote=await getDocFromServer(doc(db,'playerSaves',user.uid));
  if(!remote.exists()||remote.data().ownerUid!==user.uid)
    throw new Error('WILD_ONLINE_CLOUD_SAVE_MISSING');
  const remoteData=remote.data();
  const snapshot=normalizePlayerSaveSnapshot({
    profile:remoteData.profile,
    equippedDeck:remoteData.equippedDeck,
    processedRaceIds:remoteData.processedRaceIds,
  });
  if(!snapshot||!snapshot.processedRaceIds.includes(receipt.raceId))
    throw new Error('WILD_ONLINE_CREDIT_SNAPSHOT_NOT_READY');

  const local=getCurrentLocalPlayerSnapshot();
  const safeInstall = local.profile.id===user.uid &&
    local.profile.updatedAt===before.updatedAt &&
    local.profile.xp===before.xp &&
    local.profile.trophies===before.trophies &&
    local.profile.parts.motor===before.motor &&
    local.profile.parts.spray===before.spray &&
    local.profile.parts.engrenagem===before.engrenagem &&
    local.profile.parts.chips===before.chips;
  if(safeInstall)installPlayerSnapshot(snapshot);

  const result:RaceResult={
    raceId:receipt.raceId,position:claim.position,totalRacers:claim.totalRacers,
    carId:claim.carId,mapId:visuals.mapId,
    carVisual:{colorFront:visuals.colorFront,colorBack:visuals.colorBack},
    rewards:{...rw},xpBreakdown:{...xpBreakdown},objectives:[],unlocks:[],
    finishedAt:claim.finishedAt,isNewRecord:false,
    progress:{
      trophiesBefore:before.trophies,trophiesAfter:after.trophies,
      xpBefore:before.xp,xpAfter:after.xp,
      levelBefore:getPlayerLevel(before.xp),levelAfter:getPlayerLevel(after.xp),
    },
  };
  useRaceResultStore.getState().setResult(result);
  return {status:safeInstall?'confirmed':'confirmed_refresh_deferred',result,chips:rw.chips};
}
