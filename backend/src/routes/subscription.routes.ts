import { Router } from 'express';
import {
  toggleSubscription,
  getSubscriptionStatus,
  getSubscriptionFeed,
  getMySubscriptions,
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/:channelId', authenticateToken, toggleSubscription);
router.get('/status/:channelId', authenticateToken, getSubscriptionStatus);
router.get('/feed', authenticateToken, getSubscriptionFeed);
router.get('/my', authenticateToken, getMySubscriptions);

export default router;
