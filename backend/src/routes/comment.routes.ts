import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/:videoId', getComments);
router.post('/:videoId', authenticateToken, addComment);
router.delete('/:commentId', authenticateToken, deleteComment);

export default router;
