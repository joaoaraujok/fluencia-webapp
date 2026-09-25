import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UsersService } from './users.service.js';
import { Role } from '@prisma/client';
import { getParam } from '../../shared/utils/param.util.js';

const usersService = new UsersService();

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Perfil (role) inválido' }) })
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional()
});

export class UsersController {
  public async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await usersService.listUsers();
      res.status(200).json({ status: 'success', data: { users } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const user = await usersService.createUser({ ...data, actorUserId });

      res.status(201).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUserSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const user = await usersService.updateUser({
        id: getParam(req.params.id),
        ...data,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorUserId = req.user!.id;
      const result = await usersService.deleteUser(getParam(req.params.id), actorUserId);
      res.status(200).json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  }
}
