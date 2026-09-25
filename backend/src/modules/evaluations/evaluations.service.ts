import { prisma } from '../../database/prisma.js';
import { RecognitionStatus, EvaluationStatus, QuestionLevel, ItemType } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';
import { env } from '../../config/env.js';

interface EvaluationItemInput {
  questionId?: string;
  targetText: string;
  level: QuestionLevel;
  itemType?: ItemType;
  syllableStructure: string;
  category: string;
  transcript: string;
  normalizedTranscript: string;
  confidence?: number;
  responseTimeMs: number;
  availableTimeMs?: number; // 10000ms
  speechStartMs?: number;
  speechEndMs?: number;
  status: RecognitionStatus;
  similarity?: number;
  numberOfAttempts?: number;
  recognitionQuality?: string;
  provider?: string;
  observedError?: string;
  phonemeFindings?: string[];
}

interface CreateEvaluationSessionInput {
  id?: string; // UUID opcional do cliente para idempotência de sync offline
  studentId: string;
  evaluatorId: string;
  schoolId?: string;
  classId?: string;
  criteriaVersion?: string;
  mode?: string;
  notes?: string;
  clientTimestamp?: string;
  items: EvaluationItemInput[];
}

export class EvaluationsService {
  public async listEvaluations(studentId?: string, classId?: string, schoolId?: string) {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (schoolId) where.schoolId = schoolId;

    return prisma.evaluationSession.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, registrationNumber: true } },
        class: { select: { id: true, name: true, gradeYear: true } },
        school: { select: { id: true, name: true } },
        evaluator: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async getEvaluationById(id: string) {
    const session = await prisma.evaluationSession.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
        school: true,
        evaluator: { select: { id: true, name: true, email: true, role: true } },
        items: { orderBy: { createdAt: 'asc' } },
        criteria: true
      }
    });

    if (!session) {
      throw new AppError('Sessão de avaliação não encontrada.', 404);
    }

    return session;
  }

  public async createEvaluationSession({
    id,
    studentId,
    evaluatorId,
    criteriaVersion = env.EVALUATION_CRITERIA_VERSION,
    mode = 'complete',
    notes,
    clientTimestamp,
    items
  }: CreateEvaluationSessionInput) {
    // 1. Valida existência do aluno e herda escola e turma
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, school: true }
    });

    if (!student) {
      throw new AppError('Aluno informado não existe.', 404);
    }

    // 2. Garante que os critérios versionados existam
    let criteria = await prisma.evaluationCriteria.findUnique({
      where: { version: criteriaVersion }
    });

    if (!criteria) {
      // Cria o critério versionado padrão se não existir
      criteria = await prisma.evaluationCriteria.create({
        data: {
          version: criteriaVersion,
          wordDurationSec: 10,
          toleranceSetting: 'standard',
          active: true,
          rulesJson: {
            mecReference: 'Compromisso Nacional Criança Alfabetizada / SAEB Alfabetização',
            systemTolerance: 'lenient_for_phonetics_and_children_diminutives',
            silentMode: true,
            status: 'Critério oficial versionado FluencIA'
          }
        }
      });
    }

    // 3. Se id for fornecido (sincronização offline), verifica se já existe para evitar duplicações
    if (id) {
      const existing = await prisma.evaluationSession.findUnique({ where: { id } });
      if (existing) {
        return existing; // Idempotência garantida para retentativas de rede
      }
    }

    // 4. Calcula métricas precisas
    let correctCount = 0;
    let possibleCount = 0;
    let incorrectCount = 0;
    let noResponseCount = 0;
    let unrecognizedCount = 0;
    let totalResponseTimeMs = 0;

    for (const item of items) {
      totalResponseTimeMs += item.responseTimeMs || 0;
      switch (item.status) {
        case RecognitionStatus.CORRETO:
          correctCount++;
          break;
        case RecognitionStatus.POSSIVELMENTE_CORRETO:
          possibleCount++;
          break;
        case RecognitionStatus.INCORRETO:
          incorrectCount++;
          break;
        case RecognitionStatus.SEM_RESPOSTA:
          noResponseCount++;
          break;
        default:
          unrecognizedCount++;
          break;
      }
    }

    const totalItems = items.length;
    const effectivePoints = correctCount + possibleCount * 0.5;
    const accuracyPercentage = totalItems > 0 ? Math.round((effectivePoints / totalItems) * 1000) / 10 : 0;
    const averageResponseTimeMs = totalItems > 0 ? Math.round(totalResponseTimeMs / totalItems) : 0;

    // 5. Gera recomendações pedagógicas acolhedoras baseadas exclusivamente nos dados observados
    const recommendations = this.generatePedagogicalRecommendations(items);

    // 6. Persiste de forma atômica a sessão e todos os seus itens
    const session = await prisma.evaluationSession.create({
      data: {
        id: id || undefined,
        studentId,
        evaluatorId,
        schoolId: student.schoolId,
        classId: student.classId,
        criteriaVersion: criteria.version,
        mode,
        status: EvaluationStatus.COMPLETED,
        totalItems,
        correctCount,
        possibleCount,
        incorrectCount,
        noResponseCount,
        unrecognizedCount,
        accuracyPercentage,
        averageResponseTimeMs,
        notes: notes?.trim() || null,
        syncStatus: 'synced',
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
        completedAt: new Date(),
        summaryJson: {
          recommendations,
          criteriaUsed: criteria.version,
          pedagogicalBasis: 'Avaliação formativa da leitura e decodificação oral'
        },
        items: {
          create: items.map((item) => ({
            questionId: item.questionId || null,
            targetText: item.targetText.trim().toUpperCase(),
            level: item.level,
            itemType: item.itemType || ItemType.WORD,
            syllableStructure: item.syllableStructure,
            category: item.category,
            transcript: item.transcript,
            normalizedTranscript: item.normalizedTranscript,
            confidence: item.confidence ?? 1.0,
            responseTimeMs: item.responseTimeMs,
            availableTimeMs: item.availableTimeMs ?? 10000,
            speechStartMs: item.speechStartMs ?? null,
            speechEndMs: item.speechEndMs ?? null,
            status: item.status,
            similarity: item.similarity ?? null,
            numberOfAttempts: item.numberOfAttempts ?? 1,
            recognitionQuality: item.recognitionQuality || 'good',
            provider: item.provider || 'browser-web-speech',
            observedError: item.observedError || null,
            phonemeFindings: item.phonemeFindings || []
          }))
        }
      },
      include: {
        student: true,
        class: true,
        school: true,
        evaluator: { select: { id: true, name: true, email: true } },
        items: true
      }
    });

    await recordAuditLog({
      userId: evaluatorId,
      action: 'CREATE',
      entity: 'EvaluationSession',
      entityId: session.id,
      newValue: {
        studentId,
        totalItems,
        accuracyPercentage,
        averageResponseTimeMs,
        criteriaVersion: criteria.version
      }
    });

    return session;
  }

  private generatePedagogicalRecommendations(items: EvaluationItemInput[]) {
    const recs: Array<{
      id: string;
      title: string;
      category: string;
      description: string;
      suggestedWords: string[];
      priority: 'alta' | 'media' | 'baixa';
    }> = [];

    const challengingItems = items.filter(
      (i) => i.status === RecognitionStatus.INCORRETO || i.status === RecognitionStatus.SEM_RESPOSTA || i.status === RecognitionStatus.POSSIVELMENTE_CORRETO
    );

    if (challengingItems.length === 0) {
      recs.push({
        id: 'rec_mastery',
        title: 'Excelente precisão e fluência',
        category: 'Fluência Geral',
        description: 'A criança demonstrou excelente clareza, ritmo e acurácia articulatória em todos os itens apresentados.',
        suggestedWords: ['Leituras de pequenos contos', 'Trava-línguas lúdicos'],
        priority: 'baixa'
      });
      return recs;
    }

    // Dígrafos CH
    const ch = challengingItems.filter((i) => i.syllableStructure === 'digraph_ch' || i.targetText.includes('CH'));
    if (ch.length >= 1) {
      recs.push({
        id: 'rec_digraph_ch',
        title: 'Apoio na articulação do dígrafo CH',
        category: 'Dígrafos',
        description: 'Observou-se oportunidade de prática em palavras contendo CH. Jogos com figuras auxiliam na fixação do fonema.',
        suggestedWords: ['CHUVA', 'CHAVE', 'CHINELO', 'CHOCOLATE'],
        priority: ch.length >= 2 ? 'alta' : 'media'
      });
    }

    // Dígrafos LH
    const lh = challengingItems.filter((i) => i.syllableStructure === 'digraph_lh' || i.targetText.includes('LH'));
    if (lh.length >= 1) {
      recs.push({
        id: 'rec_digraph_lh',
        title: 'Apoio na articulação do dígrafo LH',
        category: 'Dígrafos',
        description: 'Recomenda-se incentivar a sonorização do LH, que demanda elevação palatal da língua.',
        suggestedWords: ['MILHO', 'FOLHA', 'COELHO', 'TOALHA'],
        priority: lh.length >= 2 ? 'alta' : 'media'
      });
    }

    // Encontros Consonantais com R
    const clusterR = challengingItems.filter(
      (i) => i.syllableStructure === 'cluster_r' || /([PTBCDFG]R)/.test(i.targetText)
    );
    if (clusterR.length >= 1) {
      recs.push({
        id: 'rec_cluster_r',
        title: 'Prática de encontros consonantais com R',
        category: 'Encontros Consonantais',
        description: 'A criança pode praticar a vibração ágil do R em pares consonantais (PR, TR, BR).',
        suggestedWords: ['PRATO', 'COBRA', 'TRATOR', 'TIGRE'],
        priority: clusterR.length >= 2 ? 'alta' : 'media'
      });
    }

    // Ausência de resposta / Prontidão
    const noResp = challengingItems.filter((i) => i.status === RecognitionStatus.SEM_RESPOSTA);
    if (noResp.length >= 2) {
      recs.push({
        id: 'rec_confidence',
        title: 'Tempo de prontidão e segurança',
        category: 'Ritmo e Confiança',
        description: 'Houve hesitação ou silêncio em alguns itens. Momentos lúdicos de nomeação rápida ajudam no ganho de autoconfiança.',
        suggestedWords: ['Jogos de nomeação de objetos cotidianos', 'Rimas sonoras'],
        priority: 'media'
      });
    }

    return recs;
  }
}
