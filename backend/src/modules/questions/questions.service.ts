import { prisma } from '../../database/prisma.js';
import { QuestionLevel, ItemType } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface CreateQuestionInput {
  text: string;
  level: QuestionLevel;
  type?: ItemType;
  syllablesCount?: number;
  syllableStructure: string;
  category: string;
  difficulty?: number;
  targetPhonemes?: string[];
  order?: number;
  metadata?: any;
  actorUserId: string;
}

interface UpdateQuestionInput {
  id: string;
  text?: string;
  level?: QuestionLevel;
  type?: ItemType;
  syllablesCount?: number;
  syllableStructure?: string;
  category?: string;
  difficulty?: number;
  targetPhonemes?: string[];
  active?: boolean;
  order?: number;
  metadata?: any;
  actorUserId: string;
}

export class QuestionsService {
  public async listQuestions(level?: QuestionLevel, category?: string, activeOnly: boolean = false) {
    const where: any = {};
    if (level) where.level = level;
    if (category) where.category = category;
    if (activeOnly) where.active = true;

    return prisma.question.findMany({
      where,
      orderBy: [{ level: 'asc' }, { order: 'asc' }, { text: 'asc' }]
    });
  }

  public async getQuestionById(id: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new AppError('Questão não encontrada.', 404);
    }
    return question;
  }

  public async getEvaluationQuestions(mode: 'complete' | 'pre_leitor' | 'leitor', limitPerLevel: number = 10) {
    function shuffle<T>(array: T[]): T[] {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    if (mode === 'complete') {
      const allActive = await prisma.question.findMany({
        where: { active: true }
      });

      // Separação em 3 níveis de dificuldade de palavras + frases
      const diff1 = allActive.filter(q => q.difficulty === 1 || (q.level === QuestionLevel.PRE_LEITOR && q.type !== ItemType.PHRASE));
      const diff2 = allActive.filter(q => q.difficulty === 2 && q.type !== ItemType.PHRASE);
      const diff3 = allActive.filter(q => q.difficulty === 3 && q.type !== ItemType.PHRASE);
      const phrases = allActive.filter(q => q.type === ItemType.PHRASE);

      const s1 = shuffle(diff1).slice(0, 10);
      const s2 = shuffle(diff2.length > 0 ? diff2 : allActive.filter(q => q.level === QuestionLevel.LEITOR && q.type !== ItemType.PHRASE)).slice(0, 10);
      const s3 = shuffle(diff3.length > 0 ? diff3 : s2).slice(0, 6);
      const s4 = shuffle(phrases).slice(0, 4);

      const combined = [...s1, ...s2, ...s3, ...s4];
      return combined.slice(0, 30);
    } else if (mode === 'pre_leitor') {
      const items = await prisma.question.findMany({
        where: { level: QuestionLevel.PRE_LEITOR, active: true }
      });
      return shuffle(items).slice(0, Math.min(30, limitPerLevel * 2));
    } else {
      const items = await prisma.question.findMany({
        where: { level: QuestionLevel.LEITOR, active: true }
      });
      return shuffle(items).slice(0, Math.min(30, limitPerLevel * 2));
    }
  }

  public async createQuestion({
    text,
    level,
    type = ItemType.WORD,
    syllablesCount = 2,
    syllableStructure,
    category,
    difficulty = 1,
    targetPhonemes = [],
    order = 0,
    metadata,
    actorUserId
  }: CreateQuestionInput) {
    const cleanText = text.trim().toUpperCase();

    const existing = await prisma.question.findFirst({
      where: { text: cleanText, level }
    });

    if (existing) {
      throw new AppError(`A palavra/frase "${cleanText}" já existe para o nível ${level}.`, 400);
    }

    const question = await prisma.question.create({
      data: {
        text: cleanText,
        level,
        type,
        syllablesCount,
        syllableStructure,
        category: category.trim().toLowerCase(),
        difficulty,
        targetPhonemes,
        order,
        metadata: metadata || undefined,
        active: true,
        version: 1
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'CREATE',
      entity: 'Question',
      entityId: question.id,
      newValue: { text: question.text, level: question.level, category: question.category }
    });

    return question;
  }

  public async updateQuestion({
    id,
    text,
    level,
    type,
    syllablesCount,
    syllableStructure,
    category,
    difficulty,
    targetPhonemes,
    active,
    order,
    metadata,
    actorUserId
  }: UpdateQuestionInput) {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Questão não encontrada.', 404);
    }

    const dataToUpdate: any = {};
    if (text !== undefined) dataToUpdate.text = text.trim().toUpperCase();
    if (level !== undefined) dataToUpdate.level = level;
    if (type !== undefined) dataToUpdate.type = type;
    if (syllablesCount !== undefined) dataToUpdate.syllablesCount = syllablesCount;
    if (syllableStructure !== undefined) dataToUpdate.syllableStructure = syllableStructure;
    if (category !== undefined) dataToUpdate.category = category.trim().toLowerCase();
    if (difficulty !== undefined) dataToUpdate.difficulty = difficulty;
    if (targetPhonemes !== undefined) dataToUpdate.targetPhonemes = targetPhonemes;
    if (active !== undefined) dataToUpdate.active = active;
    if (order !== undefined) dataToUpdate.order = order;
    if (metadata !== undefined) dataToUpdate.metadata = metadata;
    dataToUpdate.version = existing.version + 1;

    const updated = await prisma.question.update({
      where: { id },
      data: dataToUpdate
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'UPDATE',
      entity: 'Question',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    return updated;
  }

  public async deleteQuestion(id: string, actorUserId: string) {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Questão não encontrada.', 404);
    }

    // Desativação em vez de deleção física caso haja avaliações associadas
    const updated = await prisma.question.update({
      where: { id },
      data: { active: false }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'DELETE',
      entity: 'Question',
      entityId: id,
      oldValue: { active: existing.active },
      newValue: { active: false, action: 'soft_delete' }
    });

    return { message: 'Questão desativada com sucesso.', question: updated };
  }
}
