import { prisma } from '../../database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { RecognitionStatus, QuestionLevel } from '@prisma/client';

export class ReportsService {
  public async getStudentReport(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        class: true
      }
    });

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const sessions = await prisma.evaluationSession.findMany({
      where: { studentId },
      include: {
        evaluator: { select: { name: true } },
        items: true,
        criteria: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (sessions.length === 0) {
      return {
        student,
        totalEvaluations: 0,
        latestEvaluation: null,
        history: [],
        message: 'Nenhuma avaliação realizada ainda para este aluno.'
      };
    }

    const latest = sessions[0];

    // Análise detalhada dos itens da última avaliação
    const syllableStats: Record<string, { total: number; correct: number; possible: number; accuracy: number }> = {};
    for (const item of latest.items) {
      const struct = item.syllableStructure;
      if (!syllableStats[struct]) {
        syllableStats[struct] = { total: 0, correct: 0, possible: 0, accuracy: 0 };
      }
      syllableStats[struct].total += 1;
      if (item.status === RecognitionStatus.CORRETO) {
        syllableStats[struct].correct += 1;
      } else if (item.status === RecognitionStatus.POSSIVELMENTE_CORRETO) {
        syllableStats[struct].possible += 1;
      }
    }

    for (const k of Object.keys(syllableStats)) {
      const s = syllableStats[k];
      s.accuracy = Math.round(((s.correct + s.possible * 0.5) / s.total) * 100);
    }

    // Histórico de evolução (pontos no tempo)
    const history = sessions.map((s) => ({
      sessionId: s.id,
      date: s.createdAt,
      accuracyPercentage: s.accuracyPercentage,
      averageResponseTimeMs: s.averageResponseTimeMs,
      totalItems: s.totalItems,
      criteriaVersion: s.criteriaVersion
    }));

    return {
      student,
      totalEvaluations: sessions.length,
      latestEvaluation: {
        ...latest,
        syllableStructureAnalysis: syllableStats
      },
      history
    };
  }

  public async getClassReport(classId: string) {
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      include: {
        school: true,
        students: {
          where: { active: true },
          orderBy: { name: 'asc' },
          include: {
            evaluations: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!schoolClass) {
      throw new AppError('Turma não encontrada.', 404);
    }

    const totalStudents = schoolClass.students.length;
    let evaluatedCount = 0;
    let totalAccuracySum = 0;
    let totalTimeSum = 0;

    const studentSummaries = schoolClass.students.map((st) => {
      const lastEval = st.evaluations[0] || null;
      if (lastEval) {
        evaluatedCount++;
        totalAccuracySum += lastEval.accuracyPercentage;
        totalTimeSum += lastEval.averageResponseTimeMs;
      }

      return {
        id: st.id,
        name: st.name,
        registrationNumber: st.registrationNumber,
        hasEvaluation: !!lastEval,
        latestEvaluation: lastEval
          ? {
              id: lastEval.id,
              date: lastEval.createdAt,
              accuracyPercentage: lastEval.accuracyPercentage,
              averageResponseTimeMs: lastEval.averageResponseTimeMs,
              correctCount: lastEval.correctCount,
              totalItems: lastEval.totalItems
            }
          : null
      };
    });

    const averageAccuracy = evaluatedCount > 0 ? Math.round((totalAccuracySum / evaluatedCount) * 10) / 10 : 0;
    const averageTimeMs = evaluatedCount > 0 ? Math.round(totalTimeSum / evaluatedCount) : 0;
    const pendingCount = totalStudents - evaluatedCount;

    return {
      class: {
        id: schoolClass.id,
        name: schoolClass.name,
        gradeYear: schoolClass.gradeYear,
        schoolYear: schoolClass.schoolYear,
        shift: schoolClass.shift,
        school: schoolClass.school
      },
      metrics: {
        totalStudents,
        evaluatedCount,
        pendingCount,
        averageAccuracy,
        averageTimeMs
      },
      students: studentSummaries
    };
  }
}
