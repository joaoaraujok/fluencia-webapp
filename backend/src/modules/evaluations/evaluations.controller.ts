import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EvaluationsService } from './evaluations.service.js';
import { speechAiService } from './speechAi.service.js';
import { RecognitionStatus, QuestionLevel, ItemType } from '@prisma/client';
import { getParam } from '../../shared/utils/param.util.js';
import { AppError } from '../../shared/errors/AppError.js';

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

const reviewEvaluationSchema = z.object({
  adminFeedback: z.string().min(1, 'Parecer avaliativo é obrigatório'),
  adminReviewStatus: z.enum(['APROVADO', 'REQUER_ATENCAO', 'EM_OBSERVACAO', 'PENDENTE']).default('APROVADO')
});

export class EvaluationsController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.query.studentId as string | undefined;
      const classId = req.query.classId as string | undefined;
      const schoolId = req.query.schoolId as string | undefined;

      const evaluations = await evaluationsService.listEvaluations(studentId, classId, schoolId, req.user);
      res.status(200).json({ status: 'success', data: { evaluations } });
    } catch (err) {
      next(err);
    }
  }

  public async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = reviewEvaluationSchema.parse(req.body);
      const actorUserId = req.user!.id;

      const session = await evaluationsService.reviewEvaluationSession({
        id: getParam(req.params.id),
        adminFeedback: data.adminFeedback,
        adminReviewStatus: data.adminReviewStatus,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { session } });
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

  public async updateNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notes } = z.object({ notes: z.string() }).parse(req.body);
      const session = await evaluationsService.updateEvaluationNotes({
        id: getParam(req.params.id),
        notes,
        actorUserId: req.user!.id,
        actorSchoolId: req.user!.schoolId
      });
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

  public async analyzeAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    const filePath = req.file?.path;
    try {
      const targetText = String(req.body.targetText || '').trim();
      const itemType = String(req.body.itemType || 'word').trim();
      const directTranscript = String(req.body.transcriptText || req.body.transcript || '').trim();

      if (!targetText) {
        throw new AppError('O campo targetText é obrigatório', 400);
      }

      if (!req.file || !filePath) {
        if (directTranscript) {
          console.log(`[EvaluationsController] POST /analyze-audio (via texto): alvo="${targetText}", tipo="${itemType}", transcrição="${directTranscript}"`);
          const analysis = await speechAiService.analyzePedagogicalReading(
            targetText,
            directTranscript,
            itemType
          );

          const finalDisplayTranscript = (itemType === 'letter' && analysis.status === 'CORRETO')
            ? targetText.toUpperCase()
            : directTranscript;

          res.status(200).json({
            status: 'success',
            data: {
              transcript: finalDisplayTranscript,
              status: analysis.status,
              similarity: analysis.similarity,
              observedError: analysis.observedError,
              phonemeFindings: analysis.phonemeFindings,
              pedagogicalNote: analysis.pedagogicalNote,
              duration: 0
            }
          });
          return;
        }
        throw new AppError('Nenhum arquivo de áudio enviado (campo audioFile obrigatório)', 400);
      }

      console.log(`[EvaluationsController] POST /analyze-audio: arquivo=${req.file.filename} (${req.file.size} bytes), alvo="${targetText}", tipo="${itemType}"`);

      // 1. Transcrição com Whisper Large v3 Turbo via Groq com biasing fonético
      const transcriptionResult = await speechAiService.transcribeAudio(filePath, targetText, itemType);

      // 2. Análise pedagógica estruturada com Gemini
      const analysis = await speechAiService.analyzePedagogicalReading(
        targetText,
        transcriptionResult.text,
        itemType
      );

      // Se for letra e estiver correta, exibe a letra alvo limpa (ex: "M" em vez do artefato "Amy")
      const finalDisplayTranscript = (itemType === 'letter' && analysis.status === 'CORRETO')
        ? targetText.toUpperCase()
        : transcriptionResult.text;

      res.status(200).json({
        status: 'success',
        data: {
          transcript: finalDisplayTranscript,
          status: analysis.status,
          similarity: analysis.similarity,
          observedError: analysis.observedError,
          phonemeFindings: analysis.phonemeFindings,
          pedagogicalNote: analysis.pedagogicalNote,
          duration: transcriptionResult.duration
        }
      });
    } catch (err) {
      next(err);
    } finally {
      if (filePath) {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn(`[SpeechAi] Falha ao remover arquivo temporário ${filePath}:`, unlinkErr);
          }
        });
      }
    }
  }

  public async generateSessionSynthesis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { childName, accuracyPercentage, totalItems, correctCount, itemsSummary } = req.body;

      const synthesis = await speechAiService.generateSessionSynthesis({
        childName,
        accuracyPercentage: Number(accuracyPercentage || 0),
        totalItems: Number(totalItems || 0),
        correctCount: Number(correctCount || 0),
        itemsSummary: String(itemsSummary || '')
      });

      res.status(200).json({
        status: 'success',
        data: synthesis
      });
    } catch (err) {
      next(err);
    }
  }
}

