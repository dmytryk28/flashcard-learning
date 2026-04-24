import prisma from '../db/prisma';
import type { CreateDeckDTO, UpdateDeckDTO } from '../schemas/deckSchema';

class DeckService {
  findAllByUser(userId: string) {
    return prisma.deck.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findPublic(search: string) {
    return prisma.deck.findMany({
      where: {
        isPublic: true,
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { cards: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        _count: { select: { cards: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (!deck.isPublic && deck.userId !== userId) throw { status: 404, message: 'Deck not found' };

    return deck;
  }

  create(dto: CreateDeckDTO, userId: string) {
    return prisma.deck.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        isPublic: dto.isPublic ?? false,
        userId,
      },
    });
  }

  async update(id: string, dto: UpdateDeckDTO, userId: string) {
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    return prisma.deck.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async delete(id: string, userId: string) {
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    await prisma.deck.delete({ where: { id } });
  }

  async clone(id: string, userId: string) {
    const source = await prisma.deck.findUnique({
      where: { id },
      include: { cards: { include: { tags: true } } },
    });

    if (!source) throw { status: 404, message: 'Deck not found' };
    if (!source.isPublic && source.userId !== userId) {
      throw { status: 403, message: 'You can only clone public decks' };
    }

    return prisma.deck.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description ?? undefined,
        isPublic: false,
        userId,
        cards: {
          create: source.cards.map((card: typeof source.cards[number]) => ({
            front: card.front,
            back: card.back,
            hint: card.hint ?? undefined,
            tags: {
              create: card.tags.map((t: { id: string; tag: string; cardId: string }) => ({ tag: t.tag })),
            },
          })),
        },
      },
      include: { _count: { select: { cards: true } } },
    });
  }
}

export const deckService = new DeckService();
