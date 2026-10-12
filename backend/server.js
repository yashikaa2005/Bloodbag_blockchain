import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bloodBagRoutes from './routes/bloodBagRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { syncDefaultRoles } from './services/blockchain.js';

// Connect to MongoDB and sync roles
connectDB().then(() => {
  syncDefaultRoles();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blood-bags', bloodBagRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/stats', statsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    project: 'BloodChain',
    description: 'Blockchain-Based Blood Bag Traceability and Verification System',
    apiDocs: '/api/health',
    status: 'online',
  });
});

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[BloodChain Server] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[BloodChain Server] Health Check: http://localhost:${PORT}/api/health`);
});

export default app;
