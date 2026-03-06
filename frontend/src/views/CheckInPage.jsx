import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Stack, Avatar, Button,
    Chip, Alert, TextField, CircularProgress, Paper, IconButton, Divider,
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

export default function CheckInPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // States
    const [currentTime, setCurrentTime] = useState(new Date());
    const [gpsStatus, setGpsStatus] = useState('loading'); // loading, granted, denied, error
    const [position, setPosition] = useState(null);
    const [distance, setDistance] = useState(null);
    const [isInRadius, setIsInRadius] = useState(false);
    const [scanType, setScanType] = useState('IN'); // IN or OUT
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [mode, setMode] = useState('ONSITE'); // ONSITE or OFFSITE

    // OFFSITE fields
    const [offsiteReason, setOffsiteReason] = useState('');
    const [offsiteFile, setOffsiteFile] = useState(null);
    const fileInputRef = useRef(null);

    // Branch info
    const branch = {
        name: user?.employee?.branch_name || 'สำนักงานใหญ่ SDR',
        lat: user?.employee?.branch_lat || 13.7563,
        lng: user?.employee?.branch_lng || 100.5018,
        radius: user?.employee?.check_radius || 200,
    };

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

    // Shared Device Detection
    const checkSharedDevice = useCallback(() => {
        const lastUserId = localStorage.getItem('cico_last_user_id');
        const currentUserId = String(user?.id);
        const flag = lastUserId && lastUserId !== currentUserId;
        localStorage.setItem('cico_last_user_id', currentUserId);
        return flag;
    }, [user?.id]);

    // Handle Check-in/out
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitResult(null);

        // Validate OFFSITE
        if (mode === 'OFFSITE') {
            if (!offsiteReason.trim()) {
                setSubmitResult({ type: 'error', message: 'กรุณากรอกเหตุผลที่อยู่นอกสถานที่' });
                setIsSubmitting(false);
                return;
            }
            if (!offsiteFile) {
                setSubmitResult({ type: 'error', message: 'กรุณาแนบรูปถ่าย/หลักฐาน' });
                setIsSubmitting(false);
                return;
            }
        }

        const deviceRisk = checkSharedDevice();

        // Prepare data (will send to API later)
        const payload = {
            employee_id: user?.employee?.id,
            work_date: new Date().toISOString().split('T')[0],
            scan_time: new Date().toISOString(),
            scan_type: scanType,
            check_in_type: mode,
            latitude: position?.lat,
            longitude: position?.lng,
            location_name: branch.name,
            distance_from_base: distance,
            is_verified_location: mode === 'ONSITE' && isInRadius ? 1 : 0,
            offsite_reason: mode === 'OFFSITE' ? offsiteReason : null,
            device_risk_flag: deviceRisk ? 1 : 0,
            user_agent: navigator.userAgent,
        };

        // Simulate API call (TODO: connect to backend)
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Check-in payload:', payload);
        setSubmitResult({
            type: 'success',
            message: scanType === 'IN'
                ? `บันทึกเข้างานสำเร็จ เวลา ${currentTime.toLocaleTimeString('th-TH')}`
                : `บันทึกออกงานสำเร็จ เวลา ${currentTime.toLocaleTimeString('th-TH')}`,
        });

        // Toggle next scan type
        setScanType(prev => prev === 'IN' ? 'OUT' : 'IN');
        setIsSubmitting(false);
    };

    const displayName = user?.nickname || user?.first_name_th || 'ผู้ใช้';
    const canSubmit = mode === 'OFFSITE' || (gpsStatus === 'granted' && isInRadius);

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {/* Back button */}
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2, textTransform: 'none' }}>
                กลับ Dashboard
            </Button>

            {/* User info card */}
            <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 50, height: 50, bgcolor: 'primary.main', fontSize: 20 }}>
                            {displayName[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>{displayName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user?.employee?.employee_code} • {branch.name}
                            </Typography>
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
                        label={scanType === 'IN' ? '📥 เข้างาน' : '📤 ออกงาน'}
                        sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                    />
                </CardContent>
            </Card>

            {/* GPS Status */}
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

                            {/* Map placeholder */}
                            <Paper
                                elevation={0}
                                sx={{
                                    mt: 1.5, p: 2, borderRadius: 2,
                                    bgcolor: '#E8F5E9', textAlign: 'center',
                                    border: '1px dashed',
                                    borderColor: isInRadius ? '#4CAF50' : '#F44336',
                                }}
                            >
                                <LocationOn sx={{ fontSize: 32, color: isInRadius ? '#4CAF50' : '#F44336' }} />
                                <Typography variant="caption" display="block" color="text.secondary">
                                    แผนที่ Google Maps จะแสดงที่นี่
                                </Typography>
                                <Typography variant="caption" fontSize={9} color="text.secondary">
                                    (ต้อง config Google Maps API Key)
                                </Typography>
                            </Paper>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* OFFSITE fields */}
            {mode === 'OFFSITE' && (
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
            <Button
                variant="contained" fullWidth size="large"
                disabled={!canSubmit || isSubmitting || gpsStatus !== 'granted'}
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
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: scanType === 'IN'
                            ? '0 8px 24px rgba(21,101,192,0.5)'
                            : '0 8px 24px rgba(229,57,53,0.5)',
                    },
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

            {/* Warning if not in radius */}
            {mode === 'ONSITE' && gpsStatus === 'granted' && !isInRadius && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    คุณอยู่นอกรัศมีสาขา ({distance?.toLocaleString()} เมตร) — กรุณาเข้าใกล้สาขาก่อนลงเวลา หรือเปลี่ยนเป็น OFFSITE
                </Alert>
            )}
        </Box>
    );
}
