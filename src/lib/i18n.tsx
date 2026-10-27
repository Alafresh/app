/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react'

export type Language = 'es' | 'en'

export type GameMetaTranslation = {
  title: string
  short: string
  instruction: string
  success: string
  question: string
  reflectDuration: number
}

export type Translations = {
  hud: {
    experienceOf: (current: number, total: number) => string
    pause: string
    resume: string
    soundOn: string
    soundOff: string
    fullscreen: string
    exitFullscreen: string
    langSelectorLabel: string
  }
  intro: {
    systemReady: string
    brandTop: string
    brandBottom: string
    uniqueObject: string
    generatedForYou: string
    seed: string
    tagline: string
    heroPrimary: string
    heroHighlight: string
    specs: string
    startBtn: string
    footerIndex: string
  }
  gameShell: {
    olympics: string
    score: string
    time: string
    engineActive: string
    processing: string
    reflecting: string
    artifactSaved: string
    noFailure: string
    outputPaused: string
  }
  app: {
    saturationMeter: string
    outputApproved: string
    pauseInterrupted: string
    pauseTitle: string
    pauseDesc: string
    resumeBtn: string
    pauseHint: string
  }
  praise: {
    manufactured: (index: number) => string
    creativeValue: string
    uniqueSaved: (index: number) => string
  }
  finale: {
    fictionalReport: string
    congratulations: string
    completedNotice: (count: number) => string
    possibilities: string
    efficiency: string
    produced: string
    ranking: string
    footnote: string
    statement1: string
    statement2: string
    question: string
    replayBtn: string
    mark: string
  }
  games: GameMetaTranslation[]
  praiseLines: string[]
  gameplay: {
    tower: {
      blocksCertified: string
      dropBlock: string
      original: string
      masterpiece2: string
      masterpiece3: string
      revealBanner: string
    }
    runner: {
      jump: string
      slide: string
      distance: string
      avoided: string
      autopilot: string
    }
    snake: {
      availableSpace: string
      density: string
      expansion: string
      criticalSaturation: string
    }
    oneChoice: {
      awaitingChoice: string
      outcomesBranching: string
      takeShot: string
      choiceMade: string
      originalChoice: string
    }
    factory: {
      color: string
      form: string
      emptyPrompt: string
      automatedBanner: string
      originalStyle: string
      formula: string
      edition: string
    }
    break: {
      rule: string
      active: string
      broken: string
      ceiling: string
      hint: string
    }
  }
}

export const DICTIONARY: Record<Language, Translations> = {
  es: {
    hud: {
      experienceOf: (c, t) => `Experiencia ${c} de ${t}`,
      pause: 'Pausar experiencia (P)',
      resume: 'Reanudar experiencia (P)',
      soundOn: 'Activar sonido',
      soundOff: 'Silenciar sonido',
      fullscreen: 'Pantalla completa',
      exitFullscreen: 'Salir de pantalla completa',
      langSelectorLabel: 'Seleccionar idioma',
    },
    intro: {
      systemReady: 'MOTOR DE CREATIVIDAD ARTIFICIAL / LISTO',
      brandTop: 'TODOS SON',
      brandBottom: 'CREATIVOS',
      uniqueObject: 'OBJETO ÚNICO',
      generatedForYou: 'GENERADO PARA TI',
      seed: 'SEMILLA 001—∞',
      tagline: 'LA EXPERIENCIA DE CREATIVIDAD AUTOMATIZADA',
      heroPrimary: 'Tu imaginación.',
      heroHighlight: 'Producción ilimitada.',
      specs:
        '6 experiencias · aproximadamente 3 minutos\nNo requiere habilidad. Sonido opcional.',
      startBtn: 'VOLVERSE CREATIVO',
      footerIndex: 'UNA OBRA INTERACTIVA SOBRE CREAR, MULTIPLICAR Y SIGNIFICAR',
    },
    gameShell: {
      olympics: 'OLIMPIADAS CREATIVAS',
      score: 'PUNTAJE',
      time: 'TIEMPO',
      engineActive: 'MOTOR ACTIVO',
      processing: 'PROCESANDO...',
      reflecting: 'REFLEXIONANDO...',
      artifactSaved: 'ARTEFACTO GUARDADO',
      noFailure: 'SIN ESTADOS DE ERROR',
      outputPaused: 'PRODUCCIÓN PAUSADA',
    },
    app: {
      saturationMeter: 'SATURACIÓN GLOBAL DE PRODUCCIÓN',
      outputApproved: '✓ PRODUCCIÓN APROBADA',
      pauseInterrupted: 'PRODUCCIÓN INTERRUMPIDA',
      pauseTitle: 'LA PRODUCCIÓN PUEDE ESPERAR.',
      pauseDesc:
        'El temporizador está pausado. Tus casi-obras maestras están a salvo.',
      resumeBtn: 'REANUDAR CREACIÓN',
      pauseHint: 'Presiona P o ESC para reanudar',
    },
    praise: {
      manufactured: (idx) =>
        `OBRA MAESTRA ${String(idx + 1).padStart(2, '0')} FABRICADA CON ÉXITO`,
      creativeValue: 'VALOR CREATIVO',
      uniqueSaved: (idx) => `✓ CREACIÓN ÚNICA GUARDADA / EDICIÓN ${idx}`,
    },
    finale: {
      fictionalReport:
        'INFORME DEL SISTEMA FICTICIO / NO ES UNA MEDICIÓN CIENTÍFICA',
      congratulations: '¡FELICITACIONES!',
      completedNotice: (count) =>
        `HAS COMPLETADO ${count} EXPERIENCIAS CREATIVAS.`,
      possibilities: 'POSIBILIDADES GENERADAS',
      efficiency: 'EFICIENCIA CREATIVA',
      produced: 'OBRAS MAESTRAS PRODUCIDAS',
      ranking: 'RANKING GLOBAL DE CREATIVIDAD*',
      footnote: '*ENTRE TODOS LOS PARTICIPANTES IMAGINARIOS EN ESTA OBRA',
      statement1: 'Crear es más fácil que nunca.',
      statement2:
        'Crear algo que verdaderamente util sigue siendo igual de difícil.',
      question: '¿Qué crearías\nsi pudieras crear cualquier cosa?',
      replayBtn: 'EXPERIMENTAR DE NUEVO',
      mark: 'EIC™ / PRODUCCIÓN SIN FIN, PREGUNTAS PERDURABLES',
    },
    games: [
      {
        title: 'APILADOR DE TORRES',
        short: 'APILAR',
        instruction:
          'Haz clic, toca o presiona ESPACIO para soltar cada bloque en movimiento.',
        success: '¡INCREÍBLE!',
        question:
          '¿Está el valor en terminar algo, o en lo que hace que esa creación sea única?',
        reflectDuration: 8,
      },
      {
        title: 'CORREDOR DE BLOQUES',
        short: 'CORRER',
        instruction:
          'Salta sobre obstáculos o deslízate bajo barreras elevadas.',
        success: '¡OTRA OBRA MAESTRA!',
        question:
          'Hoy nuestras herramientas hacen el trabajo duro por nosotros. Toman decisiones y resuelven problemas que quizás ni siquiera entendemos.',
        reflectDuration: 8,
      },
      {
        title: 'SERPIENTE: MÁS, MÁS, MÁS',
        short: 'CRECER',
        instruction:
          'Usa las flechas, WASD, desliza o el control direccional para recolectar.',
        success: '¡ERES UN TALENTO NATURAL!',
        question:
          'El crecimiento sin propósito puede convertirse en saturación.',
        reflectDuration: 8,
      },
      {
        title: 'UNA SOLA ELECCIÓN',
        short: 'ELEGIR',
        instruction:
          'Apunta con el cursor y haz clic una vez — o presiona ESPACIO.',
        success: '¡NIVEL DE CREATIVIDAD: EXCEPCIONAL!',
        question:
          'Tener infinitas posibilidades no elimina la necesidad de elegir.',
        reflectDuration: 8,
      },
      {
        title: 'FÁBRICA DE COLOR',
        short: 'COMPONER',
        instruction:
          'Elige un color y una forma, luego haz clic en el lienzo para componer.',
        success: '¡HA NACIDO UN ESTILO!',
        question:
          'Un estilo reconocible puede convertirse en una fórmula repetida.',
        reflectDuration: 8,
      },
      {
        title: 'ROMPER TODO',
        short: 'ROMPER',
        instruction: 'Mueve la paleta con el cursor, las flechas o el tacto.',
        success: '¡PRODUCCIÓN IMPARABLE!',
        question:
          'Producir más no siempre resuelve el problema. A veces, lo multiplica.',
        reflectDuration: 8,
      },
    ],
    praiseLines: [
      'Una visión singular. Certificada por el motor.',
      'Tus habilidades de evasión son genuinamente asombrosas.',
      'El crecimiento te sienta bien. Más es más.',
      'Una decisión. Infinito potencial de marca personal.',
      'Este estilo exacto es tendencia ahora para otras 8.492 personas.',
      'Destruiste bloques. El sistema creó el doble.',
    ],
    gameplay: {
      tower: {
        blocksCertified: 'BLOQUES CERTIFICADOS',
        dropBlock: 'SOLTAR BLOQUE',
        original: 'ORIGINAL',
        masterpiece2: 'OBRA MAESTRA #002',
        masterpiece3: 'OBRA MAESTRA #003',
        revealBanner:
          '⚡ REVELACIÓN AUTOMATIZADA: VARIACIONES GENERADAS A PARTIR DEL ORIGINAL',
      },
      runner: {
        jump: 'SALTAR',
        slide: 'DESLIZAR',
        distance: 'DISTANCIA',
        avoided: 'EVADIDOS',
        autopilot:
          '⚡ DELEGACIÓN AUTÓNOMA: EL SISTEMA RESUELVE PROBLEMAS AUTOMÁTICAMENTE',
      },
      snake: {
        availableSpace: 'ESPACIO DISPONIBLE',
        density: 'DENSIDAD',
        expansion: 'EXPANSIÓN EXPONENCIAL',
        criticalSaturation:
          'SATURACIÓN CRÍTICA ALCANZADA / MOVIMIENTO IMPOSIBLE',
      },
      oneChoice: {
        awaitingChoice: 'UNA DECISIÓN EN ESPERA DE EJECUCIÓN [1 PROYECTIL]',
        outcomesBranching: 'RESULTADOS RAMIFICADOS',
        takeShot: 'TOMAR LA ELECCIÓN',
        choiceMade: 'ELECCIÓN DESATADA',
        originalChoice: 'ELECCIÓN ORIGINAL',
      },
      factory: {
        color: 'COLOR',
        form: 'FORMA',
        emptyPrompt: 'HAZ CLIC EN CUALQUIER LUGAR PARA FABRICAR SIGNIFICADO',
        automatedBanner:
          '⚡ REPRODUCCIÓN AUTOMÁTICA: UN ESTILO EXPANDIDO EN UNA FÓRMULA REPETIDA',
        originalStyle: '★ ESTILO ORIGINAL',
        formula: 'FÓRMULA',
        edition: 'EDICIÓN',
      },
      break: {
        rule: 'REGLA: 1 DESTRUIDO → 2 GENERADOS',
        active: 'ACTIVOS',
        broken: 'ROTOS',
        ceiling: 'LÍMITE DEL SISTEMA ALCANZADO / MÁXIMA DENSIDAD',
        hint: '← MUEVE LA PALETA CON TACTO / RATÓN / FLECHAS →',
      },
    },
  },
  en: {
    hud: {
      experienceOf: (c, t) => `Experience ${c} of ${t}`,
      pause: 'Pause experience (P)',
      resume: 'Resume experience (P)',
      soundOn: 'Sound on',
      soundOff: 'Sound off',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit fullscreen',
      langSelectorLabel: 'Select language',
    },
    intro: {
      systemReady: 'ARTIFICIAL CREATIVITY ENGINE / READY',
      brandTop: 'EVERYONE IS',
      brandBottom: 'CREATIVE',
      uniqueObject: 'UNIQUE OBJECT',
      generatedForYou: 'GENERATED FOR YOU',
      seed: 'SEED 001—∞',
      tagline: 'THE AUTOMATED CREATIVITY EXPERIENCE',
      heroPrimary: 'Your imagination.',
      heroHighlight: 'Unlimited output.',
      specs:
        '6 experiences · approximately 3 minutes\nNo skill required. Sound optional.',
      startBtn: 'BECOME CREATIVE',
      footerIndex: 'AN INTERACTIVE ARTWORK ABOUT MAKING, MULTIPLYING & MEANING',
    },
    gameShell: {
      olympics: 'CREATIVE OLYMPICS',
      score: 'SCORE',
      time: 'TIME',
      engineActive: 'ENGINE ACTIVE',
      processing: 'PROCESSING...',
      reflecting: 'REFLECTING...',
      artifactSaved: 'ARTIFACT AUTO-SAVED',
      noFailure: 'NO FAILURE STATES',
      outputPaused: 'OUTPUT PAUSED',
    },
    app: {
      saturationMeter: 'GLOBAL OUTPUT SATURATION',
      outputApproved: '✓ OUTPUT APPROVED',
      pauseInterrupted: 'PRODUCTION INTERRUPTED',
      pauseTitle: 'OUTPUT CAN WAIT.',
      pauseDesc: 'The timer is paused. Your almost-masterpieces are safe.',
      resumeBtn: 'RESUME CREATING',
      pauseHint: 'Press P or ESC to resume',
    },
    praise: {
      manufactured: (idx) =>
        `MASTERPIECE ${String(idx + 1).padStart(2, '0')} SUCCESSFULLY MANUFACTURED`,
      creativeValue: 'CREATIVE VALUE',
      uniqueSaved: (idx) => `✓ UNIQUE CREATION SAVED / EDITION ${idx}`,
    },
    finale: {
      fictionalReport: 'FICTIONAL SYSTEM REPORT / NOT A SCIENTIFIC MEASUREMENT',
      congratulations: 'CONGRATULATIONS!',
      completedNotice: (count) =>
        `YOU HAVE COMPLETED ${count} CREATIVE EXPERIENCES.`,
      possibilities: 'POSSIBILITIES GENERATED',
      efficiency: 'CREATIVE EFFICIENCY',
      produced: 'MASTERPIECES PRODUCED',
      ranking: 'GLOBAL CREATIVITY RANKING*',
      footnote: '*AMONG ALL IMAGINARY PARTICIPANTS IN THIS ARTWORK',
      statement1: 'Creating is easier than ever.',
      statement2:
        'Creating something that truly matters is still just as difficult.',
      question: 'What would you create\nif you could create anything?',
      replayBtn: 'EXPERIENCE AGAIN',
      mark: 'EIC™ / ENDLESS OUTPUT, ENDURING QUESTIONS',
    },
    games: [
      {
        title: 'TOWER STACK',
        short: 'STACK',
        instruction: 'Click, tap, or press SPACE to drop each moving block.',
        success: 'INCREDIBLE!',
        question:
          'Is the value in finishing something, or in what makes that creation unique?',
        reflectDuration: 8,
      },
      {
        title: 'CHUNK RUNNER',
        short: 'RUN',
        instruction:
          'Click, tap, or press SPACE to jump over obstacles or slide under barriers.',
        success: 'ANOTHER MASTERPIECE!',
        question:
          'Today, our tools do the hard work for us. They make decisions and solve problems we may not even understand. What do we stop understanding when we delegate the entire process?',
        reflectDuration: 8,
      },
      {
        title: 'SNAKE: MORE, MORE, MORE',
        short: 'GROW',
        instruction:
          'Use arrows, WASD, swipe, or the direction pad to collect.',
        success: 'YOU ARE A NATURAL!',
        question: 'Growth without purpose can turn into saturation.',
        reflectDuration: 8,
      },
      {
        title: 'ONE CHOICE',
        short: 'CHOOSE',
        instruction: 'Aim with your pointer, then click once — or press SPACE.',
        success: 'CREATIVITY LEVEL: EXCEPTIONAL!',
        question:
          'Having infinite possibilities does not eliminate the need to choose.',
        reflectDuration: 8,
      },
      {
        title: 'COLOR FACTORY',
        short: 'COMPOSE',
        instruction:
          'Choose a color and shape, then click the canvas to compose.',
        success: 'A SIGNATURE STYLE IS BORN!',
        question: 'A recognizable style can become a repeated formula.',
        reflectDuration: 8,
      },
      {
        title: 'BREAK EVERYTHING',
        short: 'BREAK',
        instruction: 'Move the paddle with your pointer, arrows, or touch.',
        success: 'UNSTOPPABLE OUTPUT!',
        question:
          'Producing more does not always solve the problem. Sometimes, it multiplies it.',
        reflectDuration: 8,
      },
    ],
    praiseLines: [
      'A singular vision. Certified by the engine.',
      'Your avoidance skills are genuinely breathtaking.',
      'Growth looks good on you. More is more.',
      'One decision. Infinite personal branding potential.',
      'This exact style is now trending for 8,492 others.',
      'You destroyed blocks. The system made twice as many.',
    ],
    gameplay: {
      tower: {
        blocksCertified: 'BLOCKS CERTIFIED',
        dropBlock: 'DROP BLOCK',
        original: 'ORIGINAL',
        masterpiece2: 'MASTERPIECE #002',
        masterpiece3: 'MASTERPIECE #003',
        revealBanner:
          '⚡ AUTOMATED REVEAL: VARIATIONS GENERATED FROM THE ORIGINAL',
      },
      runner: {
        jump: 'JUMP',
        slide: 'SLIDE',
        distance: 'DISTANCE',
        avoided: 'AVOIDED',
        autopilot:
          '⚡ AUTONOMOUS DELEGATION: SYSTEM SOLVING PROBLEMS AUTOMATICALLY',
      },
      snake: {
        availableSpace: 'AVAILABLE SPACE',
        density: 'DENSITY',
        expansion: 'EXPONENTIAL EXPANSION',
        criticalSaturation: 'CRITICAL SATURATION REACHED / MOVEMENT IMPOSSIBLE',
      },
      oneChoice: {
        awaitingChoice: 'ONE DECISION AWAITING EXECUTION [1 PROJECTILE]',
        outcomesBranching: 'OUTCOMES BRANCHING',
        takeShot: 'MAKE THE CHOICE',
        choiceMade: 'CHOICE UNLEASHED',
        originalChoice: 'ORIGINAL CHOICE',
      },
      factory: {
        color: 'COLOR',
        form: 'FORM',
        emptyPrompt: 'CLICK ANYWHERE TO MANUFACTURE MEANING',
        automatedBanner:
          '⚡ AUTOMATED REPRODUCTION: ONE STYLE EXPANDED INTO A REPEATED FORMULA',
        originalStyle: '★ ORIGINAL STYLE',
        formula: 'FORMULA',
        edition: 'EDITION',
      },
      break: {
        rule: 'RULE: 1 DESTROYED → 2 GENERATED',
        active: 'ACTIVE',
        broken: 'BROKEN',
        ceiling: 'SYSTEM CEILING REACHED / MAXIMUM DENSITY',
        hint: '← MOVE PADDLE WITH TOUCH / MOUSE / ARROWS →',
      },
    },
  },
}

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: DICTIONARY.es,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('es')
  const t = useMemo(() => DICTIONARY[lang], [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
