import { useLanguage } from '@/context/LanguageContext';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TutorialStep =
  | 'perfect_start'
  | 'accelerate'
  | 'brake'
  | 'card'
  | 'draft'
  | 'nitro'
  | 'finish';

type TutorialCopy = {
  title: string;
  body: string;
};

type Props = {
  visible: boolean;
  step: TutorialStep;
  perfectStartHits?: number;
  onSkip: () => void;
};

const STEP_ORDER: TutorialStep[] = [
  'perfect_start',
  'accelerate',
  'brake',
  'card',
  'draft',
  'nitro',
  'finish',
];

const COPY: Record<
  'pt-BR' | 'en' | 'es',
  Record<TutorialStep, TutorialCopy>
> = {
  'pt-BR': {
    perfect_start: {
      title: 'LARGADA PERFEITA ⚡',
      body: 'Acerte os 3 botões ⚡ durante a contagem regressiva para começar com Nitro!',
    },
    accelerate: {
      title: 'ACELERE',
      body: 'Arraste o controle inferior para a direita para ganhar velocidade.',
    },
    brake: {
      title: 'FREIE',
      body: 'Agora arraste o mesmo controle para a esquerda para reduzir a velocidade.',
    },
    card: {
      title: 'USE UMA CARTA',
      body: 'Toque em uma carta. Cada carta consome Boost e pode mudar a corrida.',
    },
    draft: {
      title: 'PEGUE O VÁCUO',
      body: 'Fique logo atrás de um rival. O vácuo carrega seu Nitro automaticamente.',
    },
    nitro: {
      title: 'SOLTE O NITRO',
      body: 'Quando o indicador chegar a 100% e o botão NITRO acender, toque nele.',
    },
    finish: {
      title: 'AGORA É COM VOCÊ',
      body: 'Corra até o fim. Sobreviva para levar os recursos coletados e busque o 1º lugar para ganhar um troféu!',
    },
  },
  en: {
    perfect_start: {
      title: 'PERFECT START ⚡',
      body: 'Hit all 3 ⚡ buttons during the countdown to start the race with Nitro!',
    },
    accelerate: {
      title: 'ACCELERATE',
      body: 'Drag the bottom control to the right to gain speed.',
    },
    brake: {
      title: 'BRAKE',
      body: 'Now drag the same control to the left to slow the car down.',
    },
    card: {
      title: 'USE A CARD',
      body: 'Tap a card. Every card costs Boost and can change the race.',
    },
    draft: {
      title: 'CATCH THE DRAFT',
      body: 'Stay right behind a rival. Drafting automatically charges your Nitro.',
    },
    nitro: {
      title: 'USE NITRO',
      body: 'When the meter reaches 100% and NITRO lights up, tap the button.',
    },
    finish: {
      title: 'YOUR TURN',
      body: 'Race to the finish. Survive to keep collected resources and take 1st place to earn a trophy!',
    },
  },
  es: {
    perfect_start: {
      title: 'SALIDA PERFECTA ⚡',
      body: '¡Acierta los 3 botones ⚡ durante la cuenta atrás para empezar con Nitro!',
    },
    accelerate: {
      title: 'ACELERA',
      body: 'Desliza el control inferior hacia la derecha para ganar velocidad.',
    },
    brake: {
      title: 'FRENA',
      body: 'Ahora desliza el mismo control hacia la izquierda para reducir la velocidad.',
    },
    card: {
      title: 'USA UNA CARTA',
      body: 'Toca una carta. Cada carta consume Boost y puede cambiar la carrera.',
    },
    draft: {
      title: 'APROVECHA EL REBUFO',
      body: 'Mantente justo detrás de un rival. El rebufo carga tu Nitro automáticamente.',
    },
    nitro: {
      title: 'USA EL NITRO',
      body: 'Cuando el indicador llegue al 100% y NITRO se encienda, toca el botón.',
    },
    finish: {
      title: 'AHORA TE TOCA',
      body: 'Llega al final. Sobrevive para conservar los recursos y termina 1º para ganar un trofeo.',
    },
  },
};

const SKIP_LABEL = {
  'pt-BR': 'PULAR',
  en: 'SKIP',
  es: 'SALTAR',
} as const;

const PERFECT_START_SUCCESS = {
  'pt-BR': {
    title: 'LARGADA PERFEITA! ⚡',
    body: '3/3! Nitro ativado. Aproveite o impulso e prepare-se para assumir o controle.',
  },
  en: {
    title: 'PERFECT START! ⚡',
    body: '3/3! Nitro activated. Enjoy the boost and get ready to take control.',
  },
  es: {
    title: '¡SALIDA PERFECTA! ⚡',
    body: '¡3/3! Nitro activado. Aprovecha el impulso y prepárate para tomar el control.',
  },
} as const;

export default function RaceTutorialOverlay({
  visible,
  step,
  perfectStartHits = 0,
  onSkip,
}: Props) {
  const { language } = useLanguage();

  const lang: 'pt-BR' | 'en' | 'es' =
    language === 'en'
      ? 'en'
      : language === 'es'
        ? 'es'
        : 'pt-BR';

  const copy = COPY[lang][step];
  const activeCopy =
    step === 'perfect_start' && perfectStartHits >= 3
      ? PERFECT_START_SUCCESS[lang]
      : copy;

  const stepNumber = useMemo(
    () => STEP_ORDER.indexOf(step) + 1,
    [step],
  );

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={styles.host}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.stepText}>
            {String(stepNumber).padStart(2, '0')} / {String(STEP_ORDER.length).padStart(2, '0')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.72}
            onPress={onSkip}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>
              {SKIP_LABEL[lang]}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {activeCopy.title}
        </Text>

        <Text style={styles.body}>
          {activeCopy.body}
        </Text>

        {step === 'perfect_start' && (
          <View style={styles.perfectStartCounter}>
            {[0, 1, 2].map(index => (
              <View
                key={`perfect-start-${index}`}
                style={[
                  styles.perfectStartHit,
                  index < perfectStartHits && styles.perfectStartHitDone,
                ]}
              >
                <Text style={styles.perfectStartHitText}>⚡</Text>
              </View>
            ))}

            <Text style={styles.perfectStartCountText}>
              {Math.min(perfectStartHits, 3)}/3
            </Text>
          </View>
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(stepNumber / STEP_ORDER.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 132,
    zIndex: 210,
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  card: {
    width: '62%',
    maxWidth: 520,
    minWidth: 300,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(8, 10, 14, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.72)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 7,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },

  stepText: {
    color: '#FFD60A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  skipText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  body: {
    marginTop: 3,
    color: '#D5D9E2',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  perfectStartCounter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  perfectStartHit: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    opacity: 0.45,
  },

  perfectStartHitDone: {
    backgroundColor: 'rgba(255,214,10,0.22)',
    borderColor: '#FFD60A',
    opacity: 1,
  },

  perfectStartHitText: {
    fontSize: 15,
  },

  perfectStartCountText: {
    marginLeft: 3,
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '900',
  },

  progressTrack: {
    height: 3,
    marginTop: 9,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFD60A',
  },
});
