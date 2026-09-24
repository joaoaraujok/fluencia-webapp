import { DifficultyLevel, ItemType, SemanticCategory, SyllableStructure } from './question';
import { RecognitionStatus } from './speech';

export type { DifficultyLevel };

export type EvaluationMode = 'complete' | DifficultyLevel;

export interface EvaluationItemResult {
  questionId: string;
  targetText: string;
  level: DifficultyLevel;
  type: ItemType;
  syllableStructure: SyllableStructure;
  category: SemanticCategory;
  transcript: string;
  status: RecognitionStatus;
  responseTimeMs: number;
  confidence: number;
  phonemeFindings?: string[];
  observedError?: string;
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

export interface EvaluationSession {
  id: string;
  childId?: string;
  childName?: string;
  timestamp: number;
  mode: EvaluationMode;
  totalItems: number;
  correctCount: number;
  possibleCount: number;
  incorrectCount: number;
  noResponseCount: number;
  unrecognizedCount: number;
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  items: EvaluationItemResult[];
  levelScores: Record<DifficultyLevel, LevelScore>;
  practiceRecommendations: PracticeRecommendation[];
  notes?: string;
}
