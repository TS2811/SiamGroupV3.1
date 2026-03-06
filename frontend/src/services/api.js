import axios from 'axios';

const API_KEY = 'sg_v3_api_key_2026_secure';

const api = axios.create({
    baseURL: '/v3_1/backend/api',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
    },
    withCredentials: true, // ส่ง cookies ทุก request
});

// ========================================
// Response Interceptor — Auto Refresh Token
// ========================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // ถ้าได้ 401 + ยังไม่ได้ retry + ไม่ใช่ auth routes
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/refresh') &&
            !originalRequest.url.includes('/auth/me')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/core/auth/refresh');
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Redirect to login
                window.location.href = '/v3_1/frontend/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// ========================================
// Auth Service
// ========================================
export const authService = {
    login: (username, password) =>
        api.post('/core/auth/login', { username, password }),

    logout: () =>
        api.post('/core/auth/logout'),

    refresh: () =>
        api.post('/core/auth/refresh'),

    getMe: () =>
        api.get('/core/auth/me'),
};

// ========================================
// Dashboard Service
// ========================================
export const dashboardService = {
    getData: () =>
        api.get('/core/dashboard'),
};
