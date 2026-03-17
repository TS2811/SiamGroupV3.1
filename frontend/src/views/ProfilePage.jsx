import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import {
    Box, Card, CardContent, Typography, Stack, Avatar, Grid, Chip,
    TextField, Button, Divider, IconButton, Paper, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, CircularProgress, Snackbar,
    useMediaQuery, useTheme,
} from '@mui/material';
import {
    Edit, Save, Person, Business, CalendarMonth, History,
    Badge, Visibility, Lock, CameraAlt,
} from '@mui/icons-material';

// ========================================
// Status Chip
// ========================================
function StatusChip({ status }) {
    const config = {
        PENDING: { label: 'รออนุมัติ', color: 'warning' },
        APPROVED: { label: 'อนุมัติ', color: 'success' },
        REJECTED: { label: 'ปฏิเสธ', color: 'error' },
        CANCELLED: { label: 'ยกเลิก', color: 'default' },
    };
    const c = config[status] || config.PENDING;
    return <Chip label={c.label} size="small" color={c.color} variant="outlined" sx={{ fontSize: 10, height: 22 }} />;
}

// ========================================
// Mobile history cards
// ========================================
function LeaveCard({ row }) {
    return (
        <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{row.leave_type_name || 'ลา'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(row.date_from).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            {row.date_from !== row.date_to && ` — ${new Date(row.date_to).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {row.total_days} วัน
                        </Typography>
                    </Box>
                    <StatusChip status={row.status} />
                </Stack>
            </CardContent>
        </Card>
    );
}

function OTCard({ row }) {
    return (
        <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{row.ot_type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(row.work_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {row.total_hours} ชม.
                        </Typography>
                    </Box>
                    <StatusChip status={row.status} />
                </Stack>
            </CardContent>
        </Card>
    );
}

// ========================================
// Main Profile Page
// ========================================
export default function ProfilePage() {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [tab, setTab] = useState(0);
    const [editing, setEditing] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    // Profile data from API
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Editable fields
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    // History data
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [otHistory, setOTHistory] = useState([]);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    // Avatar upload
    const avatarInputRef = useRef(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // ========================================
    // Fetch profile
    // ========================================
    const fetchProfile = useCallback(async () => {
        try {
            const res = await profileService.getProfile();
            const data = res.data?.data;
            setProfile(data);
            setPhone(data?.phone || '');
            setEmail(data?.email || '');
            // Set avatar URL
            if (data?.avatar_url) {
                setAvatarUrl(data.avatar_url.startsWith('gdrive://') 
                    ? '/v3_1/backend/api/core/profile/avatar/view'
                    : data.avatar_url);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Fetch leave history when tab 2 is selected
    useEffect(() => {
        if (tab === 2 && leaveHistory.length === 0) {
            profileService.getProfile() // use a dedicated endpoint if available
                .then(() => {
                    // Fetch leave history separately
                    return fetch(`/v3_1/backend/api/core/profile/leave-history?year=${new Date().getFullYear()}`, {
                        credentials: 'include',
                        headers: { 'X-API-Key': 'sg_v3_api_key_2026_secure' },
                    });
                })
                .then(r => r.json())
                .then(data => setLeaveHistory(data?.data?.leave_history || []))
                .catch(err => console.error('Leave history error:', err));
        }
    }, [tab]);

    // Fetch OT history when tab 3 is selected  
    useEffect(() => {
        if (tab === 3 && otHistory.length === 0) {
            fetch(`/v3_1/backend/api/core/profile/ot-history?year=${new Date().getFullYear()}`, {
                credentials: 'include',
                headers: { 'X-API-Key': 'sg_v3_api_key_2026_secure' },
            })
                .then(r => r.json())
                .then(data => setOTHistory(data?.data?.ot_history || []))
                .catch(err => console.error('OT history error:', err));
        }
    }, [tab]);

    // Save contact
    const handleSaveContact = async () => {
        try {
            await profileService.updateContact({ phone, email });
            setSnackbar({ open: true, message: '✅ อัปเดตข้อมูลติดต่อสำเร็จ' });
            setEditing(false);
        } catch (err) {
            setSnackbar({ open: true, message: `❌ ${err.response?.data?.message || 'เกิดข้อผิดพลาด'}` });
        }
    };

    // Avatar upload handler
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            setSnackbar({ open: true, message: '❌ รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: '❌ ขนาดไฟล์ต้องไม่เกิน 5MB' });
            return;
        }

        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await fetch('/v3_1/backend/api/core/profile/avatar', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-API-Key': 'sg_v3_api_key_2026_secure' },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setAvatarUrl(data.data?.avatar_url || URL.createObjectURL(file));
                setSnackbar({ open: true, message: '✅ อัปโหลดรูปโปรไฟล์สำเร็จ' });
            } else {
                setSnackbar({ open: true, message: `❌ ${data.message || 'อัปโหลดไม่สำเร็จ'}` });
            }
        } catch (err) {
            setSnackbar({ open: true, message: '❌ เกิดข้อผิดพลาดในการอัปโหลด' });
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    // Change password
    const handleChangePassword = async () => {
        setPasswordError('');
        if (!currentPassword || !newPassword) {
            setPasswordError('กรุณากรอกรหัสผ่าน');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }
        setPasswordSubmitting(true);
        try {
            await profileService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            setSnackbar({ open: true, message: '✅ เปลี่ยนรหัสผ่านสำเร็จ' });
            setChangePasswordOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    // Display values from profile or user context
    const p = profile || {};
    const emp = p.employee || user?.employee || {};
    const displayName = `${p.first_name_th || user?.first_name_th || 'แอดมิน'} ${p.last_name_th || user?.last_name_th || 'ระบบ'}`;
    const nickname = p.nickname || user?.nickname || 'Admin';

    if (profileLoading) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>กำลังโหลดโปรไฟล์...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Profile header card */}
            <Card sx={{ mb: 2, overflow: 'visible' }}>
                <Box sx={{
                    height: { xs: 70, sm: 100 }, borderRadius: '12px 12px 0 0',
                    background: 'linear-gradient(135deg, #0D47A1, #1976D2, #42A5F5)',
                }} />
                <CardContent sx={{ pt: 0, pb: 2, position: 'relative' }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ mt: { xs: -4, sm: -5 } }}>
                        {/* Hidden file input */}
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                        />
                        <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarInputRef.current?.click()}>
                            <Avatar 
                                src={avatarUrl} 
                                sx={{
                                    width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, border: '3px solid #fff',
                                    bgcolor: 'primary.main', fontSize: { xs: 22, sm: 28 }, fontWeight: 700, boxShadow: 2,
                                }}
                            >
                                {nickname[0]?.toUpperCase()}
                            </Avatar>
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0,
                                bgcolor: 'primary.main', borderRadius: '50%', width: 24, height: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #fff', boxShadow: 1,
                            }}>
                                {avatarUploading ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <CameraAlt sx={{ fontSize: 12, color: '#fff' }} />}
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1, pt: { xs: 1, sm: 2 }, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} fontSize={{ xs: 15, sm: 18 }} noWrap>
                                {displayName}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Chip label={emp.employee_code || 'ADM001'} size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                <Chip label={nickname} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                {(p.is_admin || user?.is_admin) && <Chip label="Admin" size="small" color="error" sx={{ height: 22, fontSize: 11 }} />}
                            </Stack>
                        </Box>
                    </Stack>
                    <Button
                        variant={editing ? "contained" : "outlined"} size="small"
                        startIcon={editing ? <Save /> : <Edit />}
                        onClick={() => {
                            if (editing) handleSaveContact();
                            else setEditing(true);
                        }}
                        sx={{ textTransform: 'none', mt: 1.5, fontSize: 12 }}
                    >
                        {editing ? 'บันทึก' : '✏️ แก้ไขข้อมูล'}
                    </Button>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{ minHeight: 40, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab label="ข้อมูล" icon={<Person sx={{ fontSize: 16 }} />} iconPosition="start"
                        sx={{ minHeight: 40, textTransform: 'none', fontSize: 12, px: 1.2, minWidth: 0 }} />
                    <Tab label="การจ้างงาน" icon={<Business sx={{ fontSize: 16 }} />} iconPosition="start"
                        sx={{ minHeight: 40, textTransform: 'none', fontSize: 12, px: 1.2, minWidth: 0 }} />
                    <Tab label="ประวัติลา" icon={<CalendarMonth sx={{ fontSize: 16 }} />} iconPosition="start"
                        sx={{ minHeight: 40, textTransform: 'none', fontSize: 12, px: 1.2, minWidth: 0 }} />
                    <Tab label="OT" icon={<History sx={{ fontSize: 16 }} />} iconPosition="start"
                        sx={{ minHeight: 40, textTransform: 'none', fontSize: 12, px: 1.2, minWidth: 0 }} />
                    <Tab label="เอกสาร" icon={<Badge sx={{ fontSize: 16 }} />} iconPosition="start"
                        sx={{ minHeight: 40, textTransform: 'none', fontSize: 12, px: 1.2, minWidth: 0 }} />
                </Tabs>
            </Card>

            {/* Tab 0: ข้อมูลส่วนตัว */}
            {tab === 0 && (
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Grid container spacing={1.5}>
                            {[
                                { label: 'ชื่อ (TH)', value: p.first_name_th || user?.first_name_th || '', editable: false },
                                { label: 'นามสกุล (TH)', value: p.last_name_th || user?.last_name_th || '', editable: false },
                                { label: 'ชื่อ (EN)', value: p.first_name_en || user?.first_name_en || '', editable: false },
                                { label: 'นามสกุล (EN)', value: p.last_name_en || user?.last_name_en || '', editable: false },
                                { label: 'ชื่อเล่น', value: nickname, editable: false },
                                { label: 'เพศ', value: emp.gender || 'ชาย', editable: false },
                                { label: 'วันเกิด', value: emp.birth_date || '01/01/1990', editable: false },
                            ].map((field, i) => (
                                <Grid size={{ xs: 6, sm: 6 }} key={i}>
                                    <TextField
                                        label={field.label} value={field.value} size="small" fullWidth
                                        disabled={!editing || !field.editable}
                                        slotProps={{ htmlInput: { style: { fontSize: 13 } }, inputLabel: { style: { fontSize: 13 } } }}
                                    />
                                </Grid>
                            ))}
                            <Grid size={{ xs: 6, sm: 6 }}>
                                <TextField label="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    size="small" fullWidth disabled={!editing}
                                    slotProps={{ htmlInput: { style: { fontSize: 13 } }, inputLabel: { style: { fontSize: 13 } } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)}
                                    size="small" fullWidth disabled={!editing}
                                    slotProps={{ htmlInput: { style: { fontSize: 13 } }, inputLabel: { style: { fontSize: 13 } } }} />
                            </Grid>
                        </Grid>

                        {editing && (
                            <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
                                🔒 ชื่อ-นามสกุล, วันเกิด, เพศ — ต้องติดต่อ HR เพื่อแก้ไข
                            </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />
                        <Button variant="outlined" size="small" color="warning" onClick={() => setChangePasswordOpen(true)}
                            sx={{ textTransform: 'none', fontSize: 12 }}>
                            🔑 เปลี่ยนรหัสผ่าน
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Tab 1: การจ้างงาน */}
            {tab === 1 && (
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Grid container spacing={1.5}>
                            {[
                                { label: 'รหัสพนักงาน', value: emp.employee_code || 'ADM001' },
                                { label: 'บริษัท', value: emp.company_name || '' },
                                { label: 'สาขา', value: emp.branch_name || '' },
                                { label: 'แผนก', value: emp.department_name || '-' },
                                { label: 'ตำแหน่ง', value: emp.position_name || '-' },
                                { label: 'Level', value: `Level ${p.level_id || user?.level_id || 1}` },
                                { label: 'วันเริ่มงาน', value: emp.start_date || '' },
                                { label: 'ประเภท', value: emp.salary_type || 'MONTHLY' },
                                { label: 'สถานะ', value: emp.status || 'FULL_TIME' },
                                { label: 'หัวหน้า', value: emp.manager_name || '-' },
                            ].map((field, i) => (
                                <Grid size={{ xs: 6, sm: 6 }} key={i}>
                                    <TextField label={field.label} value={field.value} size="small" fullWidth disabled
                                        slotProps={{ htmlInput: { style: { fontSize: 13 } }, inputLabel: { style: { fontSize: 13 } } }} />
                                </Grid>
                            ))}
                        </Grid>
                        <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
                            🔒 ข้อมูลการจ้างงานแก้ไขได้โดย HR เท่านั้น
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Tab 2: ประวัติลา */}
            {tab === 2 && (
                leaveHistory.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>ยังไม่มีประวัติการลา</Paper>
                ) : isMobile ? (
                    <Box>
                        {leaveHistory.map(row => <LeaveCard key={row.id} row={row} />)}
                    </Box>
                ) : (
                    <Card>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ประเภท</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>วันที่</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>จำนวน</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>สถานะ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaveHistory.map(row => (
                                        <TableRow key={row.id} hover>
                                            <TableCell><Typography variant="body2" fontSize={12}>{row.leave_type_name || 'ลา'}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>
                                                    {new Date(row.date_from).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    {row.date_from !== row.date_to && ` — ${new Date(row.date_to).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="caption">{row.total_days} วัน</Typography></TableCell>
                                            <TableCell><StatusChip status={row.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )
            )}

            {/* Tab 3: ประวัติ OT */}
            {tab === 3 && (
                otHistory.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>ยังไม่มีประวัติ OT</Paper>
                ) : isMobile ? (
                    <Box>
                        {otHistory.map(row => <OTCard key={row.id} row={row} />)}
                    </Box>
                ) : (
                    <Card>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ประเภท</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>วันที่</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ชั่วโมง</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>สถานะ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {otHistory.map(row => (
                                        <TableRow key={row.id} hover>
                                            <TableCell><Typography variant="body2" fontSize={12}>{row.ot_type}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>
                                                    {new Date(row.work_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="caption">{row.total_hours} ชม.</Typography></TableCell>
                                            <TableCell><StatusChip status={row.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )
            )}

            {/* Tab 4: เอกสาร */}
            {tab === 4 && (
                <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    <Alert severity="info" variant="outlined">
                        📁 ระบบจัดการเอกสารจะเปิดใช้งานเร็วๆ นี้
                    </Alert>
                </Paper>
            )}

            {/* Change Password Dialog */}
            <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>🔑 เปลี่ยนรหัสผ่าน</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {passwordError && <Alert severity="error">{passwordError}</Alert>}
                        <TextField label="รหัสผ่านปัจจุบัน" type="password" size="small" fullWidth
                            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        <TextField label="รหัสผ่านใหม่" type="password" size="small" fullWidth
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <TextField label="ยืนยันรหัสผ่านใหม่" type="password" size="small" fullWidth
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setChangePasswordOpen(false)} color="inherit" disabled={passwordSubmitting}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleChangePassword} disabled={passwordSubmitting}>
                        {passwordSubmitting ? <CircularProgress size={20} /> : 'เปลี่ยนรหัสผ่าน'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
        </Box>
    );
}
