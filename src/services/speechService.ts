/**
 * Camada de Abstração para Reconhecimento de Fala via Web Speech API.
 * Isola a implementação do navegador e garante captura contínua e sem perda de transcrições parciais.
 */

// Declaração de tipos para SpeechRecognition do navegador
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

  // 1. Remove palavras consecutivas idênticas imediatas (ex: "BOLA BOLA BOLA" -> "BOLA")
  const step1: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = step1.length > 0 ? step1[step1.length - 1] : null;
    if (!prev || current.toLowerCase() !== prev.toLowerCase()) {
      step1.push(current);
    }
  }

  // 2. Remove repetições cíclicas de frases completas (ex: "é uma bola é uma bola")
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

export interface PrepareItemOptions {
  expectedText?: string;
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onMatch?: (matchedTranscript: string, confidence: number) => void;
  checkMatch?: (alternatives: string[]) => { matched: boolean; transcript: string; confidence?: number } | null;
}

class SpeechService {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private latestTranscript: string = '';
  private currentConfidence: number = 1.0;
  private startTime: number = 0;
  private onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  private onStateChange?: (isListening: boolean) => void;
  private onError?: (error: string) => void;

  // Propriedades para Sessão de Avaliação (Isolamento Estrito por Item + Baixa Latência)
  private isEvaluationSession: boolean = false;
  private isItemActive: boolean = false;
  private currentItemTranscript: string = '';
  private currentItemConfidence: number = 1.0;
  private currentItemStartTime: number = 0;
  private currentItemOptions?: PrepareItemOptions;
  private hasMatchedCurrentItem: boolean = false;
  private backgroundStream: MediaStream | null = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowSpeechRecognition;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /**
   * Verifica se o ambiente atual é seguro (HTTPS ou localhost).
   * Celulares bloqueiam estritamente microfone em conexões HTTP normais (ex: IP 192.168.x.x).
   */
  public isSecureEnvironment(): boolean {
    if (typeof window === 'undefined') return true;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Aborta a instância ativa de SpeechRecognition garantindo que nenhum evento residual dispare
   */
  private abortRecognitionOnly(): void {
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

  /**
   * Cria uma instância de SpeechRecognition isolada para um item específico.
   * Usar continuous: false garante baixa latência no celular (150ms) e IMPEDE que
   * o Google Speech concatene palavras de itens diferentes em uma mesma frase.
   */
  private createItemRecognitionInstance(): any | null {
    if (!this.isSupported()) return null;

    try {
      const win = window as unknown as IWindowSpeechRecognition;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.lang = 'pt-BR';
      // continuous = false é CRUCIAL: evita que o Android mantenha buffer de frases longas
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 4;

      rec.onstart = () => {
        this.isListening = true;
        this.onStateChange?.(true);
      };

      rec.onresult = (event: any) => {
        if (!event || !event.results || !this.isItemActive) return;

        let consolidatedText = '';
        let bestConfidence = 1.0;
        const alternatives: string[] = [];

        // Constrói a transcrição atual consolidada substituindo rascunhos anteriores
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
        }

        // Checagem imediata de match fonético nas alternativas (menos de 200ms)
        if (!this.hasMatchedCurrentItem && this.currentItemOptions?.checkMatch && alternatives.length > 0) {
          const matchResult = this.currentItemOptions.checkMatch(alternatives);
          if (matchResult && matchResult.matched) {
            this.hasMatchedCurrentItem = true;
            this.currentItemTranscript = matchResult.transcript;
            this.currentItemConfidence = matchResult.confidence ?? bestConfidence;
            this.currentItemOptions.onMatch?.(matchResult.transcript, this.currentItemConfidence);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition erro:', event.error);
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          this.onError?.(event.error);
          this.isListening = false;
          this.onStateChange?.(false);
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.onStateChange?.(false);

        // Se o item ainda estiver ativo e a criança ainda não acertou, reativa para permitir nova tentativa dentro dos 3s
        if (this.isEvaluationSession && this.isItemActive && !this.hasMatchedCurrentItem) {
          try {
            this.recognition?.start();
          } catch {}
        }
      };

      return rec;
    } catch (err) {
      console.error('Falha ao inicializar Web Speech API:', err);
      return null;
    }
  }

  /**
   * Instância clássica avulsa para calibração / configurações
   */
  private createRecognitionInstance(): any | null {
    if (!this.isSupported()) return null;

    try {
      const win = window as unknown as IWindowSpeechRecognition;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        this.isListening = true;
        this.onStateChange?.(true);
      };

      rec.onresult = (event: any) => {
        let bestConfidence = 1.0;
        let consolidated = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0] && res[0].transcript) {
            const piece = res[0].transcript.trim();
            if (piece) {
              consolidated = consolidated ? `${consolidated} ${piece}` : piece;
            }
            if (res[0].confidence && res[0].confidence > 0) {
              bestConfidence = res[0].confidence;
            }
          }
        }

        const cleaned = deduplicateSpeechTranscript(consolidated);
        if (cleaned) {
          this.latestTranscript = cleaned;
          this.currentConfidence = bestConfidence;
          this.onTranscriptUpdate?.(cleaned, true);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition erro:', event.error);
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          this.onError?.(event.error);
          this.isListening = false;
          this.onStateChange?.(false);
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.onStateChange?.(false);
      };

      return rec;
    } catch (err) {
      console.error('Falha ao inicializar Web Speech API:', err);
      return null;
    }
  }

  /**
   * Diagnóstico aprofundado e solicitação de permissão de microfone
   */
  public async checkAndRequestPermission(): Promise<{
    granted: boolean;
    state: 'granted' | 'denied' | 'insecure_context' | 'not_supported' | 'error';
    message?: string;
  }> {
    // 1. Checa contexto de segurança (HTTP em celulares)
    if (!this.isSecureEnvironment()) {
      return {
        granted: false,
        state: 'insecure_context',
        message: 'O navegador do celular bloqueia microfones em conexões HTTP. Use HTTPS ou localhost.'
      };
    }

    // 2. Tenta solicitação nativa via getUserMedia
    try {
      let stream: MediaStream | null = null;
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        const legacy =
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;
        if (legacy) {
          stream = await new Promise<MediaStream>((resolve, reject) => {
            legacy.call(navigator, { audio: true }, resolve, reject);
          });
        }
      }

      if (stream) {
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
          message: 'Permissão de microfone negada. Libere nas configurações do site.'
        };
      }
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        return {
          granted: false,
          state: 'not_supported',
          message: 'Nenhum microfone encontrado neste aparelho.'
        };
      }
      return {
        granted: false,
        state: 'error',
        message: err?.message || 'Falha ao solicitar microfone.'
      };
    }
  }

  /**
   * Solicita permissão prévia do microfone de forma simplificada
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    const res = await this.checkAndRequestPermission();
    return res.granted;
  }

  /**
   * Inicia a escuta para um item da avaliação ou teste
   */
  public startListening(
    onUpdate?: (transcript: string, isFinal: boolean) => void,
    onState?: (isListening: boolean) => void,
    onError?: (error: string) => void
  ): boolean {
    this.latestTranscript = '';
    this.currentConfidence = 1.0;
    this.startTime = Date.now();
    this.onTranscriptUpdate = onUpdate;
    this.onStateChange = onState;
    this.onError = onError;

    // Cancela qualquer instância anterior antes de criar a nova
    this.abort();

    // Cria instância nova e limpa
    this.recognition = this.createRecognitionInstance();
    if (!this.recognition) return false;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Erro ao chamar recognition.start():', err);
      return false;
    }
  }

  /**
   * Encerra a escuta do item atual e retorna a transcrição capturada
   */
  public async stopListening(): Promise<{ transcript: string; confidence: number; durationMs: number }> {
    const durationMs = Date.now() - this.startTime;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }

    // Pequena espera de 100ms para receber o último evento do microfone
    await new Promise(r => setTimeout(r, 100));

    const finalTranscript = (this.latestTranscript || '').trim();
    const finalConfidence = this.currentConfidence;

    this.isListening = false;
    this.onStateChange?.(false);

    return {
      transcript: finalTranscript,
      confidence: finalConfidence,
      durationMs
    };
  }

  /**
   * Inicia a Sessão de Avaliação com pré-aquecimento do hardware de áudio.
   * Mantém o driver de microfone do celular ativo em segundo plano durante todo o teste,
   * eliminando qualquer lag de hardware, enquanto cada palavra do teste possui sua
   * própria instância isolada de reconhecimento.
   */
  public startEvaluationSession(
    onState?: (isListening: boolean) => void,
    onError?: (error: string) => void
  ): boolean {
    this.abort();
    this.isEvaluationSession = true;
    this.currentItemTranscript = '';
    this.currentItemConfidence = 1.0;
    this.hasMatchedCurrentItem = false;
    this.onStateChange = onState;
    this.onError = onError;

    // Pré-aquece o hardware do microfone via MediaStream para que o Android não durma entre itens
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (this.isEvaluationSession) {
            this.backgroundStream = stream;
            this.isListening = true;
            this.onStateChange?.(true);
          } else {
            stream.getTracks().forEach((t) => t.stop());
          }
        })
        .catch((err) => {
          console.warn('Aviso: microfone em background:', err);
        });
    }

    return true;
  }

  /**
   * Prepara o microfone para o item atual da avaliação.
   * Cria uma sessão isolada, limpa e com continuous: false para o item.
   * Isso IMPEDE que palavras de itens anteriores vazem para o item atual.
   */
  public prepareNextItem(options: PrepareItemOptions): void {
    // 1. Cancela qualquer reconhecimento anterior de forma limpa
    this.abortRecognitionOnly();

    // 2. Inicializa o estado estritamente limpo para esta palavra
    this.isItemActive = true;
    this.currentItemTranscript = '';
    this.currentItemConfidence = 1.0;
    this.hasMatchedCurrentItem = false;
    this.currentItemStartTime = Date.now();
    this.currentItemOptions = options;

    // 3. Cria uma instância limpa para este item
    this.recognition = this.createItemRecognitionInstance();
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Erro ao iniciar reconhecimento da palavra:', err);
      }
    }
  }

  /**
   * Consome e retorna o resultado da palavra atual isolada.
   * Encerra o reconhecimento do item e limpa o buffer.
   */
  public consumeItemResult(): { transcript: string; confidence: number; durationMs: number } {
    const durationMs = this.currentItemStartTime > 0 ? Date.now() - this.currentItemStartTime : 0;
    const finalTranscript = (this.currentItemTranscript || '').trim();
    const finalConfidence = this.currentItemConfidence;

    // Encerra imediatamente a escuta do item
    this.isItemActive = false;
    this.abortRecognitionOnly();

    this.currentItemOptions = undefined;
    this.hasMatchedCurrentItem = false;
    this.currentItemTranscript = '';

    return {
      transcript: finalTranscript,
      confidence: finalConfidence,
      durationMs
    };
  }

  /**
   * Encerra definitivamente a sessão de avaliação ao finalizar o teste.
   */
  public stopEvaluationSession(): void {
    this.isEvaluationSession = false;
    this.isItemActive = false;
    this.abort();
  }

  /**
   * Cancela a escuta imediatamente e remove todas as referências e streams
   */
  public abort() {
    this.isEvaluationSession = false;
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
    this.onStateChange?.(false);
  }
}

export const speechService = new SpeechService();
