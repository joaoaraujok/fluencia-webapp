import { prisma } from '../../database/prisma.js';

export class AnalyticsService {
  public async getOverview() {
    const [schoolsCount, classesCount, studentsCount, evaluationsCount] = await Promise.all([
      prisma.school.count({ where: { active: true } }),
      prisma.schoolClass.count({ where: { active: true } }),
      prisma.student.count({ where: { active: true } }),
      prisma.evaluationSession.count()
    ]);

    const recentEvaluations = await prisma.evaluationSession.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } }
      }
    });

    const aggregates = await prisma.evaluationSession.aggregate({
      _avg: {
        accuracyPercentage: true,
        averageResponseTimeMs: true
      }
    });

    return {
      totals: {
        schools: schoolsCount,
        classes: classesCount,
        students: studentsCount,
        evaluations: evaluationsCount
      },
      averages: {
        accuracy: aggregates._avg.accuracyPercentage ? Math.round(aggregates._avg.accuracyPercentage * 10) / 10 : 0,
        responseTimeMs: aggregates._avg.averageResponseTimeMs ? Math.round(aggregates._avg.averageResponseTimeMs) : 0
      },
      recentEvaluations
    };
  }
}
