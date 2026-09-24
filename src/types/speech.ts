export type RecognitionStatus =
  | 'CORRETO'
  | 'POSSIVELMENTE_CORRETO'
  | 'INCORRETO'
  | 'SEM_RESPOSTA'
  | 'NAO_RECONHECIDO'
  | 'ERRO_TECNICO';

export interface SpeechResult {
  transcript: string;
  normalizedTranscript: string;
  confidence: number;
  durationMs: number;
  status: RecognitionStatus;
  detectedErrors?: string[];
  distance?: number;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxDurationMs?: number;
}
