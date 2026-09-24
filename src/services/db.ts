import Dexie, { type Table } from 'dexie';
import { ChildProfile } from '../types/child';
import { EvaluationSession } from '../types/evaluation';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

export class FluenciaDatabase extends Dexie {
  public children!: Table<ChildProfile, string>;
  public evaluations!: Table<EvaluationSession, string>;
  public settings!: Table<AppSettings, string>;

  constructor() {
    super('FluenciaOralDB');

    this.version(1).stores({
      children: 'id, name, createdAt',
      evaluations: 'id, childId, timestamp, mode, accuracyPercentage',
      settings: 'id'
    });
  }
}

export const db = new FluenciaDatabase();

/**
 * Funções de acesso e manipulação de configurações
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
 * Funções de acesso às crianças
 */
export async function getChildren(): Promise<ChildProfile[]> {
  return await db.children.orderBy('createdAt').reverse().toArray();
}

export async function saveChild(child: ChildProfile): Promise<void> {
  await db.children.put(child);
}

export async function deleteChild(childId: string): Promise<void> {
  await db.children.delete(childId);
  // Opcional: remover referências das avaliações ou mantê-las com nome histórico
}

/**
 * Funções de histórico de avaliações
 */
export async function saveEvaluationSession(session: EvaluationSession): Promise<void> {
  await db.evaluations.put(session);
}

export async function getEvaluations(childId?: string): Promise<EvaluationSession[]> {
  if (childId) {
    return await db.evaluations.where('childId').equals(childId).reverse().sortBy('timestamp');
  }
  return await db.evaluations.orderBy('timestamp').reverse().toArray();
}

export async function deleteEvaluation(id: string): Promise<void> {
  await db.evaluations.delete(id);
}

export async function clearAllEvaluations(): Promise<void> {
  await db.evaluations.clear();
}
