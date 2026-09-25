import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { getParam } from '../../shared/utils/param.util.js';

const reportsService = new ReportsService();

export class ReportsController {
  public async getStudentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = getParam(req.params.studentId);
      const report = await reportsService.getStudentReport(studentId);
      res.status(200).json({ status: 'success', data: report });
    } catch (err) {
      next(err);
    }
  }

  public async getClassReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const report = await reportsService.getClassReport(classId);
      res.status(200).json({ status: 'success', data: report });
    } catch (err) {
      next(err);
    }
  }
}
