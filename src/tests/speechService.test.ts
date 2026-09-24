import { describe, it, expect, beforeEach } from 'vitest';
import { deduplicateSpeechTranscript, speechService } from '../services/speechService';

describe('Serviço de Reconhecimento de Fala (speechService)', () => {
  describe('deduplicateSpeechTranscript', () => {
    it('deve remover palavras idênticas consecutivas geradas pelo buffer móvel', () => {
      expect(deduplicateSpeechTranscript('BOLA BOLA')).toBe('BOLA');
      expect(deduplicateSpeechTranscript('BOLA BOLA BOLA')).toBe('BOLA');
      expect(deduplicateSpeechTranscript('PATO PATO')).toBe('PATO');
    });

    it('deve manter palavras diferentes na frase', () => {
      expect(deduplicateSpeechTranscript('O GATO PULA')).toBe('O GATO PULA');
      expect(deduplicateSpeechTranscript('É UMA BOLA')).toBe('É UMA BOLA');
    });

    it('deve remover repetições de frases completas', () => {
      expect(deduplicateSpeechTranscript('é uma bola é uma bola')).toBe('é uma bola');
    });

    it('deve lidar com strings vazias', () => {
      expect(deduplicateSpeechTranscript('')).toBe('');
      expect(deduplicateSpeechTranscript('   ')).toBe('');
    });
  });

  describe('Sessão Contínua e Ciclo de Vida de Baixa Latência', () => {
    beforeEach(() => {
      speechService.stopEvaluationSession();
    });

    it('deve expor métodos de sessão contínua sem quebrar em ambientes sem SpeechRecognition', () => {
      expect(typeof speechService.startEvaluationSession).toBe('function');
      expect(typeof speechService.prepareNextItem).toBe('function');
      expect(typeof speechService.consumeItemResult).toBe('function');
      expect(typeof speechService.stopEvaluationSession).toBe('function');
    });

    it('consumeItemResult deve retornar transcrição e métricas zeradas quando não há fala capturada', () => {
      speechService.prepareNextItem({});
      const result = speechService.consumeItemResult();

      expect(result).toEqual({
        transcript: '',
        confidence: 1.0,
        durationMs: expect.any(Number)
      });
    });

    it('stopEvaluationSession deve limpar o estado da sessão de forma segura', () => {
      speechService.stopEvaluationSession();
      expect(speechService.getIsListening()).toBe(false);
    });
  });
});
