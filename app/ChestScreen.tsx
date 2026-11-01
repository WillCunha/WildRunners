/**
 * Wild Runners — Alpha 17.5.3 · ULTRA PREMIUM CLEAN
 * Três baús -> escolha -> tampa/flash -> prêmio emerge -> baús DESCEM -> hero shot.
 * A prévia é puramente local; o modo real mantém AWS/Firebase autoritativos.
 * Animações com React Native Animated (native driver), sem dependência adicional.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View, Vibration, useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {router, useLocalSearchParams} from 'expo-router';
import {useRaceResultSfx} from '@/src/audio/raceSfx';
import {useLanguage} from '@/context/LanguageContext';
import {getCardDefinition} from '@/src/utils/cardMap';
import {carMaps} from '@/src/utils/carMaps';
import {getEquipmentById} from '@/src/utils/carEquipments';
import {
  prepareWildChests, openWildChest, syncWildChestReward,
  type ChestState, type ChestReward,
} from '@/src/services/firebase/wildChestService';

const PREVIEW_ALLOWED = __DEV__ || process.env.EXPO_PUBLIC_WILD_CHEST_PREVIEW === '1';
const COLORS = {common:'#73DDFD', rare:'#56EDC3', epic:'#B78CFF', legendary:'#FFD069'} as const;
const RESOURCE_ICONS = {motor:'🔧', spray:'🎨', engrenagem:'⚙️', chips:'🟣'} as const;
const DEMO_SPECIALS:readonly ChestReward[] = [
  {kind:'card', id:'tornado', label:'TORNADO', rarity:'epic'},
  {kind:'car', id:'lamborghini', label:'LAMBORGHINI', rarity:'legendary'},
  {kind:'equipment', id:'buggy_spoiler_sport_01', carId:'buggy', label:'BUGGY · AEROFÓLIO 01', rarity:'rare'},
];
const DEMO_RESOURCES:readonly ChestReward[] = [
  {kind:'resource', resource:'chips', amount:12, label:'12 CHIPs', rarity:'common'},
  {kind:'resource', resource:'motor', amount:34, label:'34 Peças de motor', rarity:'common'},
  {kind:'resource', resource:'spray', amount:25, label:'25 Spray', rarity:'common'},
  {kind:'resource', resource:'engrenagem', amount:39, label:'39 Engrenagens', rarity:'common'},
];

function demoBoxes(category:number):[ChestReward,ChestReward,ChestReward] {
  const special = DEMO_SPECIALS[category % DEMO_SPECIALS.length];
  const first = Math.floor(Math.random()*DEMO_RESOURCES.length);
  const second = (first+1+Math.floor(Math.random()*(DEMO_RESOURCES.length-1)))%DEMO_RESOURCES.length;
  const arr:[ChestReward,ChestReward,ChestReward] = [DEMO_RESOURCES[first],DEMO_RESOURCES[second],special];
  const specialIndex = Math.floor(Math.random()*3);
  [arr[2],arr[specialIndex]] = [arr[specialIndex],arr[2]];
  return arr;
}

function rewardArt(reward:ChestReward): ImageSourcePropType | undefined {
  if(reward.kind==='card') return getCardDefinition(reward.id)?.image;
  if(reward.kind==='equipment') return getEquipmentById(reward.carId,reward.id)?.icon;
  if(reward.kind==='car') return carMaps[reward.id as keyof typeof carMaps]?.icone;
  return undefined;
}
function rewardCategory(reward:ChestReward,t:ReturnType<typeof useLanguage>['t']) {
  if(reward.kind==='card') return t('chest.newCard');
  if(reward.kind==='car') return t('chest.newCar');
  if(reward.kind==='equipment') return t('chest.newEquipment');
  return reward.rarity==='epic'?t('chest.jackpot'):t('chest.resources');
}
function rewardDetail(reward:ChestReward,t:ReturnType<typeof useLanguage>['t']) {
  if(reward.kind==='card') return t('chest.cardDetail');
  if(reward.kind==='car') return t('chest.carDetail');
  if(reward.kind==='equipment') return t('chest.equipmentDetail');
  return t('chest.resourceDetail');
}
function rarityTitle(reward:ChestReward,t:ReturnType<typeof useLanguage>['t']) {
  return t(`chest.${reward.rarity}`);
}

// O baú é desenhado por views, sem precisar adicionar assets ao projeto.
function TreasureChest({small,open,selected,lid}:{small:boolean;open:boolean;selected:boolean;lid:Animated.Value}) {
  const lidRotation=lid.interpolate({inputRange:[0,1],outputRange:['0deg','-32deg']});
  const lidLift=lid.interpolate({inputRange:[0,1],outputRange:[0,-19]});
  return <View style={[styles.chestGraphic,small&&styles.chestGraphicSmall]}>
    <View style={styles.chestAura} />
    <Animated.View style={[styles.chestLid,small&&styles.chestLidSmall,
      selected&&styles.chestHighlight,{transform:[{translateY:lidLift},{rotate:lidRotation}]}]}>
      <View style={styles.lidMetal}/><View style={styles.lidMetal}/>
    </Animated.View>
    {open&&<View style={styles.innerLight}/>}
    <LinearGradient colors={selected?['#7A5E28','#D29B34','#3D2D24']:['#6E879B','#30425E','#18283F']}
      style={[styles.chestBody,small&&styles.chestBodySmall,selected&&styles.chestHighlight]}>
      <View style={styles.bodyStrip}/><View style={styles.bodyStrip}/>
      <View style={styles.chestLock}><Text style={styles.lockSymbol}>{open?'✦':'◆'}</Text></View>
    </LinearGradient>
    <View style={styles.floorShadow}/>
  </View>;
}

type Phase = 'loading'|'idle'|'choosing'|'cinematic'|'hero'|'unavailable';
const runAnimation=(animation:Animated.CompositeAnimation)=>new Promise<boolean>(resolve=>
  animation.start(({finished})=>resolve(finished)),
);

export default function ChestScreen(){
  const {raceId:routeId,preview:routePreview}=useLocalSearchParams<{raceId?:string;preview?:string}>();
  const raceId=Array.isArray(routeId)?routeId[0]:routeId;
  const previewParam=Array.isArray(routePreview)?routePreview[0]:routePreview;
  const preview=PREVIEW_ALLOWED&&previewParam==='1';
  const {t}=useLanguage();
  const {width,height}=useWindowDimensions();
  const small=width<650||height<430;
  const compact=height<470;
  const [stageSize,setStageSize]=useState({width:Math.max(320,width-40),height:Math.max(170,height-155)});
  const chestWidth=Math.min(small?118:196,Math.max(90,(stageSize.width-50)/3));
  const chestGap=small?8:Math.min(24,stageSize.width*0.03);
  const [phase,setPhase]=useState<Phase>('loading');
  const [state,setState]=useState<ChestState|null>(null);
  const [selected,setSelected]=useState<number|null>(null);
  const [reward,setReward]=useState<ChestReward|null>(null);
  const [cinematicStep,setCinematicStep]=useState<'opening'|'revealing'|'clearing'>('opening');
  const [error,setError]=useState<string|null>(null);
  const [sync,setSync]=useState<'synced'|'deferred'|null>(null);
  const [demoCategory,setDemoCategory]=useState(0);
  const [reducedMotion,setReducedMotion]=useState(false);
  const sfx=useRaceResultSfx();
  const sfxRef=useRef(sfx);sfxRef.current=sfx;
  const boxes=useRef<[ChestReward,ChestReward,ChestReward]>(demoBoxes(0));
  const mounted=useRef(true);
  const busy=useRef(false);

  // Todos os transforms animados usam native driver.
  const entry=useRef([0,1,2].map(()=>new Animated.Value(0))).current;
  const bob=useRef([0,1,2].map(()=>new Animated.Value(0))).current;
  const leave=useRef([0,1,2].map(()=>new Animated.Value(0))).current;
  const scales=useRef([0,1,2].map(()=>new Animated.Value(1))).current;
  const fades=useRef([0,1,2].map(()=>new Animated.Value(1))).current;
  const lids=useRef([0,1,2].map(()=>new Animated.Value(0))).current;
  const shakes=useRef([0,1,2].map(()=>new Animated.Value(0))).current;
  const prizeX=useRef(new Animated.Value(0)).current;
  const prizeY=useRef(new Animated.Value(0)).current;
  const prizeScale=useRef(new Animated.Value(0.2)).current;
  const prizeOpacity=useRef(new Animated.Value(0)).current;
  const prizeTurn=useRef(new Animated.Value(0)).current;
  const haloScale=useRef(new Animated.Value(0.65)).current;
  const haloOpacity=useRef(new Animated.Value(0)).current;
  const flash=useRef(new Animated.Value(0)).current;
  const burst=useRef(new Animated.Value(0)).current;
  const cameraShake=useRef(new Animated.Value(0)).current;
  const heroText=useRef(new Animated.Value(0)).current;
  const ambient=useRef(new Animated.Value(0)).current;
  const activeAnims=useRef<Animated.CompositeAnimation[]>([]);

  useEffect(()=>{
    mounted.current=true;
    void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(mounted.current)setReducedMotion(v);}).catch(()=>{});
    const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReducedMotion);
    return ()=>{mounted.current=false;sub.remove();activeAnims.current.forEach(a=>a.stop());};
  },[]);

  const resetVisuals=useCallback(()=>{
    activeAnims.current.forEach(a=>a.stop());activeAnims.current=[];
    for(let i=0;i<3;i++){
      entry[i].setValue(36);bob[i].setValue(0);leave[i].setValue(0);
      scales[i].setValue(1);fades[i].setValue(1);lids[i].setValue(0);shakes[i].setValue(0);
    }
    prizeX.setValue(0);prizeY.setValue(0);prizeScale.setValue(0.2);
    prizeOpacity.setValue(0);prizeTurn.setValue(-1);haloScale.setValue(0.65);
    haloOpacity.setValue(0);flash.setValue(0);burst.setValue(0);heroText.setValue(0);cameraShake.setValue(0);
  },[entry,bob,leave,scales,fades,lids,shakes,prizeX,prizeY,prizeScale,prizeOpacity,prizeTurn,haloScale,haloOpacity,flash,burst,heroText,cameraShake]);

  const load=useCallback(async()=>{
    resetVisuals();setPhase('loading');setError(null);setSync(null);setReward(null);setSelected(null);busy.current=false;
    if(preview){
      boxes.current=demoBoxes(demoCategory);
      setState({state:'ready',raceId:'PREVIEW_LOCAL'});setPhase('idle');return;
    }
    try{
      if(!raceId)throw new Error(t('chest.raceMissing'));
      const result=await prepareWildChests(raceId);
      if(!mounted.current)return;
      setState(result);
      if(result.state==='unavailable')setPhase('unavailable');
      else if(result.state==='opened'){
        // Se reabrir o app, recupera o prêmio já creditado sem ressorteá-lo.
        setReward(result.reward);setSelected(result.selectedBox);setPhase('hero');
        prizeOpacity.setValue(1);prizeScale.setValue(1);prizeTurn.setValue(0);haloScale.setValue(1.05);
        haloOpacity.setValue(0.65);heroText.setValue(1);
        void syncWildChestReward(result.beforeUpdatedAt).then(v=>{if(mounted.current)setSync(v);});
      }else setPhase('idle');
    }catch(e){if(mounted.current){setError(e instanceof Error?e.message:t('chest.loadError'));setPhase('unavailable');}}
  },[preview,demoCategory,raceId,resetVisuals,prizeOpacity,prizeScale,haloScale,haloOpacity,heroText,t]);
  useEffect(()=>{void load();},[load]);

  // Entrada/respiração sutil. O jogador só vê os baús parados/flutuando ANTES da escolha.
  useEffect(()=>{
    if(phase!=='idle')return;
    const animations:Animated.CompositeAnimation[]=[];
    for(let i=0;i<3;i++){
      const intro=Animated.sequence([
        Animated.delay(i*115),
        Animated.spring(entry[i],{toValue:0,friction:7,tension:58,useNativeDriver:true}),
      ]);
      animations.push(intro);intro.start();
      if(!reducedMotion){
        const loop=Animated.loop(Animated.sequence([
          Animated.delay(i*240),
          Animated.timing(bob[i],{toValue:-7,duration:1050+i*120,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
          Animated.timing(bob[i],{toValue:0,duration:1100+i*90,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
        ]));
        animations.push(loop);loop.start();
      }
    }
    activeAnims.current=animations;
    return ()=>{animations.forEach(a=>a.stop());};
  },[phase,reducedMotion,entry,bob]);

  // Brilho ambiente barato: apenas uma animação contínua para todos os pontos decorativos.
  useEffect(()=>{
    if(reducedMotion)return;
    const a=Animated.loop(Animated.sequence([
      Animated.timing(ambient,{toValue:1,duration:1750,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),
      Animated.timing(ambient,{toValue:0,duration:1800,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),
    ]));a.start();return ()=>a.stop();
  },[ambient,reducedMotion]);

  const choose=async(index:number)=>{
    if(busy.current||phase!=='idle'||state?.state!=='ready')return;
    busy.current=true;setError(null);setSelected(index);setPhase('choosing');
    // O servidor determina o prêmio. NÃO mostrar uma vitória antes da confirmação.
    try{
      const result:ChestState=preview
        ? {state:'opened',raceId:'PREVIEW_LOCAL',selectedBox:index,reward:boxes.current[index],boxes:boxes.current,beforeUpdatedAt:0}
        : await openWildChest(state.raceId,index);
      if(!mounted.current)return;
      if(result.state!=='opened')throw new Error(t('chest.notConfirmed'));
      setState(result);setReward(result.reward);setSelected(result.selectedBox);
      setPhase(reducedMotion?'hero':'cinematic');
      if(reducedMotion){
        try{if(result.reward.kind==='resource')sfxRef.current.playRewardComplete();
          else sfxRef.current.playRareUnlock();}catch{}
        prizeOpacity.setValue(1);prizeScale.setValue(1);prizeTurn.setValue(0);heroText.setValue(1);
        haloOpacity.setValue(0.65);haloScale.setValue(1);
      }
      if(!preview){
        void syncWildChestReward(result.beforeUpdatedAt).then(v=>{if(mounted.current)setSync(v);});
      }
    }catch(e){
      if(!mounted.current)return;
      setError(e instanceof Error?e.message:t('chest.openError'));
      setSelected(null);setPhase('idle');
    }finally{busy.current=false;}
  };

  // Coreografia. Prêmio nasce na posição do BAÚ escolhido e viaja até o centro;
  // somente depois os três baús CAEM para fora, deixando o hero shot sozinho.
  useEffect(()=>{
    if(phase!=='cinematic'||selected===null||!reward)return;
    let cancelled=false;
    const all:Animated.CompositeAnimation[]=[];
    const play=async(a:Animated.CompositeAnimation)=>{
      all.push(a);return await runAnimation(a)&&!cancelled;
    };
    const run=async()=>{
      bob.forEach(v=>v.stopAnimation());
      entry.forEach(v=>v.setValue(0));
      setCinematicStep('opening');
      const sceneWidth=stageSize.width;
      const sceneHeight=stageSize.height;
      // Espaçamento coincide com a fila centralizada de baús.
      const fromX=(selected-1)*(chestWidth+chestGap);
      prizeX.setValue(fromX);
      prizeY.setValue(Math.max(36,sceneHeight*0.17));
      prizeScale.setValue(0.18);prizeOpacity.setValue(0);prizeTurn.setValue(-1);
      heroText.setValue(0);haloOpacity.setValue(0);haloScale.setValue(0.65);
      if(!await play(Animated.parallel([
        ...scales.map((v,i)=>Animated.spring(v,{toValue:i===selected?1.14:0.94,friction:6,useNativeDriver:true})),
        ...fades.map((v,i)=>Animated.timing(v,{toValue:i===selected?1:0.5,duration:220,useNativeDriver:true})),
        Animated.sequence([
          Animated.timing(shakes[selected],{toValue:-6,duration:60,useNativeDriver:true}),
          Animated.timing(shakes[selected],{toValue:7,duration:70,useNativeDriver:true}),
          Animated.timing(shakes[selected],{toValue:-5,duration:60,useNativeDriver:true}),
          Animated.timing(shakes[selected],{toValue:0,duration:80,useNativeDriver:true}),
        ]),
      ])))return;
      try{Vibration.vibrate(30);}catch{}
      if(!await play(Animated.parallel([
        Animated.spring(lids[selected],{toValue:1,friction:5,tension:65,useNativeDriver:true}),
        Animated.sequence([
          Animated.timing(flash,{toValue:0.85,duration:115,useNativeDriver:true}),
          Animated.timing(flash,{toValue:0,duration:350,useNativeDriver:true}),
        ]),
        Animated.sequence([
          Animated.timing(cameraShake,{toValue:4,duration:55,useNativeDriver:true}),
          Animated.timing(cameraShake,{toValue:-3,duration:65,useNativeDriver:true}),
          Animated.timing(cameraShake,{toValue:0,duration:90,useNativeDriver:true}),
        ]),
      ])))return;
      setCinematicStep('revealing');
      try{if(reward.kind==='resource')sfxRef.current.playRewardComplete();
        else sfxRef.current.playRareUnlock();}catch{}
      if(!await play(Animated.parallel([
        Animated.timing(prizeOpacity,{toValue:1,duration:145,useNativeDriver:true}),
        Animated.timing(prizeY,{toValue:0,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
        Animated.timing(prizeX,{toValue:0,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
        Animated.spring(prizeScale,{toValue:1.13,friction:6,tension:64,useNativeDriver:true}),
        Animated.timing(prizeTurn,{toValue:0,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
        Animated.timing(haloOpacity,{toValue:0.7,duration:750,useNativeDriver:true}),
        Animated.timing(burst,{toValue:1,duration:800,useNativeDriver:true}),
        Animated.spring(haloScale,{toValue:1.1,friction:6,useNativeDriver:true}),
      ])))return;
      setCinematicStep('clearing');
      if(!await play(Animated.parallel([
        ...leave.map((v,i)=>Animated.sequence([
          Animated.delay((i===selected?0:i+1)*90),
          Animated.timing(v,{toValue:sceneHeight+180,duration:580,
            easing:Easing.in(Easing.cubic),useNativeDriver:true}),
        ])),
        Animated.timing(heroText,{toValue:1,duration:700,useNativeDriver:true}),
        Animated.spring(prizeScale,{toValue:1,friction:7,useNativeDriver:true}),
      ])))return;
      if(!cancelled)setPhase('hero');
    };
    void run();
    return ()=>{cancelled=true;all.forEach(a=>a.stop());};
  // stageSize and chest geometry are read at animation start; changing orientation starts anew.
  },[phase,selected,reward,stageSize.width,stageSize.height,chestWidth,chestGap,
    bob,entry,leave,scales,fades,lids,shakes,prizeX,prizeY,prizeScale,prizeOpacity,prizeTurn,haloOpacity,haloScale,heroText,flash,burst,cameraShake]);

  const isHero=phase==='hero';
  const isActive=phase==='idle'||phase==='choosing'||phase==='cinematic';
  const highlight=reward?COLORS[reward.rarity]:'#F1CC76';
  const art=useMemo(()=>reward?rewardArt(reward):undefined,[reward]);
  const glowFill=reward?.rarity==='legendary'?'rgba(255,190,58,0.12)':
    reward?.rarity==='epic'?'rgba(182,140,255,0.13)':
    reward?.rarity==='rare'?'rgba(86,237,195,0.12)':'rgba(115,221,253,0.12)';
  const originRotation=prizeTurn.interpolate({inputRange:[-1,0],outputRange:['-14deg','0deg']});

  return <LinearGradient colors={['#070E1E','#10223B','#080E1E']} style={styles.root}>
    <SafeAreaView style={styles.safe}>
      <View style={[styles.head,compact&&styles.headCompact]}>
        <Text style={styles.eyebrow}>{t('chest.event')}</Text>
        <Text style={[styles.title,small&&styles.titleSmall]}>{isHero?t('chest.win'):t('chest.choose')}</Text>
        <Text style={styles.subtitle}>{isHero?t('chest.secured'):
          phase==='cinematic'?t('chest.prepare'): t('chest.secret')}</Text>
        {preview&&<Text style={styles.previewPill}>{t('chest.preview')}</Text>}
      </View>

      {phase==='loading'?<View style={styles.center}>
        <ActivityIndicator color="#FFD56B" size="large"/><Text style={styles.hint}>{t('chest.loading')}</Text>
      </View>:phase==='unavailable'?<View style={styles.center}>
        <Text style={styles.status}>{error||t('chest.unavailable')}</Text>
        <TouchableOpacity onPress={()=>error?void load():router.back()} style={styles.buttonGold}>
          <Text style={styles.buttonGoldText}>{error?t('chest.retry'):t('chest.continue')}</Text>
        </TouchableOpacity>
      </View>:<>
        <Animated.View style={[styles.stage,{transform:[{translateX:cameraShake}]}]}
          onLayout={e=>{
            const {width:w,height:h}=e.nativeEvent.layout;
            if(w>0&&h>0&&(Math.abs(stageSize.width-w)>1||Math.abs(stageSize.height-h)>1))setStageSize({width:w,height:h});
          }}>
          <View pointerEvents="none" style={styles.backgroundOrbits}>
            <View style={[styles.orbit,{width:Math.min(420,stageSize.width*.71),height:Math.min(420,stageSize.width*.71)}]}/>
            <View style={[styles.orbit,styles.orbitInner,{width:Math.min(280,stageSize.width*.48),height:Math.min(280,stageSize.width*.48)}]}/>
            {Array.from({length:9},(_,i)=><Animated.View key={i} style={[styles.ambientParticle,{
              left:`${10+(i*19)%83}%`,top:`${7+(i*27)%76}%`,
              opacity:ambient.interpolate({inputRange:[0,1],outputRange:[i%2?0.15:0.4,i%2?0.55:0.2]}),
              transform:[{scale:ambient.interpolate({inputRange:[0,1],outputRange:[0.7,1.35]})}],
            }]}/>)}
          </View>

          {isActive&&<View style={[styles.row,{gap:chestGap}]}>
            {[0,1,2].map(i=>{
              const chosen=selected===i;
              return <TouchableOpacity key={i} activeOpacity={0.88}
                disabled={phase!=='idle'} onPress={()=>void choose(i)}
                accessibilityRole="button" accessibilityLabel={t('chest.openA11y',{number:i+1})}
                style={[styles.slot,{width:chestWidth},small&&styles.slotSmall]}>
                <Animated.View style={{alignItems:'center',width:'100%',
                  opacity:fades[i],transform:[{translateY:entry[i]},{translateY:bob[i]},
                    {translateY:leave[i]},{translateX:shakes[i]},{scale:scales[i]}]}}>
                  <Text style={[styles.chestNumber,chosen&&{color:'#FFD76C'}]}>{t('chest.chestNumber',{number:i+1})}</Text>
                  <TreasureChest small={small} open={phase==='cinematic'&&chosen&&cinematicStep!=='opening'}
                    selected={chosen} lid={lids[i]}/>
                  {phase==='idle'&&<Text style={styles.tap}>{t('chest.tap')}</Text>}
                  {phase==='choosing'&&chosen&&<ActivityIndicator color="#FFD76C" size="small"/>}
                </Animated.View>
              </TouchableOpacity>;
            })}
          </View>}

          {reward&&phase==='cinematic'&&<View pointerEvents="none" style={[styles.burstOrigin,{
            transform:[{translateX:(selected===null?0:(selected-1)*(chestWidth+chestGap))}]}]}>
            {Array.from({length:12},(_,i)=>{
              const angle=i*Math.PI/6;
              const radius=Math.min(150,stageSize.width*0.21);
              return <Animated.View key={i} style={[styles.spark,{backgroundColor:highlight,
                opacity:burst.interpolate({inputRange:[0,0.16,0.7,1],outputRange:[0,1,0.6,0]}),
                transform:[
                  {translateX:burst.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(angle)*radius]})},
                  {translateY:burst.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(angle)*radius-30]})},
                  {scale:burst.interpolate({inputRange:[0,1],outputRange:[0.3,i%3===0?1.6:0.85]})},
                ],
              }]}/>;
            })}
          </View>}
          {reward&&<View pointerEvents="none" style={styles.prizeAnchor}>
            <Animated.View style={[styles.halo,{borderColor:highlight,
              backgroundColor:glowFill,
              opacity:haloOpacity,transform:[{scale:haloScale}]}]}/>
            <Animated.View style={[styles.rewardArtwork,{opacity:prizeOpacity,
              transform:[{translateX:prizeX},{translateY:prizeY},{scale:prizeScale},{rotate:originRotation}]}]}>
              {art?<Image source={art} style={[styles.prizeImage,small&&styles.prizeImageSmall]} resizeMode="contain"/>
                :<Text style={[styles.emojiPrize,small&&styles.emojiPrizeSmall]}>
                  {reward.kind==='resource'?RESOURCE_ICONS[reward.resource]:reward.kind==='card'?'🃏':reward.kind==='car'?'🏎️':'🛠️'}
                </Text>}
              {reward.kind==='resource'&&<Text style={[styles.quantity,{color:highlight}]}>+{reward.amount}</Text>}
            </Animated.View>
            <Animated.View style={[styles.heroLabels,{opacity:heroText}]}>
              <Text style={[styles.category,{color:highlight}]}>{rewardCategory(reward,t)}</Text>
              <Text numberOfLines={2} style={[styles.itemName,small&&styles.itemNameSmall]}>
                {reward.kind==='resource'?`${reward.amount} ${t(`chest.${reward.resource}`)}`:reward.label}
              </Text>
              <Text style={[styles.rarity,{borderColor:highlight,color:highlight}]}>{rarityTitle(reward,t)}</Text>
              <Text style={styles.itemDetail}>{preview?t('chest.demo'):rewardDetail(reward,t)}</Text>
            </Animated.View>
          </View>}
          <Animated.View pointerEvents="none" style={[styles.screenFlash,{opacity:flash}]}/>
        </Animated.View>

        <View style={[styles.footer,compact&&styles.footerCompact]}>
          {phase==='idle'&&<Text style={styles.hint}>{t('chest.chooseHint')}</Text>}
          {phase==='choosing'&&<Text style={styles.hint}>{t('chest.confirming')}</Text>}
          {phase==='cinematic'&&<Text style={styles.hint}>✦ {cinematicStep==='opening'?t('chest.opening'):cinematicStep==='revealing'?t('chest.revealing'):t('chest.focus')} ✦</Text>}
          {!!error&&<Text style={styles.error}>{error}</Text>}
          {sync==='deferred'&&isHero&&!preview&&<Text style={styles.hint}>{t('chest.deferred')}</Text>}
          {isHero&&<View style={styles.actions}>
            {preview&&<TouchableOpacity style={styles.buttonSecondary} onPress={()=>setDemoCategory(v=>(v+1)%DEMO_SPECIALS.length)}>
              <Text style={styles.buttonSecondaryText}>{t('chest.testAnother')}</Text>
            </TouchableOpacity>}
            <TouchableOpacity style={styles.buttonGold} onPress={()=>router.back()}>
              <Text style={styles.buttonGoldText}>{preview?t('chest.exitPreview'):t('chest.continue')}</Text>
            </TouchableOpacity>
          </View>}
          {phase==='idle'&&<TouchableOpacity onPress={()=>router.back()}><Text style={styles.backText}>{t('chest.back')}</Text></TouchableOpacity>}
        </View>
      </>}
    </SafeAreaView>
  </LinearGradient>;
}

const styles=StyleSheet.create({
  root:{flex:1},safe:{flex:1,paddingHorizontal:18,paddingVertical:6},
  head:{alignItems:'center',paddingTop:6,gap:3},headCompact:{paddingTop:0,gap:1},
  eyebrow:{fontSize:9,letterSpacing:2,color:'#72BEE8',fontWeight:'800',textAlign:'center'},
  title:{fontSize:25,color:'#FFFFFF',fontWeight:'900',letterSpacing:2,textAlign:'center'},
  titleSmall:{fontSize:19,letterSpacing:1},
  subtitle:{fontSize:9,letterSpacing:1.3,color:'#B9C9DD',fontWeight:'800',textAlign:'center'},
  previewPill:{fontSize:9,fontWeight:'800',color:'#F8DA9D',backgroundColor:'rgba(154,100,20,0.23)',
    borderRadius:7,paddingHorizontal:10,paddingVertical:3,overflow:'hidden',textAlign:'center'},
  stage:{flex:1,minHeight:160,justifyContent:'center',alignItems:'center',overflow:'hidden'},
  backgroundOrbits:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center'},
  orbit:{position:'absolute',borderWidth:1,borderColor:'rgba(93,156,218,0.13)',borderRadius:500},
  orbitInner:{borderColor:'rgba(222,195,124,0.11)'},
  ambientParticle:{position:'absolute',height:4,width:4,borderRadius:3,backgroundColor:'#B7E6FF'},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'center',width:'100%',zIndex:2},
  slot:{minHeight:136,alignItems:'center',justifyContent:'center',paddingVertical:6,borderRadius:17,
    backgroundColor:'rgba(21,42,71,0.24)'},
  slotSmall:{minHeight:105},chestNumber:{fontSize:10,letterSpacing:2,fontWeight:'900',color:'#C0D2E6',marginBottom:9},
  chestGraphic:{width:'86%',height:113,alignItems:'center',justifyContent:'flex-end'},
  chestGraphicSmall:{height:78},chestAura:{position:'absolute',width:'95%',height:'45%',bottom:0,borderRadius:90,backgroundColor:'rgba(247,190,90,0.07)'},
  chestLid:{width:'92%',height:37,borderTopLeftRadius:32,borderTopRightRadius:32,
    backgroundColor:'#54708A',borderWidth:4,borderColor:'#B6C8D5',
    flexDirection:'row',justifyContent:'space-around',overflow:'hidden',zIndex:3},
  chestLidSmall:{height:26,borderWidth:3},lidMetal:{backgroundColor:'#C3AA70',width:12,height:'100%'},
  chestBody:{width:'96%',height:69,alignItems:'center',justifyContent:'space-evenly',flexDirection:'row',
    borderRadius:9,borderWidth:3,borderColor:'#B7A676',overflow:'hidden',zIndex:2},
  chestBodySmall:{height:46},chestHighlight:{borderColor:'#FFD871'},
  bodyStrip:{width:11,height:'100%',backgroundColor:'rgba(251,195,103,0.7)'},
  chestLock:{width:28,height:28,position:'absolute',borderRadius:7,alignItems:'center',justifyContent:'center',
    backgroundColor:'#F7CC74',borderWidth:2,borderColor:'#745024'},lockSymbol:{color:'#5C3C17',fontWeight:'900'},
  innerLight:{position:'absolute',height:32,width:'78%',top:14,borderRadius:24,backgroundColor:'rgba(255,214,125,0.85)',zIndex:1},
  floorShadow:{height:7,width:'94%',backgroundColor:'rgba(0,0,0,0.27)',borderRadius:40},
  tap:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#82CFFF',marginTop:7},
  prizeAnchor:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',zIndex:4},
  burstOrigin:{position:'absolute',left:'50%',top:'53%',width:0,height:0,zIndex:3,alignItems:'center',justifyContent:'center'},
  spark:{position:'absolute',width:7,height:7,borderRadius:8},
  halo:{position:'absolute',width:210,height:210,borderRadius:150,borderWidth:2,top:'13%',alignSelf:'center',
    shadowColor:'#EFC966',shadowOpacity:.5,shadowRadius:32},
  rewardArtwork:{position:'absolute',top:'9%',left:0,right:0,height:'60%',alignItems:'center',justifyContent:'center',zIndex:3},
  prizeImage:{height:'84%',width:'82%',maxWidth:300},prizeImageSmall:{maxWidth:180,height:'82%'},
  emojiPrize:{fontSize:106,textAlign:'center'},emojiPrizeSmall:{fontSize:72},
  quantity:{fontSize:29,fontWeight:'900',letterSpacing:1,marginTop:-12,textShadowColor:'rgba(0,0,0,.8)',textShadowRadius:12},
  heroLabels:{position:'absolute',bottom:0,left:5,right:5,alignItems:'center',gap:3,zIndex:5},
  category:{fontSize:10,fontWeight:'900',letterSpacing:2.5},
  itemName:{fontSize:23,color:'#FFFFFF',fontWeight:'900',letterSpacing:1.4,textAlign:'center'},
  itemNameSmall:{fontSize:17},rarity:{fontSize:9,fontWeight:'900',letterSpacing:1.5,borderWidth:1,
    paddingHorizontal:12,paddingVertical:2,borderRadius:12,overflow:'hidden'},
  itemDetail:{fontSize:10,color:'#B7C9DE',textAlign:'center'},
  screenFlash:{...StyleSheet.absoluteFillObject,backgroundColor:'#FFF9DE',zIndex:10},
  footer:{alignItems:'center',justifyContent:'flex-end',minHeight:62,gap:8,paddingBottom:4},
  footerCompact:{minHeight:45,gap:3},
  hint:{fontSize:10,fontWeight:'700',color:'#A5BCD4',textAlign:'center'},
  status:{fontSize:13,fontWeight:'800',color:'#C5D6EB',textAlign:'center'},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:14},
  error:{fontSize:10,color:'#FF979C',fontWeight:'700',textAlign:'center'},
  actions:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap'},
  buttonGold:{backgroundColor:'#F5CC6F',paddingVertical:11,paddingHorizontal:20,borderRadius:10,minWidth:120,alignItems:'center'},
  buttonGoldText:{color:'#18243B',fontSize:11,fontWeight:'900',letterSpacing:0.7},
  buttonSecondary:{backgroundColor:'#274C72',paddingVertical:11,paddingHorizontal:15,borderRadius:10,alignItems:'center'},
  buttonSecondaryText:{fontSize:10,fontWeight:'900',color:'#DCEEFF'},
  backText:{color:'#ADC2D5',fontWeight:'800',fontSize:10,letterSpacing:1},
});
