import { DifficultyLevel, ItemType, SemanticCategory, SyllableStructure, PedagogicalDiagnosis } from './question';
import { RecognitionStatus } from './speech';

export type { DifficultyLevel };

export type EvaluationMode = 'adaptive' | 'complete' | 'pre_leitor' | 'leitor' | DifficultyLevel;

export type AdaptiveEvaluationStage = 'letters' | 'words' | 'text' | 'phrases' | 'completed';

export interface EvaluationItemResult {
  questionId: string;
  targetText: string;
  level: DifficultyLevel;
  type: ItemType;
  stage?: AdaptiveEvaluationStage;
  syllableStructure: SyllableStructure | string;
  category: SemanticCategory | string;
  transcript: string;
  normalizedTranscript?: string;
  status: RecognitionStatus;
  
  // Métricas temporais rigorosas (Regra 5)
  presentationTimeMs?: number; // Momento de apresentação
  speechStartMs?: number;      // Momento de início da fala
  speechEndMs?: number;        // Momento de término da fala
  reactionTimeMs?: number;     // Tempo entre apresentação e início da fala
  speechDurationMs?: number;   // Duração real da fala
  totalTimeMs?: number;        // Tempo total do item (reação + fala)
  responseTimeMs: number;      // Tempo total decorrido do cronômetro
  availableTimeMs: number;     // Limite máximo do item (10s ou 15s)
  
  // Indicadores de qualidade articulatória e automaticidade (Regras 5, 7, 13 e 15)
  confidence: number;
  confidenceNote?: string;     // Se < 0.65 -> "Indeterminada — baixa confiança"
  similarity?: number;
  numberOfAttempts?: number;
  recognitionQuality?: string;
  provider?: string;
  phonemeFindings?: string[];
  observedError?: string;      // Categoria do erro (troca_fonema, omissao, acrescimo, etc)
  isSelfCorrection?: boolean;  // Se houve autocorreção
  silabationDetected?: boolean;// Se houve silabação evidente
  isTimeLimitReached?: boolean;// Se atingiu o tempo máximo de 10s ou 15s
  pausesCount?: number;        // Quantidade de pausas detectadas
  pausesDurationMs?: number;   // Duração acumulada das pausas
}

export interface PracticeRecommendation {
  id: string;
  title: string;
  category: string;
  description: string;
  recommendedExamples: string[];
  priority: 'alta' | 'media' | 'baixa';
}

export interface LevelScore {
  level: DifficultyLevel;
  total: number;
  correct: number;
  possible: number;
  incorrect: number;
  noResponse: number;
  accuracy: number;
  averageTimeMs: number;
}

// Métricas da Etapa 1: Reconhecimento de Letras
export interface LettersReportMetrics {
  presented: number;
  correct: number;
  accuracy: number;
  averageReactionTimeMs: number;
  noResponseCount: number;
  timeExceededCount: number;
  confusions: { expected: string; spoken: string; count: number }[];
  recognizedLetters: string[];
  challengingLetters: string[];
}

// Métricas da Etapa 2: Palavras Isoladas
export interface WordsReportMetrics {
  presented: number;
  correct: number;
  incorrect: number;
  noResponse: number;
  timeExceededCount: number;
  wordsPerMinute: number; // PCPM em palavras
  accuracy: number;
  averageReactionTimeMs: number;
  averageDurationMs: number;
  pausesCount: number;
  selfCorrectionsCount: number;
  silabationCount: number;
  errorBreakdown: Record<string, number>;
}

// Métricas da Etapa 3: Leitura de Texto
export interface TextReportMetrics {
  evaluated: boolean;
  textTitle?: string;
  totalWords: number;
  wordsRead: number;
  wordsCorrect: number;
  errorsCount: number;
  accuracy: number;
  wordsPerMinute: number; // PCPM no texto
  durationSeconds: number;
  pausesCount: number;
  selfCorrectionsCount: number;
  silabationCount: number;
  punctuationRespected: boolean;
  prosodyScore: number; // 0 a 100
  automaticityLevel: 'alta' | 'media' | 'baixa';
  isFluentEligible: boolean; // >= 65 PCPM e > 90% precisão
}

// Métricas da Etapa 4: Frases Curtas (Apenas para Leitor Fluente)
export interface PhrasesReportMetrics {
  evaluated: boolean;
  presented: number;
  completed: number;
  incomplete: number;
  accuracy: number;
  averageTimeMs: number;
  prosodyScore: number;
  cadenceDescription: string;
}

// Resumo Executivo para Leitura Rápida do Supervisor (Regra 20)
export interface ExecutiveSummary {
  currentLevelTitle: string;
  currentLevelCategory: string;
  whatChildCanDo: string;
  mainDifficulties: string;
  supportingData: string;
  skillsNeedingAttention: string[];
  readingQualitySummary: string;
  aspectsToWorkOn: string[];
}

export interface EvaluationSession {
  id: string;
  childId?: string;
  childName?: string;
  schoolId?: string;
  schoolName?: string;
  classId?: string;
  className?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  criteriaVersion?: string;
  timestamp: number;
  mode: EvaluationMode;
  
  // Limite Global de 240 segundos (4 minutos)
  globalElapsedSeconds: number;
  isGlobalTimeLimitReached: boolean;
  
  totalItems: number;
  correctCount: number;
  possibleCount: number;
  incorrectCount: number;
  noResponseCount: number;
  unrecognizedCount: number;
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  wordsPerMinute?: number; // Palavras Corretas Por Minuto (PCPM)
  
  // Classificação estrita em 6 níveis pedagógicos
  pedagogicalDiagnosis: PedagogicalDiagnosis;
  classificationEvidences: string[]; // Parágrafos detalhados de justificativa
  executiveSummary: ExecutiveSummary; // Resumo executivo para o supervisor
  
  // Detalhamento por etapa adaptativa
  lettersReport?: LettersReportMetrics;
  wordsReport?: WordsReportMetrics;
  textReport?: TextReportMetrics;
  phrasesReport?: PhrasesReportMetrics;
  
  items: EvaluationItemResult[];
  levelScores: Record<DifficultyLevel, LevelScore>;
  practiceRecommendations: PracticeRecommendation[];
  notes?: string;
  syncStatus?: 'synced' | 'pending' | 'syncing' | 'error';
}
