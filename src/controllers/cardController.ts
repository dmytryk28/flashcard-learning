import type { Request, Response } from 'express';
import { cardService } from '../services/cardService';
import type { CreateCardDTO, UpdateCardDTO } from '../schemas/cardSchema';

export async function getCards(req: Request<{ id: string }>, res: Response) {
  try {
    const cards = await cardService.findAllByDeck(req.params.id, req.user!.id);
    res.status(200).json(cards);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function createCard(req: Request<{ id: string }, {}, CreateCardDTO>, res: Response) {
  try {
    const card = await cardService.create(req.params.id, req.body, req.user!.id);
    res.status(201).json(card);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function updateCard(req: Request<{ id: string }, {}, UpdateCardDTO>, res: Response) {
  try {
    const card = await cardService.update(req.params.id, req.body, req.user!.id);
    res.status(200).json(card);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function deleteCard(req: Request<{ id: string }>, res: Response) {
  try {
    await cardService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}
