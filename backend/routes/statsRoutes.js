import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getDashboardStats);

export default router;
