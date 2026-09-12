import { Response, Request } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// =====================
// GET /api/comments/:videoId
// Pobierz komentarze do wideo (tylko top-level, replies osobno)
// =====================
export const getComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { videoId, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, handle: true, avatarUrl: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, username: true, handle: true, avatarUrl: true },
              },
              _count: { select: { likes: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { likes: true, replies: true } },
        },
      }),
      prisma.comment.count({ where: { videoId, parentId: null } }),
    ]);

    return res.json({
      comments,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Błąd pobierania komentarzy:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// POST /api/comments/:videoId
// Dodaj komentarz lub odpowiedź
// =====================
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { videoId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Treść komentarza nie może być pusta.' });
    }

    // Sprawdź czy wideo istnieje
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Nie znaleziono wideo.' });

    // Jeśli to odpowiedź, sprawdź czy rodzic istnieje
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(404).json({ message: 'Nie znaleziono komentarza nadrzędnego.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        videoId,
        userId: req.user.userId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, handle: true, avatarUrl: true },
        },
        _count: { select: { likes: true, replies: true } },
      },
    });

    return res.status(201).json({ message: 'Komentarz dodany.', comment });
  } catch (error) {
    console.error('Błąd dodawania komentarza:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// DELETE /api/comments/:commentId
// Usuń komentarz (tylko autor)
// =====================
export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) return res.status(404).json({ message: 'Nie znaleziono komentarza.' });
    if (comment.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego komentarza.' });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ message: 'Komentarz usunięty.' });
  } catch (error) {
    console.error('Błąd usuwania komentarza:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};
