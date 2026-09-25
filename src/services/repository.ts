import { api } from './api';
import {
  db,
  saveEvaluationSessionLocally,
  enqueueOfflineEvaluation,
  getPendingOfflineEvaluations,
  markOfflineEvaluationSynced,
  markOfflineEvaluationError,
  getPendingOfflineCount
} from './db';
import { SchoolClass, Student } from '../types/school';
import { QuestionItem } from '../types/question';
import { EvaluationSession } from '../types/evaluation';
import { selectEvaluationItems } from '../data/questionBank';

class DataRepository {
  /**
   * Obtém turmas com fallback para cache offline
   */
  public async getClasses(schoolId?: string): Promise<SchoolClass[]> {
    try {
      const res = await api.getClasses(schoolId);
      if (res && res.classes) {
        // Atualiza cache local
        await db.classesCache.clear();
        await db.classesCache.bulkPut(res.classes);
        return res.classes;
      }
    } catch (err) {
      console.warn('API indisponível, buscando turmas do cache local:', err);
    }

    // Fallback offline
    return db.classesCache.toArray();
  }

  /**
   * Obtém alunos com fallback para cache offline
   */
  public async getStudents(classId?: string, search?: string): Promise<Student[]> {
    try {
      const res = await api.getStudents(classId, search);
      if (res && res.students) {
        if (classId) {
          await db.studentsCache.where('classId').equals(classId).delete();
        }
        await db.studentsCache.bulkPut(res.students);
        return res.students;
      }
    } catch (err) {
      console.warn('API indisponível, buscando alunos do cache local:', err);
    }

    // Fallback offline
    if (classId) {
      return db.studentsCache.where('classId').equals(classId).toArray();
    }
    return db.studentsCache.toArray();
  }

  /**
   * Obtém itens para avaliação com fallback inteligente
   */
  public async getEvaluationQuestions(
    mode: 'complete' | 'pre_leitor' | 'leitor' | any = 'complete',
    limit: number = 10
  ): Promise<QuestionItem[]> {
    try {
      const modeString = typeof mode === 'number' ? (mode === 1 ? 'pre_leitor' : 'leitor') : mode;
      const res = await api.getEvaluationItems(modeString, limit);
      if (res && res.items && res.items.length > 0) {
        await db.questionsCache.bulkPut(res.items);
        return res.items;
      }
    } catch (err) {
      console.warn('API indisponível, selecionando itens do banco local:', err);
    }

    // Fallback para o banco local empacotado
    const cached = await db.questionsCache.toArray();
    if (cached.length >= 10) {
      return cached.slice(0, limit * 2);
    }
    return selectEvaluationItems(mode, limit);
  }

  /**
   * Salva avaliação com estratégia offline-first e sincronização resiliente
   */
  public async saveEvaluation(session: EvaluationSession): Promise<{ synced: boolean; session: EvaluationSession }> {
    // 1. Persistência local imediata no IndexedDB (garantia de não perda em oscilação de rede)
    await saveEvaluationSessionLocally(session);

    // 2. Tenta envio imediato ao backend central
    try {
      const backendPayload = {
        id: session.id,
        studentId: session.childId,
        criteriaVersion: session.criteriaVersion || '2026.1',
        mode: String(session.mode),
        notes: session.notes,
        clientTimestamp: new Date(session.timestamp).toISOString(),
        items: session.items.map((i) => ({
          questionId: i.questionId && i.questionId.length > 10 ? i.questionId : undefined,
          targetText: i.targetText,
          level: i.level === 1 ? 'PRE_LEITOR' : 'LEITOR',
          itemType: i.type ? i.type.toUpperCase() : 'WORD',
          syllableStructure: i.syllableStructure,
          category: i.category,
          transcript: i.transcript,
          normalizedTranscript: i.normalizedTranscript || i.transcript.toUpperCase(),
          confidence: i.confidence,
          responseTimeMs: i.responseTimeMs,
          availableTimeMs: i.availableTimeMs || 10000,
          speechStartMs: i.speechStartMs,
          speechEndMs: i.speechEndMs,
          status: i.status,
          similarity: i.similarity,
          numberOfAttempts: i.numberOfAttempts || 1,
          recognitionQuality: i.recognitionQuality || 'good',
          provider: i.provider || 'browser-web-speech',
          observedError: i.observedError,
          phonemeFindings: i.phonemeFindings || []
        }))
      };

      await api.submitEvaluation(backendPayload);
      session.syncStatus = 'synced';
      await saveEvaluationSessionLocally(session);
      return { synced: true, session };
    } catch (err: any) {
      console.warn('Falha no envio da avaliação ao backend. Enfileirando offline:', err.message);
      session.syncStatus = 'pending';
      await saveEvaluationSessionLocally(session);
      await enqueueOfflineEvaluation(session.id, session);
      return { synced: false, session };
    }
  }

  /**
   * Sincroniza avaliações pendentes da fila offline
   */
  public async syncPendingEvaluations(): Promise<{ syncedCount: number; errorCount: number }> {
    const pendingItems = await getPendingOfflineEvaluations();
    let syncedCount = 0;
    let errorCount = 0;

    for (const item of pendingItems) {
      try {
        const payload = item.payload;
        const backendPayload = {
          id: payload.id,
          studentId: payload.childId,
          criteriaVersion: payload.criteriaVersion || '2026.1',
          mode: String(payload.mode),
          notes: payload.notes,
          clientTimestamp: new Date(payload.timestamp).toISOString(),
          items: payload.items.map((i: any) => ({
            questionId: i.questionId && i.questionId.length > 10 ? i.questionId : undefined,
            targetText: i.targetText,
            level: i.level === 1 ? 'PRE_LEITOR' : 'LEITOR',
            itemType: i.type ? i.type.toUpperCase() : 'WORD',
            syllableStructure: i.syllableStructure,
            category: i.category,
            transcript: i.transcript,
            normalizedTranscript: i.normalizedTranscript || i.transcript.toUpperCase(),
            confidence: i.confidence,
            responseTimeMs: i.responseTimeMs,
            availableTimeMs: i.availableTimeMs || 10000,
            speechStartMs: i.speechStartMs,
            speechEndMs: i.speechEndMs,
            status: i.status,
            similarity: i.similarity,
            numberOfAttempts: i.numberOfAttempts || 1,
            recognitionQuality: i.recognitionQuality || 'good',
            provider: i.provider || 'browser-web-speech',
            observedError: i.observedError,
            phonemeFindings: i.phonemeFindings || []
          }))
        };

        await api.submitEvaluation(backendPayload);
        await markOfflineEvaluationSynced(item.id);
        syncedCount++;
      } catch (err: any) {
        console.error(`Erro ao sincronizar avaliação ${item.id}:`, err);
        await markOfflineEvaluationError(item.id, err.message);
        errorCount++;
      }
    }

    return { syncedCount, errorCount };
  }

  public async getPendingCount(): Promise<number> {
    return getPendingOfflineCount();
  }
}

export const repository = new DataRepository();
