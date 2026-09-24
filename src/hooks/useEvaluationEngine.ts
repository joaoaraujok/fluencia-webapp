import { useEffect, useRef, useState } from 'react';
import { compareSpeech, generatePracticeRecommendations } from '../services/analysisEngine';
import { audioService } from '../services/audioService';
import { saveEvaluationSession } from '../services/db';
import { speechService } from '../services/speechService';
import { ChildProfile } from '../types/child';
import {
  DifficultyLevel,
  EvaluationItemResult,
  EvaluationMode,
  EvaluationSession,
  LevelScore
} from '../types/evaluation';
import { QuestionItem } from '../types/question';
import { AppSettings } from '../types/settings';

export type EvaluationPhase = 'idle' | 'preparing' | 'testing' | 'completed';

interface UseEvaluationEngineProps {
  items: QuestionItem[];
  mode: EvaluationMode;
  settings: AppSettings;
  activeChild?: ChildProfile | null;
  onFinished: (session: EvaluationSession) => void;
}

export function useEvaluationEngine({
  items,
  mode,
  settings,
  activeChild,
  onFinished
}: UseEvaluationEngineProps) {
  const [phase, setPhase] = useState<EvaluationPhase>('idle');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [preparationCount, setPreparationCount] = useState<number>(3);
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(3);
  const [totalItemDurationSec, setTotalItemDurationSec] = useState<number>(3);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [evaluatedItems, setEvaluatedItems] = useState<EvaluationItemResult[]>([]);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);

  // Refs para garantir estado sincronizado em callbacks assíncronos e evitar travamento por stale closure
  const currentIndexRef = useRef<number>(0);
  const currentItemRef = useRef<QuestionItem | null>(null);
  const evaluatedItemsRef = useRef<EvaluationItemResult[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Iniciar a avaliação completa com pré-aquecimento do microfone
  const startEvaluation = () => {
    if (items.length === 0) return;
    setEvaluatedItems([]);
    evaluatedItemsRef.current = [];
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setPreparationCount(3);
    setIsSuccessFeedback(false);
    setPhase('preparing');
    audioService.setEnabled(settings.soundEnabled);

    // Pré-aquecimento da conexão com o microfone e servidor de fala durante o 3-2-1
    // Elimina completamente o cold-start (handshake de 1.5s - 2.5s) no celular!
    speechService.startEvaluationSession(
      (listening) => setIsMicListening(listening),
      (err) => console.warn('Aviso do microfone na sessão contínua:', err)
    );

    // Contagem regressiva 3, 2, 1
    let count = 3;
    audioService.playCountdownBeep(0);

    const prepInterval = window.setInterval(() => {
      count--;
      if (count > 0) {
        setPreparationCount(count);
        audioService.playCountdownBeep(3 - count);
      } else {
        clearInterval(prepInterval);
        audioService.playStartChime();
        // Inicia o primeiro item com o microfone já 100% aquecido e ouvindo
        setPhase('testing');
        startItem(0);
      }
    }, 1000);
  };

  const startItem = (index: number) => {
    if (index >= items.length) {
      finishEvaluation();
      return;
    }

    const item = items[index];
    currentIndexRef.current = index;
    currentItemRef.current = item;
    setCurrentIndex(index);
    setLiveTranscript('');
    setIsSuccessFeedback(false);
    isTransitioningRef.current = false;

    // Determina duração: se for frase usa phraseDurationSec, senão wordDurationSec
    const duration = item.type === 'phrase' ? settings.phraseDurationSec : settings.wordDurationSec;
    setTotalItemDurationSec(duration);
    setTimeRemainingSec(duration);

    const startTime = Date.now();
    const durationMs = duration * 1000;

    // Função auxiliar para acionamento imediato de acerto (reduz a percepção de demora no celular)
    const triggerImmediateSuccess = (matchedTranscript: string, confidence: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsSuccessFeedback(true);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setLiveTranscript(matchedTranscript);
      const elapsed = Date.now() - startTime;

      // Breve pausa sutil de 250ms para a criança e o educador verem o feedback positivo
      window.setTimeout(async () => {
        await completeCurrentItem(index, item, elapsed, matchedTranscript, confidence);
      }, 250);
    };

    // Prepara o próximo item com instância isolada e sem resíduo do item anterior
    speechService.prepareNextItem({
      expectedText: item.text,
      onTranscriptUpdate: (transcript) => {
        setLiveTranscript(transcript);

        // Auto-avanço para Educação Infantil:
        // Assim que a fala atinge correspondência com o esperado, valida imediatamente
        if (transcript && !isTransitioningRef.current) {
          const quickCheck = compareSpeech(item, transcript, 1.0);
          if (quickCheck.status === 'CORRETO') {
            triggerImmediateSuccess(item.text.toLowerCase(), 1.0);
          }
        }
      },
      onMatch: (_matchedTranscript, confidence) => {
        // Validação ultra-rápida via alternativas de hipóteses fonéticas
        triggerImmediateSuccess(item.text.toLowerCase(), confidence);
      },
      checkMatch: (alternatives) => {
        for (const alt of alternatives) {
          const check = compareSpeech(item, alt, 1.0);
          if (check.status === 'CORRETO') {
            return { matched: true, transcript: item.text.toLowerCase(), confidence: 1.0 };
          }
        }
        return null;
      }
    });

    // Inicia contador regressivo de precisão (a cada 100ms)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeRemainingSec(remaining);

      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          await completeCurrentItem(index, item, durationMs);
        }
      }
    }, 100);
  };

  const completeCurrentItem = async (
    itemIndex: number,
    item: QuestionItem,
    plannedDurationMs: number,
    explicitTranscript?: string,
    explicitConfidence?: number
  ) => {
    let transcript = explicitTranscript;
    let confidence = explicitConfidence ?? 1.0;
    let durationMs = plannedDurationMs;

    if (transcript === undefined) {
      // Consome o resultado do item atual e encerra a escuta do item
      const itemResult = speechService.consumeItemResult();
      transcript = itemResult.transcript;
      confidence = itemResult.confidence;
      durationMs = itemResult.durationMs || plannedDurationMs;
    }

    // Compara fala da criança com tolerâncias fonéticas de Educação Infantil
    const comparison = compareSpeech(item, transcript, confidence);

    // Se a criança acertou a palavra alvo (mesmo que com hesitação prévia ou som ambiente),
    // registramos a palavra correta limpa para não poluir o relatório do educador
    let displayTranscript = transcript || comparison.normalizedTranscript;
    if (comparison.status === 'CORRETO' && item.type === 'word') {
      displayTranscript = item.text.toLowerCase();
    }

    const itemResult: EvaluationItemResult = {
      questionId: item.id,
      targetText: item.text,
      level: item.level,
      type: item.type,
      syllableStructure: item.syllableStructure,
      category: item.category,
      transcript: displayTranscript,
      status: comparison.status,
      responseTimeMs: durationMs || plannedDurationMs,
      confidence,
      observedError: comparison.observedError
    };

    evaluatedItemsRef.current.push(itemResult);
    setEvaluatedItems([...evaluatedItemsRef.current]);

    // Transição suave e sutil (sem indicar erro ou acerto para a criança)
    audioService.playTransitionTick();

    // Calcula o próximo índice com base no índice explícito recebido
    const nextIndex = itemIndex + 1;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    // Pequena pausa (150ms) para absorver a transição e avançar com o microfone continuamente quente
    await new Promise(r => setTimeout(r, 150));

    if (nextIndex < items.length) {
      // Avança para o próximo item
      startItem(nextIndex);
    } else {
      // Conclui avaliação
      finishEvaluation();
    }
  };

  const finishEvaluation = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Encerra definitivamente a sessão contínua do microfone
    speechService.stopEvaluationSession();

    const allItems = evaluatedItemsRef.current;
    const totalItems = allItems.length;

    let correctCount = 0;
    let possibleCount = 0;
    let incorrectCount = 0;
    let noResponseCount = 0;
    let unrecognizedCount = 0;
    let totalTimeMs = 0;

    const levelScores: Record<DifficultyLevel, LevelScore> = {
      1: { level: 1, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 },
      2: { level: 2, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 },
      3: { level: 3, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 },
      4: { level: 4, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 }
    };

    for (const item of allItems) {
      totalTimeMs += item.responseTimeMs;
      const lvl = item.level;
      levelScores[lvl].total += 1;
      levelScores[lvl].averageTimeMs += item.responseTimeMs;

      switch (item.status) {
        case 'CORRETO':
          correctCount++;
          levelScores[lvl].correct += 1;
          break;
        case 'POSSIVELMENTE_CORRETO':
          possibleCount++;
          levelScores[lvl].possible += 1;
          break;
        case 'INCORRETO':
          incorrectCount++;
          levelScores[lvl].incorrect += 1;
          break;
        case 'SEM_RESPOSTA':
          noResponseCount++;
          levelScores[lvl].noResponse += 1;
          break;
        default:
          unrecognizedCount++;
          break;
      }
    }

    // Calcula acurácia por nível
    for (const l of [1, 2, 3, 4] as DifficultyLevel[]) {
      const sc = levelScores[l];
      if (sc.total > 0) {
        sc.averageTimeMs = Math.round(sc.averageTimeMs / sc.total);
        sc.accuracy = Math.round(((sc.correct + sc.possible * 0.5) / sc.total) * 100);
      }
    }

    // Acurácia geral ponderada (corretos valem 1.0, possivelmente corretos valem 0.5)
    const effectivePoints = correctCount + possibleCount * 0.5;
    const accuracyPercentage = totalItems > 0 ? Math.round((effectivePoints / totalItems) * 100) : 0;
    const averageResponseTimeMs = totalItems > 0 ? Math.round(totalTimeMs / totalItems) : 0;

    const practiceRecommendations = generatePracticeRecommendations(allItems);

    const session: EvaluationSession = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      childId: activeChild?.id,
      childName: activeChild?.name || 'Criança em Avaliação',
      timestamp: Date.now(),
      mode,
      totalItems,
      correctCount,
      possibleCount,
      incorrectCount,
      noResponseCount,
      unrecognizedCount,
      accuracyPercentage,
      averageResponseTimeMs,
      items: allItems,
      levelScores,
      practiceRecommendations
    };

    // Salvar no IndexedDB
    try {
      await saveEvaluationSession(session);
    } catch (err) {
      console.error('Falha ao salvar sessão de avaliação:', err);
    }

    // Tocar comemoração suave
    audioService.playCelebration();
    setPhase('completed');
    onFinished(session);
  };

  const cancelEvaluation = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    speechService.stopEvaluationSession();
    setPhase('idle');
  };

  const skipCurrentItem = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const idx = currentIndexRef.current;
    const item = items[idx];
    if (item && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      completeCurrentItem(idx, item, totalItemDurationSec * 1000);
    }
  };

  // Limpeza no unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      speechService.stopEvaluationSession();
    };
  }, []);

  return {
    phase,
    currentItem: items[currentIndex] || currentItemRef.current || null,
    currentIndex,
    totalItems: items.length,
    preparationCount,
    timeRemainingSec,
    totalItemDurationSec,
    isMicListening,
    liveTranscript,
    isSuccessFeedback,
    evaluatedItems,
    startEvaluation,
    cancelEvaluation,
    skipCurrentItem
  };
}
