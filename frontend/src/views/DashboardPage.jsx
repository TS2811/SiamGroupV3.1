import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import {
    Box, Grid, Card, CardContent, Typography, Stack, Chip, Avatar,
    IconButton, Tooltip, Paper, Button, Divider, LinearProgress,
    CircularProgress, Alert,
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, AccessTime, CalendarMonth,
    EventNote, TrendingUp,
} from '@mui/icons-material';

// ========================================
// Status Config ตาม PRD
// ========================================
const STATUS_CONFIG = {
    ON_TIME: { label: 'เข้างานปกติ', color: '#4CAF50', icon: '🟢' },
    NORMAL: { label: 'เข้างานปกติ', color: '#4CAF50', icon: '🟢' },
    LATE_MINOR: { label: 'มาสาย ≤15น.', color: '#FFC107', icon: '🟡' },
    LATE_MAJOR: { label: 'มาสาย >15น.', color: '#F44336', icon: '🔴' },
    EARLY_OUT: { label: 'กลับก่อน', color: '#FF9800', icon: '🟠' },
    FORGOT_OUT: { label: 'ลืมเช็ค Out', color: '#795548', icon: '🟤' },
    NO_OUT: { label: 'ลืมเช็ค Out', color: '#795548', icon: '🟤' },
    WORKING: { label: 'กำลังทำงาน', color: '#1976D2', icon: '🔵' },
    ABSENT: { label: 'ขาดงาน', color: '#616161', icon: '⬛' },
    LEAVE: { label: 'ลา', color: '#2196F3', icon: '🔵' },
    HOLIDAY: { label: 'หยุดบริษัท', color: '#9C27B0', icon: '🟣' },
    FUTURE: { label: '', color: 'transparent', icon: '' },
    WEEKEND: { label: 'หยุด', color: '#E0E0E0', icon: '' },
};

// ========================================
// Payroll Cycle Helpers
// ========================================
function getPayrollCycle(offset = 0) {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    if (now.getDate() >= 21) month += 1;
    month += offset;
    if (month > 11) { year += Math.floor(month / 12); month = month % 12; }
    if (month < 0) { year += Math.floor(month / 12); month = ((month % 12) + 12) % 12; }
    return { displayMonth: month + 1, displayYear: year };
}

function formatThaiMonth(month, year) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${months[month - 1]} ${year + 543}`;
}

function isSameDay(dateStr, today) {
    return dateStr === today;
}

// ========================================
// Calendar Day Component
// ========================================
function CalendarDay({ dateStr, dayData, isToday, onClick }) {
    const status = dayData?.status || 'FUTURE';
    const timeIn = dayData?.in || null;
    const timeOut = dayData?.out || null;
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.FUTURE;
    const isFuture = status === 'FUTURE';
    const isWeekend = status === 'WEEKEND';
    const isOff = ['HOLIDAY', 'LEAVE'].includes(status);
    const dayNum = new Date(dateStr).getDate();

    return (
        <Tooltip
            title={`${cfg.label}${timeIn ? ` — เข้า ${timeIn}` : ''}${timeOut ? ` ออก ${timeOut}` : ''}${dayData?.holiday_name ? ` (${dayData.holiday_name})` : ''}${dayData?.leave_name ? ` (${dayData.leave_name})` : ''}`}
            arrow placement="top"
        >
            <Box
                onClick={() => !isFuture && onClick(dateStr)}
                sx={{
                    p: 0.5, borderRadius: 1.5,
                    cursor: isFuture ? 'default' : 'pointer',
                    opacity: isFuture ? 0.3 : 1,
                    bgcolor: isToday ? 'primary.main' : isWeekend ? '#F5F5F5' : 'transparent',
                    color: isToday ? '#fff' : 'text.primary',
                    border: '1px solid',
                    borderColor: isToday ? 'primary.dark' : 'divider',
                    transition: 'all 0.15s',
                    minHeight: 52,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    '&:hover': !isFuture ? { bgcolor: isToday ? 'primary.dark' : 'action.hover', transform: 'scale(1.03)', boxShadow: 1 } : {},
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Typography fontWeight={isToday ? 700 : 500} fontSize={13} lineHeight={1}>{dayNum}</Typography>
                    {!isFuture && !isWeekend && cfg.color !== 'transparent' && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isToday ? '#fff' : cfg.color, flexShrink: 0 }} />
                    )}
                </Stack>
                {timeIn && (
                    <Typography fontSize={9} lineHeight={1.2} sx={{ color: isToday ? 'rgba(255,255,255,0.85)' : 'text.secondary', mt: 0.2, fontFamily: 'monospace' }}>
                        {timeIn}
                    </Typography>
                )}
                {timeOut && (
                    <Typography fontSize={9} lineHeight={1.2} sx={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'text.disabled', fontFamily: 'monospace' }}>
                        {timeOut}
                    </Typography>
                )}
                {isWeekend && !timeIn && (
                    <Typography fontSize={8} color={isToday ? 'rgba(255,255,255,0.6)' : 'text.disabled'} lineHeight={1}>หยุด</Typography>
                )}
                {isOff && (
                    <Typography fontSize={8} sx={{ color: isToday ? '#fff' : cfg.color }} lineHeight={1}>{dayData?.holiday_name || dayData?.leave_name || cfg.label}</Typography>
                )}
                {status === 'FORGOT_OUT' && (
                    <Typography fontSize={8} sx={{ color: isToday ? '#fff' : cfg.color }} lineHeight={1}>ไม่มี OUT</Typography>
                )}
                {status === 'ABSENT' && (
                    <Typography fontSize={8} sx={{ color: isToday ? '#fff' : cfg.color }} lineHeight={1}>ขาด</Typography>
                )}
            </Box>
        </Tooltip>
    );
}

// ========================================
// Main Dashboard Component
// ========================================
export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cycleOffset, setCycleOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [calendarData, setCalendarData] = useState(null);
    const [summary, setSummary] = useState(null);

    const cycle = useMemo(() => getPayrollCycle(cycleOffset), [cycleOffset]);
    const today = new Date().toISOString().split('T')[0];
    const isManager = !!user?.is_admin;
    const displayName = user?.nickname || user?.first_name_th || 'ผู้ใช้';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await dashboardService.getCalendar(cycle.displayMonth, cycle.displayYear);
            const data = res.data?.data;
            setCalendarData(data?.calendar || null);
            setSummary(data?.summary || null);
        } catch (err) {
            console.error('Dashboard API error:', err);
            setError('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    }, [cycle]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const calendarDays = calendarData?.days || [];

    // สร้าง lookup map: date → dayData
    const dayMap = useMemo(() => {
        const m = {};
        calendarDays.forEach(d => { m[d.date] = d; });
        return m;
    }, [calendarDays]);

    // สร้าง array ของวันที่แสดง
    const displayDays = useMemo(() => {
        if (!calendarData) return [];
        return calendarDays.map(d => d.date);
    }, [calendarData, calendarDays]);

    // สถิติสรุปรอบเดือน
    const stats = useMemo(() => {
        const vals = calendarDays.map(d => d.status);
        return {
            onTime: vals.filter(v => ['ON_TIME', 'NORMAL'].includes(v)).length,
            lateMild: vals.filter(v => v === 'LATE_MINOR').length,
            lateBad: vals.filter(v => v === 'LATE_MAJOR').length,
            leave: vals.filter(v => v === 'LEAVE').length,
            absent: vals.filter(v => v === 'ABSENT').length,
            holiday: vals.filter(v => ['HOLIDAY', 'WEEKEND'].includes(v)).length,
            total: vals.filter(v => !['FUTURE', 'WEEKEND', 'HOLIDAY'].includes(v)).length,
        };
    }, [calendarDays]);

    const handleDayClick = (dateStr) => {
        navigate(`/requests?date=${dateStr}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    const cycleStart = calendarData?.cycle_start;
    const cycleEnd = calendarData?.cycle_end;

    return (
        <Box>
            {/* Welcome + Check-in */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 2.5 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>สวัสดี, {displayName} 👋</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {user?.employee?.company_name && (
                            <Chip label={user.employee.company_name} size="small" variant="outlined" color="primary" sx={{ ml: 1, height: 20, fontSize: 10 }} />
                        )}
                    </Typography>
                </Box>
                <Button
                    variant="contained" size="large" startIcon={<AccessTime />}
                    onClick={() => navigate('/checkin')}
                    sx={{
                        px: 3, py: 1.2,
                        background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                        fontWeight: 700, borderRadius: 3, fontSize: '0.9rem',
                        boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
                        '&:hover': { background: 'linear-gradient(135deg, #1976D2, #1565C0)', transform: 'translateY(-1px)' },
                        transition: 'all 0.2s',
                    }}
                >
                    🕐 ลงเวลาเข้า-ออกงาน
                </Button>
            </Stack>

            {/* ปฏิทินรอบเงินเดือน */}
            <Card sx={{ mb: 2.5 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2.5 }, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                            <CalendarMonth color="primary" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight={700}>ปฏิทินรอบเงินเดือน</Typography>
                            {cycleStart && cycleEnd && (
                                <Typography variant="caption" color="text.secondary">
                                    ({new Date(cycleStart + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {new Date(cycleEnd + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                                </Typography>
                            )}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconButton size="small" onClick={() => setCycleOffset(p => p - 1)}><ChevronLeft fontSize="small" /></IconButton>
                            <Chip label={formatThaiMonth(cycle.displayMonth, cycle.displayYear)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, minWidth: 90 }} />
                            <IconButton size="small" onClick={() => setCycleOffset(p => p + 1)}><ChevronRight fontSize="small" /></IconButton>
                        </Stack>
                    </Stack>

                    {/* Day headers */}
                    <Grid container spacing={0.5} sx={{ mb: 0.3 }}>
                        {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((d, i) => (
                            <Grid size={{ xs: 12 / 7 }} key={i}>
                                <Typography variant="caption" fontWeight={600} textAlign="center" display="block" color={i >= 5 ? 'error.main' : 'text.secondary'} fontSize={11}>
                                    {d}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Calendar grid */}
                    <Grid container spacing={0.5}>
                        {(() => {
                            if (!displayDays.length) return null;
                            const firstDate = new Date(displayDays[0] + 'T00:00:00');
                            const firstDay = firstDate.getDay();
                            const offset = firstDay === 0 ? 6 : firstDay - 1;
                            return Array.from({ length: offset }).map((_, i) => (
                                <Grid size={{ xs: 12 / 7 }} key={`e-${i}`}><Box sx={{ minHeight: 52 }} /></Grid>
                            ));
                        })()}
                        {displayDays.map((dateStr) => {
                            const dayData = dayMap[dateStr] || { status: 'FUTURE' };
                            return (
                                <Grid size={{ xs: 12 / 7 }} key={dateStr}>
                                    <CalendarDay dateStr={dateStr} dayData={dayData} isToday={isSameDay(dateStr, today)} onClick={handleDayClick} />
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Legend */}
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        {Object.entries(STATUS_CONFIG)
                            .filter(([k]) => !['FUTURE', 'WEEKEND', 'NORMAL', 'NO_OUT'].includes(k))
                            .map(([key, cfg]) => (
                                <Stack key={key} direction="row" alignItems="center" spacing={0.3} sx={{ mr: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color }} />
                                    <Typography variant="caption" fontSize={9} color="text.secondary">{cfg.label}</Typography>
                                </Stack>
                            ))}
                    </Stack>
                </CardContent>
            </Card>

            {/* สรุปลูกน้อง — วันนี้ */}
            {isManager && summary && (
                <Card sx={{ mb: 2.5, border: '1px solid', borderColor: 'primary.light' }}>
                    <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                            <TrendingUp color="primary" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight={700}>สรุปลูกน้อง — วันนี้</Typography>
                        </Stack>
                        <Grid container spacing={1.5}>
                            {[
                                { label: 'ต้องมา', value: summary.total_employees, color: '#1565C0' },
                                { label: 'มาแล้ว', value: summary.present, color: '#4CAF50' },
                                { label: 'ขาด', value: summary.absent, color: '#F44336' },
                                { label: 'ลา', value: summary.on_leave, color: '#2196F3' },
                                { label: 'มาสาย', value: summary.late, color: '#FF9800' },
                                { label: 'Pending', value: summary.pending_requests, color: '#FF8F00' },
                            ].map((item) => (
                                <Grid size={{ xs: 4, sm: 2 }} key={item.label}>
                                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="h6" fontWeight={800} sx={{ color: item.color, lineHeight: 1 }}>{item.value}</Typography>
                                        <Typography variant="caption" fontSize={10} color="text.secondary">{item.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* รายงานสรุป (3 cards) */}
            <Grid container spacing={2}>
                {/* สถิติเดือนนี้ */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                                <EventNote color="primary" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={700}>สถิติรอบนี้</Typography>
                            </Stack>
                            <Divider sx={{ mb: 1.5 }} />
                            {[
                                { label: 'ตรงเวลา', value: stats.onTime, total: stats.total, color: '#4CAF50' },
                                { label: 'สาย (เบา)', value: stats.lateMild, total: stats.total, color: '#FFC107' },
                                { label: 'สาย (หนัก)', value: stats.lateBad, total: stats.total, color: '#F44336' },
                                { label: 'ลา', value: stats.leave, total: stats.total, color: '#2196F3' },
                                { label: 'ขาด', value: stats.absent, total: stats.total, color: '#616161' },
                            ].map((item) => (
                                <Box key={item.label} sx={{ mb: 1.2 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.2 }}>
                                        <Typography variant="caption" fontSize={11}>{item.label}</Typography>
                                        <Typography variant="caption" fontWeight={600} fontSize={11}>{item.value} วัน</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate" value={item.total > 0 ? (item.value / item.total) * 100 : 0}
                                        sx={{ height: 5, borderRadius: 3, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 } }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* วันหยุดเดือนนี้ */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                                <CalendarMonth sx={{ color: '#9C27B0' }} fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={700}>วันหยุดรอบนี้</Typography>
                            </Stack>
                            <Divider sx={{ mb: 1.5 }} />
                            <Box sx={{ textAlign: 'center', py: 0.5 }}>
                                <Typography variant="h4" fontWeight={800} color="primary.main">{stats.holiday}</Typography>
                                <Typography variant="caption" color="text.secondary">วัน (รวมวันหยุดสัปดาห์)</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            {calendarDays.filter(d => d.status === 'HOLIDAY').map((h, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                                    <Box>
                                        <Typography variant="caption" fontSize={11} fontWeight={500}>
                                            {new Date(h.date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </Typography>
                                        <Typography variant="caption" fontSize={10} color="text.secondary" display="block">{h.holiday_name}</Typography>
                                    </Box>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9C27B0' }} />
                                </Stack>
                            ))}
                            {calendarDays.filter(d => d.status === 'HOLIDAY').length === 0 && (
                                <Typography variant="caption" color="text.secondary" textAlign="center" display="block">ไม่มีวันหยุดพิเศษ</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* สถิติสรุป */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                                <AccessTime sx={{ color: '#2196F3' }} fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={700}>สิทธิ์การลาปีนี้</Typography>
                            </Stack>
                            <Divider sx={{ mb: 1.5 }} />
                            {[
                                { type: 'ลาป่วย', used: 2, total: 30, color: '#F44336' },
                                { type: 'ลากิจ', used: 0, total: 3, color: '#FF9800' },
                                { type: 'ลาพักร้อน', used: 1, total: 10, color: '#4CAF50' },
                            ].map((item) => (
                                <Box key={item.type} sx={{ mb: 1.2 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                                        <Typography variant="caption" fontSize={11}>{item.type}</Typography>
                                        <Typography variant="caption" fontWeight={600} fontSize={11}>{item.used}/{item.total} วัน</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate" value={(item.used / item.total) * 100}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 } }}
                                    />
                                    <Typography variant="caption" fontSize={9} color="text.secondary">เหลือ {item.total - item.used} วัน</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
