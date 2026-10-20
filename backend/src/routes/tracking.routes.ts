import { Router } from 'express';
import { trackClick, getCtaMetrics, getClickEvents } from '../controllers/tracking.controller';

const router = Router();

// Endpoint utama tracking: POST /api/track/click
router.post('/click', trackClick);

// Monitoring / verification endpoints
router.get('/metrics', getCtaMetrics);
router.get('/events', getClickEvents);

export default router;
