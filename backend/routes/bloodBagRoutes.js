import express from 'express';
import {
  registerBloodBag,
  getBloodBags,
  getBloodBagById,
  getBloodBagHistory,
  startTesting,
  approveBloodBag,
  rejectBloodBag,
  transferBloodBag,
  receiveBloodBag,
  consumeBloodBag,
  expireBloodBag,
} from '../controllers/bloodBagController.js';
import { authenticateUser, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Public / All Authenticated Read Endpoints
router.get('/', authenticateUser, getBloodBags);
router.get('/:bagId', authenticateUser, getBloodBagById);
router.get('/:bagId/history', authenticateUser, getBloodBagHistory);

// Blood Bank Registration
router.post('/register', authenticateUser, authorizeRole('BLOOD_BANK'), registerBloodBag);

// Lab Workflow
router.post('/:bagId/testing', authenticateUser, authorizeRole('LAB'), startTesting);
router.post('/:bagId/approve', authenticateUser, authorizeRole('LAB'), approveBloodBag);
router.post('/:bagId/reject', authenticateUser, authorizeRole('LAB'), rejectBloodBag);

// Transfer Workflow
router.post('/:bagId/transfer', authenticateUser, authorizeRole('BLOOD_BANK', 'HOSPITAL'), transferBloodBag);

// Hospital Workflow
router.post('/:bagId/receive', authenticateUser, authorizeRole('HOSPITAL'), receiveBloodBag);
router.post('/:bagId/consume', authenticateUser, authorizeRole('HOSPITAL'), consumeBloodBag);

// Expiry
router.post('/:bagId/expire', authenticateUser, expireBloodBag);

export default router;
