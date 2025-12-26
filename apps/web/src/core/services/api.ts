import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * API Service - Singleton pattern for HTTP requests
 */
class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor - Add auth token
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('accessToken');
                    if (token && config.headers) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - Handle errors
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired - try to refresh
                    // TODO: Implement token refresh logic
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // GET request
    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    // POST request
    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    // PUT request
    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    // PATCH request
    async patch<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.patch<T>(url, data);
        return response.data;
    }

    // DELETE request
    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
        return response.data;
    }
}

// Export singleton instance
export const apiService = new ApiService();
