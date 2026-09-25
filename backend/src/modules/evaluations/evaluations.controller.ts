import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EvaluationsService } from './evaluations.service.js';
import { RecognitionStatus, QuestionLevel, ItemType } from '@prisma/client';
import { getParam } from '../../shared/utils/param.util.js';

const evaluationsService = new EvaluationsService();

const evaluationItemSchema = z.object({
  questionId: z.string().uuid().optional(),
  targetText: z.string().min(1, 'Texto alvo é obrigatório'),
  level: z.nativeEnum(QuestionLevel),
  itemType: z.nativeEnum(ItemType).default(ItemType.WORD),
  syllableStructure: z.string().min(1),
  category: z.string().min(1),
  transcript: z.string().default(''),
  normalizedTranscript: z.string().default(''),
  confidence: z.number().min(0).max(1).default(1),
  responseTimeMs: z.number().int().min(0),
  availableTimeMs: z.number().int().min(1000).default(10000),
  speechStartMs: z.number().int().optional(),
  speechEndMs: z.number().int().optional(),
  status: z.nativeEnum(RecognitionStatus),
  similarity: z.number().optional(),
  numberOfAttempts: z.number().int().default(1),
  recognitionQuality: z.string().optional(),
  provider: z.string().default('browser-web-speech'),
  observedError: z.string().optional(),
  phonemeFindings: z.array(z.string()).default([])
});

const createEvaluationSessionSchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string().uuid('ID do aluno deve ser um UUID válido'),
  criteriaVersion: z.string().optional(),
  mode: z.string().default('complete'),
  notes: z.string().optional(),
  clientTimestamp: z.string().optional(),
  items: z.array(evaluationItemSchema).min(1, 'A avaliação deve conter ao menos 1 item respondido')
});

export class EvaluationsController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.query.studentId as string | undefined;
      const classId = req.query.classId as string | undefined;
      const schoolId = req.query.schoolId as string | undefined;

      const evaluations = await evaluationsService.listEvaluations(studentId, classId, schoolId);
      res.status(200).json({ status: 'success', data: { evaluations } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await evaluationsService.getEvaluationById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { session } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createEvaluationSessionSchema.parse(req.body);
      const evaluatorId = req.user!.id;

      const session = await evaluationsService.createEvaluationSession({
        ...data,
        evaluatorId
      });

      res.status(201).json({ status: 'success', data: { session } });
    } catch (err) {
      next(err);
    }
  }
}
