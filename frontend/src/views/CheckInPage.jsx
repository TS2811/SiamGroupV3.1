import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkInService } from '../services/api';
import {
    Box, Card, CardContent, Typography, Stack, Avatar, Button,
    Chip, Alert, TextField, CircularProgress, Paper, IconButton, Divider,
    Snackbar,
} from '@mui/material';
import {
    AccessTime, MyLocation, LocationOn, CheckCircle, Cancel,
    ArrowBack, CameraAlt, CloudUpload,
} from '@mui/icons-material';

// ========================================
// Distance calculation (Haversine)
// ========================================
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========================================
// Google Map Component
// ========================================
function GoogleMapView({ userLat, userLng, branchLat, branchLng, branchRadius, isInRadius }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || !window.google || userLat == null || userLng == null) return;

        const userPos = { lat: userLat, lng: userLng };
        const branchPos = branchLat && branchLng ? { lat: branchLat, lng: branchLng } : userPos;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                zoom: 16,
                center: userPos,
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                ],
            });

            // Branch marker
            if (branchLat && branchLng) {
                new window.google.maps.Marker({
                    position: branchPos,
                    map: mapInstanceRef.current,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#1565C0',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                    },
                    title: 'สาขา',
                });

                // Branch radius circle
                new window.google.maps.Circle({
                    map: mapInstanceRef.current,
                    center: branchPos,
                    radius: branchRadius,
                    fillColor: '#1565C0',
                    fillOpacity: 0.1,
                    strokeColor: '#1565C0',
                    strokeWeight: 1,
                    strokeOpacity: 0.5,
                });
            }
        }

        // User marker
        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(userPos);
        } else {
            userMarkerRef.current = new window.google.maps.Marker({
                position: userPos,
                map: mapInstanceRef.current,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: isInRadius ? '#4CAF50' : '#F44336',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                },
                title: 'ตำแหน่งของคุณ',
            });
        }

        userMarkerRef.current.setIcon({
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: isInRadius ? '#4CAF50' : '#F44336',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
        });

        mapInstanceRef.current.panTo(userPos);
    }, [userLat, userLng, branchLat, branchLng, branchRadius, isInRadius]);

    return (
        <Box
            ref={mapRef}
            sx={{ width: '100%', height: 200, borderRadius: 2, overflow: 'hidden', bgcolor: '#E8F5E9' }}
        />
    );
}

export default function CheckInPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // States
    const [currentTime, setCurrentTime] = useState(new Date());
    const [gpsStatus, setGpsStatus] = useState('loading');
    const [position, setPosition] = useState(null);
    const [distance, setDistance] = useState(null);
    const [isInRadius, setIsInRadius] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [mode, setMode] = useState('ONSITE');

    // API-fetched status
    const [todayStatus, setTodayStatus] = useState(null); // NONE / IN / COMPLETE
    const [branchInfo, setBranchInfo] = useState(null);
    const [shiftInfo, setShiftInfo] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);

    // The current scan type is derived from todayStatus
    const scanType = todayStatus?.status === 'NONE' ? 'IN' : todayStatus?.status === 'IN' ? 'OUT' : 'DONE';

    // OFFSITE fields
    const [offsiteReason, setOffsiteReason] = useState('');
    const [offsiteFile, setOffsiteFile] = useState(null);
    const fileInputRef = useRef(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Default branch (fallback)
    const branch = {
        name: branchInfo?.name_th || user?.employee?.branch_name || 'สำนักงานใหญ่',
        lat: branchInfo?.latitude ? parseFloat(branchInfo.latitude) : 18.795847,
        lng: branchInfo?.longitude ? parseFloat(branchInfo.longitude) : 98.987740,
        radius: branchInfo?.check_radius ? parseInt(branchInfo.check_radius) : 200,
    };

    // ========================================
    // Fetch today's status from API
    // ========================================
    const fetchStatus = useCallback(async () => {
        try {
            const res = await checkInService.getStatus();
            const data = res.data?.data;
            setTodayStatus(data?.status || { status: 'NONE' });
            setBranchInfo(data?.branch || null);
            setShiftInfo(data?.shift || null);
        } catch (err) {
            console.error('Failed to fetch checkin status:', err);
            setTodayStatus({ status: 'NONE' });
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Request GPS
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setPosition({ lat: latitude, lng: longitude, accuracy });
                setGpsStatus('granted');

                const dist = haversine(latitude, longitude, branch.lat, branch.lng);
                setDistance(Math.round(dist));
                setIsInRadius(dist <= branch.radius);
            },
            (err) => {
                if (err.code === 1) setGpsStatus('denied');
                else setGpsStatus('error');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [branch.lat, branch.lng, branch.radius]);

    // Handle Check-in/out — CALL REAL API
    const handleSubmit = async () => {
        if (scanType === 'DONE') return;

        setIsSubmitting(true);
        setSubmitResult(null);

        if (mode === 'OFFSITE') {
            if (!offsiteReason.trim()) {
                setSubmitResult({ type: 'error', message: 'กรุณากรอกเหตุผลที่อยู่นอกสถานที่' });
                setIsSubmitting(false);
                return;
            }
        }

        // Shared Device Detection
        const lastUserId = localStorage.getItem('cico_last_user_id');
        const currentUserId = String(user?.id);
        const deviceRisk = lastUserId && lastUserId !== currentUserId ? 1 : 0;
        localStorage.setItem('cico_last_user_id', currentUserId);

        const payload = {
            check_in_type: mode,
            latitude: position?.lat,
            longitude: position?.lng,
            location_name: branch.name,
            distance_from_base: distance,
            is_verified_location: mode === 'ONSITE' && isInRadius ? 1 : 0,
            offsite_reason: mode === 'OFFSITE' ? offsiteReason : null,
            device_risk_flag: deviceRisk,
        };

        try {
            const res = await checkInService.clock(payload);
            const data = res.data?.data;

            setSnackbar({
                open: true,
                message: data?.scan_type === 'IN'
                    ? `✅ บันทึกเข้างานสำเร็จ เวลา ${new Date(data.scan_time).toLocaleTimeString('th-TH')}`
                    : `✅ บันทึกออกงานสำเร็จ เวลา ${new Date(data.scan_time).toLocaleTimeString('th-TH')}`,
                severity: 'success',
            });

            // Re-fetch status to update UI
            await fetchStatus();
        } catch (err) {
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            setSubmitResult({ type: 'error', message: msg });
            setSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayName = user?.nickname || user?.first_name_th || 'ผู้ใช้';
    const canSubmit = scanType !== 'DONE' && (mode === 'OFFSITE' || (gpsStatus === 'granted' && isInRadius));

    // Shift display
    const shiftLabel = shiftInfo
        ? `${shiftInfo.name_th || 'กะ'} (${shiftInfo.start_time?.slice(0, 5)} — ${shiftInfo.end_time?.slice(0, 5)})`
        : null;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {/* Back button */}
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2, textTransform: 'none' }}>
                กลับ Dashboard
            </Button>

            {statusLoading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>กำลังโหลดสถานะ...</Typography>
                </Box>
            ) : (
                <>
                    {/* User info card */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ width: 50, height: 50, bgcolor: 'primary.main', fontSize: 20 }}>
                                    {displayName[0]?.toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>{displayName}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        {user?.employee?.employee_code} • {branch.name}
                                    </Typography>
                                    {shiftLabel && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            🕐 {shiftLabel}
                                        </Typography>
                                    )}
                                </Box>
                                <Chip
                                    icon={mode === 'ONSITE' ? <LocationOn /> : <MyLocation />}
                                    label={mode === 'ONSITE' ? 'ONSITE' : 'OFFSITE'}
                                    color={mode === 'ONSITE' ? 'primary' : 'warning'}
                                    size="small"
                                    onClick={() => setMode(m => m === 'ONSITE' ? 'OFFSITE' : 'ONSITE')}
                                    sx={{ cursor: 'pointer' }}
                                />
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Today's status */}
                    {todayStatus?.clock_in && (
                        <Alert severity="info" sx={{ mb: 2 }} variant="outlined">
                            <Stack spacing={0.5}>
                                <Typography variant="body2">
                                    📥 เข้างาน: <strong>{new Date(todayStatus.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
                                </Typography>
                                {todayStatus.clock_out && (
                                    <Typography variant="body2">
                                        📤 ออกงาน: <strong>{new Date(todayStatus.clock_out).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
                                    </Typography>
                                )}
                            </Stack>
                        </Alert>
                    )}

                    {/* Live clock */}
                    <Card sx={{ mb: 2, textAlign: 'center', background: 'linear-gradient(135deg, #0D47A1, #1565C0)' }}>
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                                {currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, fontFamily: 'monospace', letterSpacing: 4 }}>
                                {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                            <Chip
                                label={scanType === 'IN' ? '📥 เข้างาน' : scanType === 'OUT' ? '📤 ออกงาน' : '✅ ลงเวลาครบแล้ว'}
                                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                            />
                        </CardContent>
                    </Card>

                    {/* GPS Status + Map */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <MyLocation color={gpsStatus === 'granted' ? 'success' : 'disabled'} fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={600}>ตำแหน่ง GPS</Typography>
                            </Stack>

                            {gpsStatus === 'loading' && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">กำลังค้นหาตำแหน่ง...</Typography>
                                </Stack>
                            )}

                            {gpsStatus === 'denied' && (
                                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                                    กรุณาเปิดสิทธิ์เข้าถึงตำแหน่ง (Location) ในเบราว์เซอร์
                                </Alert>
                            )}

                            {gpsStatus === 'error' && (
                                <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                                    ไม่สามารถดึงตำแหน่งได้ กรุณาลองใหม่
                                </Alert>
                            )}

                            {gpsStatus === 'granted' && (
                                <>
                                    <Stack spacing={0.8}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">พิกัด</Typography>
                                            <Typography variant="caption" fontFamily="monospace">
                                                {position?.lat?.toFixed(6)}, {position?.lng?.toFixed(6)}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">ความแม่นยำ</Typography>
                                            <Typography variant="caption">±{Math.round(position?.accuracy || 0)} เมตร</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">สาขา</Typography>
                                            <Typography variant="caption">{branch.name}</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">ระยะห่าง</Typography>
                                            <Typography variant="caption" fontWeight={600} sx={{ color: isInRadius ? '#4CAF50' : '#F44336' }}>
                                                {distance?.toLocaleString()} เมตร {isInRadius ? '✅ ในรัศมี' : `❌ นอกรัศมี (${branch.radius}m)`}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Box sx={{ mt: 1.5 }}>
                                        <GoogleMapView
                                            userLat={position?.lat}
                                            userLng={position?.lng}
                                            branchLat={branch.lat}
                                            branchLng={branch.lng}
                                            branchRadius={branch.radius}
                                            isInRadius={isInRadius}
                                        />
                                    </Box>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* OFFSITE fields */}
                    {mode === 'OFFSITE' && scanType !== 'DONE' && (
                        <Card sx={{ mb: 2 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                                    📝 ข้อมูลเพิ่มเติม (OFFSITE)
                                </Typography>
                                <TextField
                                    label="เหตุผลที่อยู่นอกสถานที่"
                                    multiline rows={2}
                                    fullWidth size="small"
                                    value={offsiteReason}
                                    onChange={(e) => setOffsiteReason(e.target.value)}
                                    required
                                    sx={{ mb: 1.5 }}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    hidden
                                    onChange={(e) => setOffsiteFile(e.target.files[0])}
                                />
                                <Button
                                    variant="outlined" fullWidth
                                    startIcon={offsiteFile ? <CheckCircle color="success" /> : <CameraAlt />}
                                    onClick={() => fileInputRef.current?.click()}
                                    color={offsiteFile ? 'success' : 'primary'}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {offsiteFile ? `📎 ${offsiteFile.name}` : '📷 ถ่ายรูป / แนบหลักฐาน'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Result */}
                    {submitResult && (
                        <Alert severity={submitResult.type} sx={{ mb: 2 }}>
                            {submitResult.message}
                        </Alert>
                    )}

                    {/* Submit button */}
                    {scanType !== 'DONE' ? (
                        <Button
                            variant="contained" fullWidth size="large"
                            disabled={!canSubmit || isSubmitting}
                            onClick={handleSubmit}
                            sx={{
                                py: 2,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                borderRadius: 3,
                                background: scanType === 'IN'
                                    ? 'linear-gradient(135deg, #1565C0, #0D47A1)'
                                    : 'linear-gradient(135deg, #E53935, #C62828)',
                                boxShadow: scanType === 'IN'
                                    ? '0 6px 20px rgba(21,101,192,0.4)'
                                    : '0 6px 20px rgba(229,57,53,0.4)',
                                '&:hover': { transform: 'translateY(-2px)' },
                                '&:disabled': { background: '#ccc', boxShadow: 'none' },
                                transition: 'all 0.2s',
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} sx={{ color: '#fff' }} />
                            ) : scanType === 'IN' ? (
                                '📥 บันทึกเข้างาน'
                            ) : (
                                '📤 บันทึกออกงาน'
                            )}
                        </Button>
                    ) : (
                        <Alert severity="success" sx={{ textAlign: 'center' }}>
                            ✅ ลงเวลาเข้า-ออกครบแล้ววันนี้
                        </Alert>
                    )}

                    {/* Warning if not in radius */}
                    {mode === 'ONSITE' && gpsStatus === 'granted' && !isInRadius && scanType !== 'DONE' && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            คุณอยู่นอกรัศมีสาขา ({distance?.toLocaleString()} เมตร) — กรุณาเข้าใกล้สาขาก่อนลงเวลา หรือเปลี่ยนเป็น OFFSITE
                        </Alert>
                    )}
                </>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />
        </Box>
    );
}
