import { Router } from 'express';
import {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideosByChannel,
  streamVideo,
} from '../controllers/video.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadVideoWithThumbnail } from '../middleware/upload.middleware';

const router = Router();

// Publiczne trasy
router.get('/', getVideos);
router.get('/channel/:userId', getVideosByChannel);
router.get('/stream/:id', streamVideo);
router.get('/:id', getVideoById);

// Chronione trasy (wymagają JWT)
router.post('/upload', authenticateToken, uploadVideoWithThumbnail, uploadVideo);
router.patch('/:id', authenticateToken, updateVideo);
router.delete('/:id', authenticateToken, deleteVideo);

export default router;
