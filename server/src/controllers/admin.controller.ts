import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service';

export async function listUsers(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await adminService.listUsers());
}
