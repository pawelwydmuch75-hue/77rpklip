import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import videoRoutes from './routes/video.routes';
import commentRoutes from './routes/comment.routes';
import likeRoutes from './routes/like.routes';
import subscriptionRoutes from './routes/subscription.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pliki statyczne (lokalne uploady — dev)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Trasy API ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'YouTube Clone API działa poprawnie',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/videos',
      'POST /api/videos/upload',
      'GET  /api/videos/:id',
      'GET  /api/videos/stream/:id',
      'GET  /api/videos/channel/:userId',
      'PATCH/DELETE /api/videos/:id',
      'GET  /api/comments/:videoId',
      'POST /api/comments/:videoId',
      'DELETE /api/comments/:commentId',
      'POST /api/likes/video/:videoId',
      'POST /api/likes/comment/:commentId',
      'POST /api/subscriptions/:channelId',
      'GET  /api/subscriptions/status/:channelId',
      'GET  /api/subscriptions/feed',
      'GET  /api/subscriptions/my',
    ],
  });
});

// ─── 404 ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Nie znaleziono żądanego zasobu API' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🚀 Server YouTube Clone API działa na: http://0.0.0.0:${PORT}`);
  console.log(`📋 Wszystkie endpointy: http://localhost:${PORT}/api/health\n`);
  console.log(`🌐 Dostęp z sieci lokalnej: http://192.168.100.5:${PORT}\n`);
});
