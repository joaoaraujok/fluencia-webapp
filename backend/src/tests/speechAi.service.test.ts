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

    it('deve usar Fast-Path para palavras exatas sem chamar Gemini', async () => {
      const result = await service.analyzePedagogicalReading('BOLA', 'bola', 'word');

      expect(result.status).toBe('CORRETO');
      expect(result.similarity).toBe(1.0);
      expect(result.observedError).toBe('');
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
    });

    it('deve chamar o Gemini quando houver divergência/erro e retornar a análise estruturada em JSON', async () => {
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
      const callArgs = mockGeminiGenerateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-3.8-flash');
      expect(callArgs.config.responseMimeType).toBe('application/json');

      expect(result.status).toBe('INCORRETO');
      expect(result.similarity).toBe(0.5);
      expect(result.observedError).toContain('Substituição');
      expect(result.pedagogicalNote).toContain('troca');
    });

    it('deve reconhecer "Amy", "Emy" e "eme" como CORRETO para a letra M (artefato acústico do Whisper via Fast-Path)', async () => {
      const resultAmy = await service.analyzePedagogicalReading('M', 'Amy', 'letter');
      expect(resultAmy.status).toBe('CORRETO');
      expect(resultAmy.similarity).toBe(1.0);
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();

      const resultEme = await service.analyzePedagogicalReading('M', 'eme', 'letter');
      expect(resultEme.status).toBe('CORRETO');
      expect(resultEme.similarity).toBe(1.0);
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
    });

    it('deve reconhecer "Annie" e "Any" como CORRETO para a letra N e "Eli" para a letra L via Fast-Path', async () => {
      const resultN = await service.analyzePedagogicalReading('N', 'Annie', 'letter');
      expect(resultN.status).toBe('CORRETO');
      expect(resultN.similarity).toBe(1.0);
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();

      const resultL = await service.analyzePedagogicalReading('L', 'Eli', 'letter');
      expect(resultL.status).toBe('CORRETO');
      expect(resultL.similarity).toBe(1.0);
      expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
    });
  });
});
