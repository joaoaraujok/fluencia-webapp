/**
 * Camada de Abstração para Reconhecimento de Fala (SpeechRecognitionProvider).
 * Desacopla a regra de negócio da implementação do navegador e garante
 * isolamento estrito por item, baixa latência e métricas temporais minuciosas.
 */

import { ProviderItemOptions, SpeechItemCapture, SpeechRecognitionProvider } from '../types/speech';

interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

/**
 * Remove repetições consecutivas de palavras ou frases causadas por flutuação
 * do buffer da Web Speech API no Android e celulares.
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

export class BrowserWebSpeechProvider implements SpeechRecognitionProvider {
  public readonly id = 'browser-web-speech';

  private recognition: any | null = null;
  private isListening: boolean = false;
  private backgroundStream: MediaStream | null = null;

  // Estado da sessão e do item ativo
  private isSessionActive: boolean = false;
  private isItemActive: boolean = false;
  private currentItemOptions?: ProviderItemOptions;

  // Métricas temporais detalhadas do item atual (10s)
  private itemStartTime: number = 0;
  private speechStartTimestamp: number | null = null;
  private speechEndTimestamp: number | null = null;
  private numberOfAttempts: number = 0;
  private currentItemTranscript: string = '';
  private currentItemConfidence: number = 1.0;
  private hasMatchedCurrentItem: boolean = false;

  private onStateChangeCallback?: (isListening: boolean) => void;
  private onErrorCallback?: (err: string) => void;
  private restartRecognitionTimeout: any = null;
  private startItemTimeout: any = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowSpeechRecognition;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
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

  private abortRecognitionOnly(): void {
    if (this.restartRecognitionTimeout) {
      clearTimeout(this.restartRecognitionTimeout);
      this.restartRecognitionTimeout = null;
    }
    if (this.startItemTimeout) {
      clearTimeout(this.startItemTimeout);
      this.startItemTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  private createItemInstance(): any | null {
    if (!this.isSupported()) return null;

    try {
      const win = window as unknown as IWindowSpeechRecognition;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.lang = 'pt-BR';
      // continuous configurável: false para palavras/letras rápidas, true para texto longo
      rec.continuous = this.currentItemOptions?.continuous ?? false;
      rec.interimResults = true;
      rec.maxAlternatives = 4;

      rec.onstart = () => {
        this.isListening = true;
        this.onStateChangeCallback?.(true);
        console.log(`[FluencIA Áudio] Microfone ativo para o item: "${this.currentItemOptions?.expectedText || ''}"`);
      };

      rec.onaudiostart = () => {
        console.log('[FluencIA Áudio] Sinal sonoro detectado');
      };

      rec.onresult = (event: any) => {
        if (!event || !event.results || !this.isItemActive) return;

        const now = Date.now();
        if (this.speechStartTimestamp === null) {
          this.speechStartTimestamp = now;
        }
        this.speechEndTimestamp = now;
        this.numberOfAttempts++;

        let consolidatedText = '';
        let bestConfidence = 1.0;
        const alternatives: string[] = [];

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (!res) continue;

          for (let a = 0; a < res.length; ++a) {
            const alt = res[a];
            if (alt && alt.transcript) {
              const cleanAlt = alt.transcript.trim();
              if (cleanAlt && !alternatives.includes(cleanAlt)) {
                alternatives.push(cleanAlt);
              }
            }
          }

          if (res[0] && res[0].transcript) {
            const piece = res[0].transcript.trim();
            if (piece) {
              consolidatedText = consolidatedText ? `${consolidatedText} ${piece}` : piece;
            }
            if (res[0].confidence && res[0].confidence > 0) {
              bestConfidence = res[0].confidence;
            }
          }
        }

        const cleaned = deduplicateSpeechTranscript(consolidatedText);
        if (cleaned) {
          this.currentItemTranscript = cleaned;
          this.currentItemConfidence = bestConfidence;
          this.currentItemOptions?.onTranscriptUpdate?.(cleaned, false);
          console.log(`[FluencIA Áudio] Transcrição: "${cleaned}" (Confiança: ${bestConfidence})`, alternatives);
        }

        // Checagem imediata de match nas alternativas
        if (!this.hasMatchedCurrentItem && this.currentItemOptions?.checkMatch && alternatives.length > 0) {
          const matchResult = this.currentItemOptions.checkMatch(alternatives);
          if (matchResult && matchResult.matched) {
            this.hasMatchedCurrentItem = true;
            this.currentItemTranscript = matchResult.transcript;
            this.currentItemConfidence = matchResult.confidence ?? bestConfidence;
            console.log(`[FluencIA Áudio] Match imediato reconhecido: "${matchResult.transcript}"`);
            this.currentItemOptions.onMatch?.(matchResult.transcript, this.currentItemConfidence);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[FluencIA Áudio] Erro Web Speech:', event.error);
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          this.onErrorCallback?.(event.error);
          this.isListening = false;
          this.onStateChangeCallback?.(false);
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.onStateChangeCallback?.(false);

        // Se o item ainda estiver ativo na janela de tempo e a criança não concluiu, reinicia criando nova instância
        if (this.isSessionActive && this.isItemActive && !this.hasMatchedCurrentItem) {
          this.restartRecognitionForItem();
        }
      };

      return rec;
    } catch (err) {
      console.error('Falha ao inicializar Web Speech API:', err);
      return null;
    }
  }

  public async checkAndRequestPermission(): Promise<{
    granted: boolean;
    state: 'granted' | 'denied' | 'insecure_context' | 'not_supported' | 'error';
    message?: string;
  }> {
    if (!this.isSecureEnvironment()) {
      return {
        granted: false,
        state: 'insecure_context',
        message: 'O navegador bloqueia microfones em conexões HTTP. Utilize HTTPS ou localhost.'
      };
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((track) => track.stop());
        return { granted: true, state: 'granted' };
      }
      return {
        granted: false,
        state: 'not_supported',
        message: 'Dispositivo ou API de microfone não encontrada.'
      };
    } catch (err: any) {
      console.warn('Erro ao solicitar permissão de microfone:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        return {
          granted: false,
          state: 'denied',
          message: 'Permissão de microfone negada. Libere nas configurações do navegador.'
        };
      }
      return {
        granted: false,
        state: 'error',
        message: err?.message || 'Falha ao solicitar microfone.'
      };
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    const res = await this.checkAndRequestPermission();
    return res.granted;
  }

  public startSession(
    onStateChange?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): boolean {
    this.abort();
    this.isSessionActive = true;
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError;
    return true;
  }

  private restartRecognitionForItem(): void {
    if (this.restartRecognitionTimeout) {
      clearTimeout(this.restartRecognitionTimeout);
      this.restartRecognitionTimeout = null;
    }

    if (!this.isSessionActive || !this.isItemActive || this.hasMatchedCurrentItem) {
      return;
    }

    this.abortRecognitionOnly();

    this.restartRecognitionTimeout = setTimeout(() => {
      if (!this.isSessionActive || !this.isItemActive || this.hasMatchedCurrentItem) {
        return;
      }
      this.recognition = this.createItemInstance();
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (err) {
          console.warn('Aviso ao reiniciar microfone:', err);
        }
      }
    }, 60);
  }

  public prepareNextItem(options: ProviderItemOptions): void {
    this.abortRecognitionOnly();

    this.isItemActive = true;
    this.itemStartTime = Date.now();
    this.speechStartTimestamp = null;
    this.speechEndTimestamp = null;
    this.numberOfAttempts = 0;
    this.currentItemTranscript = '';
    this.currentItemConfidence = 1.0;
    this.hasMatchedCurrentItem = false;
    this.currentItemOptions = options;

    // Pausa técnica mínima (35ms) para que o Chrome libere o hardware de áudio do abort() anterior
    this.startItemTimeout = setTimeout(() => {
      if (!this.isItemActive || this.hasMatchedCurrentItem) return;

      this.recognition = this.createItemInstance();
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (_err) {
          // Contingência: retenta após 80ms se o navegador ainda estiver ocupado
          setTimeout(() => {
            if (this.isItemActive && !this.hasMatchedCurrentItem && !this.isListening) {
              try {
                this.recognition = this.createItemInstance();
                this.recognition?.start();
              } catch (err2) {
                console.warn('Retentativa do microfone para o item:', err2);
              }
            }
          }, 80);
        }
      }
    }, 35);
  }

  public consumeItemResult(): SpeechItemCapture {
    const now = Date.now();
    const durationMs = this.itemStartTime > 0 ? now - this.itemStartTime : 0;
    const finalTranscript = (this.currentItemTranscript || '').trim();
    const finalConfidence = this.currentItemConfidence;

    const speechStartMs = this.speechStartTimestamp !== null ? this.speechStartTimestamp - this.itemStartTime : undefined;
    const speechEndMs = this.speechEndTimestamp !== null ? this.speechEndTimestamp - this.itemStartTime : undefined;

    this.isItemActive = false;
    this.abortRecognitionOnly();

    const result: SpeechItemCapture = {
      transcript: finalTranscript,
      normalizedTranscript: finalTranscript.toUpperCase(),
      confidence: finalConfidence,
      responseTimeMs: durationMs,
      availableTimeMs: this.currentItemOptions?.availableTimeMs || 10000,
      speechStartMs,
      speechEndMs,
      numberOfAttempts: Math.max(1, this.numberOfAttempts),
      recognitionQuality: finalConfidence > 0.7 ? 'good' : finalConfidence > 0.3 ? 'poor' : 'noisy',
      provider: this.id
    };

    this.currentItemOptions = undefined;
    this.hasMatchedCurrentItem = false;
    this.currentItemTranscript = '';

    return result;
  }

  public stopSession(): void {
    this.isSessionActive = false;
    this.isItemActive = false;
    this.abort();
  }

  public abort(): void {
    this.isSessionActive = false;
    this.isItemActive = false;
    this.currentItemOptions = undefined;
    this.hasMatchedCurrentItem = false;
    this.currentItemTranscript = '';

    this.abortRecognitionOnly();

    if (this.backgroundStream) {
      try {
        this.backgroundStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.backgroundStream = null;
    }

    this.isListening = false;
    this.onStateChangeCallback?.(false);
  }

  // Compatibilidade com a API anterior
  public startEvaluationSession(
    onState?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): boolean {
    return this.startSession(onState, onError);
  }

  public stopEvaluationSession(): void {
    this.stopSession();
  }

  public startListening(
    onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void,
    onStateChange?: (isListening: boolean) => void,
    onError?: (err: string) => void
  ): boolean {
    this.startSession(onStateChange, onError);
    this.prepareNextItem({
      onTranscriptUpdate,
      availableTimeMs: 30000
    });
    return true;
  }

  public async stopListening(): Promise<{ transcript: string; confidence: number; durationMs: number }> {
    const res = this.consumeItemResult();
    this.stopSession();
    return {
      transcript: res.transcript,
      confidence: res.confidence,
      durationMs: res.responseTimeMs
    };
  }
}

// Instância padrão exportada
export const speechService = new BrowserWebSpeechProvider();
