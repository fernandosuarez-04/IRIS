import { User, UpdateUserInput } from './users.types';
import { createError } from '../../core/middleware/errorHandler';

/**
 * Users Service
 * Handles business logic for user management
 */
export class UsersService {
    // Mock users database
    private users: User[] = [
        {
            id: '1',
            email: 'demo@iris.com',
            name: 'Usuario Demo',
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: '2',
            email: 'admin@iris.com',
            name: 'Administrador',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    /**
     * Get all users
     */
    async getAll(): Promise<User[]> {
        // TODO: Replace with actual database query
        return this.users;
    }

    /**
     * Get user by ID
     */
    async getById(id: string): Promise<User> {
        const user = this.users.find(u => u.id === id);

        if (!user) {
            throw createError(
                'Usuario no encontrado',
                404,
                'NOT_FOUND'
            );
        }

        return user;
    }

    /**
     * Update user by ID
     */
    async update(id: string, data: UpdateUserInput): Promise<User> {
        const userIndex = this.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw createError(
                'Usuario no encontrado',
                404,
                'NOT_FOUND'
            );
        }

        // Update user
        this.users[userIndex] = {
            ...this.users[userIndex],
            ...data,
            updatedAt: new Date(),
        };

        return this.users[userIndex];
    }

    /**
     * Delete user by ID
     */
    async delete(id: string): Promise<void> {
        const userIndex = this.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw createError(
                'Usuario no encontrado',
                404,
                'NOT_FOUND'
            );
        }

        this.users.splice(userIndex, 1);
    }
}

// Export singleton instance
export const usersService = new UsersService();
