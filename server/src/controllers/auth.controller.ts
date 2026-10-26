import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { loginSchema, registerSchema } from '../validation/auth.schemas';

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input));
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  res.status(200).json(await authService.login(input));
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json(await authService.getCurrentUser(req.user!.id));
}
