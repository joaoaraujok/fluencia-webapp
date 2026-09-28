import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemStateMachine, Clock } from '../services/evaluationStateMachine';
import { QuestionItem } from '../types/question';

class MockClock implements Clock {
  public currentTime: number = 10000;
  private timerId: number = 1;
  private timers: Map<number, { cb: () => void; triggerTime: number }> = new Map();

  public now(): number {
    return this.currentTime;
  }

  public setTimeout(cb: () => void, ms: number): number {
    const id = this.timerId++;
    this.timers.set(id, { cb, triggerTime: this.currentTime + ms });
    return id;
  }

  public clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  public setInterval(cb: () => void, ms: number): number {
    return this.setTimeout(cb, ms);
  }

  public clearInterval(id: number): void {
    this.clearTimeout(id);
  }

  public advance(ms: number): void {
    const targetTime = this.currentTime + ms;
    while (true) {
      // Find earliest timer <= targetTime
      let earliestId: number | null = null;
      let earliestTrigger = Infinity;

      for (const [id, timer] of this.timers.entries()) {
        if (timer.triggerTime <= targetTime && timer.triggerTime < earliestTrigger) {
          earliestId = id;
          earliestTrigger = timer.triggerTime;
        }
      }

      if (earliestId === null) {
        this.currentTime = targetTime;
        break;
      }

      this.currentTime = earliestTrigger;
      const timer = this.timers.get(earliestId);
      this.timers.delete(earliestId);
      timer?.cb();
    }
  }
}

describe('ItemStateMachine - Máquina de Estados e Temporização Rigorosa', () => {
  let clock: MockClock;
  let wordItem: QuestionItem;
  let textItem: QuestionItem;

  beforeEach(() => {
    clock = new MockClock();
    wordItem = {
      id: 'word-1',
      text: 'BOLA',
      level: 1,
      type: 'word',
      syllablesCount: 2,
      syllableStructure: 'canonical_cv_cv',
      category: 'brinquedos'
    };
    textItem = {
      id: 'text-1',
      text: 'MIMOSO É UM GATO MUITO BONITO.',
      level: 3,
      type: 'text',
      syllablesCount: 12,
      syllableStructure: 'text_story',
      category: 'animais'
    };
  });

  it('Cenário 1: Nenhuma fala durante 3 segundos deve classificar como OMISSAO imediatamente', () => {
    const onOmission = vi.fn();
    const onItemCompleted = vi.fn();

    const sm = new ItemStateMachine(
      { onOmission, onItemCompleted },
      {},
      clock
    );

    sm.startItem(wordItem);
    expect(sm.getState()).toBe('WAITING_FOR_SPEECH');

    // Avança 2.9 segundos (ainda esperando)
    clock.advance(2900);
    expect(onOmission).not.toHaveBeenCalled();

    // Completa os 3 segundos
    clock.advance(100);

    expect(onOmission).toHaveBeenCalledTimes(1);
    expect(onItemCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        isOmission: true,
        effectiveReadingTimeMs: 0
      }),
      'OMISSAO'
    );
  });

  it('Cenário 2 e 3: Fala detectada seguida de 2 segundos de silêncio encerra e exclui silêncio do tempo efetivo', () => {
    const onSpeechDetected = vi.fn();
    const onRequestAiAnalysis = vi.fn();

    const sm = new ItemStateMachine(
      { onSpeechDetected, onRequestAiAnalysis },
      {},
      clock
    );

    sm.startItem(wordItem);

    // Criança começa a falar após 800ms
    clock.advance(800);
    sm.processAudioVolume(25); // frame 1
    sm.processAudioVolume(30); // frame 2 -> fala detectada!

    expect(sm.getState()).toBe('CAPTURING_SPEECH');
    expect(onSpeechDetected).toHaveBeenCalled();

    // Fala dura 1200ms
    clock.advance(1200);
    sm.processAudioVolume(20);

    // Agora fica em silêncio por 2.0 segundos
    clock.advance(100);
    sm.processAudioVolume(2); // silêncio inicia timer de 2000ms

    clock.advance(1900);
    expect(onRequestAiAnalysis).not.toHaveBeenCalled();

    clock.advance(100); // 2000ms de silêncio completos
    expect(onRequestAiAnalysis).toHaveBeenCalledTimes(1);

    const metrics = onRequestAiAnalysis.mock.calls[0][0];
    expect(metrics.silenceDurationMs).toBe(2000);
    // Tempo efetivo não inclui os 2000ms de silêncio de encerramento!
    expect(metrics.effectiveReadingTimeMs).toBeLessThan(metrics.grossRecordingTimeMs);
  });

  it('Cenário 4: Fala contínua deve respeitar o teto máximo de 5 segundos após início da fala', () => {
    const onRequestAiAnalysis = vi.fn();

    const sm = new ItemStateMachine(
      { onRequestAiAnalysis },
      {},
      clock
    );

    sm.startItem(wordItem);

    // Fala inicia com 500ms
    clock.advance(500);
    sm.processAudioVolume(20);
    sm.processAudioVolume(25);

    // Fala contínua por mais de 5 segundos
    for (let i = 0; i < 50; i++) {
      clock.advance(100);
      sm.processAudioVolume(30); // sempre falando
    }

    // Atinge 5000ms após o início da fala
    expect(onRequestAiAnalysis).toHaveBeenCalledTimes(1);
    const metrics = onRequestAiAnalysis.mock.calls[0][0];
    expect(metrics.isTimeLimitReached).toBe(true);
  });

  it('Cenário 18 e 19: Texto corrido - silêncio de 4s encerra, mas retomada cancela encerramento', () => {
    const onRequestAiAnalysis = vi.fn();

    const sm = new ItemStateMachine(
      { onRequestAiAnalysis },
      {},
      clock
    );

    sm.startItem(textItem);

    // Criança começa a ler aos 500ms
    clock.advance(500);
    sm.processAudioVolume(20);
    sm.processAudioVolume(25);

    // Fala por 5 segundos
    clock.advance(5000);
    sm.processAudioVolume(25);

    // Pausa de 2.5s (menor que os 4s de encerramento de texto)
    clock.advance(100);
    sm.processAudioVolume(1); // silêncio detectado
    clock.advance(2400);

    // Retoma a fala antes dos 4s
    sm.processAudioVolume(30);
    expect(onRequestAiAnalysis).not.toHaveBeenCalled();

    // Lê mais 2 segundos
    clock.advance(2000);
    sm.processAudioVolume(25);

    // Agora para e fica em silêncio por 4 segundos
    clock.advance(100);
    sm.processAudioVolume(1);

    clock.advance(3900);
    expect(onRequestAiAnalysis).not.toHaveBeenCalled();

    clock.advance(100); // 4000ms de silêncio completados
    expect(onRequestAiAnalysis).toHaveBeenCalledTimes(1);
    const metrics = onRequestAiAnalysis.mock.calls[0][0];
    expect(metrics.silenceDurationMs).toBe(4000);
  });
});
