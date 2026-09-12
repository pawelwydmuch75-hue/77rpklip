import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// =====================
// POST /api/likes/video/:videoId
// Toggle like/dislike na wideo
// =====================
export const toggleVideoLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { videoId } = req.params;
    const { isDislike } = req.body; // true = dislike, false/undefined = like

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Nie znaleziono wideo.' });

    const existingLike = await prisma.like.findUnique({
      where: { userId_videoId: { userId: req.user.userId, videoId } },
    });

    if (existingLike) {
      if (existingLike.isDislike === Boolean(isDislike)) {
        // Kliknął to samo co poprzednio — cofnij (toggle off)
        await prisma.like.delete({ where: { id: existingLike.id } });

        const counts = await getLikeCounts(videoId);
        return res.json({ message: 'Ocena cofnięta.', action: 'removed', ...counts });
      } else {
        // Zmiana z like na dislike lub odwrotnie
        const updated = await prisma.like.update({
          where: { id: existingLike.id },
          data: { isDislike: Boolean(isDislike) },
        });

        const counts = await getLikeCounts(videoId);
        return res.json({
          message: isDislike ? 'Zmieniono na nie lubię.' : 'Zmieniono na lubię.',
          action: isDislike ? 'disliked' : 'liked',
          ...counts,
        });
      }
    }

    // Nowa ocena
    await prisma.like.create({
      data: {
        userId: req.user.userId,
        videoId,
        isDislike: Boolean(isDislike),
      },
    });

    const counts = await getLikeCounts(videoId);
    return res.status(201).json({
      message: isDislike ? 'Nie lubię dodane.' : 'Lubię dodane.',
      action: isDislike ? 'disliked' : 'liked',
      ...counts,
    });
  } catch (error) {
    console.error('Błąd oceniania wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// POST /api/likes/comment/:commentId
// Toggle like na komentarz
// =====================
export const toggleCommentLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: 'Nie znaleziono komentarza.' });

    const existingLike = await prisma.like.findUnique({
      where: { userId_commentId: { userId: req.user.userId, commentId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      const likesCount = await prisma.like.count({ where: { commentId, isDislike: false } });
      return res.json({ message: 'Cofnięto polubienie komentarza.', action: 'removed', likesCount });
    }

    await prisma.like.create({
      data: { userId: req.user.userId, commentId, isDislike: false },
    });

    const likesCount = await prisma.like.count({ where: { commentId, isDislike: false } });
    return res.status(201).json({ message: 'Polubiono komentarz.', action: 'liked', likesCount });
  } catch (error) {
    console.error('Błąd oceniania komentarza:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// Helper: zlicz likes i dislikes dla wideo
const getLikeCounts = async (videoId: string) => {
  const [likesCount, dislikesCount] = await Promise.all([
    prisma.like.count({ where: { videoId, isDislike: false } }),
    prisma.like.count({ where: { videoId, isDislike: true } }),
  ]);
  return { likesCount, dislikesCount };
};
