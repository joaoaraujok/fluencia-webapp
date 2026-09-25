import { prisma } from '../../database/prisma.js';

export class AuditService {
  public async listLogs(entity?: string, action?: string, limit: number = 50) {
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    return prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });
  }
}
