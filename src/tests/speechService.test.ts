import { describe, it, expect, beforeEach } from 'vitest';
import { deduplicateSpeechTranscript, speechService, BrowserWebSpeechProvider } from '../services/speechService';

describe('Serviço de Reconhecimento de Fala (SpeechRecognitionProvider)', () => {
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

  describe('Interface SpeechRecognitionProvider e Métricas Temporais', () => {
    beforeEach(() => {
      speechService.stopSession();
    });

    it('deve instanciar a classe com id oficial browser-web-speech', () => {
      expect(speechService.id).toBe('browser-web-speech');
      const customProvider = new BrowserWebSpeechProvider();
      expect(customProvider.id).toBe('browser-web-speech');
    });

    it('deve expor métodos de sessão contínua sem quebrar em ambientes de teste', () => {
      expect(typeof speechService.startSession).toBe('function');
      expect(typeof speechService.prepareNextItem).toBe('function');
      expect(typeof speechService.consumeItemResult).toBe('function');
      expect(typeof speechService.stopSession).toBe('function');
    });

    it('consumeItemResult deve retornar métricas completas com janela de 10s', () => {
      speechService.prepareNextItem({ availableTimeMs: 10000 });
      const result = speechService.consumeItemResult();

      expect(result).toMatchObject({
        transcript: '',
        confidence: 1.0,
        availableTimeMs: 10000,
        provider: 'browser-web-speech',
        numberOfAttempts: expect.any(Number),
        responseTimeMs: expect.any(Number)
      });
    });

    it('stopSession deve limpar o estado de escuta com segurança', () => {
      speechService.stopSession();
      expect(speechService.getIsListening()).toBe(false);
    });
  });
});
