import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechAiService } from '../modules/evaluations/speechAi.service.js';

const { mockGroqCreate, mockGeminiGenerateContent } = vi.hoisted(() => ({
  mockGroqCreate: vi.fn(),
  mockGeminiGenerateContent: vi.fn()
}));

vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      audio = {
        transcriptions: {
          create: mockGroqCreate
        }
      };
    }
  };
});

vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY'
    },
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGeminiGenerateContent
      };
    }
  };
});

vi.mock('fs', async () => {
  const actual = await vi.importActual<any>('fs');
  const mockCreateReadStream = vi.fn().mockReturnValue('mock-file-stream');
  return {
    ...actual,
    default: {
      ...(actual.default || actual),
      createReadStream: mockCreateReadStream
    },
    createReadStream: mockCreateReadStream
  };
});

describe('SpeechAiService - Whisper Groq e Google Gemini', () => {
  let service: SpeechAiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SpeechAiService();
  });

  describe('transcribeAudio', () => {
    it('deve chamar o Groq Whisper com parâmetros corretos e retornar texto transcrito', async () => {
      mockGroqCreate.mockResolvedValue({
        text: 'BOLA',
        duration: 1.8
      });

      const result = await service.transcribeAudio('/tmp/test-audio.webm');

      expect(mockGroqCreate).toHaveBeenCalledWith({
        file: 'mock-file-stream',
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        language: 'pt',
        temperature: 0.0,
        prompt: 'Transcrição fonética e leitura infantil em português do Brasil.'
      });

      expect(result.text).toBe('BOLA');
      expect(result.duration).toBe(1.8);
    });
  });

  describe('analyzePedagogicalReading', () => {
    it('deve retornar SEM_RESPOSTA quando o texto transcrito for vazio', async () => {
      const result = await service.analyzePedagogicalReading('BOLA', '', 'word');

      expect(result.status).toBe('SEM_RESPOSTA');
      expect(result.similarity).toBe(0);
      expect(result.phonemeFindings).toEqual([]);
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
    });

    it('deve chamar o Gemini para revisar palavras e retornar a análise estruturada em JSON', async () => {
      const mockAiResponse = {
        status: 'CORRETO',
        similarity: 1.0,
        observedError: '',
        phonemeFindings: [],
        pedagogicalNote: 'Leitura correta e fluida da palavra BOLA.'
      };

      mockGeminiGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAiResponse)
      });

      const result = await service.analyzePedagogicalReading('BOLA', 'bola', 'word');

      expect(mockGeminiGenerateContent).toHaveBeenCalled();
      const callArgs = mockGeminiGenerateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-3.5-flash-lite');
      expect(callArgs.config.responseMimeType).toBe('application/json');

      expect(result.status).toBe('CORRETO');
      expect(result.similarity).toBe(1.0);
    });

    it('deve chamar o Gemini para diagnosticar divergências fonéticas com precisão técnica', async () => {
      const mockAiResponse = {
        status: 'INCORRETO',
        similarity: 0.5,
        observedError: 'Substituição de fonema consonantal /l/ por /t/.',
        phonemeFindings: ['Troca de /l/ por /t/'],
        pedagogicalNote: 'A criança realizou a troca do fonema lateral /l/ pelo oclusivo /t/.'
      };

      mockGeminiGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAiResponse)
      });

      const result = await service.analyzePedagogicalReading('BOLA', 'bota', 'word');

      expect(mockGeminiGenerateContent).toHaveBeenCalled();
      expect(result.status).toBe('INCORRETO');
      expect(result.similarity).toBe(0.5);
      expect(result.observedError).toContain('Substituição');
      expect(result.pedagogicalNote).toContain('troca');
    });

    it('deve acionar o Gemini para avaliar pronúncia de letras', async () => {
      const mockAiResponse = {
        status: 'CORRETO',
        similarity: 1.0,
        observedError: '',
        phonemeFindings: ['Reconhecimento de artefato acústico Amy como letra M'],
        pedagogicalNote: 'A pronúncia da letra M foi precisa.'
      };

      mockGeminiGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAiResponse)
      });

      const resultAmy = await service.analyzePedagogicalReading('M', 'Amy', 'letter');
      expect(resultAmy.status).toBe('CORRETO');
      expect(resultAmy.similarity).toBe(1.0);
      expect(mockGeminiGenerateContent).toHaveBeenCalled();
    });

    it('deve acionar o Gemini para avaliar erros em pseudopalavras', async () => {
      const mockAiResponse = {
        status: 'INCORRETO',
        similarity: 0.5,
        observedError: 'Desvio na rota fonológica da pseudopalavra',
        phonemeFindings: ['Substituição de /b/ por /p/'],
        pedagogicalNote: 'Desvio fonológico registrado.'
      };

      mockGeminiGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAiResponse)
      });

      const result = await service.analyzePedagogicalReading('BALO', 'palo', 'pseudoword');
      expect(result.status).toBe('INCORRETO');
      expect(result.observedError).toContain('Desvio');
      expect(mockGeminiGenerateContent).toHaveBeenCalled();
    });
  });
});

