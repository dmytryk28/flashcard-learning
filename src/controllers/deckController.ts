import type { Request, Response } from 'express';
import { deckService } from '../services/deckService';
import type { CreateDeckDTO, UpdateDeckDTO } from '../schemas/deckSchema';

export async function getMyDecks(req: Request, res: Response) {
  try {
    const decks = await deckService.findAllByUser(req.user!.id);
    res.status(200).json(decks);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function getPublicDecks(req: Request, res: Response) {
  try {
    const search = req.query.search as string;
    const decks = await deckService.findPublic(search);
    res.status(200).json(decks);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function getDeckById(req: Request<{ id: string }>, res: Response) {
  try {
    const deck = await deckService.findById(req.params.id, req.user!.id);
    res.status(200).json(deck);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function createDeck(req: Request<{}, {}, CreateDeckDTO>, res: Response) {
  try {
    const deck = await deckService.create(req.body, req.user!.id);
    res.status(201).json(deck);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function updateDeck(req: Request<{ id: string }, {}, UpdateDeckDTO>, res: Response) {
  try {
    const deck = await deckService.update(req.params.id, req.body, req.user!.id);
    res.status(200).json(deck);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function deleteDeck(req: Request<{ id: string }>, res: Response) {
  try {
    await deckService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function cloneDeck(req: Request<{ id: string }>, res: Response) {
  try {
    const deck = await deckService.clone(req.params.id, req.user!.id);
    res.status(201).json(deck);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}
