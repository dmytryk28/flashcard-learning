import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db/prisma';
import type { RegisterDTO, LoginDTO } from '../schemas/authSchema';

const SALT_ROUNDS = 12;

function generateAccessToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: { id: string; email: string }): string {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' } as jwt.SignOptions
  );
}

async function saveRefreshToken(token: string, userId: string): Promise<void> {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? '7', 10);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

class AuthService {
  async register(dto: RegisterDTO) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw { status: 409, message: 'Email already in use' };
    }

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name: dto.name, email: dto.email, password },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
    await saveRefreshToken(refreshToken, user.id);

    return { user, accessToken, refreshToken };
  }

  async login(dto: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
    await saveRefreshToken(refreshToken, user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    interface JwtPayload { id: string; email: string }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    } catch {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { token } });
      throw { status: 401, message: 'Refresh token revoked or expired' };
    }

    // Rotate — delete old, issue new pair
    await prisma.refreshToken.delete({ where: { token } });

    const accessToken = generateAccessToken({ id: payload.id, email: payload.email });
    const newRefreshToken = generateRefreshToken({ id: payload.id, email: payload.email });
    await saveRefreshToken(newRefreshToken, payload.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  }
}

export const authService = new AuthService();
