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

  /**
   * Inicia a captura e análise contínua de volume do microfone
   */
  public async startMicMonitoring(
    onVolumeChange: (volumePercent: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    this.stopMicMonitoring();

    const ctx = this.getContext();
    if (!ctx) {
      return { success: false, error: 'Web Audio API não suportada neste navegador.' };
    }

    try {
      let stream: MediaStream | null = null;

      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        const legacyGetUserMedia =
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).msGetUserMedia;
        if (legacyGetUserMedia) {
          stream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
          });
        }
      }

      if (!stream) {
        return { success: false, error: 'Dispositivo de microfone não encontrado ou contexto não seguro.' };
      }

      this.micStream = stream;
      this.micSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.micSource.connect(this.analyser);
      this.isMonitoring = true;

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
        // Mapeia para 0 - 100% com sensibilidade calibrada para voz humana normal
        const volumePercent = Math.min(100, Math.round(rms * 280));
        onVolumeChange(volumePercent);

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
   * Encerra o monitoramento de microfone e libera o hardware
   */
  public stopMicMonitoring(): void {
    this.isMonitoring = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

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
}

export const audioService = new AudioService();

