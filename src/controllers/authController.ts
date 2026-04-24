import type { Request, Response } from 'express';
import { authService } from '../services/authService';
import type { RegisterDTO, LoginDTO, RefreshDTO } from '../schemas/authSchema';

export async function register(req: Request<{}, {}, RegisterDTO>, res: Response) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function login(req: Request<{}, {}, LoginDTO>, res: Response) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function refresh(req: Request<{}, {}, RefreshDTO>, res: Response) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}

export async function logout(req: Request<{}, {}, RefreshDTO>, res: Response) {
  try {
    await authService.logout(req.body.refreshToken);
  } catch {
    // ignore
  }
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.me(req.user!.id);
    res.status(200).json(user);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
}
