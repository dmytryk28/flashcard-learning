import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';
import type { CreateCardDTO, UpdateCardDTO } from '../schemas/cardSchema';

class CardService {
  async findAllByDeck(deckId: string, userId: string) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (!deck.isPublic && deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    return prisma.card.findMany({
      where: { deckId },
      include: {
        tags: { select: { tag: true } },
        progress: {
          where: { userId },
          select: { easeFactor: true, interval: true, repetitions: true, nextReviewAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(deckId: string, dto: CreateCardDTO, userId: string) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    return prisma.card.create({
      data: {
        front: dto.front.trim(),
        back: dto.back.trim(),
        hint: dto.hint?.trim(),
        deckId,
        tags: {
          create: (dto.tags ?? []).map((t) => ({ tag: t.trim().toLowerCase() })),
        },
      },
      include: { tags: { select: { tag: true } } },
    });
  }

  async update(id: string, dto: UpdateCardDTO, userId: string) {
    const card = await prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });
    if (!card) throw { status: 404, message: 'Card not found' };
    if (card.deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.tags !== undefined) {
        await tx.cardTag.deleteMany({ where: { cardId: id } });
      }
      return tx.card.update({
        where: { id },
        data: {
          ...(dto.front && { front: dto.front.trim() }),
          ...(dto.back && { back: dto.back.trim() }),
          ...(dto.hint !== undefined && { hint: dto.hint?.trim() }),
          ...(dto.tags !== undefined && {
            tags: { create: dto.tags.map((t) => ({ tag: t.trim().toLowerCase() })) },
          }),
        },
        include: { tags: { select: { tag: true } } },
      });
    });
  }

  async delete(id: string, userId: string) {
    const card = await prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });
    if (!card) throw { status: 404, message: 'Card not found' };
    if (card.deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    await prisma.card.delete({ where: { id } });
  }
}

export const cardService = new CardService();
