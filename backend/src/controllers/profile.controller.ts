import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

// =====================
// PATCH /api/auth/profile
// Aktualizacja danych profilu
// =====================
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const { username, bio, handle } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const avatarFile = files?.['avatar']?.[0];
    const bannerFile = files?.['banner']?.[0];

    const protocol = req.protocol;
    const host = req.get('host');

    const data: Record<string, string> = {};
    if (username?.trim()) data.username = username.trim();
    if (bio !== undefined) data.bio = bio.trim();
    if (handle?.trim()) {
      const formatted = handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`;
      // Sprawdź unikalność handle
      const existing = await prisma.user.findFirst({
        where: { handle: formatted, NOT: { id: req.user.userId } },
      });
      if (existing) return res.status(409).json({ message: 'Ten identyfikator jest już zajęty.' });
      data.handle = formatted;
    }

    if (avatarFile) {
      data.avatarUrl = `${protocol}://${host}/uploads/avatars/${avatarFile.filename}`;
    }
    if (bannerFile) {
      data.bannerUrl = `${protocol}://${host}/uploads/banners/${bannerFile.filename}`;
    } else if (req.body.bannerGradient) {
      // Gradient jako bannerUrl (nie plik — tylko CSS string)
      data.bannerUrl = req.body.bannerGradient;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true, email: true, username: true, handle: true,
        avatarUrl: true, bannerUrl: true, bio: true, createdAt: true,
        _count: { select: { subscribers: true, videos: true } },
      },
    });

    return res.json({ message: 'Profil zaktualizowany.', user: updated });
  } catch (error: any) {
    console.error('Błąd aktualizacji profilu:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// DELETE /api/auth/avatar
// Usuń awatar (przywróć domyślny)
// =====================
export const removeAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });

    // Usuń stary plik awatara z dysku
    if (user.avatarUrl?.includes('/uploads/avatars/')) {
      try {
        const uploadsBase = path.join(__dirname, '../../uploads');
        const relativePath = user.avatarUrl.split('/uploads/')[1];
        const fullPath = path.join(uploadsBase, relativePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch {}
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}` },
      select: { id: true, avatarUrl: true },
    });

    return res.json({ message: 'Awatar usunięty.', avatarUrl: updated.avatarUrl });
  } catch (error) {
    console.error('Błąd usuwania awatara:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};

// =====================
// DELETE /api/auth/banner
// Usuń baner kanału
// =====================
export const removeBanner = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });

    if (user.bannerUrl?.includes('/uploads/banners/')) {
      try {
        const uploadsBase = path.join(__dirname, '../../uploads');
        const relativePath = user.bannerUrl.split('/uploads/')[1];
        const fullPath = path.join(uploadsBase, relativePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch {}
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { bannerUrl: null },
    });

    return res.json({ message: 'Baner usunięty.' });
  } catch (error) {
    console.error('Błąd usuwania banera:', error);
    return res.status(500).json({ message: 'Błąd serwera.' });
  }
};
