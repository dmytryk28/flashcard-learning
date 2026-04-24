import type { Request, Response } from 'express';
import { studyService } from '../services/studyService';
import type { ReviewDTO } from '../schemas/studySchema';

export async function getSession(req: Request<{ deckId: string }>, res: Response) {
  try {
    const session = await studyService.getSession(req.params.deckId, req.user!.id);
    res.status(200).json(session);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function submitReview(req: Request<{ cardId: string }, {}, ReviewDTO>, res: Response) {
  try {
    const result = await studyService.submitReview(req.params.cardId, req.body, req.user!.id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await studyService.getStats(req.user!.id);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function getHeatmap(req: Request, res: Response) {
  try {
    const data = await studyService.getHeatmap(req.user!.id);
    res.status(200).json(data);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function getForecast(req: Request, res: Response) {
  try {
    const data = await studyService.getForecast(req.user!.id);
    res.status(200).json(data);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}
