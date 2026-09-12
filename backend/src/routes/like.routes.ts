import { Router } from 'express';
import { toggleVideoLike, toggleCommentLike } from '../controllers/like.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/video/:videoId', authenticateToken, toggleVideoLike);
router.post('/comment/:commentId', authenticateToken, toggleCommentLike);

export default router;
