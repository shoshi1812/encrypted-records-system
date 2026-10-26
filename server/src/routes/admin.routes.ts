import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

export const adminRouter = Router();

adminRouter.use(auth, requireAdmin);
adminRouter.get('/users', asyncHandler(adminController.listUsers));
