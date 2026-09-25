export type RecognitionStatus =
  | 'CORRETO'
  | 'POSSIVELMENTE_CORRETO'
  | 'INCORRETO'
  | 'SEM_RESPOSTA'
  | 'NAO_RECONHECIDO'
  | 'ERRO_TECNICO';

export interface SpeechItemCapture {
  transcript: string;
  normalizedTranscript: string;
  confidence: number;
  responseTimeMs: number;
  availableTimeMs: number;
  speechStartMs?: number;
  speechEndMs?: number;
  numberOfAttempts: number;
  recognitionQuality?: 'good' | 'poor' | 'noisy';
  provider: string;
}

export interface SpeechResult {
  transcript: string;
  normalizedTranscript: string;
  confidence: number;
  durationMs: number;
  status: RecognitionStatus;
  detectedErrors?: string[];
  distance?: number;
}

export interface ProviderItemOptions {
  expectedText?: string;
  availableTimeMs?: number; // padrão 10000ms
  continuous?: boolean; // true para itens de leitura longa (texto)
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onMatch?: (matchedTranscript: string, confidence: number) => void;
  checkMatch?: (alternatives: string[]) => { matched: boolean; transcript: string; confidence?: number } | null;
}

export interface SpeechRecognitionProvider {
  readonly id: string;
  isSupported(): boolean;
  startSession(
    onStateChange?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): Promise<boolean> | boolean;
  prepareNextItem(options: ProviderItemOptions): void;
  consumeItemResult(): SpeechItemCapture;
  stopSession(): void;
  abort(): void;
}
