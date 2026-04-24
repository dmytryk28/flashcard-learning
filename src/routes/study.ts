import { Router } from 'express';
import express from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { reviewSchema } from '../schemas/studySchema';
import * as StudyController from '../controllers/studyController';

const router = Router();
const jsonParser = express.json();

router.get('/stats', authenticate, StudyController.getStats);
router.get('/heatmap', authenticate, StudyController.getHeatmap);
router.get('/forecast', authenticate, StudyController.getForecast);

router.get('/:deckId/session', authenticate, StudyController.getSession);
router.post('/:cardId/review', jsonParser, authenticate, validate(reviewSchema), StudyController.submitReview);

export default router;
