/**
 * AccIframePage — iframe-based ACC Module
 * 
 * แทนที่การ render ACC components โดยตรง ใช้ iframe load ระบบ ACC standalone แทน
 * 
 * V3.1 routes /acc/easy-fill → iframe navigates to /acc/easy-fill
 * V3.1 routes /acc/settings  → iframe navigates to /acc/settings
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';

export default function AccIframePage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();
    const iframeRef = useRef(null);
    const prevPathRef = useRef(null);

    // ACC base URL
    // - Dev mode (Vite port 5173) → ACC อยู่บน XAMPP port 80
    // - Production (same origin) → ACC อยู่ same origin
    // JWT cookie ถูกส่งอัตโนมัติเพราะ same hostname (localhost)
    const accBaseUrl = useMemo(() => {
        const { hostname, protocol, port } = window.location;
        // Dev mode: Vite dev server ใช้ port อื่น → ชี้ไป XAMPP (port 80)
        if (port && port !== '80' && port !== '443') {
            return `${protocol}//${hostname}`;
        }
        return `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }, []);

    // แปลง V3.1 route → ACC iframe path
    // V3.1: /acc/easy-fill → ACC: /acc/easy-fill
    // V3.1: /acc/settings  → ACC: /acc/settings
    const accPath = useMemo(() => {
        // location.pathname = e.g. "/v3_1/frontend/acc/easy-fill"
        // ดึงส่วนหลัง /acc/ ออกมา
        const match = location.pathname.match(/\/acc\/(.*)/);
        if (match && match[1]) {
            return `/acc/${match[1]}`;
        }
        return '/acc/';  // default = Easy Fill
    }, [location.pathname]);

    // ครั้งแรก: load iframe ด้วย full URL
    const initialSrc = useMemo(() => {
        return `${accBaseUrl}${accPath}`;
    }, []); // intentionally empty deps — only set once

    // เมื่อ V3.1 sidebar เปลี่ยน route → navigate iframe โดยไม่ reload
    useEffect(() => {
        if (prevPathRef.current === null) {
            // ครั้งแรก — ใช้ src แทน
            prevPathRef.current = accPath;
            return;
        }
        if (prevPathRef.current === accPath) return;

        prevPathRef.current = accPath;

        // Navigate iframe content โดยไม่ reload ทั้ง iframe
        try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentWindow) {
                // ส่ง postMessage ให้ ACC app navigate
                iframe.contentWindow.postMessage(
                    { type: 'ACC_NAVIGATE', path: accPath.replace('/acc/', '/').replace('/acc', '/') },
                    '*'
                );
            }
        } catch (e) {
            // Cross-origin fallback: reload iframe with new URL
            if (iframeRef.current) {
                iframeRef.current.src = `${accBaseUrl}${accPath}`;
            }
        }
    }, [accPath, accBaseUrl]);

    return (
        <Box
            sx={{
                mx: { xs: -1.5, md: -3 },
                mt: { xs: '-16px', md: '-24px' },
                mb: isMobile ? '-80px' : '-24px',
                height: isMobile
                    ? 'calc(100vh - 64px)'
                    : 'calc(100vh - 64px)',
                overflow: 'hidden',
            }}
        >
            <iframe
                ref={iframeRef}
                id="acc-app-iframe"
                src={initialSrc}
                title="Accounting Application"
                allow="clipboard-read; clipboard-write; geolocation"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                }}
            />
        </Box>
    );
}
