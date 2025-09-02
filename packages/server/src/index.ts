import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import { config, configService } from './config/config';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';
import { cleanupService } from './services/cleanup.service';
// import { apiLimiter } from "./middleware/security.middleware";

// Routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import healthRoutes from './routes/health.routes';

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middlewares
// app.use(apiLimiter);

// Basic middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(morgan(configService.isDevelopment() ? 'dev' : 'combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', healthRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({
    message: 'CollabBoard API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  cleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  cleanupService.stop();
  process.exit(0);
});

// Connect DB and Start Server
connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`✅ Server running at http://localhost:${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);

    // Start automatic token cleanup service
    cleanupService.start();
  });
});
