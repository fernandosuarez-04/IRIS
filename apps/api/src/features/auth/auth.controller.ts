import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../core/middleware/errorHandler';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */
export class AuthController {
    /**
     * POST /auth/login
     */
    login = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(req.body);

        res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * POST /auth/register
     */
    register = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);

        res.status(201).json({
            success: true,
            data: result,
        });
    });

    /**
     * POST /auth/refresh
     */
    refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);

        res.status(200).json({
            success: true,
            data: result,
        });
    });

    /**
     * POST /auth/logout
     */
    logout = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id || 'unknown';
        await authService.logout(userId);

        res.status(200).json({
            success: true,
            message: 'Sesión cerrada correctamente',
        });
    });

    /**
     * GET /auth/me
     */
    getMe = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;

        res.status(200).json({
            success: true,
            data: user,
        });
    });
}

// Export singleton instance
export const authController = new AuthController();
