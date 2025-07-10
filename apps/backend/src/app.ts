import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import cookieParser from 'cookie-parser';

dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import profileRoutes from './routes/profile';
import feedRoutes from './routes/feed';
import reactionRoutes from './routes/reaction';
import noteRoutes from './routes/note';
import messageRoutes from './routes/message';
import bookmarkRoutes from './routes/bookmark';
import followRoutes from './routes/follow';
import jammingRoutes from './routes/jamming';
import roomRoutes from './routes/room';
import activityRoutes from './routes/activity';
import waitlistRoutes from './routes/waitlist';

// Import services
import { setupSocket } from './services/socket';
import { setupJammingSocket } from './services/jammingSocket';
import { updateAllUsersNowPlaying } from './services/nowPlayingUpdater';
import { CryptoUtils } from '@sonder/utils';
import { RoomManager } from './models/JammingRoom';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Initialize crypto utils
CryptoUtils.initialize(process.env.ENCRYPTION_KEY!);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!) || 1500, // 1500 requests per 15 minutes (much more reasonable for music app)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/profile', profileRoutes);
app.use('/feed', feedRoutes);
app.use('/reaction', reactionRoutes);
app.use('/note', noteRoutes);
app.use('/message', messageRoutes);
app.use('/bookmark', bookmarkRoutes);
app.use('/follow', followRoutes);
app.use('/jamming', jammingRoutes);
app.use('/rooms', roomRoutes);
app.use('/activity', activityRoutes);
app.use('/waitlist', waitlistRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Setup Socket.IO
// setupSocket(io);
setupJammingSocket(io);

// Background job: Update now playing every 2 minutes
// cron.schedule('*/2 * * * *', async () => {
//   console.log('🎵 Running background now-playing update...');
//   try {
//     await updateAllUsersNowPlaying();
//     console.log('✅ Background update completed');
//   } catch (error) {
//     console.error('❌ Background update failed:', error);
//   }
// });

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sonder.fm backend running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
});

export default app;
