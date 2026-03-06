import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [menuTree, setMenuTree] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // ตรวจสอบ session เมื่อเปิดแอป
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await authService.getMe();
            if (res.data?.status === 'success') {
                const data = res.data.data;
                // /auth/me ส่งกลับ { user, menu_tree, permissions }
                if (data.user) {
                    setUser(data.user);
                    setMenuTree(data.menu_tree || []);
                    setPermissions(data.permissions || []);
                } else {
                    // fallback กรณี response format เดิม
                    setUser(data);
                }
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = useCallback(async (username, password) => {
        const res = await authService.login(username, password);
        if (res.data?.status === 'success') {
            setUser(res.data.data.user);
            setMenuTree(res.data.data.menu_tree || []);
            setPermissions(res.data.data.permissions || []);
            return { success: true };
        }
        return { success: false, message: res.data?.message };
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch { /* ignore */ }
        setUser(null);
        setMenuTree([]);
        setPermissions([]);
    }, []);

    // ตรวจสิทธิ์ Action
    const hasPermission = useCallback((actionCode) => {
        return permissions.some(p => p.action_code === actionCode);
    }, [permissions]);

    // ตรวจสิทธิ์ Page (slug)
    const hasPage = useCallback((slug) => {
        return menuTree.some(m => m.slug === slug);
    }, [menuTree]);

    const value = {
        user,
        menuTree,
        permissions,
        loading,
        login,
        logout,
        hasPermission,
        hasPage,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
