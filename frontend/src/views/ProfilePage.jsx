import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Stack, Avatar, Grid, Chip,
    TextField, Button, Divider, IconButton, Paper, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import {
    Edit, Save, Lock, CameraAlt, Person, Badge, Business,
    CalendarMonth, Email, Phone, Visibility, History,
} from '@mui/icons-material';

// ========================================
// Mock data for leave/OT history
// ========================================
const MOCK_LEAVE_HISTORY = [
    { id: 1, type: 'ลาป่วย', dateFrom: '2026-02-10', dateTo: '2026-02-10', days: 1, status: 'APPROVED' },
    { id: 2, type: 'ลากิจ', dateFrom: '2026-01-15', dateTo: '2026-01-15', days: 1, status: 'APPROVED' },
    { id: 3, type: 'ลาพักร้อน', dateFrom: '2025-12-28', dateTo: '2025-12-31', days: 2, status: 'APPROVED' },
];

const MOCK_OT_HISTORY = [
    { id: 1, type: 'OT_1_5', date: '2026-02-27', hours: 3, status: 'APPROVED' },
    { id: 2, type: 'OT_2_0', date: '2026-02-14', hours: 8, status: 'APPROVED' },
];

const MOCK_DOCUMENTS = [
    { id: 1, name: 'บัตรประชาชน', uploadedAt: '2026-01-05', uploadedBy: 'HR Admin' },
    { id: 2, name: 'สัญญาจ้างงาน', uploadedAt: '2026-01-05', uploadedBy: 'HR Admin' },
    { id: 3, name: 'ใบขับขี่', uploadedAt: '2026-01-10', uploadedBy: 'HR Admin' },
];

// ========================================
// Status chip
// ========================================
function StatusChip({ status }) {
    const map = {
        APPROVED: { label: 'อนุมัติ', color: 'success' },
        PENDING: { label: 'รออนุมัติ', color: 'warning' },
        REJECTED: { label: 'ปฏิเสธ', color: 'error' },
    };
    const s = map[status] || { label: status, color: 'default' };
    return <Chip label={s.label} size="small" color={s.color} variant="outlined" sx={{ fontSize: 10, height: 22 }} />;
}

// ========================================
// Main Profile Page
// ========================================
export default function ProfilePage() {
    const { user } = useAuth();
    const [tab, setTab] = useState(0);
    const [editing, setEditing] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    // Editable fields
    const [phone, setPhone] = useState(user?.phone || '081-xxx-xxxx');
    const [email, setEmail] = useState(user?.email || '');

    const displayName = `${user?.first_name_th || 'แอดมิน'} ${user?.last_name_th || 'ระบบ'}`;
    const nickname = user?.nickname || 'Admin';

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>👤 ข้อมูลส่วนตัว</Typography>

            {/* Profile header card */}
            <Card sx={{ mb: 2.5, overflow: 'visible' }}>
                <Box sx={{
                    height: 100, borderRadius: '12px 12px 0 0',
                    background: 'linear-gradient(135deg, #0D47A1, #1976D2, #42A5F5)',
                }} />
                <CardContent sx={{ pt: 0, pb: 2, position: 'relative' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'flex-end' }}
                        sx={{ mt: -5 }}>
                        <Avatar
                            sx={{
                                width: 80, height: 80, border: '4px solid #fff',
                                bgcolor: 'primary.main', fontSize: 28, fontWeight: 700,
                                boxShadow: 2,
                            }}
                        >
                            {nickname[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, pt: { xs: 0, sm: 2 } }}>
                            <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Chip label={user?.employee?.employee_code || 'ADM001'} size="small" variant="outlined" />
                                <Chip label={nickname} size="small" color="primary" variant="outlined" />
                                {user?.is_admin && <Chip label="Admin" size="small" color="error" />}
                            </Stack>
                        </Box>
                        <Button
                            variant={editing ? "contained" : "outlined"}
                            size="small"
                            startIcon={editing ? <Save /> : <Edit />}
                            onClick={() => setEditing(!editing)}
                            sx={{ textTransform: 'none' }}
                        >
                            {editing ? 'บันทึก' : 'แก้ไขข้อมูล'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card sx={{ mb: 2.5 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{ minHeight: 42, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab label="ข้อมูลส่วนตัว" icon={<Person fontSize="small" />} iconPosition="start"
                        sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                    <Tab label="การจ้างงาน" icon={<Business fontSize="small" />} iconPosition="start"
                        sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                    <Tab label="ประวัติลา" icon={<CalendarMonth fontSize="small" />} iconPosition="start"
                        sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                    <Tab label="ประวัติ OT" icon={<History fontSize="small" />} iconPosition="start"
                        sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                    <Tab label="เอกสาร" icon={<Badge fontSize="small" />} iconPosition="start"
                        sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                </Tabs>
            </Card>

            {/* ========== Tab 0: ข้อมูลส่วนตัว ========== */}
            {tab === 0 && (
                <Card>
                    <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {[
                                { label: 'ชื่อ (TH)', value: user?.first_name_th || 'แอดมิน', editable: false },
                                { label: 'นามสกุล (TH)', value: user?.last_name_th || 'ระบบ', editable: false },
                                { label: 'ชื่อ (EN)', value: user?.first_name_en || 'Admin', editable: false },
                                { label: 'นามสกุล (EN)', value: user?.last_name_en || 'System', editable: false },
                                { label: 'ชื่อเล่น', value: nickname, editable: false },
                                { label: 'เพศ', value: 'ชาย', editable: false },
                                { label: 'วันเกิด', value: '01/01/1990', editable: false },
                            ].map((field, i) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                    <TextField
                                        label={field.label}
                                        value={field.value}
                                        size="small" fullWidth
                                        disabled={!editing || !field.editable}
                                        InputProps={{
                                            endAdornment: !field.editable && editing ? <Lock fontSize="small" color="disabled" /> : null,
                                        }}
                                    />
                                </Grid>
                            ))}

                            {/* Editable fields */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    size="small" fullWidth disabled={!editing}
                                    InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)}
                                    size="small" fullWidth disabled={!editing}
                                    InputProps={{ startAdornment: <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                            </Grid>
                        </Grid>

                        {editing && (
                            <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
                                🔒 ชื่อ-นามสกุล, วันเกิด, เพศ — ต้องติดต่อ HR เพื่อแก้ไข
                            </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Button variant="outlined" size="small" color="warning" onClick={() => setChangePasswordOpen(true)}
                            sx={{ textTransform: 'none' }}>
                            🔑 เปลี่ยนรหัสผ่าน
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ========== Tab 1: การจ้างงาน ========== */}
            {tab === 1 && (
                <Card>
                    <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {[
                                { label: 'รหัสพนักงาน', value: user?.employee?.employee_code || 'ADM001' },
                                { label: 'บริษัท', value: user?.employee?.company_name || 'สยามเดลิเวอรี่ เซอร์วิส' },
                                { label: 'สาขา', value: user?.employee?.branch_name || 'สำนักงานใหญ่' },
                                { label: 'แผนก', value: user?.employee?.department || '-' },
                                { label: 'ตำแหน่ง', value: user?.employee?.position || 'Admin' },
                                { label: 'Level', value: `Level ${user?.employee?.level_id || 1}` },
                                { label: 'วันเริ่มงาน', value: user?.employee?.start_date || '2024-01-01' },
                                { label: 'ประเภทเงินเดือน', value: user?.employee?.salary_type || 'MONTHLY' },
                                { label: 'สถานะ', value: user?.employee?.status || 'FULL_TIME' },
                                { label: 'หัวหน้า', value: user?.employee?.manager_name || '-' },
                            ].map((field, i) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                    <TextField
                                        label={field.label} value={field.value} size="small" fullWidth disabled
                                        InputProps={{ endAdornment: <Lock fontSize="small" color="disabled" /> }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
                            🔒 ข้อมูลการจ้างงานแก้ไขได้โดย HR เท่านั้น
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* ========== Tab 2: ประวัติลา ========== */}
            {tab === 2 && (
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
                                {MOCK_LEAVE_HISTORY.map(row => (
                                    <TableRow key={row.id} hover>
                                        <TableCell><Typography variant="body2" fontSize={12}>{row.type}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontSize={11}>
                                                {new Date(row.dateFrom).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                {row.dateFrom !== row.dateTo && ` — ${new Date(row.dateTo).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="caption">{row.days} วัน</Typography></TableCell>
                                        <TableCell><StatusChip status={row.status} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* ========== Tab 3: ประวัติ OT ========== */}
            {tab === 3 && (
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
                                {MOCK_OT_HISTORY.map(row => (
                                    <TableRow key={row.id} hover>
                                        <TableCell><Typography variant="body2" fontSize={12}>{row.type}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="caption" fontSize={11}>
                                                {new Date(row.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="caption">{row.hours} ชม.</Typography></TableCell>
                                        <TableCell><StatusChip status={row.status} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* ========== Tab 4: เอกสาร ========== */}
            {tab === 4 && (
                <Card>
                    <CardContent sx={{ p: 2 }}>
                        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                            📁 เอกสารอัปโหลดโดย HR — พนักงานสามารถดูได้อย่างเดียว
                        </Alert>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ชื่อเอกสาร</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>วันที่อัปโหลด</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>อัปโหลดโดย</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="center">ดู</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {MOCK_DOCUMENTS.map(doc => (
                                        <TableRow key={doc.id} hover>
                                            <TableCell><Typography variant="body2" fontSize={12}>📄 {doc.name}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>
                                                    {new Date(doc.uploadedAt).toLocaleDateString('th-TH')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Typography variant="caption" fontSize={11}>{doc.uploadedBy}</Typography></TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Change Password Dialog */}
            <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>🔑 เปลี่ยนรหัสผ่าน</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField label="รหัสผ่านปัจจุบัน" type="password" size="small" fullWidth />
                        <TextField label="รหัสผ่านใหม่" type="password" size="small" fullWidth />
                        <TextField label="ยืนยันรหัสผ่านใหม่" type="password" size="small" fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setChangePasswordOpen(false)} color="inherit">ยกเลิก</Button>
                    <Button variant="contained" onClick={() => setChangePasswordOpen(false)}>เปลี่ยนรหัสผ่าน</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
