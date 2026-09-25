import Dexie, { type Table } from 'dexie';
import { ChildProfile } from '../types/child';
import { EvaluationSession } from '../types/evaluation';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { SchoolClass, Student } from '../types/school';
import { QuestionItem } from '../types/question';

export interface OfflineEvaluationItem {
  id: string; // UUID da sessão
  payload: any;
  status: 'pending' | 'syncing' | 'error';
  attempts: number;
  lastAttemptAt?: number;
  errorMessage?: string;
  createdAt: number;
}

export class FluenciaDatabase extends Dexie {
  public children!: Table<ChildProfile, string>;
  public evaluations!: Table<EvaluationSession, string>;
  public settings!: Table<AppSettings, string>;
  public offlineQueue!: Table<OfflineEvaluationItem, string>;
  public studentsCache!: Table<Student, string>;
  public classesCache!: Table<SchoolClass, string>;
  public questionsCache!: Table<QuestionItem, string>;

  constructor() {
    super('FluenciaOralDB');

    this.version(2).stores({
      children: 'id, name, createdAt',
      evaluations: 'id, childId, timestamp, mode, accuracyPercentage, syncStatus',
      settings: 'id',
      offlineQueue: 'id, status, createdAt',
      studentsCache: 'id, classId, schoolId, name',
      classesCache: 'id, schoolId, name',
      questionsCache: 'id, level, category'
    });
  }
}

export const db = new FluenciaDatabase();

/**
 * Funções de acesso às configurações locais
 */
export async function getStoredSettings(): Promise<AppSettings> {
  try {
    const s = await db.settings.get('current_settings');
    if (s) {
      return { ...DEFAULT_SETTINGS, ...s };
    }
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error('Erro ao ler configurações do IndexedDB:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoredSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getStoredSettings();
  const updated: AppSettings = { ...current, ...newSettings, id: 'current_settings' };
  await db.settings.put(updated);
  return updated;
}

/**
 * Histórico de avaliações locais e cache
 */
export async function saveEvaluationSessionLocally(session: EvaluationSession): Promise<void> {
  await db.evaluations.put(session);
}

export async function getLocalEvaluations(childId?: string): Promise<EvaluationSession[]> {
  if (childId) {
    return await db.evaluations.where('childId').equals(childId).reverse().sortBy('timestamp');
  }
  return await db.evaluations.orderBy('timestamp').reverse().toArray();
}

export async function getEvaluations(childId?: string): Promise<EvaluationSession[]> {
  return getLocalEvaluations(childId);
}

export async function deleteEvaluation(id: string): Promise<void> {
  await db.evaluations.delete(id);
}

export async function clearAllEvaluations(): Promise<void> {
  await db.evaluations.clear();
}

/**
 * Fila Offline de Avaliações
 */
export async function enqueueOfflineEvaluation(sessionId: string, payload: any): Promise<void> {
  await db.offlineQueue.put({
    id: sessionId,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: Date.now()
  });
}

export async function getPendingOfflineEvaluations(): Promise<OfflineEvaluationItem[]> {
  return db.offlineQueue.where('status').equals('pending').toArray();
}

export async function markOfflineEvaluationSynced(sessionId: string): Promise<void> {
  await db.offlineQueue.delete(sessionId);
  const localEval = await db.evaluations.get(sessionId);
  if (localEval) {
    localEval.syncStatus = 'synced';
    await db.evaluations.put(localEval);
  }
}

export async function markOfflineEvaluationError(sessionId: string, errorMessage: string): Promise<void> {
  const item = await db.offlineQueue.get(sessionId);
  if (item) {
    item.status = 'error';
    item.attempts += 1;
    item.lastAttemptAt = Date.now();
    item.errorMessage = errorMessage;
    await db.offlineQueue.put(item);
  }
}

export async function getPendingOfflineCount(): Promise<number> {
  return db.offlineQueue.count();
}

// Funções de compatibilidade para dados locais legados
export async function getChildren(): Promise<ChildProfile[]> {
  return await db.children.orderBy('createdAt').reverse().toArray();
}

export async function saveChild(child: ChildProfile): Promise<void> {
  await db.children.put(child);
}

export async function deleteChild(childId: string): Promise<void> {
  await db.children.delete(childId);
}
