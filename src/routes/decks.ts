import { Router } from 'express';
import express from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { createDeckSchema, updateDeckSchema } from '../schemas/deckSchema';
import * as DeckController from '../controllers/deckController';
import * as CardController from '../controllers/cardController';
import { createCardSchema, updateCardSchema } from '../schemas/cardSchema';

const router = Router();
const jsonParser = express.json();

router.get('/', authenticate, DeckController.getMyDecks);
router.get('/public', authenticate, DeckController.getPublicDecks);
router.get('/:id', authenticate, DeckController.getDeckById);
router.post('/', jsonParser, authenticate, validate(createDeckSchema), DeckController.createDeck);
router.put('/:id', jsonParser, authenticate, validate(updateDeckSchema), DeckController.updateDeck);
router.delete('/:id', authenticate, DeckController.deleteDeck);
router.post('/:id/clone', authenticate, DeckController.cloneDeck);

// Cards nested under decks
router.get('/:id/cards', authenticate, CardController.getCards);
router.post('/:id/cards', jsonParser, authenticate, validate(createCardSchema), CardController.createCard);

export default router;
