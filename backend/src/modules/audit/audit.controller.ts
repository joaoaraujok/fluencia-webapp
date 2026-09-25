import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';

const auditService = new AuditService();

export class AuditController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entity = req.query.entity as string | undefined;
      const action = req.query.action as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const logs = await auditService.listLogs(entity, action, limit);
      res.status(200).json({ status: 'success', data: { logs } });
    } catch (err) {
      next(err);
    }
  }
}
