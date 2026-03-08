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
    getCalendar: (month, year) =>
        api.get('/core/dashboard/calendar', { params: { month, year } }),

    getSummary: () =>
        api.get('/core/dashboard/summary'),
};

// ========================================
// CheckIn Service
// ========================================
export const checkInService = {
    getStatus: () =>
        api.get('/core/checkin/status'),

    clock: (data) =>
        api.post('/core/checkin/clock', data),

    getHistory: (month, year) =>
        api.get('/core/checkin/history', { params: { month, year } }),
};

// ========================================
// Requests Service
// ========================================
export const requestsService = {
    getList: (params = {}) =>
        api.get('/core/requests', { params }),

    createLeave: (data) =>
        api.post('/core/requests/leave', data),

    createOT: (data) =>
        api.post('/core/requests/ot', data),

    createTimeCorrection: (data) =>
        api.post('/core/requests/time-correction', data),

    createShiftSwap: (data) =>
        api.post('/core/requests/shift-swap', data),

    cancel: (id, data) =>
        api.put(`/core/requests/${id}/cancel`, data),
};

// ========================================
// Profile Service
// ========================================
export const profileService = {
    getProfile: () =>
        api.get('/core/profile'),

    updateContact: (data) =>
        api.put('/core/profile/contact', data),

    changePassword: (data) =>
        api.put('/core/profile/password', data),
};

// ========================================
// Settings Service (Admin Only)
// ========================================
export const settingsService = {
    // Companies
    getCompanies: () => api.get('/core/settings/companies'),
    getCompany: (id) => api.get(`/core/settings/companies/${id}`),
    updateCompany: (id, data) => api.put(`/core/settings/companies/${id}`, data),

    // Branches
    getBranches: (companyId) => api.get('/core/settings/branches', { params: companyId ? { company_id: companyId } : {} }),
    updateBranch: (id, data) => api.put(`/core/settings/branches/${id}`, data),

    // Departments
    getDepartments: () => api.get('/core/settings/departments'),
    createDepartment: (data) => api.post('/core/settings/departments', data),
    updateDepartment: (id, data) => api.put(`/core/settings/departments/${id}`, data),
    deleteDepartment: (id) => api.delete(`/core/settings/departments/${id}`),

    // Roles
    getRoles: () => api.get('/core/settings/roles'),
    createRole: (data) => api.post('/core/settings/roles', data),
    updateRole: (id, data) => api.put(`/core/settings/roles/${id}`, data),
    deleteRole: (id) => api.delete(`/core/settings/roles/${id}`),

    // Levels
    getLevels: () => api.get('/core/settings/levels'),
    createLevel: (data) => api.post('/core/settings/levels', data),
    updateLevel: (id, data) => api.put(`/core/settings/levels/${id}`, data),
    deleteLevel: (id) => api.delete(`/core/settings/levels/${id}`),

    // System Config
    getSystemConfig: () => api.get('/core/settings/system-config'),
    updateSystemConfig: (items) => api.put('/core/settings/system-config', { items }),

    // Admin Users
    getAdminUsers: () => api.get('/core/settings/admin-users'),
    searchUsers: (search) => api.get('/core/settings/admin-users', { params: { search } }),
    toggleAdmin: (id, isAdmin) => api.put(`/core/settings/admin-users/${id}`, { is_admin: isAdmin }),

    // Permissions
    getPermissionMatrix: () => api.get('/core/settings/permissions/matrix'),
    savePermissionMatrix: (levelId, pageIds) => api.put('/core/settings/permissions/matrix', { level_id: levelId, page_ids: pageIds }),

    // App Structure
    getAppStructure: () => api.get('/core/settings/app-structure'),
    createAppStructure: (data) => api.post('/core/settings/app-structure', data),
    updateAppStructure: (id, data) => api.put(`/core/settings/app-structure/${id}`, data),
    deleteAppStructure: (id) => api.delete(`/core/settings/app-structure/${id}`),

    // App Actions
    getAppActions: (pageId) => api.get('/core/settings/app-actions', { params: pageId ? { page_id: pageId } : {} }),
    createAppAction: (data) => api.post('/core/settings/app-actions', data),
    updateAppAction: (id, data) => api.put(`/core/settings/app-actions/${id}`, data),
    deleteAppAction: (id) => api.delete(`/core/settings/app-actions/${id}`),
};

// ========================================
// HRM Service (HR Management)
// ========================================
export const hrmService = {
    // Employees
    getEmployees: (params = {}) => api.get('/hrm/employees', { params }),
    getEmployee: (id) => api.get(`/hrm/employees/${id}`),
    createEmployee: (data) => api.post('/hrm/employees', data),
    updateEmployee: (id, data) => api.put(`/hrm/employees/${id}`, data),

    // Employee Documents
    getDocuments: (empId) => api.get(`/hrm/employees/${empId}/documents`),
    uploadDocument: (empId, formData) => api.post(`/hrm/employees/${empId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteDocument: (empId, docId) => api.delete(`/hrm/employees/${empId}/documents/${docId}`),

    // Time Report
    getTimeCalendar: (params = {}) => api.get('/hrm/time-report/calendar', { params }),
    getTimeDailyBreakdown: (params = {}) => api.get('/hrm/time-report/daily', { params }),
    getTimeSummary: (params = {}) => api.get('/hrm/time-report/summary', { params }),
    upsertRemark: (data) => api.put('/hrm/time-report/remarks', data),

    // Schedules (Shifts)
    getShifts: (companyId) => api.get('/hrm/schedules/shifts', { params: companyId ? { company_id: companyId } : {} }),
    createShift: (data) => api.post('/hrm/schedules/shifts', data),
    updateShift: (id, data) => api.put(`/hrm/schedules/shifts/${id}`, data),
    getEmployeeShifts: (empId) => api.get('/hrm/schedules/employee', { params: { employee_id: empId } }),
    assignShift: (data) => api.post('/hrm/schedules/assign', data),
    bulkAssignShift: (data) => api.post('/hrm/schedules/bulk', data),

    // Holidays
    getHolidays: (params = {}) => api.get('/hrm/holidays', { params }),
    createHoliday: (data) => api.post('/hrm/holidays', data),
    updateHoliday: (id, data) => api.put(`/hrm/holidays/${id}`, data),
    deleteHoliday: (id) => api.delete(`/hrm/holidays/${id}`),

    // Personal Off Days
    getPersonalOffDays: (params = {}) => api.get('/hrm/personal-off-days', { params }),
    createPersonalOffDay: (data) => api.post('/hrm/personal-off-days', data),
    deletePersonalOffDay: (id) => api.delete(`/hrm/personal-off-days/${id}`),

    // Leave Types
    getLeaveTypes: () => api.get('/hrm/leave-types'),
    createLeaveType: (data) => api.post('/hrm/leave-types', data),
    updateLeaveType: (id, data) => api.put(`/hrm/leave-types/${id}`, data),
    deleteLeaveType: (id) => api.delete(`/hrm/leave-types/${id}`),

    // Leave Quotas
    getLeaveQuotas: (params = {}) => api.get('/hrm/leave-quotas', { params }),
    saveLeaveQuota: (data) => api.post('/hrm/leave-quotas', data),
    bulkSaveLeaveQuotas: (items) => api.post('/hrm/leave-quotas/bulk', { items }),

    // Approvals
    getApprovals: (params = {}) => api.get('/hrm/approvals', { params }),
    approveRequest: (id, type) => api.put(`/hrm/approvals/${id}/approve`, { type }),
    rejectRequest: (id, type, reason) => api.put(`/hrm/approvals/${id}/reject`, { type, reason }),
    forceLeave: (empId, data) => api.put(`/hrm/approvals/${empId}/force-leave`, data),

    // Reports
    getEmployeeReport: () => api.get('/hrm/reports/employees'),
    getOtReport: (params = {}) => api.get('/hrm/reports/ot', { params }),
    getLeaveReport: (params = {}) => api.get('/hrm/reports/leave', { params }),
    getAttendanceReport: (params = {}) => api.get('/hrm/reports/attendance', { params }),
};
