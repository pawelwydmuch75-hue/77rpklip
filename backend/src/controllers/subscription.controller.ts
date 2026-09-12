import { Response, Request } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// =====================
// POST /api/subscriptions/:channelId
// Subskrybuj / odsubskrybuj kanał (toggle)
// =====================
export const toggleSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { channelId } = req.params;

    if (req.user.userId === channelId) {
      return res.status(400).json({ message: 'Nie możesz subskrybować własnego kanału.' });
    }

    const channel = await prisma.user.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ message: 'Nie znaleziono kanału.' });

    const existing = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: req.user.userId,
          channelId,
        },
      },
    });

    if (existing) {
      // Odsubskrybuj
      await prisma.subscription.delete({ where: { id: existing.id } });
      const subscribersCount = await prisma.subscription.count({ where: { channelId } });
      return res.json({
        message: `Anulowano subskrypcję kanału ${channel.username}.`,
        subscribed: false,
        subscribersCount,
      });
    }

    // Subskrybuj
    await prisma.subscription.create({
      data: { subscriberId: req.user.userId, channelId },
    });

    const subscribersCount = await prisma.subscription.count({ where: { channelId } });
    return res.status(201).json({
      message: `Zasubskrybowano kanał ${channel.username}.`,
      subscribed: true,
      subscribersCount,
    });
  } catch (error) {
    console.error('Błąd subskrypcji:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// GET /api/subscriptions/status/:channelId
// Sprawdź czy zalogowany user subskrybuje dany kanał
// =====================
export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.json({ subscribed: false, subscribersCount: 0 });

    const { channelId } = req.params;

    const [existing, subscribersCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: req.user.userId,
            channelId,
          },
        },
      }),
      prisma.subscription.count({ where: { channelId } }),
    ]);

    return res.json({ subscribed: !!existing, subscribersCount });
  } catch (error) {
    console.error('Błąd sprawdzania subskrypcji:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// GET /api/subscriptions/feed
// Feed z wideo od subskrybowanych kanałów
// =====================
export const getSubscriptionFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Pobierz ID kanałów, które user subskrybuje
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: req.user.userId },
      select: { channelId: true },
    });

    const channelIds = subscriptions.map(s => s.channelId);

    if (channelIds.length === 0) {
      return res.json({
        videos: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false },
      });
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { userId: { in: channelIds }, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, handle: true, avatarUrl: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.video.count({ where: { userId: { in: channelIds }, status: 'PUBLISHED' } }),
    ]);

    return res.json({
      videos,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Błąd pobierania feedu subskrypcji:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// GET /api/subscriptions/my
// Kanały subskrybowane przez zalogowanego użytkownika
// =====================
export const getMySubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: req.user.userId },
      include: {
        channel: {
          select: {
            id: true, username: true, handle: true, avatarUrl: true,
            _count: { select: { subscribers: true, videos: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ subscriptions: subscriptions.map(s => s.channel) });
  } catch (error) {
    console.error('Błąd pobierania subskrypcji:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};
