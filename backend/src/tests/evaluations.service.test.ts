import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvaluationsService } from '../modules/evaluations/evaluations.service.js';
import { prisma } from '../database/prisma.js';
import { RecognitionStatus, QuestionLevel, ItemType } from '@prisma/client';

vi.mock('../database/prisma.js', () => ({
  prisma: {
    student: { findUnique: vi.fn() },
    evaluationCriteria: { findUnique: vi.fn(), create: vi.fn() },
    evaluationSession: { findUnique: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

describe('EvaluationsService - Persistência e Cálculo Pedagógico', () => {
  let service: EvaluationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EvaluationsService();
  });

  it('deve calcular corretamente a porcentagem ponderada e tempo médio com itens de 10s', async () => {
    const mockStudent = {
      id: 'student-1',
      name: 'Criança Avaliada',
      schoolId: 'school-1',
      classId: 'class-1'
    };

    const mockCriteria = {
      version: '2026.1',
      wordDurationSec: 10
    };

    (prisma.student.findUnique as any).mockResolvedValue(mockStudent);
    (prisma.evaluationCriteria.findUnique as any).mockResolvedValue(mockCriteria);
    (prisma.evaluationSession.create as any).mockImplementation((args: any) => Promise.resolve({ id: 'eval-1', ...args.data }));

    const items = [
      {
        targetText: 'BOLA',
        level: QuestionLevel.PRE_LEITOR,
        itemType: ItemType.WORD,
        syllableStructure: 'canonical_cv_cv',
        category: 'brinquedos',
        transcript: 'bola',
        normalizedTranscript: 'BOLA',
        responseTimeMs: 2500,
        availableTimeMs: 10000,
        status: RecognitionStatus.CORRETO
      },
      {
        targetText: 'PATO',
        level: QuestionLevel.PRE_LEITOR,
        itemType: ItemType.WORD,
        syllableStructure: 'canonical_cv_cv',
        category: 'animais',
        transcript: 'patinho',
        normalizedTranscript: 'PATINHO',
        responseTimeMs: 3500,
        availableTimeMs: 10000,
        status: RecognitionStatus.POSSIVELMENTE_CORRETO // 0.5 pontos
      },
      {
        targetText: 'SAPO',
        level: QuestionLevel.PRE_LEITOR,
        itemType: ItemType.WORD,
        syllableStructure: 'canonical_cv_cv',
        category: 'animais',
        transcript: 'gato',
        normalizedTranscript: 'GATO',
        responseTimeMs: 4000,
        availableTimeMs: 10000,
        status: RecognitionStatus.INCORRETO // 0 pontos
      },
      {
        targetText: 'VACA',
        level: QuestionLevel.PRE_LEITOR,
        itemType: ItemType.WORD,
        syllableStructure: 'canonical_cv_cv',
        category: 'animais',
        transcript: '',
        normalizedTranscript: '',
        responseTimeMs: 10000,
        availableTimeMs: 10000,
        status: RecognitionStatus.SEM_RESPOSTA // 0 pontos
      }
    ];

    // Pontos efetivos: 1.0 (correto) + 0.5 (possivelmente) = 1.5 de 4.0 = 37.5%
    // Tempo médio: (2500 + 3500 + 4000 + 10000) / 4 = 20000 / 4 = 5000ms

    const session = await service.createEvaluationSession({
      studentId: 'student-1',
      evaluatorId: 'evaluator-1',
      items: items as any
    });

    expect(prisma.evaluationSession.create).toHaveBeenCalled();
    const createCallArgs = (prisma.evaluationSession.create as any).mock.calls[0][0].data;

    expect(createCallArgs.accuracyPercentage).toBe(37.5);
    expect(createCallArgs.averageResponseTimeMs).toBe(5000);
    expect(createCallArgs.correctCount).toBe(1);
    expect(createCallArgs.possibleCount).toBe(1);
    expect(createCallArgs.incorrectCount).toBe(1);
    expect(createCallArgs.noResponseCount).toBe(1);
    expect(createCallArgs.criteriaVersion).toBe('2026.1');
  });
});
