import type { Request, Response } from 'express';
import * as recordService from '../services/cipherRecord.service';
import {
  createCipherRecordSchema,
  listCipherRecordsQuerySchema,
  updateCipherRecordSchema,
} from '../validation/cipherRecord.schemas';

export async function list(req: Request, res: Response): Promise<void> {
  const query = listCipherRecordsQuerySchema.parse(req.query);
  res.status(200).json(await recordService.listRecords(req.user!, query));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createCipherRecordSchema.parse(req.body);
  res.status(201).json(await recordService.createRecord(req.user!, input));
}

export async function getById(req: Request, res: Response): Promise<void> {
  res.status(200).json(await recordService.getRecord(req.user!, req.params.id));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateCipherRecordSchema.parse(req.body);
  res.status(200).json(await recordService.updateRecord(req.user!, req.params.id, input));
}
