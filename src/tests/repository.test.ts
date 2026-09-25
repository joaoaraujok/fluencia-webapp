import { describe, it, expect, vi, beforeEach } from 'vitest';
import { repository } from '../services/repository';
import { api } from '../services/api';
import * as dbService from '../services/db';
import { EvaluationSession } from '../types/evaluation';

vi.mock('../services/api', () => ({
  api: {
    getClasses: vi.fn(),
    getStudents: vi.fn(),
    getEvaluationItems: vi.fn(),
    submitEvaluation: vi.fn()
  }
}));

vi.mock('../services/db', () => ({
  saveEvaluationSessionLocally: vi.fn().mockResolvedValue(undefined),
  enqueueOfflineEvaluation: vi.fn().mockResolvedValue(undefined),
  getPendingOfflineEvaluations: vi.fn().mockResolvedValue([]),
  markOfflineEvaluationSynced: vi.fn().mockResolvedValue(undefined),
  markOfflineEvaluationError: vi.fn().mockResolvedValue(undefined),
  getPendingOfflineCount: vi.fn().mockResolvedValue(0),
  db: {
    classesCache: { clear: vi.fn(), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]) },
    studentsCache: { where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ delete: vi.fn(), toArray: vi.fn().mockResolvedValue([]) }) }), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]) },
    questionsCache: { bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]) },
    evaluations: { get: vi.fn(), put: vi.fn() },
    offlineQueue: { clear: vi.fn() }
  }
}));

describe('DataRepository - Estratégia Offline-First e Sincronização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve salvar avaliação localmente e enviar à API quando online', async () => {
    (api.submitEvaluation as any).mockResolvedValue({ session: { id: 'eval-1' } });

    const session: EvaluationSession = {
      id: 'eval-1',
      childId: 'student-1',
      childName: 'Estudante Teste',
      timestamp: Date.now(),
      mode: 'complete',
      totalItems: 1,
      correctCount: 1,
      possibleCount: 0,
      incorrectCount: 0,
      noResponseCount: 0,
      unrecognizedCount: 0,
      accuracyPercentage: 100,
      averageResponseTimeMs: 2000,
      items: [
        {
          questionId: 'q1',
          targetText: 'BOLA',
          level: 1,
          type: 'word',
          syllableStructure: 'canonical_cv_cv',
          category: 'brinquedos',
          transcript: 'bola',
          status: 'CORRETO',
          responseTimeMs: 2000,
          availableTimeMs: 10000,
          confidence: 1.0
        }
      ],
      globalElapsedSeconds: 30,
      isGlobalTimeLimitReached: false,
      pedagogicalDiagnosis: 'LEITOR_FLUENTE',
      classificationEvidences: ['Evidência pedagógica de teste.'],
      executiveSummary: {
        currentLevelTitle: 'Leitor Fluente',
        currentLevelCategory: 'Leitor Fluente',
        whatChildCanDo: 'Lê com fluência e precisão.',
        mainDifficulties: 'Nenhuma dificuldade observada.',
        supportingData: '100% de precisão nos itens avaliados.',
        skillsNeedingAttention: [],
        readingQualitySummary: 'Leitura contínua e funcional.',
        aspectsToWorkOn: []
      },
      levelScores: {} as any,
      practiceRecommendations: []
    };

    const result = await repository.saveEvaluation(session);

    expect(result.synced).toBe(true);
    expect(dbService.saveEvaluationSessionLocally).toHaveBeenCalled();
    expect(api.submitEvaluation).toHaveBeenCalled();
    expect(result.session.syncStatus).toBe('synced');
  });

  it('deve salvar localmente e enfileirar offline quando a API falhar', async () => {
    (api.submitEvaluation as any).mockRejectedValue(new Error('Servidor offline'));

    const session: EvaluationSession = {
      id: 'eval-offline-1',
      childId: 'student-1',
      childName: 'Estudante Offline',
      timestamp: Date.now(),
      mode: 1,
      totalItems: 1,
      correctCount: 1,
      possibleCount: 0,
      incorrectCount: 0,
      noResponseCount: 0,
      unrecognizedCount: 0,
      accuracyPercentage: 100,
      averageResponseTimeMs: 1500,
      items: [
        {
          questionId: 'q1',
          targetText: 'PATO',
          level: 1,
          type: 'word',
          syllableStructure: 'canonical_cv_cv',
          category: 'animais',
          transcript: 'pato',
          status: 'CORRETO',
          responseTimeMs: 1500,
          availableTimeMs: 10000,
          confidence: 1.0
        }
      ],
      globalElapsedSeconds: 25,
      isGlobalTimeLimitReached: false,
      pedagogicalDiagnosis: 'LEITOR_INICIANTE_1',
      classificationEvidences: ['Evidência pedagógica de teste offline.'],
      executiveSummary: {
        currentLevelTitle: 'Leitor Iniciante 1',
        currentLevelCategory: 'Leitor Iniciante',
        whatChildCanDo: 'Lê palavras simples.',
        mainDifficulties: 'Hesitações pontuais.',
        supportingData: '15 PCPM em palavras.',
        skillsNeedingAttention: [],
        readingQualitySummary: 'Leitura funcional em consolidação.',
        aspectsToWorkOn: []
      },
      levelScores: {} as any,
      practiceRecommendations: []
    };

    const result = await repository.saveEvaluation(session);

    expect(result.synced).toBe(false);
    expect(dbService.saveEvaluationSessionLocally).toHaveBeenCalled();
    expect(dbService.enqueueOfflineEvaluation).toHaveBeenCalledWith('eval-offline-1', session);
    expect(result.session.syncStatus).toBe('pending');
  });
});
