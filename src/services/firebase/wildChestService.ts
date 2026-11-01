/** Alpha 17.5 — Cliente somente solicita e lê; Admin/AWS é quem sorteia e credita. */
import { getDocFromServer, doc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { getCurrentLocalPlayerSnapshot } from './playerCloud';
import { installPlayerSnapshot, normalizePlayerSaveSnapshot } from '@/src/store/playerStore';

const SERVER_URL=(process.env.EXPO_PUBLIC_WILD_SERVER_URL || 'https://online.wfsoft.com.br').replace(/\/$/,'');
export type ChestResource='motor'|'spray'|'engrenagem'|'chips';
export type ChestReward=
  | {kind:'resource';resource:ChestResource;amount:number;label:string;rarity:'common'|'epic'}
  | {kind:'card';id:string;label:string;rarity:'epic'}
  | {kind:'car';id:string;label:string;rarity:'legendary'}
  | {kind:'equipment';id:string;carId:'buggy';label:string;rarity:'rare'};
export type ChestState =
  | {state:'unavailable'}
  | {state:'ready';raceId:string}
  | {state:'opened';raceId:string;selectedBox:number;reward:ChestReward;boxes:[ChestReward,ChestReward,ChestReward];beforeUpdatedAt:number};

async function chestRequest(action:'prepare'|'open',data:{raceId:string;boxIndex?:number}):Promise<ChestState>{
  const user=auth.currentUser;
  if(!user)throw new Error('Faça login novamente para abrir os baús.');
  const token=await user.getIdToken();
  const response=await fetch(`${SERVER_URL}/api/wild/chests/${action}`,{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
    body:JSON.stringify(data),
  });
  let payload:any;
  try { payload=await response.json(); }
  catch { throw new Error('O servidor de baús não respondeu corretamente.'); }
  if(!response.ok||!payload?.ok){
    const err=payload?.error;
    if(err==='WILD_CHEST_RACE_NOT_ELIGIBLE')throw new Error('Esta corrida não está elegível para baús.');
    if(err==='WILD_CHEST_PREPARE_REQUIRED')throw new Error('Prepare os baús novamente.');
    throw new Error(`Não foi possível acessar os baús (${err||response.status}).`);
  }
  if(payload.state==='unavailable')return {state:'unavailable'};
  if(payload.state==='ready'&&typeof payload.raceId==='string')return {state:'ready',raceId:payload.raceId};
  if(payload.state==='opened'&&typeof payload.raceId==='string'&&Number.isInteger(payload.selectedBox)&&
     Array.isArray(payload.boxes)&&payload.boxes.length===3&&payload.reward){
    return {state:'opened',raceId:payload.raceId,selectedBox:payload.selectedBox,reward:payload.reward,
      boxes:payload.boxes,beforeUpdatedAt:payload.beforeUpdatedAt};
  }
  throw new Error('O servidor retornou uma resposta inesperada.');
}
export const prepareWildChests=(raceId:string)=>chestRequest('prepare',{raceId});
export const openWildChest=(raceId:string,boxIndex:number)=>chestRequest('open',{raceId,boxIndex});

/** Instala snapshot somente se o Zustand não foi alterado entre a corrida e o grant. */
export async function syncWildChestReward(beforeUpdatedAt:number):Promise<'synced'|'deferred'> {
  const user=auth.currentUser;
  if(!user)return 'deferred';
  try{
    const local=getCurrentLocalPlayerSnapshot();
    if(local.profile.id!==user.uid||local.profile.updatedAt!==beforeUpdatedAt)return 'deferred';
    const remote=await getDocFromServer(doc(db,'playerSaves',user.uid));
    if(!remote.exists()||remote.data().ownerUid!==user.uid)return 'deferred';
    const d=remote.data();
    const snapshot=normalizePlayerSaveSnapshot({profile:d.profile,equippedDeck:d.equippedDeck,processedRaceIds:d.processedRaceIds});
    if(!snapshot)return 'deferred';
    // Uma alteração local ocorrida enquanto o fetch aguardava não pode ser perdida.
    const fresh=getCurrentLocalPlayerSnapshot();
    if(fresh.profile.updatedAt!==beforeUpdatedAt)return 'deferred';
    return installPlayerSnapshot(snapshot)?'synced':'deferred';
  }catch {return 'deferred';}
}
