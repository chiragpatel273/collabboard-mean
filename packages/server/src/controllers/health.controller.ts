import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/config';
import { asyncHandler } from '../middleware/error.middleware';

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.version,
    services: {
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  };

  res.json({ message: 'Health check successful', ...healthStatus });
});

export const readinessCheck = asyncHandler(async (req: Request, res: Response) => {
  // Check if all critical services are ready
  const isDbReady = mongoose.connection.readyState === 1;

  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      message: 'Service not ready - Database disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    message: 'Service is ready',
    status: 'Ready',
    timestamp: new Date().toISOString(),
  });
});
