import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

// HTTP Status codes
const HTTP_STATUS = {
    UNAUTHORIZED: 401,
};

// Error codes
const ERROR_CODES = {
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
};

/**
 * Authentication middleware
 * Verifies JWT token in Authorization header
 */
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        throw createError(
            'Token no proporcionado',
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.AUTHENTICATION_ERROR
        );
    }

    try {
        // TODO: Implement JWT verification with your secret
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;

        // For now, just pass through (implement proper JWT verification)
        next();
    } catch {
        throw createError(
            'Token inválido o expirado',
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.AUTHENTICATION_ERROR
        );
    }
};

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            throw createError(
                'Usuario no autenticado',
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.AUTHENTICATION_ERROR
            );
        }

        if (!allowedRoles.includes(user.role)) {
            throw createError(
                'No tienes permisos para acceder a este recurso',
                403,
                'FORBIDDEN'
            );
        }

        next();
    };
};
