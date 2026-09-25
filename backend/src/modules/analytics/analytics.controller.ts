import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  public async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await analyticsService.getOverview();
      res.status(200).json({ status: 'success', data: overview });
    } catch (err) {
      next(err);
    }
  }
}
