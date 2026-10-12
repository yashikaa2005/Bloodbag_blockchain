import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    message: 'BloodChain REST API is operational',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: dbStatus,
      blockchain: 'ready',
    },
    version: '1.0.0',
  });
});

export default router;
