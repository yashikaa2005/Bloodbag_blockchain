import express from 'express';
import {
  getAllUsers,
  getOrganizations,
  assignUserRole,
} from '../controllers/userController.js';
import { authenticateUser, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get organizations for transfers (open to all authenticated users)
router.get('/organizations', authenticateUser, getOrganizations);

// Admin-only management routes
router.get('/', authenticateUser, authorizeRole('ADMIN'), getAllUsers);
router.post('/assign-role', authenticateUser, authorizeRole('ADMIN'), assignUserRole);

export default router;
