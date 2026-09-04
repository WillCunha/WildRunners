import { AudioContext } from '@/context/AudioContext';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Vibration, View } from 'react-native';

interface SwapEffectProps {
    allRacers: {
        id: string;
        x: number;
        color?: string;
        isPlayer?: boolean;
    }[];

    callerId: string;
    scaleAnim: Animated.Value;
    onTargetChange?: (targetId: string) => void;

    // Executa a troca real das coordenadas no ponto em que os carros já encolheram.
    onSwapExecute: (targetId: string) => void;

    // Só limpa activeSwap depois que a animação inversa terminou.
    onComplete?: () => void;

    // Garante limpeza caso o alvo/caller desapareça.
    onCancel?: () => void;
}

export default function SwapEffect({
    allRacers,
    callerId,
    scaleAnim,
    onTargetChange,
    onSwapExecute,
    onComplete,
    onCancel,
}: SwapEffectProps) {
    const { playCardSfx } = useContext(AudioContext);

    const [currentTarget, setCurrentTarget] = useState<string | null>(null);
    const [phase, setPhase] = useState<'aiming' | 'animating' | 'done'>('aiming');

    // Mantém posições e callbacks sempre atuais sem reiniciar os timers a cada frame.
    const racersRef = useRef(allRacers);
    const currentTargetRef = useRef<string | null>(null);
    const initialTargetIdsRef = useRef<string[]>([]);

    const onTargetChangeRef = useRef(onTargetChange);
    const onSwapExecuteRef = useRef(onSwapExecute);
    const onCompleteRef = useRef(onComplete);
    const onCancelRef = useRef(onCancel);
    const playCardSfxRef = useRef(playCardSfx);

    useEffect(() => {
        racersRef.current = allRacers;
    }, [allRacers]);

    useEffect(() => {
        onTargetChangeRef.current = onTargetChange;
        onSwapExecuteRef.current = onSwapExecute;
        onCompleteRef.current = onComplete;
        onCancelRef.current = onCancel;
        playCardSfxRef.current = playCardSfx;
    }, [
        onTargetChange,
        onSwapExecute,
        onComplete,
        onCancel,
        playCardSfx,
    ]);

    const publishTarget = (targetId: string) => {
        currentTargetRef.current = targetId;
        setCurrentTarget(targetId);
        onTargetChangeRef.current?.(targetId);
    };

    const chooseTarget = () => {
        const racers = racersRef.current;
        const caller = racers.find(r => r.id === callerId);

        if (!caller) return null;

        // Opção normal: qualquer corredor que esteja à frente neste momento.
        const aheadNow = racers.filter(
            r => r.id !== callerId && r.x > caller.x
        );

        if (aheadNow.length > 0) {
            return aheadNow[Math.floor(Math.random() * aheadNow.length)].id;
        }

        // Se a ordem mudou durante os 3 segundos da roleta, não anulamos a carta.
        const initialStillAlive = racers.filter(
            r =>
                r.id !== callerId &&
                initialTargetIdsRef.current.includes(r.id)
        );

        if (initialStillAlive.length === 0) return null;

        return initialStillAlive[
            Math.floor(Math.random() * initialStillAlive.length)
        ].id;
    };

    useEffect(() => {
        if (phase !== 'aiming') return;

        const racers = racersRef.current;
        const caller = racers.find(r => r.id === callerId);

        if (!caller) {
            setPhase('done');
            onCancelRef.current?.();
            return;
        }

        const initialTargets = racers.filter(
            r => r.id !== callerId && r.x > caller.x
        );

        initialTargetIdsRef.current = initialTargets.map(r => r.id);

        // Seleciona imediatamente. Isso mantém o Swap funcionando com somente um adversário.
        const firstTarget = chooseTarget();

        if (!firstTarget) {
            setPhase('done');
            onCancelRef.current?.();
            return;
        }

        publishTarget(firstTarget);

        const aimInterval = setInterval(() => {
            const nextTarget = chooseTarget();

            if (nextTarget) publishTarget(nextTarget);
        }, 500);

        const finishTimer = setTimeout(() => {
            setPhase('animating');
        }, 3000);

        return () => {
            clearInterval(aimInterval);
            clearTimeout(finishTimer);
        };
    }, [phase, callerId]);

    useEffect(() => {
        if (phase !== 'animating') return;

        let targetId = currentTargetRef.current;
        const racers = racersRef.current;

        if (!targetId || !racers.some(r => r.id === targetId)) {
            targetId = chooseTarget();

            if (targetId) {
                publishTarget(targetId);
            }
        }

        if (!targetId) {
            scaleAnim.setValue(1);
            setPhase('done');
            onCancelRef.current?.();
            return;
        }

        const finalTargetId = targetId;

        /*
         * O SFX começa junto com a sucção.
         *
         * O prompt do ElevenLabs tem o "pop" aproximadamente no meio
         * do efeito. Por isso o encolhimento dura ~500 ms e a troca real
         * acontece exatamente quando scale chega quase a zero.
         */
        playCardSfxRef.current('swap');

        // 1) Caller + alvo são "sugados" para o próprio centro.
        Animated.timing(scaleAnim, {
            toValue: 0.03,
            duration: 500,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished) return;

            // 2) O "POP" do áudio coincide aproximadamente com esta troca.
            onSwapExecuteRef.current(finalTargetId);
            Vibration.vibrate(100);

            // 3) Na nova posição, os dois se materializam novamente.
            Animated.spring(scaleAnim, {
                toValue: 1,
                speed: 14,
                bounciness: 4,
                useNativeDriver: true,
            }).start(({ finished: growFinished }) => {
                if (!growFinished) return;

                setPhase('done');
                onCompleteRef.current?.();
            });
        });

        return () => {
            scaleAnim.stopAnimation();
        };
    }, [phase, scaleAnim]);

    useEffect(() => {
        return () => {
            scaleAnim.stopAnimation();
            scaleAnim.setValue(1);
        };
    }, [scaleAnim]);

    if (phase === 'done') return null;

    return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;
}
