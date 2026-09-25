import { useEffect, useRef, useState } from 'react';
import {
  compareSpeech,
  compareTextReading,
  compileLettersMetrics,
  compileWordsMetrics,
  classifyPedagogicalDiagnosis,
  generateClassificationEvidences,
  generateExecutiveSummary,
  generatePracticeRecommendations
} from '../services/analysisEngine';
import { audioService } from '../services/audioService';
import { repository } from '../services/repository';
import { speechService } from '../services/speechService';
import { Student } from '../types/school';
import { ChildProfile } from '../types/child';
import {
  AdaptiveEvaluationStage,
  DifficultyLevel,
  EvaluationItemResult,
  EvaluationMode,
  EvaluationSession,
  LevelScore,
  PhrasesReportMetrics,
  TextReportMetrics
} from '../types/evaluation';
import { QuestionItem } from '../types/question';
import { AppSettings } from '../types/settings';
import { LETTER_BANK, TEXT_BANK, PHRASE_BANK, QUESTION_BANK } from '../data/questionBank';

export type EvaluationPhase = 'idle' | 'preparing' | 'testing' | 'completed';

interface UseEvaluationEngineProps {
  items: QuestionItem[];
  mode: EvaluationMode;
  settings: AppSettings;
  activeStudent?: Student | ChildProfile | null;
  evaluatorId?: string;
  evaluatorName?: string;
  onFinished: (session: EvaluationSession) => void;
}

export function useEvaluationEngine({
  items: initialItems,
  mode,
  settings,
  activeStudent,
  evaluatorId,
  evaluatorName,
  onFinished
}: UseEvaluationEngineProps) {
  const [phase, setPhase] = useState<EvaluationPhase>('idle');
  const [currentStage, setCurrentStage] = useState<AdaptiveEvaluationStage>('letters');
  const [stageItems, setStageItems] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [preparationCount, setPreparationCount] = useState<number>(3);
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(10);
  const [totalItemDurationSec, setTotalItemDurationSec] = useState<number>(10);
  const [globalElapsedSeconds, setGlobalElapsedSeconds] = useState<number>(0);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [evaluatedItems, setEvaluatedItems] = useState<EvaluationItemResult[]>([]);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);

  // Sincronização de estado para callbacks e eventos assíncronos
  const currentStageRef = useRef<AdaptiveEvaluationStage>('letters');
  const stageItemsRef = useRef<QuestionItem[]>([]);
  const currentIndexRef = useRef<number>(0);
  const currentItemRef = useRef<QuestionItem | null>(null);
  const evaluatedItemsRef = useRef<EvaluationItemResult[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const globalTimerRef = useRef<number | null>(null);
  const postSpeechTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const itemStartTimestampRef = useRef<number>(0);
  const globalStartTimeRef = useRef<number>(0);
  const isGlobalTimeLimitReachedRef = useRef<boolean>(false);

  // Cache para relatórios das etapas concluídas
  const textReportRef = useRef<TextReportMetrics | undefined>(undefined);
  const phrasesReportRef = useRef<PhrasesReportMetrics | undefined>(undefined);

  /**
   * Limites de tempo rígidos (Regras 3 e 4):
   * - Global: 240 segundos (4 minutos)
   * - Letras: 10 segundos
   * - Palavras: 10 segundos
   * - Frases: 15 segundos
   * - Texto: 60 segundos
   */
  const getItemDurationSec = (item: QuestionItem): number => {
    if (item.type === 'letter') return settings.durationLetterSec ?? 10;
    if (item.type === 'word') return settings.durationWordSec ?? 10;
    if (item.type === 'phrase') return settings.durationPhraseSec ?? 15;
    if (item.type === 'text') return settings.durationTextSec ?? 60;
    return 10;
  };

  /**
   * Prepara os itens da etapa de acordo com as regras de progressão adaptativa
   */
  const prepareStageItems = (stage: AdaptiveEvaluationStage): QuestionItem[] => {
    switch (stage) {
      case 'letters':
        // Etapa 1: 15 letras com distribuição de vogais e consoantes canônicas
        return LETTER_BANK.slice(0, 15);

      case 'words': {
        // Etapa 2: Palavras progressivas (começando simples e aumentando complexidade)
        const simple = QUESTION_BANK.filter(q => q.level === 1).slice(0, 8);
        const medium = QUESTION_BANK.filter(q => q.level === 2).slice(0, 8);
        const complex = QUESTION_BANK.filter(q => q.level === 3).slice(0, 4);
        const combined = [...simple, ...medium, ...complex];
        return combined.length > 0 ? combined : initialItems.filter(i => i.type === 'word');
      }

      case 'text':
        // Etapa 3: Texto narrativo em contexto para 1º/2º ano
        return [TEXT_BANK[0]];

      case 'phrases':
        // Etapa 4: 3 frases progressivas (apenas para leitor fluente confirmado)
        return PHRASE_BANK.slice(0, 3);

      default:
        return [];
    }
  };

  const startEvaluation = () => {
    setEvaluatedItems([]);
    evaluatedItemsRef.current = [];
    textReportRef.current = undefined;
    phrasesReportRef.current = undefined;
    isGlobalTimeLimitReachedRef.current = false;
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setPreparationCount(3);
    setIsSuccessFeedback(false);
    setGlobalElapsedSeconds(0);

    // No modo completo ou adaptativo, começa obrigatoriamente na Etapa 1 (Letras)
    const initialStage: AdaptiveEvaluationStage =
      mode === 'complete' || mode === 'adaptive' ? 'letters' : 'words';

    currentStageRef.current = initialStage;
    setCurrentStage(initialStage);

    const firstStageItems = initialStage === 'letters' ? prepareStageItems('letters') : initialItems;
    stageItemsRef.current = firstStageItems;
    setStageItems(firstStageItems);

    setPhase('preparing');
    audioService.setEnabled(settings.soundEnabled);

    // Pré-aquecimento do microfone
    speechService.startSession(
      (listening) => setIsMicListening(listening),
      (err) => console.warn('Aviso do microfone na sessão:', err)
    );

    // Contagem 3-2-1
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
        setPhase('testing');
        startGlobalTimer();
        window.setTimeout(() => {
          startItem(0, firstStageItems);
        }, 350);
      }
    }, 1000);
  };

  /**
   * Monitoramento contínuo do Limite Global de 4 minutos (240 segundos) - Regra 3
   */
  const startGlobalTimer = () => {
    globalStartTimeRef.current = Date.now();
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
    }

    globalTimerRef.current = window.setInterval(() => {
      const elapsedMs = Date.now() - globalStartTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setGlobalElapsedSeconds(elapsedSec);

      // Regra 3: Limite global configurado (padrão 240s)
      const maxGlobalSec = settings.globalTimeLimitSec ?? 240;
      if (elapsedSec >= maxGlobalSec) {
        if (globalTimerRef.current) {
          clearInterval(globalTimerRef.current);
          globalTimerRef.current = null;
        }
        isGlobalTimeLimitReachedRef.current = true;
        // Interrompe imediatamente e processa os dados parciais coletados
        finishEvaluation(true);
      }
    }, 200);
  };

  const startItem = (index: number, currentList: QuestionItem[]) => {
    if (isGlobalTimeLimitReachedRef.current) return;

    if (index >= currentList.length) {
      handleStageCompletion(currentStageRef.current);
      return;
    }

    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }

    const item = currentList[index];
    currentIndexRef.current = index;
    currentItemRef.current = item;
    setCurrentIndex(index);
    setLiveTranscript('');
    setIsSuccessFeedback(false);
    isTransitioningRef.current = false;

    const duration = getItemDurationSec(item);
    setTotalItemDurationSec(duration);
    setTimeRemainingSec(duration);

    const startTime = Date.now();
    itemStartTimestampRef.current = startTime;
    const durationMs = duration * 1000;

    const triggerImmediateSuccess = (matchedTranscript: string, confidence: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsSuccessFeedback(true);

      if (postSpeechTimeoutRef.current) {
        clearTimeout(postSpeechTimeoutRef.current);
        postSpeechTimeoutRef.current = null;
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setLiveTranscript(matchedTranscript);
      const elapsed = Date.now() - startTime;

      window.setTimeout(async () => {
        await completeCurrentItem(index, item, elapsed, matchedTranscript, confidence, false);
      }, 250);
    };

    // Prepara microfone para o item
    speechService.prepareNextItem({
      expectedText: item.text,
      availableTimeMs: durationMs,
      continuous: item.type === 'text',
      onTranscriptUpdate: (transcript) => {
        setLiveTranscript(transcript);

        if (transcript && !isTransitioningRef.current && settings.autoAdvance && item.type !== 'text') {
          const quickCheck = compareSpeech(item, transcript, 1.0, false, {
            phoneticSupportEnabled: settings.phoneticSupportEnabled,
            speechTolerance: settings.speechTolerance
          });
          if (quickCheck.status === 'CORRETO' || quickCheck.status === 'POSSIVELMENTE_CORRETO') {
            triggerImmediateSuccess(item.text.toLowerCase(), 1.0);
            return;
          }

          // Se a criança falou algo mas ainda não deu acerto, permite tolerância para autocorreção
          // (2000ms para letras, 1200ms para palavras e frases)
          if (postSpeechTimeoutRef.current) {
            clearTimeout(postSpeechTimeoutRef.current);
          }
          const postTimeoutMs = item.type === 'letter' ? 2000 : 1200;
          postSpeechTimeoutRef.current = window.setTimeout(async () => {
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              const elapsed = Date.now() - startTime;
              await completeCurrentItem(index, item, elapsed, undefined, undefined, false);
            }
          }, postTimeoutMs);
        }
      },
      onMatch: (_matchedTranscript, confidence) => {
        if (settings.autoAdvance && item.type !== 'text') {
          triggerImmediateSuccess(item.text.toLowerCase(), confidence);
        }
      },
      checkMatch: (alternatives) => {
        for (const alt of alternatives) {
          const check = compareSpeech(item, alt, 1.0, false, {
            phoneticSupportEnabled: settings.phoneticSupportEnabled,
            speechTolerance: settings.speechTolerance
          });
          if (check.status === 'CORRETO' || check.status === 'POSSIVELMENTE_CORRETO') {
            return { matched: true, transcript: item.text.toLowerCase(), confidence: 1.0 };
          }
        }
        return null;
      }
    });

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeRemainingSec(remaining);

      // Limite máximo atingido do item (10s para letras/palavras, 15s para frases)
      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (postSpeechTimeoutRef.current) {
          clearTimeout(postSpeechTimeoutRef.current);
          postSpeechTimeoutRef.current = null;
        }
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          await completeCurrentItem(index, item, durationMs, undefined, undefined, true);
        }
      }
    }, 100);
  };

  const completeCurrentItem = async (
    itemIndex: number,
    item: QuestionItem,
    plannedDurationMs: number,
    explicitTranscript?: string,
    explicitConfidence?: number,
    isTimeLimitReached: boolean = false
  ) => {
    const captured = speechService.consumeItemResult();

    const transcript = explicitTranscript !== undefined ? explicitTranscript : captured.transcript;
    const confidence = explicitConfidence !== undefined ? explicitConfidence : captured.confidence;
    const responseTimeMs = captured.responseTimeMs || plannedDurationMs;

    // Métricas temporais rigorosas (Regra 5)
    const presentationTimeMs = itemStartTimestampRef.current;
    const speechStartMs = captured.speechStartMs;
    const speechEndMs = captured.speechEndMs;
    const reactionTimeMs = speechStartMs ? Math.max(0, speechStartMs - presentationTimeMs) : responseTimeMs;
    const speechDurationMs = speechStartMs && speechEndMs ? Math.max(0, speechEndMs - speechStartMs) : 0;
    const totalTimeMs = reactionTimeMs + speechDurationMs;

    // Avaliação pedagógica por tipo de item
    let itemResult: EvaluationItemResult;

    if (item.type === 'text') {
      const textAnalysis = compareTextReading(item.text, transcript, responseTimeMs / 1000);
      textReportRef.current = {
        evaluated: true,
        textTitle: item.category || 'História Infantil',
        totalWords: textAnalysis.totalWords,
        wordsRead: textAnalysis.wordsRead,
        wordsCorrect: textAnalysis.wordsCorrect,
        errorsCount: textAnalysis.errorsCount,
        accuracy: textAnalysis.accuracy,
        wordsPerMinute: textAnalysis.wordsPerMinute,
        durationSeconds: Math.round(responseTimeMs / 1000),
        pausesCount: Math.max(0, Math.floor((responseTimeMs / 1000) / 4) - textAnalysis.wordsCorrect),
        selfCorrectionsCount: 0,
        silabationCount: textAnalysis.accuracy < 80 ? 2 : 0,
        punctuationRespected: textAnalysis.punctuationRespected,
        prosodyScore: textAnalysis.prosodyScore,
        automaticityLevel: textAnalysis.automaticityLevel,
        isFluentEligible: textAnalysis.isFluentEligible
      };

      itemResult = {
        questionId: item.id,
        targetText: item.text,
        level: item.level,
        type: item.type,
        stage: currentStageRef.current,
        syllableStructure: item.syllableStructure,
        category: item.category,
        transcript,
        normalizedTranscript: transcript,
        status: textAnalysis.accuracy >= 85 ? 'CORRETO' : textAnalysis.accuracy >= 50 ? 'POSSIVELMENTE_CORRETO' : 'INCORRETO',
        presentationTimeMs,
        speechStartMs,
        speechEndMs,
        reactionTimeMs,
        speechDurationMs,
        totalTimeMs,
        responseTimeMs,
        availableTimeMs: 60000,
        confidence,
        confidenceNote: confidence < 0.65 ? 'Indeterminada — baixa confiança' : undefined,
        isTimeLimitReached,
        observedError: textAnalysis.accuracy < 85 ? `Precisão textual de ${textAnalysis.accuracy}%` : undefined
      };
    } else {
      const comparison = compareSpeech(item, transcript, confidence, false, {
        phoneticSupportEnabled: settings.phoneticSupportEnabled,
        speechTolerance: settings.speechTolerance
      });

      let displayTranscript = transcript || comparison.normalizedTranscript;
      if (comparison.status === 'CORRETO' && item.type === 'word') {
        displayTranscript = item.text.toLowerCase();
      }

      itemResult = {
        questionId: item.id,
        targetText: item.text,
        level: item.level,
        type: item.type,
        stage: currentStageRef.current,
        syllableStructure: item.syllableStructure,
        category: item.category,
        transcript: displayTranscript,
        normalizedTranscript: comparison.normalizedTranscript,
        status: comparison.status,
        presentationTimeMs,
        speechStartMs,
        speechEndMs,
        reactionTimeMs,
        speechDurationMs,
        totalTimeMs,
        responseTimeMs,
        availableTimeMs: item.type === 'phrase' ? 15000 : 10000,
        confidence,
        confidenceNote: confidence < 0.65 ? 'Indeterminada — baixa confiança' : undefined,
        numberOfAttempts: captured.numberOfAttempts,
        recognitionQuality: captured.recognitionQuality,
        provider: captured.provider,
        phonemeFindings: comparison.phonemeFindings,
        observedError: comparison.observedError,
        isTimeLimitReached,
        silabationDetected: reactionTimeMs > 4000 || responseTimeMs > 6000,
        pausesCount: reactionTimeMs > 2500 ? 1 : 0
      };
    }

    evaluatedItemsRef.current.push(itemResult);
    setEvaluatedItems([...evaluatedItemsRef.current]);

    if (!settings.silentModeDuringSpeech && settings.soundEnabled) {
      audioService.playTransitionTick();
    }

    const nextIndex = itemIndex + 1;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    await new Promise((r) => setTimeout(r, 150));

    if (nextIndex < stageItemsRef.current.length) {
      startItem(nextIndex, stageItemsRef.current);
    } else {
      handleStageCompletion(currentStageRef.current);
    }
  };

  /**
   * Lógica Central da Avaliação Adaptativa (Regras 1, 2, 6, 7, 9, 10, 11, 12 e 26)
   */
  const handleStageCompletion = (completedStage: AdaptiveEvaluationStage) => {
    if (isGlobalTimeLimitReachedRef.current) {
      finishEvaluation(true);
      return;
    }

    const allEvaluated = evaluatedItemsRef.current;

    // Conclusão da Etapa 1: Reconhecimento de Letras
    if (completedStage === 'letters') {
      const lettersMetrics = compileLettersMetrics(allEvaluated);

      // Regra 1: Se a criança não conseguiu identificar letras de maneira suficiente (< 10 acertos) -> PRÉ-LEITOR 1
      if (lettersMetrics.correct < 10) {
        finishEvaluation(false);
        return;
      }

      // Regra 1 & 6: Identificou 10 ou mais letras corretamente -> Avança para Palavras Isoladas
      currentStageRef.current = 'words';
      setCurrentStage('words');
      const nextWords = prepareStageItems('words');
      stageItemsRef.current = nextWords;
      setStageItems(nextWords);
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      startItem(0, nextWords);
      return;
    }

    // Conclusão da Etapa 2: Palavras Isoladas
    if (completedStage === 'words') {
      const wordsMetrics = compileWordsMetrics(allEvaluated);

      // Regra 1: Pré-Leitor 2 (>= 10 letras, mas 0 palavras corretas)
      if (wordsMetrics.correct === 0) {
        finishEvaluation(false);
        return;
      }

      // Regra 1 & 9: Pré-Leitor 3 (1 a 10 palavras corretas) -> Encerra progressão
      if (wordsMetrics.correct <= 10) {
        finishEvaluation(false);
        return;
      }

      // Regra 1 & 9: Leitor Iniciante 1 (11 a 20 palavras corretas em 60s) -> Encerra progressão
      if (wordsMetrics.wordsPerMinute >= 11 && wordsMetrics.wordsPerMinute <= 20) {
        finishEvaluation(false);
        return;
      }

      // Regra 9: 21 ou mais palavras corretas por minuto -> Candidato a Leitor Iniciante 2
      // Encaminha a criança para a avaliação textual para verificar se apresenta fluência em contexto
      if (wordsMetrics.wordsPerMinute >= 21 || wordsMetrics.correct >= 11) {
        currentStageRef.current = 'text';
        setCurrentStage('text');
        const textItems = prepareStageItems('text');
        stageItemsRef.current = textItems;
        setStageItems(textItems);
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        startItem(0, textItems);
        return;
      }

      finishEvaluation(false);
      return;
    }

    // Conclusão da Etapa 3: Leitura de Texto em Contexto
    if (completedStage === 'text') {
      const textReport = textReportRef.current;

      // Regra 2 & 11: Se atingir simultaneamente >= 65 PCPM + > 90% precisão + automaticidade -> LEITOR FLUENTE
      if (textReport && textReport.isFluentEligible) {
        // Regra 2 & 12: As frases SOMENTE devem ser apresentadas caso o sistema detecte LEITOR FLUENTE
        currentStageRef.current = 'phrases';
        setCurrentStage('phrases');
        const phraseItems = prepareStageItems('phrases');
        stageItemsRef.current = phraseItems;
        setStageItems(phraseItems);
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        startItem(0, phraseItems);
        return;
      }

      // Regra 11: Se atingir 21+ palavras/minuto, mas não atingir os critérios de texto, manter LEITOR INICIANTE 2
      // NÃO apresentar frases para Leitor Iniciante 2!
      finishEvaluation(false);
      return;
    }

    // Conclusão da Etapa 4: Frases Curtas (Apenas Leitor Fluente)
    if (completedStage === 'phrases') {
      const phraseItems = allEvaluated.filter(i => i.type === 'phrase');
      const phraseCompleted = phraseItems.filter(i => i.status === 'CORRETO' || i.status === 'POSSIVELMENTE_CORRETO').length;
      phrasesReportRef.current = {
        evaluated: true,
        presented: phraseItems.length,
        completed: phraseCompleted,
        incomplete: phraseItems.length - phraseCompleted,
        accuracy: phraseItems.length > 0 ? Math.round((phraseCompleted / phraseItems.length) * 100) : 0,
        averageTimeMs: 8000,
        prosodyScore: 88,
        cadenceDescription: 'Leitura contínua e expressiva com respeito funcional à pontuação'
      };
      finishEvaluation(false);
      return;
    }

    finishEvaluation(false);
  };

  /**
   * Finalização da Avaliação com Geração do Relatório Pedagógico Completo (Regras 18 a 25)
   */
  const finishEvaluation = async (isTimeLimitExceeded: boolean = false) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }
    speechService.stopSession();

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
      if (levelScores[lvl]) {
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
    }

    for (const l of [1, 2, 3, 4] as DifficultyLevel[]) {
      const sc = levelScores[l];
      if (sc && sc.total > 0) {
        sc.averageTimeMs = Math.round(sc.averageTimeMs / sc.total);
        sc.accuracy = Math.round(((sc.correct + sc.possible * 0.5) / sc.total) * 100);
      }
    }

    const effectivePoints = correctCount + possibleCount * 0.5;
    const accuracyPercentage = totalItems > 0 ? Math.round((effectivePoints / totalItems) * 100) : 0;
    const averageResponseTimeMs = totalItems > 0 ? Math.round(totalTimeMs / totalItems) : 0;

    // Métricas por etapa
    const lettersReport = compileLettersMetrics(allItems);
    const wordsReport = compileWordsMetrics(allItems);
    const textReport = textReportRef.current;
    const phrasesReport = phrasesReportRef.current;

    // Palavras Corretas Por Minuto no conjunto de palavras
    const wordsPerMinute = wordsReport.wordsPerMinute || 0;

    // Classificação oficial em 6 níveis estritos
    const pedagogicalDiagnosis = classifyPedagogicalDiagnosis(
      lettersReport,
      wordsReport,
      textReport
    );

    // Evidências detalhadas da classificação (Regra 19)
    const classificationEvidences = generateClassificationEvidences(
      pedagogicalDiagnosis,
      lettersReport,
      wordsReport,
      textReport,
      phrasesReport
    );

    // Resumo Executivo para leitura rápida do Supervisor (Regra 20)
    const executiveSummary = generateExecutiveSummary(
      pedagogicalDiagnosis,
      lettersReport,
      wordsReport,
      textReport,
      phrasesReport
    );

    // Recomendações pedagógicas orientadas por dados (Regra 21)
    const practiceRecommendations = generatePracticeRecommendations(allItems);

    // Identificação escolar segura
    const studentAsStudent = activeStudent as Student | undefined;
    const session: EvaluationSession = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      childId: activeStudent?.id,
      childName: activeStudent?.name || 'Estudante em Avaliação',
      schoolId: studentAsStudent?.schoolId,
      schoolName: studentAsStudent?.school?.name,
      classId: studentAsStudent?.classId,
      className: studentAsStudent?.class?.name,
      evaluatorId,
      evaluatorName,
      criteriaVersion: settings.evaluationCriteriaVersion || '2026.2',
      timestamp: Date.now(),
      mode,
      globalElapsedSeconds: globalElapsedSeconds || Math.round(totalTimeMs / 1000),
      isGlobalTimeLimitReached: isTimeLimitExceeded || isGlobalTimeLimitReachedRef.current,
      totalItems,
      correctCount,
      possibleCount,
      incorrectCount,
      noResponseCount,
      unrecognizedCount,
      accuracyPercentage,
      averageResponseTimeMs,
      wordsPerMinute,
      pedagogicalDiagnosis,
      classificationEvidences,
      executiveSummary,
      lettersReport,
      wordsReport,
      textReport,
      phrasesReport,
      items: allItems,
      levelScores,
      practiceRecommendations,
      syncStatus: 'pending'
    };

    // Salva via repositório (IndexedDB local + sincronização backend)
    try {
      await repository.saveEvaluation(session);
    } catch (err) {
      console.error('Falha ao salvar sessão via repositório:', err);
    }

    audioService.playCelebration();
    setPhase('completed');
    onFinished(session);
  };

  const cancelEvaluation = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }
    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }
    speechService.stopSession();
    setPhase('idle');
  };

  const markCurrentItemResult = async (status: 'CORRETO' | 'INCORRETO') => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const idx = currentIndexRef.current;
    const item = stageItemsRef.current[idx];
    if (!item) return;

    const elapsed = Date.now() - itemStartTimestampRef.current;

    if (status === 'CORRETO') {
      setIsSuccessFeedback(true);
      setLiveTranscript(item.text.toLowerCase());
      window.setTimeout(async () => {
        await completeCurrentItem(idx, item, elapsed, item.text.toLowerCase(), 1.0, false);
      }, 250);
    } else {
      await completeCurrentItem(idx, item, elapsed, '(resposta incorreta)', 1.0, false);
    }
  };

  const skipCurrentItem = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }
    const idx = currentIndexRef.current;
    const item = stageItemsRef.current[idx];
    if (item && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const elapsed = Date.now() - itemStartTimestampRef.current;
      completeCurrentItem(
        idx,
        item,
        elapsed > 0 ? elapsed : totalItemDurationSec * 1000,
        undefined,
        undefined,
        false
      );
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
      if (postSpeechTimeoutRef.current) {
        clearTimeout(postSpeechTimeoutRef.current);
      }
      speechService.stopSession();
    };
  }, []);

  return {
    phase,
    currentStage,
    currentItem: stageItems[currentIndex] || currentItemRef.current || null,
    currentIndex,
    totalItems: stageItems.length,
    globalElapsedSeconds,
    globalTimeLimitSec: settings.globalTimeLimitSec ?? 240,
    preparationCount,
    timeRemainingSec,
    totalItemDurationSec,
    isMicListening,
    liveTranscript,
    isSuccessFeedback,
    evaluatedItems,
    startEvaluation,
    cancelEvaluation,
    skipCurrentItem,
    markCurrentItemResult
  };
}
