import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { speechAiService } from '../modules/evaluations/speechAi.service.js';
import { prisma } from '../database/prisma.js';

vi.mock('../modules/evaluations/speechAi.service.js', () => ({
  speechAiService: {
    transcribeAudio: vi.fn(),
    analyzePedagogicalReading: vi.fn()
  }
}));

vi.mock('../database/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

describe('POST /api/v1/evaluations/analyze-audio', () => {
  let authToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-evaluator-123',
      name: 'Avaliador Teste',
      email: 'avaliador@fluencia.edu.br',
      role: 'SUPERVISOR',
      active: true
    });

    authToken = jwt.sign(
      {
        sub: 'user-evaluator-123',
        email: 'avaliador@fluencia.edu.br',
        role: 'SUPERVISOR'
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('deve rejeitar se nenhum arquivo de áudio for enviado', async () => {
    const response = await request(app)
      .post('/api/v1/evaluations/analyze-audio')
      .field('targetText', 'BOLA')
      .field('itemType', 'word');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('audioFile');
  });

  it('deve rejeitar se o targetText estiver ausente', async () => {
    const dummyAudioBuffer = Buffer.from('RIFF....WAVEfmt ...data...');

    const response = await request(app)
      .post('/api/v1/evaluations/analyze-audio')
      .attach('audioFile', dummyAudioBuffer, 'item.webm');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('targetText');
  });

  it('deve transcrever e analisar com sucesso quando o áudio e metadados forem enviados', async () => {
    (speechAiService.transcribeAudio as any).mockResolvedValue({
      text: 'bola',
      duration: 1.5
    });

    (speechAiService.analyzePedagogicalReading as any).mockResolvedValue({
      status: 'CORRETO',
      similarity: 1.0,
      observedError: '',
      phonemeFindings: [],
      pedagogicalNote: 'Leitura correta e fluida.'
    });

    const dummyAudioBuffer = Buffer.from('RIFF....WAVEfmt ...data...');

    const response = await request(app)
      .post('/api/v1/evaluations/analyze-audio')
      .set('Authorization', `Bearer ${authToken}`)
      .field('targetText', 'BOLA')
      .field('itemType', 'word')
      .attach('audioFile', dummyAudioBuffer, 'item.webm');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.transcript).toBe('bola');
    expect(response.body.data.status).toBe('CORRETO');
    expect(response.body.data.similarity).toBe(1.0);
    expect(response.body.data.pedagogicalNote).toBe('Leitura correta e fluida.');

    expect(speechAiService.transcribeAudio).toHaveBeenCalled();
    expect(speechAiService.analyzePedagogicalReading).toHaveBeenCalledWith('BOLA', 'bola', 'word');
  });
});
