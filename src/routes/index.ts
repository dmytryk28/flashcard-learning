import { Router } from 'express';
import authRoutes  from './auth';
import deckRoutes  from './decks';
import cardRoutes  from './cards';
import studyRoutes from './study';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth',  authRoutes);
router.use('/decks', deckRoutes);
router.use('/cards', cardRoutes);
router.use('/study', studyRoutes);

export default router;
