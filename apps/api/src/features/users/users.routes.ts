import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../core/middleware/validation.middleware';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';
import { updateUserSchema, getUserSchema } from './users.types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), usersController.getAll);

// Get user by ID
router.get('/:id', validate(getUserSchema), usersController.getById);

// Update user
router.patch('/:id', validate(updateUserSchema), usersController.update);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), validate(getUserSchema), usersController.delete);

export { router as userRoutes };
