/**
 * Camada de Abstração para Reconhecimento e Captura de Fala (SpeechRecognitionProvider).
 * Integrada 100% ao pipeline Groq Whisper Large v3 (STT) + Google Gemini (Análise Pedagógica).
 * Totalmente desacoplada da Web Speech API nativa, garantindo suporte universal
 * em qualquer navegador moderno via MediaRecorder e Web Audio API.
 */

import { ProviderItemOptions, SpeechItemCapture, SpeechRecognitionProvider } from '../types/speech';
import { audioService } from './audioService';
import { api } from './api';

/**
 * Remove repetições consecutivas de palavras ou frases causadas por flutuação
 * de buffers de captura de áudio.
 */
export function deduplicateSpeechTranscript(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  if (words.length <= 1) return trimmed;

  const step1: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = step1.length > 0 ? step1[step1.length - 1] : null;
    if (!prev || current.toLowerCase() !== prev.toLowerCase()) {
      step1.push(current);
    }
  }

  if (step1.length >= 4 && step1.length % 2 === 0) {
    const half = step1.length / 2;
    const firstHalf = step1.slice(0, half).join(' ').toLowerCase();
    const secondHalf = step1.slice(half).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      return step1.slice(0, half).join(' ');
    }
  }

  return step1.join(' ');
}

export class GroqGeminiSpeechProvider implements SpeechRecognitionProvider {
  public readonly id = 'groq-whisper-gemini';

  private isListening: boolean = false;
  private isSessionActive: boolean = false;
  public isItemActive: boolean = false;
  private currentItemOptions?: ProviderItemOptions;

  // Métricas temporais detalhadas do item atual (10s)
  private itemStartTime: number = 0;
  private speechStartTimestamp: number | null = null;
  private speechEndTimestamp: number | null = null;
  private numberOfAttempts: number = 0;
  private currentItemTranscript: string = '';
  private currentItemConfidence: number = 1.0;

  private onStateChangeCallback?: (isListening: boolean) => void;
  private onErrorCallback?: (err: string) => void;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  public isSecureEnvironment(): boolean {
    if (typeof window === 'undefined') return true;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public async checkAndRequestPermission(): Promise<{
    granted: boolean;
    state: 'granted' | 'denied' | 'insecure_context' | 'not_supported' | 'error';
    message?: string;
  }> {
    if (!this.isSupported()) {
      return {
        granted: false,
        state: 'not_supported',
        message: 'Navegador não possui suporte para captura de áudio (getUserMedia).'
      };
    }

    if (!this.isSecureEnvironment()) {
      return {
        granted: false,
        state: 'insecure_context',
        message: 'Para usar o microfone em dispositivos móveis, é necessário conexão segura HTTPS ou localhost.'
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true, state: 'granted' };
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return {
          granted: false,
          state: 'denied',
          message: 'Permissão de microfone bloqueada pelo usuário nas configurações do navegador.'
        };
      }
      return {
        granted: false,
        state: 'error',
        message: err.message || 'Falha ao solicitar microfone.'
      };
    }
  }

  public async startSession(
    onStateChange?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): Promise<boolean> {
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError;
    this.isSessionActive = true;

    try {
      const stream = await audioService.ensureMicStream();
      if (!stream) {
        throw new Error('Não foi possível obter o fluxo de áudio do microfone.');
      }
      this.isListening = true;
      this.onStateChangeCallback?.(true);
      return true;
    } catch (err: any) {
      console.warn('[FluencIA Áudio] Aviso na sessão de microfone:', err);
      this.onErrorCallback?.(err.message || 'Erro de microfone');
      return false;
    }
  }

  public prepareNextItem(options: ProviderItemOptions): void {
    if (!this.isSessionActive) {
      this.startSession(this.onStateChangeCallback, this.onErrorCallback);
    }

    this.currentItemOptions = options;
    this.isItemActive = true;
    this.itemStartTime = Date.now();
    this.speechStartTimestamp = null;
    this.speechEndTimestamp = null;
    this.numberOfAttempts = 0;
    this.currentItemTranscript = '';
    this.currentItemConfidence = 1.0;
  }

  public consumeItemResult(): SpeechItemCapture {
    const durationMs = this.itemStartTime > 0 ? Date.now() - this.itemStartTime : 0;
    const speechStartMs = this.speechStartTimestamp !== null ? this.speechStartTimestamp - this.itemStartTime : undefined;
    const speechEndMs = this.speechEndTimestamp !== null ? this.speechEndTimestamp - this.itemStartTime : undefined;

    this.isItemActive = false;

    const result: SpeechItemCapture = {
      transcript: this.currentItemTranscript,
      normalizedTranscript: this.currentItemTranscript.toUpperCase(),
      confidence: this.currentItemConfidence,
      responseTimeMs: durationMs,
      availableTimeMs: this.currentItemOptions?.availableTimeMs || 10000,
      speechStartMs,
      speechEndMs,
      numberOfAttempts: Math.max(1, this.numberOfAttempts),
      recognitionQuality: 'good',
      provider: this.id
    };

    this.currentItemOptions = undefined;
    this.currentItemTranscript = '';

    return result;
  }

  public stopSession(): void {
    this.isSessionActive = false;
    this.isItemActive = false;
    this.isListening = false;
    this.currentItemOptions = undefined;
    audioService.stopMicMonitoring();
    this.onStateChangeCallback?.(false);
  }

  public abort(): void {
    this.stopSession();
  }

  // Compatibilidade com telas auxiliares (EnvironmentCheck, SettingsModal)
  public async startListening(
    _onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void,
    onStateChange?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): Promise<boolean> {
    await this.startSession(onStateChange, onError);
    audioService.startItemRecording();
    return true;
  }

  public async stopListening(): Promise<{ transcript: string; confidence: number; durationMs: number }> {
    const durationMs = this.itemStartTime > 0 ? Date.now() - this.itemStartTime : 1000;
    let transcript = '';
    let confidence = 1.0;

    try {
      const audioBlob = await audioService.stopItemRecording();
      if (audioBlob && audioBlob.size > 100) {
        const formData = new FormData();
        const extension = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        formData.append('audioFile', audioBlob, `test_${Date.now()}.${extension}`);
        formData.append('targetText', 'TESTE');
        formData.append('itemType', 'word');

        const aiRes = await api.analyzeAudioItem(formData);
        if (aiRes) {
          transcript = aiRes.transcript || '';
          confidence = aiRes.similarity ?? 1.0;
        }
      }
    } catch (err) {
      console.warn('[SpeechService] Teste de áudio Groq Whisper offline ou inatingível:', err);
    }

    this.stopSession();
    return {
      transcript,
      confidence,
      durationMs
    };
  }
}

// Exportações para compatibilidade estrita
export const BrowserWebSpeechProvider = GroqGeminiSpeechProvider;
export const speechService = new GroqGeminiSpeechProvider();
