import { Response, Request } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyToken } from '../utils/jwt';
import path from 'path';
import fs from 'fs';

// Buduje publiczny URL do pliku w /uploads
const buildFileUrl = (req: Request, relativePath: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${relativePath}`;
};

// =====================
// POST /api/videos/upload
// Dodanie nowego wideo
// =====================
export const uploadVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files['video'] || files['video'].length === 0) {
      return res.status(400).json({ message: 'Brak pliku wideo. Pole "video" jest wymagane.' });
    }

    const videoFile = files['video'][0];
    const thumbnailFile = files['thumbnail'] ? files['thumbnail'][0] : null;

    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      // Usuń przesłane pliki jeśli brak tytułu
      fs.unlinkSync(videoFile.path);
      if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);
      return res.status(400).json({ message: 'Tytuł wideo jest wymagany.' });
    }

    const videoUrl = buildFileUrl(req, `videos/${videoFile.filename}`);
    const thumbnailUrl = thumbnailFile
      ? buildFileUrl(req, `thumbnails/${thumbnailFile.filename}`)
      : `https://picsum.photos/seed/${Date.now()}/1280/720`;

    // serverTag: 'wl-off' | 'wl-on' | null
    const serverTagRaw = (req.body.serverTag as string | undefined) || null;
    const serverTag = (serverTagRaw === 'wl-off' || serverTagRaw === 'wl-on') ? serverTagRaw : 'wl-off';

    // Weryfikacja uprawnień Discord i Whitelist
    const userAuth = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { inGuild: true, hasWl: true },
    });

    if (!userAuth || !userAuth.inGuild) {
      if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
      if (thumbnailFile && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
      return res.status(403).json({
        message: 'Musisz być członkiem oficjalnego Discorda 77RP, aby publikować materiały.',
      });
    }

    if (serverTag === 'wl-on' && !userAuth.hasWl) {
      if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
      if (thumbnailFile && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
      return res.status(403).json({
        message: 'Publikowanie filmów na serwerze WL:ON wymaga rangi Whitelist na serwerze 77RP. Jako gracz WL:OFF możesz opublikować swój klip z oznaczeniem WL:OFF.',
      });
    }

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        videoUrl,
        thumbnailUrl,
        duration: 0, // Zostanie zaktualizowane gdy będziemy mieć ffprobe
        status: 'PUBLISHED',
        userId: req.user.userId,
        serverTag,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            handle: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Film przesłany pomyślnie.',
      video,
    });
  } catch (error: any) {
    console.error('Błąd uploadu wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas przesyłania wideo.' });
  }
};

// =====================
// GET /api/videos
// Lista filmów (feed)
// =====================
export const getVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as string) || 'latest'; // latest | popular
    const search = (req.query.search as string) || '';
    const serverTag = (req.query.serverTag as string) || null;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      ...(search ? { title: { contains: search } } : {}),
      ...(serverTag ? { serverTag } : {}),
    };

    let orderBy: any = { createdAt: 'desc' as const };
    if (sort === 'popular') {
      orderBy = { viewsCount: 'desc' as const };
    } else if (sort === 'top_rated') {
      orderBy = { likes: { _count: 'desc' as const } };
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              handle: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return res.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error: any) {
    console.error('Błąd pobierania listy wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas pobierania filmów.' });
  }
};

// =====================
// GET /api/videos/:id
// Pojedyncze wideo (strona odtwarzania)
// =====================
export const getVideoById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            handle: true,
            avatarUrl: true,
            _count: { select: { subscribers: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!video) {
      return res.status(404).json({ message: 'Nie znaleziono wideo.' });
    }

    if (video.status !== 'PUBLISHED') {
      // Tylko autor może oglądać niepubliczne filmy
      if (!req.user || req.user.userId !== video.userId) {
        return res.status(403).json({ message: 'Ten film jest prywatny.' });
      }
    }

    // Zwiększ licznik wyświetleń i dodaj zapis w VideoView
    await prisma.video.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    await prisma.videoView.create({
      data: {
        videoId: id,
        userId: req.user?.userId || null,
      },
    });

    // Policz likes/dislikes osobno
    const likesCount = await prisma.like.count({ where: { videoId: id, isDislike: false } });
    const dislikesCount = await prisma.like.count({ where: { videoId: id, isDislike: true } });

    // Czy zalogowany user dał like/dislike
    let userLike = null;
    if (req.user) {
      userLike = await prisma.like.findUnique({
        where: { userId_videoId: { userId: req.user.userId, videoId: id } },
      });
    }

    return res.json({
      video: {
        ...video,
        viewsCount: video.viewsCount + 1,
        likesCount,
        dislikesCount,
        userLike: userLike ? (userLike.isDislike ? 'dislike' : 'like') : null,
      },
    });
  } catch (error: any) {
    console.error('Błąd pobierania wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas pobierania wideo.' });
  }
};

// =====================
// PATCH /api/videos/:id
// Aktualizacja metadanych wideo
// =====================
export const updateVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });
    const { id } = req.params;
    const { title, description, status } = req.body;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ message: 'Nie znaleziono wideo.' });
    if (video.userId !== req.user.userId) return res.status(403).json({ message: 'Brak uprawnień do edycji tego wideo.' });

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
      },
    });

    return res.json({ message: 'Wideo zaktualizowane.', video: updatedVideo });
  } catch (error: any) {
    console.error('Błąd aktualizacji wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// DELETE /api/videos/:id
// Usuwanie wideo
// =====================
export const deleteVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ message: 'Nie znaleziono wideo.' });
    if (video.userId !== req.user.userId) return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego wideo.' });

    // Usuń plik z dysku (jeśli to lokalny upload)
    const uploadsBase = path.join(__dirname, '../../uploads');
    const tryDeleteFile = (url: string) => {
      try {
        if (url.includes('/uploads/')) {
          const relativePath = url.split('/uploads/')[1];
          const fullPath = path.join(uploadsBase, relativePath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
      } catch {}
    };

    tryDeleteFile(video.videoUrl);
    tryDeleteFile(video.thumbnailUrl);

    await prisma.video.delete({ where: { id } });

    return res.json({ message: 'Wideo zostało usunięte.' });
  } catch (error: any) {
    console.error('Błąd usuwania wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// GET /api/videos/channel/:userId
// Wideo z konkretnego kanału
// =====================
export const getVideosByChannel = async (req: Request, res: Response) => {
  try {
    let { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    if (userId === 'me') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      if (token) {
        try {
          const decoded = verifyToken(token);
          userId = decoded.userId;
        } catch {
          return res.status(401).json({ message: 'Brak autoryzacji lub nieprawidłowy token.' });
        }
      } else {
        return res.status(401).json({ message: 'Zaloguj się, aby wyświetlić swój kanał.' });
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { handle: userId },
          { handle: `@${userId}` },
          { username: userId },
        ],
      },
      select: {
        id: true, username: true, handle: true,
        avatarUrl: true, bannerUrl: true, bio: true,
        _count: { select: { subscribers: true, videos: true } },
      },
    });

    if (!user) return res.status(404).json({ message: 'Nie znaleziono kanału.' });

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { userId: user.id, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.video.count({ where: { userId: user.id, status: 'PUBLISHED' } }),
    ]);

    return res.json({
      channel: user,
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Błąd pobierania kanału:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// GET /api/videos/stream/:id
// Strumieniowanie wideo z obsługą Range requests
// =====================
export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ message: 'Nie znaleziono wideo.' });

    // Jeśli wideo jest na zewnętrznym URL - przekieruj
    if (!video.videoUrl.includes('/uploads/')) {
      return res.redirect(video.videoUrl);
    }

    const uploadsBase = path.join(__dirname, '../../uploads');
    const relativePath = video.videoUrl.split('/uploads/')[1];
    const filePath = path.join(uploadsBase, relativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Plik wideo nie istnieje na serwerze.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Obsługa Range Request (streaming)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      fileStream.pipe(res);
    } else {
      // Pełne wideo bez range
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error: any) {
    console.error('Błąd strumieniowania wideo:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas strumieniowania.' });
  }
};
