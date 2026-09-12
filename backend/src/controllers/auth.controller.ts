import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, handle, bio, avatarUrl } = req.body;

    if (!email || !password || !username || !handle) {
      return res.status(400).json({
        message: 'Wszystkie wymagane pola (email, hasło, nazwa użytkownika, identyfikator handle) muszą być wypełnione.',
      });
    }

    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username },
          { handle: formattedHandle },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Użytkownik o podanym adresie email, nazwie lub identyfikatorze już istnieje.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        username,
        handle: formattedHandle,
        bio: bio || '',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
      select: {
        id: true,
        email: true,
        username: true,
        handle: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    const token = generateToken({ userId: newUser.id, email: newUser.email ?? '' });

    return res.status(201).json({
      message: 'Rejestracja zakończona sukcesem.',
      user: newUser,
      token,
    });
  } catch (error: any) {
    console.error('Błąd rejestracji:', error);
    return res.status(500).json({ message: 'Wystąpił błąd serwera podczas rejestracji.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body; // login to email lub handle

    if (!login || !password) {
      return res.status(400).json({ message: 'Proszę podać login (email/handle) i hasło.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login.toLowerCase() },
          { handle: login.startsWith('@') ? login : `@${login}` },
          { username: login },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
    }

    // Konta Discord nie mają hasła
    if (!user.password) {
      return res.status(401).json({ message: 'To konto używa logowania przez Discord. Użyj przycisku Discord.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
    }

    const token = generateToken({ userId: user.id, email: user.email ?? '' });

    const { password: _, ...userData } = user;

    return res.json({
      message: 'Zalogowano pomyślnie.',
      user: userData,
      token,
    });
  } catch (error: any) {
    console.error('Błąd logowania:', error);
    return res.status(500).json({ message: 'Wystąpił błąd serwera podczas logowania.' });
  }
};

// ===================================
// POST /api/auth/discord
// Logowanie przez Discord (OAuth2 + weryfikacja 77RP)
// ===================================
export const discordLogin = async (req: Request, res: Response) => {
  try {
    const { code, persona } = req.body;

    let discordId = '';
    let discordTag = '';
    let username = '';
    let avatarUrl = '';
    let inGuild = false;
    let hasWl = false;

    // 1. Jeśli przekazano personę testową (dla szybkiego testowania i weryfikacji)
    if (persona) {
      if (persona === 'wl-on') {
        discordId = 'discord_wl_on_7777';
        username = 'Gracz_77RP_WL';
        discordTag = 'Gracz_77RP_WL#7777';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=77rp_wlon';
        inGuild = true;
        hasWl = true;
      } else if (persona === 'wl-off') {
        discordId = 'discord_wl_off_1010';
        username = 'Gracz_77RP_OFF';
        discordTag = 'Gracz_77RP_OFF#1010';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=77rp_wloff';
        inGuild = true;
        hasWl = false;
      } else if (persona === 'no-guild') {
        discordId = 'discord_no_guild_0001';
        username = 'Uzytkownik_Bez_DC';
        discordTag = 'Uzytkownik_Bez_DC#0001';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=nodiscord';
        inGuild = false;
        hasWl = false;
      } else {
        return res.status(400).json({ message: 'Nieznana persona testowa Discord.' });
      }
    } else if (code) {
      // 2. Jeśli mamy prawdziwy kod OAuth Discorda
      try {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = req.body.redirectUri || process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/login';

        if (!clientId || !clientSecret) {
          return res.status(500).json({
            message: 'Brak konfiguracji DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET na serwerze.',
          });
        }

        const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
        });

        const tokenData: any = await tokenRes.json();
        if (!tokenData.access_token) {
          return res.status(400).json({ message: 'Błąd autoryzacji Discord (niepoprawny kod).' });
        }

        // Pobierz dane użytkownika
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const dUser: any = await userRes.json();

        discordId = dUser.id;
        username = dUser.username;
        discordTag = dUser.discriminator && dUser.discriminator !== '0'
          ? `${dUser.username}#${dUser.discriminator}`
          : dUser.username;
        avatarUrl = dUser.avatar
          ? `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png`
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${dUser.username}`;

        // Sprawdź obecność na serwerach 77RP i rolę WL
        const guildIdWlOn  = process.env.DISCORD_GUILD_ID_WLON;
        const guildIdWlOff = process.env.DISCORD_GUILD_ID_WLOFF;
        const wlRoleId     = process.env.DISCORD_WL_ROLE_ID;

        // Domyślnie brak dostępu
        inGuild = false;
        hasWl   = false;

        // 1. Sprawdź serwer WL:ON
        if (guildIdWlOn) {
          const memberRes = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildIdWlOn}/member`,
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          if (memberRes.ok) {
            const memberData: any = await memberRes.json();
            inGuild = true;
            // Sprawdź rolę WL
            if (wlRoleId && Array.isArray(memberData.roles)) {
              hasWl = memberData.roles.includes(wlRoleId);
            }
          }
        }

        // 2. Jeśli nie ma WL, sprawdź serwer WL:OFF (może tam być)
        if (!inGuild && guildIdWlOff) {
          const memberOffRes = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildIdWlOff}/member`,
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          if (memberOffRes.ok) {
            inGuild = true;
            hasWl   = false; // Serwer WL:OFF → brak WL
          }
        }

      } catch (oauthErr: any) {
        console.error('Błąd Discord OAuth:', oauthErr);
        return res.status(500).json({ message: 'Błąd komunikacji z API Discord.' });
      }
    } else {
      return res.status(400).json({ message: 'Wymagany kod autoryzacji lub persona Discord.' });
    }

    // Znajdź lub utwórz użytkownika
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { discordId },
          { username },
        ],
      },
    });

    const baseHandle = `@${username.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'}`;
    let handle = baseHandle;
    const existingHandle = await prisma.user.findFirst({ where: { handle } });
    if (existingHandle && existingHandle.id !== user?.id) {
      handle = `${baseHandle}_${discordId.slice(-4)}`;
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          handle,
          discordId,
          discordTag,
          avatarUrl,
          inGuild,
          hasWl,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discordId,
          discordTag,
          avatarUrl: avatarUrl || user.avatarUrl,
          inGuild,
          hasWl,
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email || `${username}@discord.77rp`,
    });

    const { password: _, ...userData } = user;

    return res.json({
      message: 'Zalogowano pomyślnie przez Discord.',
      user: userData,
      token,
    });
  } catch (error: any) {
    console.error('Błąd logowania Discord:', error);
    return res.status(500).json({ message: 'Wystąpił błąd serwera podczas logowania przez Discord.' });
  }
};

// ===================================
// GET /api/auth/discord/url
// Zwraca URL do autoryzacji Discord
// ===================================
export const getDiscordAuthUrl = async (req: Request, res: Response) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientRedirect = req.query.redirect_uri as string | undefined;
  const redirectUri = clientRedirect || process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/login';

  if (!clientId) {
    return res.json({ url: null, configured: false });
  }

  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=identify%20guilds%20guilds.members.read`;

  return res.json({ url, configured: true });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Brak autoryzacji.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        handle: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        discordId: true,
        discordTag: true,
        inGuild: true,
        hasWl: true,
        createdAt: true,
        _count: {
          select: {
            subscribers: true,
            subscriptions: true,
            videos: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony.' });
    }

    return res.json({ user });
  } catch (error: any) {
    console.error('Błąd pobierania profilu:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas pobierania danych profilu.' });
  }
};
