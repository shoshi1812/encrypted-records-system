import { Router } from 'express';
import * as recordController from '../controllers/cipherRecord.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { auth } from '../middleware/auth';

export const cipherRecordRouter = Router();

cipherRecordRouter.use(auth);
cipherRecordRouter.get('/', asyncHandler(recordController.list));
cipherRecordRouter.post('/', asyncHandler(recordController.create));
cipherRecordRouter.get('/:id', asyncHandler(recordController.getById));
cipherRecordRouter.put('/:id', asyncHandler(recordController.update));
// אין DELETE בגרסה זו
