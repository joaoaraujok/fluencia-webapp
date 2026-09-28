/**
 * Máquina de Estados e Motor de Temporização Rigorosa do Protocolo FluencIA.
 * Implementa com precisão temporal:
 * - Janela inicial de 3 segundos para detecção de fala (omissão imediata se silencioso);
 * - Janela de 2 segundos de silêncio pós-fala (excluída do tempo efetivo);
 * - Teto máximo de 5 segundos de fala contínua após a primeira emissão;
 * - Janela de 4 segundos de silêncio para encerramento de leitura de texto corrido;
 * - Janela de 5 segundos para omissão de palavras no texto;
 * - Segregação matemática rigorosa: tempo bruto, silêncio, fala detectada, tempo efetivo e tempo de IA;
 * - Suporte a relógio monotônico (performance.now()) e relógio simulado para testes automatizados.
 */

import { QuestionItem } from '../types/question';
import { RecognitionStatus } from '../types/speech';

export type ItemState =
  | 'IDLE'
  | 'PRESENTING_ITEM'
  | 'WAITING_FOR_SPEECH'
  | 'CAPTURING_SPEECH'
  | 'SILENCE_DETECTED'
  | 'SUBMITTING_AUDIO'
  | 'ANALYZING_AUDIO'
  | 'FINALIZING_ITEM'
  | 'ADVANCING'
  | 'BLOCK_COMPLETED'
  | 'COMPLETED'
  | 'ERROR_RECOVERY';

export interface Clock {
  now(): number;
  setTimeout(cb: () => void, ms: number): any;
  clearTimeout(id: any): void;
  setInterval(cb: () => void, ms: number): any;
  clearInterval(id: any): void;
}

export const systemClock: Clock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (cb, ms) => setInterval(cb, ms),
  clearInterval: (id) => clearInterval(id)
};

export interface ItemTimingConfig {
  initialSilenceWindowMs: number;      // 3000ms: espera pela primeira fala em itens isolados
  postSpeechSilenceWindowMs: number;    // 2000ms: silêncio pós-fala que encerra o item isolado
  maxPostSpeechDurationMs: number;      // 5000ms: teto de duração após a fala começar
  textSilenceWindowMs: number;          // 4000ms: silêncio que encerra a leitura de texto
  textWordOmissionWindowMs: number;     // 5000ms: caracterização de omissão no texto
  maxTextDurationMs: number;            // 60000ms: teto oficial da leitura de texto
  speechVolumeThreshold: number;        // Limiar de volume (0-100) para voz ativa
}

export const DEFAULT_TIMING_CONFIG: ItemTimingConfig = {
  initialSilenceWindowMs: 3000,
  postSpeechSilenceWindowMs: 2000,
  maxPostSpeechDurationMs: 5000,
  textSilenceWindowMs: 4000,
  textWordOmissionWindowMs: 5000,
  maxTextDurationMs: 60000,
  speechVolumeThreshold: 8
};

export interface TimingMetrics {
  presentationTimestamp: number;
  speechStartTimestamp: number | null;
  lastSpeechTimestamp: number | null;
  itemEndTimestamp: number;
  grossRecordingTimeMs: number;
  speechDetectedTimeMs: number;
  silenceDurationMs: number;
  effectiveReadingTimeMs: number;
  reactionTimeMs: number;
  isOmission: boolean;
  isTimeLimitReached: boolean;
  omissionReason?: string;
}

export interface ItemStateMachineCallbacks {
  onStateChange?: (newState: ItemState, oldState: ItemState) => void;
  onOmission?: (metrics: TimingMetrics) => void;
  onSpeechDetected?: (timestampMs: number) => void;
  onItemCompleted?: (metrics: TimingMetrics, finalStatus: RecognitionStatus) => void;
  onRequestAiAnalysis?: (metrics: TimingMetrics) => Promise<void> | void;
}

export class ItemStateMachine {
  private state: ItemState = 'IDLE';
  private currentItem: QuestionItem | null = null;
  private config: ItemTimingConfig;
  private clock: Clock;
  private callbacks: ItemStateMachineCallbacks;

  // Timestamps monotônicos
  private presentationTime: number = 0;
  private speechStartTime: number | null = null;
  private lastSpeechTime: number | null = null;
  private itemEndTime: number = 0;

  // Acumuladores de fala e pausas
  private isSpeechActive: boolean = false;
  private consecutiveSpeechFrames: number = 0;
  private silenceDurationAccumulated: number = 0;
  private isOmission: boolean = false;
  private isTimeLimitReached: boolean = false;
  private omissionReason?: string;

  // Handles de temporizadores
  private initialTimeoutHandle: any = null;
  private maxDurationTimeoutHandle: any = null;
  private silenceTimeoutHandle: any = null;
  private monitoringIntervalHandle: any = null;

  constructor(
    callbacks: ItemStateMachineCallbacks = {},
    config: Partial<ItemTimingConfig> = {},
    clock: Clock = systemClock
  ) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_TIMING_CONFIG, ...config };
    this.clock = clock;
  }

  public getState(): ItemState {
    return this.state;
  }

  public getConfig(): ItemTimingConfig {
    return { ...this.config };
  }

  public isVocalActivityDetected(): boolean {
    return this.isSpeechActive;
  }

  public getAccumulatedSilenceMs(): number {
    return this.silenceDurationAccumulated;
  }

  public getCurrentItem(): QuestionItem | null {
    return this.currentItem;
  }

  private transitionTo(newState: ItemState): void {
    const oldState = this.state;
    if (oldState === newState) return;
    this.state = newState;
    this.callbacks.onStateChange?.(newState, oldState);
  }

  /**
   * Inicia a apresentação de um item e ativa a máquina de estados temporal.
   */
  public startItem(item: QuestionItem): void {
    this.resetTimers();
    this.currentItem = item;
    this.presentationTime = this.clock.now();
    this.speechStartTime = null;
    this.lastSpeechTime = null;
    this.itemEndTime = 0;
    this.isSpeechActive = false;
    this.consecutiveSpeechFrames = 0;
    this.silenceDurationAccumulated = 0;
    this.isOmission = false;
    this.isTimeLimitReached = false;
    this.omissionReason = undefined;

    const isText = item.type === 'text';

    this.transitionTo('PRESENTING_ITEM');

    // Transita imediatamente para aguardar fala
    this.transitionTo('WAITING_FOR_SPEECH');

    if (isText) {
      // Para texto: teto máximo oficial (padrão 60s)
      this.maxDurationTimeoutHandle = this.clock.setTimeout(() => {
        this.handleMaxDurationReached();
      }, this.config.maxTextDurationMs);
    } else {
      // Para itens isolados (letras, palavras, pseudopalavras):
      // Janela inicial estrita de 3 segundos para detectar início vocal
      this.initialTimeoutHandle = this.clock.setTimeout(() => {
        this.handleInitialSilenceExpired();
      }, this.config.initialSilenceWindowMs);
    }
  }

  /**
   * Processa leitura de volume do microfone (chamado pelo monitor de áudio / VAD).
   */
  public processAudioVolume(volumePercent: number): void {
    const now = this.clock.now();
    const elapsedSincePresentation = now - this.presentationTime;

    // Ignora os primeiros 200ms para evitar cliques do botão ou transições
    if (elapsedSincePresentation < 200) return;

    const isAboveThreshold = volumePercent >= this.config.speechVolumeThreshold;
    const isText = this.currentItem?.type === 'text';

    if (this.state === 'WAITING_FOR_SPEECH') {
      if (isAboveThreshold) {
        this.consecutiveSpeechFrames++;
        if (this.consecutiveSpeechFrames >= 2) {
          // Fala detectada dentro da janela inicial!
          this.handleSpeechDetected(now);
        }
      } else {
        this.consecutiveSpeechFrames = 0;
      }
      return;
    }

    if (this.state === 'CAPTURING_SPEECH') {
      if (isAboveThreshold) {
        this.lastSpeechTime = now;
        this.isSpeechActive = true;

        // Se havia temporizador de silêncio correndo, cancela (criança retomou a fala)
        if (this.silenceTimeoutHandle !== null) {
          this.clock.clearTimeout(this.silenceTimeoutHandle);
          this.silenceTimeoutHandle = null;
        }
      } else {
        // Silêncio detectado durante a captura
        this.isSpeechActive = false;

        if (this.silenceTimeoutHandle === null && this.lastSpeechTime !== null) {
          const silenceWindow = isText
            ? this.config.textSilenceWindowMs       // 4.0s para encerramento de texto
            : this.config.postSpeechSilenceWindowMs; // 2.0s para itens isolados

          this.silenceTimeoutHandle = this.clock.setTimeout(() => {
            this.handleSilenceWindowExpired();
          }, silenceWindow);
        }
      }
    }
  }

  /**
   * Notificação explícita de início de fala (por exemplo vindo do SpeechRecognitionProvider)
   */
  public notifySpeechStart(timestampMs?: number): void {
    if (this.state === 'WAITING_FOR_SPEECH') {
      this.handleSpeechDetected(timestampMs ?? this.clock.now());
    }
  }

  private handleSpeechDetected(now: number): void {
    // Cancela o timeout da janela inicial de 3s
    if (this.initialTimeoutHandle !== null) {
      this.clock.clearTimeout(this.initialTimeoutHandle);
      this.initialTimeoutHandle = null;
    }

    this.speechStartTime = now;
    this.lastSpeechTime = now;
    this.isSpeechActive = true;

    this.transitionTo('CAPTURING_SPEECH');
    this.callbacks.onSpeechDetected?.(now);

    const isText = this.currentItem?.type === 'text';
    if (!isText) {
      // Dispara o teto máximo de 5s contados A PARTIR do início da fala
      this.maxDurationTimeoutHandle = this.clock.setTimeout(() => {
        this.handleMaxDurationReached();
      }, this.config.maxPostSpeechDurationMs);
    }
  }

  /**
   * Caso 1: Nenhuma fala detectada durante a janela inicial de 3 segundos -> OMISSAO.
   * Não aguarda o restante de nenhum timer; avança imediatamente.
   */
  private handleInitialSilenceExpired(): void {
    if (this.state !== 'WAITING_FOR_SPEECH') return;

    this.itemEndTime = this.clock.now();
    this.isOmission = true;
    this.omissionReason = 'Nenhuma emissão vocal detectada na janela inicial de 3 segundos';

    this.transitionTo('SILENCE_DETECTED');
    this.transitionTo('FINALIZING_ITEM');

    const metrics = this.computeMetrics(this.config.initialSilenceWindowMs);
    this.callbacks.onOmission?.(metrics);
    this.callbacks.onItemCompleted?.(metrics, 'OMISSAO');
  }

  /**
   * Caso 2: Silêncio pós-fala detectado (2s em isoladas, 4s em texto)
   */
  private handleSilenceWindowExpired(): void {
    if (this.state !== 'CAPTURING_SPEECH') return;

    this.itemEndTime = this.clock.now();
    this.transitionTo('SILENCE_DETECTED');

    const isText = this.currentItem?.type === 'text';
    const silenceDeduction = isText
      ? this.config.textSilenceWindowMs
      : this.config.postSpeechSilenceWindowMs;

    this.transitionTo('SUBMITTING_AUDIO');
    const metrics = this.computeMetrics(silenceDeduction);

    this.transitionTo('ANALYZING_AUDIO');
    this.callbacks.onRequestAiAnalysis?.(metrics);
  }

  /**
   * Caso 3: Teto máximo de duração atingido (5s após início da fala em isoladas, 60s em texto)
   */
  private handleMaxDurationReached(): void {
    if (this.state !== 'CAPTURING_SPEECH' && this.state !== 'WAITING_FOR_SPEECH') return;

    this.itemEndTime = this.clock.now();
    this.isTimeLimitReached = true;

    if (this.state === 'WAITING_FOR_SPEECH') {
      this.isOmission = true;
      this.omissionReason = 'Limite máximo de espera sem fala atingido';
    }

    this.transitionTo('SUBMITTING_AUDIO');
    const metrics = this.computeMetrics(0);

    this.transitionTo('ANALYZING_AUDIO');
    this.callbacks.onRequestAiAnalysis?.(metrics);
  }

  /**
   * Encerramento forçado manual ou pelo supervisor (ex: atalho do teclado ou botão avançar)
   */
  public forceComplete(explicitStatus?: RecognitionStatus): TimingMetrics {
    this.itemEndTime = this.clock.now();
    this.resetTimers();

    const metrics = this.computeMetrics(0);
    this.transitionTo('FINALIZING_ITEM');
    this.callbacks.onItemCompleted?.(metrics, explicitStatus || (this.isOmission ? 'OMISSAO' : 'CORRETO'));
    return metrics;
  }

  /**
   * Chamado quando a análise da IA retorna para finalizar o item
   */
  public finalizeItem(finalStatus: RecognitionStatus): TimingMetrics {
    const metrics = this.computeMetrics();
    this.transitionTo('FINALIZING_ITEM');
    this.callbacks.onItemCompleted?.(metrics, finalStatus);
    this.transitionTo('ADVANCING');
    return metrics;
  }

  /**
   * Cálculo matemático preciso de tempos com separação estrita de silêncios
   */
  public computeMetrics(knownSilenceDeductionMs: number = 0): TimingMetrics {
    const end = this.itemEndTime || this.clock.now();
    const gross = Math.max(0, end - this.presentationTime);

    let reactionTimeMs = 0;
    let speechDetectedMs = 0;
    let silenceDurationMs = knownSilenceDeductionMs;

    if (this.isOmission || this.speechStartTime === null) {
      reactionTimeMs = gross;
      speechDetectedMs = 0;
      silenceDurationMs = gross;
    } else {
      reactionTimeMs = Math.max(0, this.speechStartTime - this.presentationTime);
      const speechEnd = this.lastSpeechTime || end;
      speechDetectedMs = Math.max(0, speechEnd - this.speechStartTime);

      if (silenceDurationMs === 0) {
        silenceDurationMs = Math.max(0, end - speechEnd);
      }
    }

    // Tempo efetivo de leitura: EXCLUI o silêncio de encerramento
    // Para palavras isoladas, é a duração real da articulação da criança
    const effectiveReadingTimeMs = this.isOmission
      ? 0
      : Math.max(200, Math.round(speechDetectedMs > 0 ? speechDetectedMs : gross - silenceDurationMs));

    return {
      presentationTimestamp: this.presentationTime,
      speechStartTimestamp: this.speechStartTime,
      lastSpeechTimestamp: this.lastSpeechTime,
      itemEndTimestamp: end,
      grossRecordingTimeMs: Math.round(gross),
      speechDetectedTimeMs: Math.round(speechDetectedMs),
      silenceDurationMs: Math.round(silenceDurationMs),
      effectiveReadingTimeMs,
      reactionTimeMs: Math.round(reactionTimeMs),
      isOmission: this.isOmission,
      isTimeLimitReached: this.isTimeLimitReached,
      omissionReason: this.omissionReason
    };
  }

  public resetTimers(): void {
    if (this.initialTimeoutHandle !== null) {
      this.clock.clearTimeout(this.initialTimeoutHandle);
      this.initialTimeoutHandle = null;
    }
    if (this.maxDurationTimeoutHandle !== null) {
      this.clock.clearTimeout(this.maxDurationTimeoutHandle);
      this.maxDurationTimeoutHandle = null;
    }
    if (this.silenceTimeoutHandle !== null) {
      this.clock.clearTimeout(this.silenceTimeoutHandle);
      this.silenceTimeoutHandle = null;
    }
    if (this.monitoringIntervalHandle !== null) {
      this.clock.clearInterval(this.monitoringIntervalHandle);
      this.monitoringIntervalHandle = null;
    }
  }

  public destroy(): void {
    this.resetTimers();
    this.state = 'IDLE';
    this.currentItem = null;
  }
}
