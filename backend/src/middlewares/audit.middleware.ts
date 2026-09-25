import { prisma } from '../database/prisma.js';

interface AuditLogParams {
  userId?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'SETTINGS_CHANGE';
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        oldValue: params.oldValue ? (params.oldValue as any) : undefined,
        newValue: params.newValue ? (params.newValue as any) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null
      }
    });
  } catch (err) {
    console.error('Falha ao registrar log de auditoria:', err);
    // Não quebramos o fluxo da requisição principal por falha no log de auditoria
  }
}
