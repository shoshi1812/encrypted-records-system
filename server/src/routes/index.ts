import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { cipherRecordRouter } from './cipherRecord.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/cipher-records', cipherRecordRouter);
apiRouter.use('/admin', adminRouter);
