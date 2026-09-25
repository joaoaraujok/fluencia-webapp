import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(1, 'A senha é obrigatória')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter ao menos 8 caracteres')
});

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login({
        ...data,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await authService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: { user: profile }
      });
    } catch (err) {
      next(err);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = changePasswordSchema.parse(req.body);

      const result = await authService.changePassword(
        userId,
        data.currentPassword,
        data.newPassword
      );

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
