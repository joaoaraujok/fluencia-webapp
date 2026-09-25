import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SettingsService } from './settings.service.js';

const settingsService = new SettingsService();

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional()
});

export class SettingsController {
  public async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json({ status: 'success', data: { settings } });
    } catch (err) {
      next(err);
    }
  }

  public async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateSettingSchema.parse(req.body);
      const actorUserId = req.user!.id;

      const updated = await settingsService.updateSetting(
        data.key,
        data.value,
        data.description,
        actorUserId
      );

      res.status(200).json({ status: 'success', data: { setting: updated } });
    } catch (err) {
      next(err);
    }
  }
}
