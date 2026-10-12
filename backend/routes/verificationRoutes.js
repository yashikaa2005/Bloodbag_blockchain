import express from 'express';
import { verifyBloodBag } from '../controllers/verificationController.js';

const router = express.Router();

// Public verification route - no JWT required
router.get('/:bagId', verifyBloodBag);

export default router;
