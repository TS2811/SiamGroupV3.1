import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    InputAdornment, IconButton, Alert, CircularProgress, Stack
} from '@mui/material';
import { Visibility, VisibilityOff, LoginRounded } from '@mui/icons-material';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password.trim()) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #42A5F5 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <Box sx={{
                position: 'absolute', top: -100, right: -100,
                width: 400, height: 400, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
            }} />
            <Box sx={{
                position: 'absolute', bottom: -150, left: -150,
                width: 500, height: 500, borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
            }} />

            <Card
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    mx: 2,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                }}
                elevation={24}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Logo / Title */}
                    <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
                        <Box
                            sx={{
                                width: 64, height: 64, borderRadius: 3,
                                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
                                mb: 1,
                            }}
                        >
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>SG</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                            SiamGroup V3.1
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            เข้าสู่ระบบเพื่อจัดการธุรกิจของคุณ
                        </Typography>
                    </Stack>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="ชื่อผู้ใช้"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                fullWidth
                                autoFocus
                                autoComplete="username"
                                disabled={loading}
                            />
                            <TextField
                                label="รหัสผ่าน"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                autoComplete="current-password"
                                disabled={loading}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginRounded />}
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1976D2, #1565C0)',
                                    },
                                }}
                            >
                                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                            </Button>
                        </Stack>
                    </form>

                    {/* Footer */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
                        © 2026 SiamGroup — All rights reserved
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
