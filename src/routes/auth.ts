import { Router } from 'express';
import express from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/authSchema';
import * as AuthController from '../controllers/authController';

const router = Router();
const jsonParser = express.json();

router.post('/register', jsonParser, validate(registerSchema), AuthController.register);
router.post('/login', jsonParser, validate(loginSchema),    AuthController.login);
router.post('/refresh', jsonParser, validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', jsonParser, validate(refreshTokenSchema), AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
