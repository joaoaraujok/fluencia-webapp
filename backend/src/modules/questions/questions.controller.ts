import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QuestionsService } from './questions.service.js';
import { QuestionLevel, ItemType } from '@prisma/client';
import { getParam } from '../../shared/utils/param.util.js';

const questionsService = new QuestionsService();

const createQuestionSchema = z.object({
  text: z.string().min(1, 'Texto da questão é obrigatório'),
  level: z.nativeEnum(QuestionLevel),
  type: z.nativeEnum(ItemType).default(ItemType.WORD),
  syllablesCount: z.number().int().min(1).default(2),
  syllableStructure: z.string().min(1, 'Estrutura silábica é obrigatória'),
  category: z.string().min(1, 'Categoria semântica é obrigatória'),
  difficulty: z.number().int().min(1).max(5).default(1),
  targetPhonemes: z.array(z.string()).default([]),
  order: z.number().int().default(0),
  metadata: z.any().optional()
});

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  level: z.nativeEnum(QuestionLevel).optional(),
  type: z.nativeEnum(ItemType).optional(),
  syllablesCount: z.number().int().min(1).optional(),
  syllableStructure: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  targetPhonemes: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
  metadata: z.any().optional()
});

export class QuestionsController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const level = req.query.level as QuestionLevel | undefined;
      const category = req.query.category as string | undefined;
      const activeOnly = req.query.activeOnly === 'true';

      const questions = await questionsService.listQuestions(level, category, activeOnly);
      res.status(200).json({ status: 'success', data: { questions } });
    } catch (err) {
      next(err);
    }
  }

  public async getEvaluationItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mode = (req.query.mode as 'complete' | 'pre_leitor' | 'leitor') || 'complete';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const items = await questionsService.getEvaluationQuestions(mode, limit);
      res.status(200).json({ status: 'success', data: { items } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await questionsService.getQuestionById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { question } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createQuestionSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const question = await questionsService.createQuestion({ ...data, actorUserId });

      res.status(201).json({ status: 'success', data: { question } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateQuestionSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const question = await questionsService.updateQuestion({
        id: getParam(req.params.id),
        ...data,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { question } });
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = req.user!.id;
      const result = await questionsService.deleteQuestion(getParam(req.params.id), actorUserId);
      res.status(200).json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  }
}
