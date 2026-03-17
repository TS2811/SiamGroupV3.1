import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// --- CSS Keyframes as string for injection ---
const animationStyles = `
@keyframes driveAcross {
  0% { transform: translateX(-120px); }
  100% { transform: translateX(calc(100vw + 120px)); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-18px); }
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(5deg); }
  50% { transform: translateY(-8px) rotate(-3deg); }
  75% { transform: translateY(-22px) rotate(4deg); }
}
@keyframes floatSlow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(-6deg); }
}
@keyframes wobble {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse404 {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.03); }
}
@keyframes roadMove {
  0% { background-position: 0 0; }
  100% { background-position: -200px 0; }
}
@keyframes wheelSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
`;

// --- SVG Components ---
const DeliveryTruck = ({ style }) => (
    <svg viewBox="0 0 120 60" style={{ width: 120, height: 60, ...style }}>
        {/* Truck body */}
        <rect x="30" y="10" width="50" height="30" rx="4" fill="#3b82f6" />
        <rect x="35" y="15" width="18" height="12" rx="2" fill="#93c5fd" opacity="0.8" />
        {/* Cargo area */}
        <rect x="65" y="5" width="40" height="35" rx="3" fill="#f59e0b" />
        <rect x="70" y="10" width="30" height="25" rx="2" fill="#fbbf24" />
        {/* Parcel inside */}
        <rect x="76" y="16" width="14" height="12" rx="1" fill="#92400e" opacity="0.6" />
        <line x1="83" y1="16" x2="83" y2="28" stroke="#fff" strokeWidth="1" />
        <line x1="76" y1="22" x2="90" y2="22" stroke="#fff" strokeWidth="1" />
        {/* Wheels */}
        <g>
            <circle cx="45" cy="42" r="8" fill="#374151" />
            <circle cx="45" cy="42" r="4" fill="#6b7280" />
            <circle cx="45" cy="42" r="1.5" fill="#9ca3af" style={{ animation: 'wheelSpin 0.5s linear infinite' }} />
        </g>
        <g>
            <circle cx="90" cy="42" r="8" fill="#374151" />
            <circle cx="90" cy="42" r="4" fill="#6b7280" />
            <circle cx="90" cy="42" r="1.5" fill="#9ca3af" style={{ animation: 'wheelSpin 0.5s linear infinite' }} />
        </g>
        {/* Exhaust */}
        <circle cx="22" cy="38" r="3" fill="#d1d5db" opacity="0.4">
            <animate attributeName="r" values="3;6;3" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="36" r="2" fill="#d1d5db" opacity="0.3">
            <animate attributeName="r" values="2;5;2" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1s" repeatCount="indefinite" />
        </circle>
    </svg>
);

const FloatingParcel = ({ size = 50, delay = 0, left, top, color = '#f59e0b' }) => (
    <svg viewBox="0 0 50 50" style={{
        width: size, height: size, position: 'absolute', left, top,
        animation: `float 4s ease-in-out ${delay}s infinite`,
        opacity: 0.6,
    }}>
        <rect x="5" y="8" width="40" height="35" rx="4" fill={color} />
        <rect x="8" y="11" width="34" height="29" rx="2" fill={color} opacity="0.8" />
        <line x1="25" y1="8" x2="25" y2="43" stroke="#fff" strokeWidth="2" />
        <line x1="5" y1="25" x2="45" y2="25" stroke="#fff" strokeWidth="2" />
        {/* Tape */}
        <rect x="18" y="20" width="14" height="10" rx="1" fill="#92400e" opacity="0.3" />
    </svg>
);

const BouncingCar = ({ style }) => (
    <svg viewBox="0 0 90 45" style={{ width: 90, height: 45, ...style }}>
        {/* Car body */}
        <path d="M15 28 L20 15 Q22 12 25 12 L55 12 Q58 12 60 15 L68 28 Z" fill="#ef4444" />
        {/* Roof */}
        <path d="M28 12 L32 4 Q33 2 35 2 L50 2 Q52 2 53 4 L57 12 Z" fill="#dc2626" />
        {/* Windows */}
        <path d="M30 12 L33 5 L42 5 L42 12 Z" fill="#bfdbfe" opacity="0.8" />
        <path d="M44 12 L44 5 L52 5 L55 12 Z" fill="#bfdbfe" opacity="0.8" />
        {/* Body lower */}
        <rect x="10" y="28" width="65" height="6" rx="2" fill="#b91c1c" />
        {/* Headlights */}
        <rect x="66" y="24" width="5" height="4" rx="1" fill="#fde047" />
        <rect x="12" y="24" width="5" height="4" rx="1" fill="#fca5a5" />
        {/* Wheels */}
        <circle cx="25" cy="36" r="7" fill="#1f2937" />
        <circle cx="25" cy="36" r="3.5" fill="#4b5563" />
        <circle cx="60" cy="36" r="7" fill="#1f2937" />
        <circle cx="60" cy="36" r="3.5" fill="#4b5563" />
    </svg>
);

const Sparkle = ({ left, top, delay = 0, size = 8 }) => (
    <Box sx={{
        position: 'absolute', left, top, width: size, height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
        animation: `sparkle 2s ease-in-out ${delay}s infinite`,
    }} />
);

export default function ErrorPage({ statusCode }) {
    const navigate = useNavigate();
    let error = null;
    try { error = useRouteError(); } catch (e) { /* not in errorElement context */ }
    const status = statusCode || error?.status || 404;

    const messages = {
        404: { title: 'พัสดุหลงทาง!', subtitle: 'หน้าที่คุณกำลังหาอาจถูกส่งไปผิดที่ หรือยังไม่ได้จัดส่ง' },
        403: { title: 'ถนนปิด!', subtitle: 'คุณไม่มีสิทธิ์เข้าถึงเส้นทางนี้' },
        500: { title: 'รถเสียกลางทาง!', subtitle: 'ระบบกำลังซ่อมบำรุง กรุณาลองใหม่อีกครั้ง' },
    };
    const msg = messages[status] || messages[404];

    return (
        <>
            <style>{animationStyles}</style>
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                fontFamily: '"Inter", "Noto Sans Thai", sans-serif',
            }}>

                {/* Stars / sparkles */}
                <Sparkle left="10%" top="15%" delay={0} size={6} />
                <Sparkle left="25%" top="8%" delay={0.5} size={4} />
                <Sparkle left="70%" top="12%" delay={1} size={5} />
                <Sparkle left="85%" top="20%" delay={1.5} size={7} />
                <Sparkle left="50%" top="5%" delay={0.8} size={4} />
                <Sparkle left="15%" top="75%" delay={2} size={5} />
                <Sparkle left="80%" top="70%" delay={0.3} size={6} />

                {/* Floating parcels */}
                <FloatingParcel size={45} left="8%" top="20%" delay={0} color="#f59e0b" />
                <FloatingParcel size={35} left="82%" top="15%" delay={1.2} color="#fb923c" />
                <FloatingParcel size={30} left="18%" top="65%" delay={0.6} color="#fbbf24" />
                <FloatingParcel size={40} left="75%" top="60%" delay={1.8} color="#f97316" />
                <FloatingParcel size={25} left="55%" top="78%" delay={2.2} color="#fcd34d" />

                {/* Road */}
                <Box sx={{
                    position: 'absolute', bottom: 60, left: 0, right: 0, height: 28,
                    background: '#374151',
                    '&::before': {
                        content: '""', position: 'absolute', top: '50%', left: 0, right: 0,
                        height: 3, transform: 'translateY(-50%)',
                        background: 'repeating-linear-gradient(90deg, #fbbf24 0px, #fbbf24 30px, transparent 30px, transparent 60px)',
                        animation: 'roadMove 1s linear infinite',
                    },
                }} />

                {/* Ground */}
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                }} />

                {/* Delivery Truck driving */}
                <Box sx={{
                    position: 'absolute', bottom: 72, left: 0,
                    animation: 'driveAcross 8s linear infinite',
                }}>
                    <DeliveryTruck />
                </Box>

                {/* Bouncing Car */}
                <Box sx={{
                    position: 'absolute', bottom: 76, right: '20%',
                    animation: 'bounce 1.5s ease-in-out infinite',
                }}>
                    <BouncingCar />
                </Box>

                {/* Main Content */}
                <Container maxWidth="sm" sx={{
                    textAlign: 'center', position: 'relative', zIndex: 10,
                    animation: 'fadeInUp 0.8s ease-out',
                }}>
                    {/* 404 Number */}
                    <Typography sx={{
                        fontSize: { xs: '8rem', md: '12rem' },
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)',
                        backgroundClip: 'text', WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                        animation: 'pulse404 3s ease-in-out infinite',
                        textShadow: 'none',
                        mb: -2,
                        userSelect: 'none',
                    }}>
                        {status}
                    </Typography>

                    {/* Title */}
                    <Typography variant="h4" sx={{
                        color: '#fff', fontWeight: 700, mb: 1.5,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                    }}>
                        {msg.title}
                    </Typography>

                    {/* Subtitle */}
                    <Typography sx={{
                        color: '#94a3b8', fontSize: '1.05rem', mb: 4,
                        maxWidth: 400, mx: 'auto', lineHeight: 1.7,
                    }}>
                        {msg.subtitle}
                    </Typography>

                    {/* Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<HomeIcon />}
                            onClick={() => navigate('/')}
                            sx={{
                                px: 4, py: 1.5,
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                borderRadius: 3,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    boxShadow: '0 6px 30px rgba(59, 130, 246, 0.6)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            กลับหน้าหลัก
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{
                                px: 4, py: 1.5,
                                borderColor: 'rgba(148, 163, 184, 0.4)',
                                color: '#94a3b8',
                                borderRadius: 3,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                    color: '#3b82f6',
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            ย้อนกลับ
                        </Button>
                    </Box>

                    {/* Brand */}
                    <Typography sx={{
                        color: '#475569', fontSize: '0.8rem', mt: 5,
                        letterSpacing: 2, textTransform: 'uppercase',
                    }}>
                        SiamGroup V3.1
                    </Typography>
                </Container>
            </Box>
        </>
    );
}
