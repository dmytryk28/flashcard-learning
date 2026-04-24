import { Router } from 'express';
import express from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { updateCardSchema } from '../schemas/cardSchema';
import * as CardController from '../controllers/cardController';

const router = Router();
const jsonParser = express.json();

router.put('/:id', jsonParser, authenticate, validate(updateCardSchema), CardController.updateCard);
router.delete('/:id', authenticate, CardController.deleteCard);

export default router;
