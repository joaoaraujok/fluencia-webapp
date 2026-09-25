import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SchoolsService } from './schools.service.js';
import { getParam } from '../../shared/utils/param.util.js';

const schoolsService = new SchoolsService();

const createSchoolSchema = z.object({
  name: z.string().min(2, 'Nome da escola deve ter ao menos 2 caracteres'),
  code: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 letras (ex: SP, RJ, CE)')
});

const updateSchoolSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().length(2).optional(),
  active: z.boolean().optional()
});

export class SchoolsController {
  public async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schools = await schoolsService.listSchools();
      res.status(200).json({ status: 'success', data: { schools } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolsService.getSchoolById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { school } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createSchoolSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const school = await schoolsService.createSchool({ ...data, actorUserId });

      res.status(201).json({ status: 'success', data: { school } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateSchoolSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const school = await schoolsService.updateSchool({
        id: getParam(req.params.id),
        ...data,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { school } });
    } catch (err) {
      next(err);
    }
  }
}
