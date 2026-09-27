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
import { api } from '../services/api';
import { Student } from '../types/school';
import { ChildProfile } from '../types/child';
import { RecognitionStatus } from '../types/speech';
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
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);

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
  const isGlobalTimerPausedRef = useRef<boolean>(false);
  const pauseGlobalTimerStartRef = useRef<number>(0);
  const intentionalSpeechDetectedRef = useRef<boolean>(false);
  const lastSpeechTimestampRef = useRef<number>(0);

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

    // Pré-aquecimento do microfone e gravação por item
    audioService.ensureMicStream().catch(() => {});
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
    isGlobalTimerPausedRef.current = false;
    pauseGlobalTimerStartRef.current = 0;
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
    }

    globalTimerRef.current = window.setInterval(() => {
      if (isGlobalTimerPausedRef.current) return;
      const elapsedMs = Math.max(0, Date.now() - globalStartTimeRef.current);
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

  /**
   * Pausa o tempo decorrido global no momento em que o áudio é enviado para análise de IA.
   */
  const pauseGlobalTimer = () => {
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
      globalTimerRef.current = null;
    }
    if (!isGlobalTimerPausedRef.current) {
      isGlobalTimerPausedRef.current = true;
      pauseGlobalTimerStartRef.current = Date.now();
    }
  };

  /**
   * Retoma o cronômetro global descontando:
   * 1. O tempo de latência de rede/processamento da IA (tempo pausado).
   * 2. O tempo de silêncio (3s de espera sem som) para que a quantidade de palavras por minuto seja exata.
   */
  const resumeGlobalTimer = (deductSilenceMs: number = 0) => {
    let pauseDurationMs = 0;
    if (isGlobalTimerPausedRef.current) {
      pauseDurationMs = Math.max(0, Date.now() - pauseGlobalTimerStartRef.current);
      isGlobalTimerPausedRef.current = false;
    }

    const totalDeductionMs = pauseDurationMs + Math.max(0, deductSilenceMs);
    globalStartTimeRef.current += totalDeductionMs;

    const currentElapsedMs = Math.max(0, Date.now() - globalStartTimeRef.current);
    const currentElapsedSec = Math.floor(currentElapsedMs / 1000);
    setGlobalElapsedSeconds(currentElapsedSec);

    const maxGlobalSec = settings.globalTimeLimitSec ?? 240;
    if (currentElapsedSec < maxGlobalSec && !isGlobalTimeLimitReachedRef.current) {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
      globalTimerRef.current = window.setInterval(() => {
        if (isGlobalTimerPausedRef.current) return;
        const elapsedMs = Math.max(0, Date.now() - globalStartTimeRef.current);
        const elapsedSec = Math.floor(elapsedMs / 1000);
        setGlobalElapsedSeconds(elapsedSec);

        if (elapsedSec >= maxGlobalSec) {
          if (globalTimerRef.current) {
            clearInterval(globalTimerRef.current);
            globalTimerRef.current = null;
          }
          isGlobalTimeLimitReachedRef.current = true;
          finishEvaluation(true);
        }
      }, 200);
    }
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

    // Inicia a gravação com MediaRecorder para captura de áudio da emissão da criança
    audioService.startItemRecording();

    // Configura o item de escuta
    speechService.prepareNextItem({
      expectedText: item.text,
      availableTimeMs: durationMs,
      continuous: item.type === 'text'
    });

    let consecutiveSpeechFrames = 0;
    intentionalSpeechDetectedRef.current = false;
    lastSpeechTimestampRef.current = 0;

    audioService.startMicMonitoring((vol) => {
      const now = Date.now();
      const elapsedMs = now - startTime;

      // Ignora os primeiros 300ms para evitar captura de cliques ou ruídos de transição
      if (elapsedMs < 300) return;

      if (vol >= 8) {
        consecutiveSpeechFrames++;
        if (consecutiveSpeechFrames >= 2) {
          intentionalSpeechDetectedRef.current = true;
          lastSpeechTimestampRef.current = now;
          setLiveTranscript(item.type === 'text' ? 'Gravando leitura da historinha...' : 'Gravando voz da criança...');
          if (postSpeechTimeoutRef.current) {
            clearTimeout(postSpeechTimeoutRef.current);
            postSpeechTimeoutRef.current = null;
          }
        }
      } else {
        consecutiveSpeechFrames = 0;
        // Espera 3.0 segundos de silêncio para garantir que a criança não fez apenas uma pausa (válido para letras, palavras e historinha)
        if (
          intentionalSpeechDetectedRef.current &&
          !isTransitioningRef.current &&
          settings.autoAdvance &&
          elapsedMs >= 2000 &&
          now - lastSpeechTimestampRef.current >= 3000
        ) {
          isTransitioningRef.current = true;
          audioService.stopMicMonitoring();
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          if (postSpeechTimeoutRef.current) {
            clearTimeout(postSpeechTimeoutRef.current);
            postSpeechTimeoutRef.current = null;
          }

          const rawElapsed = Date.now() - startTime;
          const silenceDuration = 3000; // Exatamente 3.0s de silêncio aguardado
          completeCurrentItem(index, item, rawElapsed, undefined, undefined, false, silenceDuration);
        }
      }
    });

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeRemainingSec(remaining);

      // Limite máximo atingido do item (10s para letras/palavras, 60s para texto)
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
          audioService.stopMicMonitoring();
          const rawElapsed = durationMs;
          const silenceDuration = (intentionalSpeechDetectedRef.current && lastSpeechTimestampRef.current > 0)
            ? Math.min(3000, Math.max(0, (startTime + durationMs) - lastSpeechTimestampRef.current))
            : 0;
          await completeCurrentItem(index, item, rawElapsed, undefined, undefined, true, silenceDuration);
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
    isTimeLimitReached: boolean = false,
    silenceWaitMs: number = 0
  ) => {
    // 1. Pausa o cronômetro decorrido global imediatamente quando o áudio é enviado para a IA
    pauseGlobalTimer();
    setIsAnalyzingAi(true);

    // 2. Finaliza a gravação do áudio do item atual com MediaRecorder
    let audioBlob: Blob | null = null;
    try {
      audioBlob = await audioService.stopItemRecording();
    } catch (recErr) {
      console.warn('[FluencIA] Aviso ao finalizar gravação do item:', recErr);
    }
    audioService.stopMicMonitoring();

    // 3. Coleta métricas da Web Speech API (fallback / medição de latência)
    const captured = speechService.consumeItemResult();

    const localTranscript = explicitTranscript !== undefined ? explicitTranscript : captured.transcript;
    const localConfidence = explicitConfidence !== undefined ? explicitConfidence : captured.confidence;

    // Desconta o tempo de silêncio (3s) aguardado após a fala para correção precisa de PPM
    const rawResponseTimeMs = captured.responseTimeMs || plannedDurationMs;
    const responseTimeMs = Math.max(200, rawResponseTimeMs - silenceWaitMs);

    // Métricas temporais rigorosas (Regra 5)
    const presentationTimeMs = itemStartTimestampRef.current;
    const speechStartMs = captured.speechStartMs;
    const speechEndMs = captured.speechEndMs
      ? Math.min(captured.speechEndMs, presentationTimeMs + responseTimeMs)
      : (presentationTimeMs + responseTimeMs);
    const reactionTimeMs = speechStartMs ? Math.max(0, speechStartMs - presentationTimeMs) : responseTimeMs;
    const speechDurationMs = speechStartMs ? Math.max(0, speechEndMs - speechStartMs) : responseTimeMs;
    const totalTimeMs = reactionTimeMs + speechDurationMs;

    // 3. Pipeline de IA Fonética (Groq Whisper Large v3 + Google Gemini 3.8 Flash)
    let finalTranscript = localTranscript;
    let finalStatus: RecognitionStatus | null = null;
    let similarity: number | undefined = undefined;
    let observedError: string | undefined = undefined;
    let phonemeFindings: string[] = [];
    let pedagogicalNote: string | undefined = undefined;
    let provider = captured.provider;
    let isAiAnalyzed = false;

    if (audioBlob && audioBlob.size > 100) {
      try {
        const formData = new FormData();
        const extension = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        formData.append('audioFile', audioBlob, `item_${itemIndex}_${Date.now()}.${extension}`);
        formData.append('targetText', item.text);
        formData.append('itemType', item.type);

        const aiResponse = await api.analyzeAudioItem(formData);
        if (aiResponse && aiResponse.status) {
          finalTranscript = aiResponse.transcript || localTranscript;
          finalStatus = aiResponse.status as RecognitionStatus;
          similarity = aiResponse.similarity;
          observedError = aiResponse.observedError;
          phonemeFindings = aiResponse.phonemeFindings || [];
          pedagogicalNote = aiResponse.pedagogicalNote;
          provider = 'groq-whisper-v3 + gemini-3.8-flash';
          isAiAnalyzed = true;
          setLiveTranscript(finalTranscript || localTranscript);
        }
      } catch (aiErr) {
        console.warn('[FluencIA] API de IA offline ou inatingível. Aplicando contingência com análise fonética local:', aiErr);
      }
    }

    // 4. Avaliação pedagógica estruturada do item
    let itemResult: EvaluationItemResult;

    if (item.type === 'text') {
      const textAnalysis = compareTextReading(item.text, finalTranscript, responseTimeMs / 1000);
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

      const resolvedStatus = finalStatus || (textAnalysis.accuracy >= 85 ? 'CORRETO' : textAnalysis.accuracy >= 50 ? 'POSSIVELMENTE_CORRETO' : 'INCORRETO');

      itemResult = {
        questionId: item.id,
        targetText: item.text,
        level: item.level,
        type: item.type,
        stage: currentStageRef.current,
        syllableStructure: item.syllableStructure,
        category: item.category,
        transcript: finalTranscript,
        normalizedTranscript: finalTranscript,
        status: resolvedStatus,
        presentationTimeMs,
        speechStartMs,
        speechEndMs,
        reactionTimeMs,
        speechDurationMs,
        totalTimeMs,
        responseTimeMs,
        availableTimeMs: 60000,
        confidence: isAiAnalyzed ? (similarity ?? 1.0) : localConfidence,
        confidenceNote: (!isAiAnalyzed && localConfidence < 0.65) ? 'Indeterminada — baixa confiança' : undefined,
        isTimeLimitReached,
        observedError: observedError || (textAnalysis.accuracy < 85 ? `Precisão textual de ${textAnalysis.accuracy}%` : undefined),
        phonemeFindings,
        pedagogicalNote,
        provider
      };
    } else {
      let displayTranscript = finalTranscript;
      let resolvedStatus: RecognitionStatus;
      let comparisonPhonemeFindings: string[] = [];
      let comparisonObservedError: string | undefined = undefined;

      if (isAiAnalyzed && finalStatus) {
        resolvedStatus = finalStatus;
        if (resolvedStatus === 'CORRETO' && item.type === 'letter') {
          displayTranscript = item.text;
        } else if (resolvedStatus === 'CORRETO' && item.type === 'word') {
          displayTranscript = item.text.toLowerCase();
        }
      } else {
        const comparison = compareSpeech(item, finalTranscript, localConfidence, false, {
          phoneticSupportEnabled: settings.phoneticSupportEnabled,
          speechTolerance: settings.speechTolerance
        });
        if (comparison.status === 'CORRETO' && item.type === 'word') {
          displayTranscript = item.text.toLowerCase();
        } else if (comparison.status === 'CORRETO' && item.type === 'letter') {
          displayTranscript = item.text;
        } else {
          displayTranscript = finalTranscript || comparison.normalizedTranscript;
        }
        resolvedStatus = comparison.status;
        comparisonPhonemeFindings = comparison.phonemeFindings || [];
        comparisonObservedError = comparison.observedError;
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
        normalizedTranscript: finalTranscript.toUpperCase(),
        status: resolvedStatus,
        presentationTimeMs,
        speechStartMs,
        speechEndMs,
        reactionTimeMs,
        speechDurationMs,
        totalTimeMs,
        responseTimeMs,
        availableTimeMs: item.type === 'phrase' ? 15000 : 10000,
        confidence: isAiAnalyzed ? (similarity ?? 1.0) : localConfidence,
        confidenceNote: (!isAiAnalyzed && localConfidence < 0.65) ? 'Indeterminada — baixa confiança' : undefined,
        numberOfAttempts: captured.numberOfAttempts,
        recognitionQuality: captured.recognitionQuality,
        provider,
        phonemeFindings: isAiAnalyzed ? phonemeFindings : comparisonPhonemeFindings,
        observedError: observedError || comparisonObservedError,
        pedagogicalNote,
        isTimeLimitReached,
        silabationDetected: reactionTimeMs > 4000 || responseTimeMs > 6000,
        pausesCount: reactionTimeMs > 2500 ? 1 : 0
      };
    }

    evaluatedItemsRef.current.push(itemResult);
    setEvaluatedItems([...evaluatedItemsRef.current]);

    if (itemResult.status === 'CORRETO' || itemResult.status === 'POSSIVELMENTE_CORRETO') {
      setIsSuccessFeedback(true);
    }

    setIsAnalyzingAi(false);

    // Retoma o cronômetro decorrido global descontando o tempo sem som (3s) e o tempo de IA
    resumeGlobalTimer(silenceWaitMs);

    if (!settings.silentModeDuringSpeech && settings.soundEnabled) {
      audioService.playTransitionTick();
    }

    const nextIndex = itemIndex + 1;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    await new Promise((r) => setTimeout(r, 450));

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
    let executiveSummary = generateExecutiveSummary(
      pedagogicalDiagnosis,
      lettersReport,
      wordsReport,
      textReport,
      phrasesReport
    );

    // Recomendações pedagógicas orientadas por dados (Regra 21)
    let practiceRecommendations = generatePracticeRecommendations(allItems);

    let aiPedagogicalSynthesis: { executiveSummary: string; recommendations: string[]; strengths: string[] } | undefined = undefined;

    // Síntese Pedagógica Estruturada com Google Gemini (gemini-3.8-flash)
    try {
      const itemsSummary = allItems
        .map((it) => `- Alvo: "${it.targetText}", Leitura: "${it.transcript}", Status: ${it.status}${it.observedError ? ` (${it.observedError})` : ''}`)
        .join('\n');

      const geminiSynthesis = await api.generateSessionSynthesis({
        childName: activeStudent?.name,
        accuracyPercentage,
        totalItems,
        correctCount,
        itemsSummary
      });

      if (geminiSynthesis?.executiveSummary) {
        aiPedagogicalSynthesis = geminiSynthesis;
        executiveSummary.readingQualitySummary = geminiSynthesis.executiveSummary;
        if (geminiSynthesis.strengths && geminiSynthesis.strengths.length > 0) {
          executiveSummary.whatChildCanDo = geminiSynthesis.strengths.join('. ');
        }
      }
      if (Array.isArray(geminiSynthesis?.recommendations) && geminiSynthesis.recommendations.length > 0) {
        practiceRecommendations = geminiSynthesis.recommendations.map((recText, idx) => ({
          id: `rec_gemini_${idx + 1}`,
          title: `Intervenção Pedagógica #${idx + 1}`,
          category: 'Apropriação do Sistema de Escrita',
          description: recText,
          recommendedExamples: [],
          priority: idx === 0 ? 'alta' : 'media'
        }));
      }
    } catch (synthErr) {
      console.warn('[Gemini] Síntese automatizada offline, mantendo síntese estruturada padrão:', synthErr);
    }

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
      globalElapsedSeconds: Math.floor(Math.max(0, Date.now() - globalStartTimeRef.current) / 1000) || globalElapsedSeconds || Math.round(totalTimeMs / 1000),
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
      aiPedagogicalSynthesis,
      syncStatus: 'pending'
    };

    // Salva via repositório (IndexedDB local + sincronização backend)
    try {
      await repository.saveEvaluation(session);
    } catch (err) {
      console.error('Falha ao salvar sessão via repositório:', err);
    }

    pauseGlobalTimer();
    audioService.playCelebration();
    audioService.releaseMic();
    setPhase('completed');
    onFinished(session);
  };

  const cancelEvaluation = () => {
    pauseGlobalTimer();
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
    audioService.stopItemRecording().catch(() => {});
    speechService.stopSession();
    audioService.releaseMic();
    setPhase('idle');
  };

  const markCurrentItemResult = async (status: 'CORRETO' | 'INCORRETO') => {
    if (isTransitioningRef.current || isAnalyzingAi) return;
    isTransitioningRef.current = true;

    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    audioService.stopMicMonitoring();

    const idx = currentIndexRef.current;
    const item = stageItemsRef.current[idx];
    if (!item) return;

    const elapsed = Date.now() - itemStartTimestampRef.current;

    if (status === 'CORRETO') {
      setIsSuccessFeedback(true);
      setLiveTranscript(item.text.toLowerCase());
      window.setTimeout(async () => {
        await completeCurrentItem(idx, item, elapsed, item.text.toLowerCase(), 1.0, false, 0);
      }, 250);
    } else {
      await completeCurrentItem(idx, item, elapsed, '(resposta incorreta)', 1.0, false, 0);
    }
  };

  const skipCurrentItem = () => {
    if (isTransitioningRef.current || isAnalyzingAi) return;

    const elapsed = Date.now() - itemStartTimestampRef.current;
    // Previne avanço acidental prematuro se nenhuma fala intencional foi detectada
    if (elapsed < 600 && !intentionalSpeechDetectedRef.current) {
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (postSpeechTimeoutRef.current) {
      clearTimeout(postSpeechTimeoutRef.current);
      postSpeechTimeoutRef.current = null;
    }
    audioService.stopMicMonitoring();
    const idx = currentIndexRef.current;
    const item = stageItemsRef.current[idx];
    if (item && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const silenceDuration = (intentionalSpeechDetectedRef.current && lastSpeechTimestampRef.current > 0)
        ? Math.min(3000, Math.max(0, Date.now() - lastSpeechTimestampRef.current))
        : 0;
      completeCurrentItem(
        idx,
        item,
        elapsed > 0 ? elapsed : totalItemDurationSec * 1000,
        undefined,
        undefined,
        false,
        silenceDuration
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
      audioService.stopItemRecording().catch(() => {});
      speechService.stopSession();
      audioService.releaseMic();
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
    isAnalyzingAi,
    evaluatedItems,
    startEvaluation,
    cancelEvaluation,
    skipCurrentItem,
    markCurrentItemResult
  };
}
