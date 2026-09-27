import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioService } from '../services/audioService';
import { api } from '../services/api';

describe('AudioService & API Pipeline - Gravação e Análise Fonética de IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AudioService - Gravação de Áudio por Item', () => {
    it('deve ter os métodos startItemRecording e stopItemRecording disponíveis', async () => {
      expect(typeof audioService.startItemRecording).toBe('function');
      expect(typeof audioService.stopItemRecording).toBe('function');
      expect(typeof audioService.isItemRecording).toBe('function');
    });

    it('deve resolver stopItemRecording retornando um Blob mesmo sem gravação ativa', async () => {
      const blob = await audioService.stopItemRecording();
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('API - analyzeAudioItem', () => {
    it('deve enviar requisição POST /evaluations/analyze-audio com FormData', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          transcript: 'bola',
          status: 'CORRETO',
          similarity: 1.0,
          observedError: '',
          phonemeFindings: [],
          pedagogicalNote: 'Leitura com fonética precisa.'
        }
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as any);

      const formData = new FormData();
      const dummyBlob = new Blob(['test-audio-data'], { type: 'audio/webm' });
      formData.append('audioFile', dummyBlob, 'test.webm');
      formData.append('targetText', 'BOLA');
      formData.append('itemType', 'word');

      const result = await api.analyzeAudioItem(formData);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations/analyze-audio'),
        expect.objectContaining({
          method: 'POST',
          body: formData
        })
      );

      expect(result.status).toBe('CORRETO');
      expect(result.transcript).toBe('bola');
      expect(result.similarity).toBe(1.0);
      expect(result.pedagogicalNote).toBe('Leitura com fonética precisa.');

      fetchSpy.mockRestore();
    });

    it('deve propagar erro amigável quando o servidor estiver offline', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

      const formData = new FormData();
      formData.append('targetText', 'BOLA');

      await expect(api.analyzeAudioItem(formData)).rejects.toThrow('Servidor offline ou inatingível');

      fetchSpy.mockRestore();
    });
  });
});
