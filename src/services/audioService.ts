/**
 * Serviço de Áudio Sintetizado via Web Audio API.
 * 100% autônomo, sem arquivos de áudio externos, funcionando offline.
 * Sons suaves, agradáveis e sem efeito punitivo de erro durante os testes.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Bip suave para contagem regressiva (3... 2... 1...)
   */
  public playCountdownBeep(pitchStep: number = 0) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseFreq = 440 + pitchStep * 60; // 440Hz -> 500Hz -> 560Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Acorde suave no início do teste ("Vamos começar!")
   */
  public playStartChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * Transição sutil entre itens (sem revelar acerto/erro)
   */
  public playTransitionTick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Fanfarra suave e alegre de conclusão da avaliação
   */
  public playCelebration() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Arpeggio de Dó Maior alegre: C5, D5, E5, G5, C6
    const chord = [523.25, 587.33, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  }

  // ==========================================
  // Monitoramento de Microfone em Tempo Real (VU Meter)
  // ==========================================
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isMonitoring: boolean = false;
  private volumeCallback: ((volumePercent: number) => void) | null = null;

  /**
   * Conecta os nós da Web Audio API apenas uma vez por MediaStream para evitar o bug do Chromium
   * onde reconectar createMediaStreamSource silencia o microfone (RMS = 0).
   */
  private setupAudioNodes(ctx: AudioContext, stream: MediaStream): boolean {
    if (this.micSource && this.analyser) {
      return true;
    }
    try {
      this.micSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      this.micSource.connect(this.analyser);
      return true;
    } catch (err) {
      console.warn('[AudioService] Erro ao configurar nós de áudio do microfone:', err);
      return false;
    }
  }

  /**
   * Inicia a captura e análise contínua de volume do microfone
   */
  public async startMicMonitoring(
    onVolumeChange: (volumePercent: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    this.volumeCallback = onVolumeChange;

    const ctx = this.getContext();
    if (!ctx) {
      return { success: false, error: 'Web Audio API não suportada neste navegador.' };
    }

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const stream = await this.ensureMicStream();
      if (!stream) {
        return { success: false, error: 'Dispositivo de microfone não encontrado ou contexto não seguro.' };
      }

      this.setupAudioNodes(ctx, stream);
      this.isMonitoring = true;

      if (this.animFrameId !== null) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (!this.analyser) {
        return { success: false, error: 'Falha ao inicializar o analisador de frequências.' };
      }

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.isMonitoring || !this.analyser) return;

        this.analyser.getByteTimeDomainData(dataArray);

        // Calcula a amplitude média quadrática (RMS)
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }

        const rms = Math.sqrt(sumSquares / dataArray.length);
        // Mapeia para 0 - 100% com sensibilidade adequada para voz humana e microfones padrão
        const volumePercent = Math.min(100, Math.round(rms * 400));
        if (this.volumeCallback) {
          this.volumeCallback(volumePercent);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
      return { success: true };
    } catch (err: any) {
      console.warn('Falha ao iniciar monitoramento do microfone:', err);
      let errMsg = 'Permissão de microfone negada ou erro de captura.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errMsg = 'Permissão do microfone negada no navegador.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errMsg = 'Nenhum microfone foi encontrado no seu aparelho.';
      } else if (err?.name === 'NotReadableError') {
        errMsg = 'O microfone já está em uso por outro aplicativo.';
      }
      return { success: false, error: errMsg };
    }
  }

  /**
   * Encerra a leitura dos decibéis entre itens SEM desconectar os nós da Web Audio API.
   * Isso previne a perda de sinal do microfone no Chrome.
   */
  public stopMicMonitoring(): void {
    this.isMonitoring = false;
    this.volumeCallback = null;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Libera completamente o hardware do microfone e desconecta os nós de áudio (ao sair do app ou finalizar sessão)
   */
  public releaseMic(): void {
    this.stopMicMonitoring();

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {}
      this.analyser = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.micStream = null;
    }
  }

  // ==========================================
  // Gravação de Áudio por Item com MediaRecorder
  // ==========================================
  private itemMediaRecorder: MediaRecorder | null = null;
  private itemAudioChunks: Blob[] = [];
  private itemRecordingPromiseResolve: ((blob: Blob) => void) | null = null;

  public getMicStream(): MediaStream | null {
    return this.micStream;
  }

  /**
   * Garante a disponibilidade do stream de microfone para gravação
   */
  public async ensureMicStream(): Promise<MediaStream | null> {
    const hasLiveTracks = this.micStream && this.micStream.active && this.micStream.getTracks().some((t) => t.readyState === 'live');
    if (hasLiveTracks) {
      return this.micStream;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        return this.micStream;
      }
    } catch (err) {
      console.warn('Não foi possível obter MediaStream para gravação:', err);
    }
    return null;
  }

  /**
   * Inicia a gravação em formato WebM/Opus do áudio emitido durante o item
   */
  public startItemRecording(stream?: MediaStream): void {
    if (this.itemMediaRecorder && this.itemMediaRecorder.state !== 'inactive') {
      try {
        this.itemMediaRecorder.stop();
      } catch {}
    }
    this.itemAudioChunks = [];

    const activeStream = stream || this.micStream;
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined' || !activeStream) {
      return;
    }

    try {
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const options: MediaRecorderOptions | undefined = mimeType ? { mimeType } : undefined;
      this.itemMediaRecorder = new MediaRecorder(activeStream, options);

      this.itemMediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.itemAudioChunks.push(event.data);
        }
      };

      this.itemMediaRecorder.onstop = () => {
        const resolvedBlob = new Blob(this.itemAudioChunks, {
          type: this.itemMediaRecorder?.mimeType || 'audio/webm'
        });
        if (this.itemRecordingPromiseResolve) {
          this.itemRecordingPromiseResolve(resolvedBlob);
          this.itemRecordingPromiseResolve = null;
        }
      };

      this.itemMediaRecorder.start(100);
    } catch (err) {
      console.warn('Falha ao inicializar MediaRecorder para o item:', err);
    }
  }

  /**
   * Finaliza a gravação do item e retorna o Blob de áudio resultante com proteção de timeout
   */
  public stopItemRecording(): Promise<Blob> {
    return new Promise<Blob>((resolve) => {
      if (!this.itemMediaRecorder || this.itemMediaRecorder.state === 'inactive') {
        const fallbackBlob = new Blob(this.itemAudioChunks, { type: 'audio/webm' });
        resolve(fallbackBlob);
        return;
      }

      let isResolved = false;
      const safeResolve = (blob: Blob) => {
        if (!isResolved) {
          isResolved = true;
          this.itemRecordingPromiseResolve = null;
          resolve(blob);
        }
      };

      this.itemRecordingPromiseResolve = safeResolve;

      const recorder = this.itemMediaRecorder;
      // Timeout de segurança caso o navegador atrase a emissão do evento onstop
      const timerId = window.setTimeout(() => {
        const fallbackBlob = new Blob(this.itemAudioChunks, {
          type: recorder.mimeType || 'audio/webm'
        });
        safeResolve(fallbackBlob);
      }, 400);

      const prevOnStop = recorder.onstop;
      recorder.onstop = (ev) => {
        window.clearTimeout(timerId);
        if (prevOnStop) {
          prevOnStop.call(recorder, ev);
        } else {
          const resolvedBlob = new Blob(this.itemAudioChunks, {
            type: recorder.mimeType || 'audio/webm'
          });
          safeResolve(resolvedBlob);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn('Aviso ao finalizar gravação do item:', err);
        window.clearTimeout(timerId);
        const fallbackBlob = new Blob(this.itemAudioChunks, { type: 'audio/webm' });
        safeResolve(fallbackBlob);
      }
    });
  }

  public isItemRecording(): boolean {
    return this.itemMediaRecorder !== null && this.itemMediaRecorder.state === 'recording';
  }
}

export const audioService = new AudioService();

