import dotenv from 'dotenv';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './core/middleware/errorHandler';
import { authRoutes } from './features/auth/auth.routes';
import { userRoutes } from './features/users/users.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ======================
// GLOBAL MIDDLEWARE
// ======================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: {
            message: 'Demasiadas peticiones, intenta de nuevo más tarde',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Cookie parsing
app.use(cookieParser());

// ======================
// ROUTES
// ======================

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'API is running',
        version: API_VERSION,
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);

// ======================
// ERROR HANDLING
// ======================

// Global error handler (must be last)
app.use(errorHandler);

// 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Ruta no encontrada',
            code: 'NOT_FOUND',
        },
    });
});

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 API Version: ${API_VERSION}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
