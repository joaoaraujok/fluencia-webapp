import { prisma } from '../../database/prisma.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

export class SettingsService {
  public async getSettings() {
    const list = await prisma.pedagogicalSetting.findMany({
      orderBy: { key: 'asc' }
    });

    const settingsMap: Record<string, any> = {};
    for (const item of list) {
      settingsMap[item.key] = item.value;
    }

    return settingsMap;
  }

  public async updateSetting(key: string, value: any, description?: string, actorUserId?: string) {
    const existing = await prisma.pedagogicalSetting.findUnique({ where: { key } });

    const updated = await prisma.pedagogicalSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: description || null,
        updatedByUserId: actorUserId || null
      },
      update: {
        value,
        description: description || existing?.description || null,
        updatedByUserId: actorUserId || null
      }
    });

    if (actorUserId) {
      await recordAuditLog({
        userId: actorUserId,
        action: 'SETTINGS_CHANGE',
        entity: 'PedagogicalSetting',
        entityId: key,
        oldValue: existing?.value,
        newValue: value
      });
    }

    return updated;
  }
}
