import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, TextField, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, MenuItem, InputAdornment,
    IconButton, Avatar, Tooltip, CircularProgress, Alert, Snackbar,
    FormControl, InputLabel, Select, Divider
} from '@mui/material';
import {
    Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
    Visibility as ViewIcon, FilterList as FilterIcon,
    Person as PersonIcon, Badge as BadgeIcon, Close as CloseIcon
} from '@mui/icons-material';
import { hrmService, settingsService } from '../../services/api';

const statusColors = {
    PROBATION: 'warning',
    FULL_TIME: 'success',
    RESIGNED: 'error',
    TERMINATED: 'default',
};
const statusLabels = {
    PROBATION: 'ทดลองงาน',
    FULL_TIME: 'พนักงานประจำ',
    RESIGNED: 'ลาออก',
    TERMINATED: 'เลิกจ้าง',
};

export default function HrmEmployeesPage() {
    // State
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ company_id: '', branch_id: '', status: '', search: '' });
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [levels, setLevels] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    // Load data
    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.company_id) params.company_id = filters.company_id;
            if (filters.branch_id) params.branch_id = filters.branch_id;
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;
            const res = await hrmService.getEmployees(params);
            setEmployees(res.data?.data?.employees || []);
        } catch (err) {
            console.error('Load employees error:', err);
        }
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        loadEmployees();
        loadMasterData();
    }, [loadEmployees]);

    const loadMasterData = async () => {
        try {
            const [cRes, bRes, lRes] = await Promise.all([
                settingsService.getCompanies(),
                settingsService.getBranches(),
                settingsService.getLevels(),
            ]);
            setCompanies(cRes.data?.data?.companies || []);
            setBranches(bRes.data?.data?.branches || []);
            setLevels(lRes.data?.data?.levels || []);
        } catch (err) { console.error(err); }
    };

    // Dialog handlers
    const openAddDialog = () => {
        setForm({
            username: '', password: '1234', first_name_th: '', last_name_th: '',
            first_name_en: '', last_name_en: '', nickname: '', email: '', phone: '',
            gender: '', birth_date: '', employee_code: '', company_id: '',
            branch_id: '', level_id: '', manager_id: '', start_date: '',
            salary_type: 'MONTHLY', base_salary: '', status: 'PROBATION',
        });
        setEditMode(false);
        setViewMode(false);
        setDialogOpen(true);
    };

    const openEditDialog = (emp) => {
        setForm({
            id: emp.id,
            first_name_th: emp.first_name_th || '', last_name_th: emp.last_name_th || '',
            first_name_en: emp.first_name_en || '', last_name_en: emp.last_name_en || '',
            nickname: emp.nickname || '', email: emp.email || '', phone: emp.phone || '',
            gender: emp.gender || '', birth_date: emp.birth_date || '',
            employee_code: emp.employee_code || '', company_id: emp.company_id || '',
            branch_id: emp.branch_id || '', level_id: emp.level_id || '',
            manager_id: emp.manager_id || '', start_date: emp.start_date || '',
            salary_type: emp.salary_type || 'MONTHLY', base_salary: emp.base_salary || '',
            status: emp.status || 'PROBATION',
        });
        setEditMode(true);
        setViewMode(false);
        setDialogOpen(true);
    };

    const openViewDialog = (emp) => {
        setForm(emp);
        setViewMode(true);
        setEditMode(false);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editMode) {
                await hrmService.updateEmployee(form.id, form);
                setSnack({ open: true, message: 'อัปเดตพนักงานสำเร็จ', severity: 'success' });
            } else {
                await hrmService.createEmployee(form);
                setSnack({ open: true, message: 'เพิ่มพนักงานสำเร็จ', severity: 'success' });
            }
            setDialogOpen(false);
            loadEmployees();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" /> จัดการพนักงาน
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        จัดการข้อมูลพนักงานทั้งหมดในองค์กร
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                    เพิ่มพนักงาน
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" label="ค้นหา" placeholder="ชื่อ, รหัสพนักงาน..."
                        value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                        sx={{ minWidth: 220, flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>บริษัท</InputLabel>
                        <Select value={filters.company_id} label="บริษัท"
                            onChange={e => setFilters(f => ({ ...f, company_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>สาขา</InputLabel>
                        <Select value={filters.branch_id} label="สาขา"
                            onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>สถานะ</InputLabel>
                        <Select value={filters.status} label="สถานะ"
                            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" size="medium" onClick={loadEmployees}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                            <FilterIcon fontSize="small" sx={{ mr: 0.5 }} /> กรอง
                        </Button>
                        <Button variant="outlined" size="medium" onClick={() => setFilters({ company_id: '', branch_id: '', status: '', search: '' })}
                            sx={{ textTransform: 'none', borderRadius: 2 }}>
                            ล้าง
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Table */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ชื่อ-นามสกุล</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ชื่อเล่น</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>บริษัท</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>สาขา</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ตำแหน่ง</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>วันเริ่มงาน</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            ไม่พบข้อมูลพนักงาน
                                        </TableCell>
                                    </TableRow>
                                ) : employees.map(emp => (
                                    <TableRow key={emp.id} hover sx={{ cursor: 'pointer' }}
                                        onClick={() => openViewDialog(emp)}>
                                        <TableCell>
                                            <Chip label={emp.employee_code} size="small" variant="outlined"
                                                icon={<BadgeIcon />} sx={{ fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar src={emp.avatar_url} sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                    {(emp.first_name_th || '?')[0]}
                                                </Avatar>
                                                {emp.first_name_th} {emp.last_name_th}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{emp.nickname || '-'}</TableCell>
                                        <TableCell><Chip label={emp.company_code} size="small" /></TableCell>
                                        <TableCell>{emp.branch_name || '-'}</TableCell>
                                        <TableCell>{emp.level_name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip label={statusLabels[emp.status] || emp.status} size="small"
                                                color={statusColors[emp.status] || 'default'} />
                                        </TableCell>
                                        <TableCell>{emp.start_date || '-'}</TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Tooltip title="ดู"><IconButton size="small" onClick={() => openViewDialog(emp)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="แก้ไข"><IconButton size="small" onClick={() => openEditDialog(emp)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">ทั้งหมด {employees.length} คน</Typography>
                </Box>
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen && !viewMode} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editMode ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่'}
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {/* System fields (create only) */}
                        {!editMode && (
                            <>
                                <Typography variant="subtitle2" fontWeight={700} color="primary">ข้อมูลระบบ</Typography><Divider />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField sx={{ flex: 1 }} size="small" label="Username *" value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                                    <TextField sx={{ flex: 1 }} size="small" label="รหัสผ่าน" type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                                </Box>
                            </>
                        )}
                        {/* Personal */}
                        <Typography variant="subtitle2" fontWeight={700} color="primary">ข้อมูลส่วนตัว</Typography><Divider />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="ชื่อ (TH) *" value={form.first_name_th || ''} onChange={e => setForm(f => ({ ...f, first_name_th: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="นามสกุล (TH) *" value={form.last_name_th || ''} onChange={e => setForm(f => ({ ...f, last_name_th: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="ชื่อ (EN)" value={form.first_name_en || ''} onChange={e => setForm(f => ({ ...f, first_name_en: e.target.value }))} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="นามสกุล (EN)" value={form.last_name_en || ''} onChange={e => setForm(f => ({ ...f, last_name_en: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="ชื่อเล่น" value={form.nickname || ''} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="เบอร์โทร" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </Box>
                        <TextField fullWidth size="small" label="Email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        {/* Employment */}
                        <Typography variant="subtitle2" fontWeight={700} color="primary">ข้อมูลการจ้างงาน</Typography><Divider />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="รหัสพนักงาน *" value={form.employee_code || ''} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))} />
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>บริษัท *</InputLabel>
                                <Select value={form.company_id || ''} label="บริษัท *" onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>สาขา *</InputLabel>
                                <Select value={form.branch_id || ''} label="สาขา *" onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}>
                                    {branches.filter(b => !form.company_id || b.company_id == form.company_id).map(b => <MenuItem key={b.id} value={b.id}>{b.name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>ตำแหน่ง *</InputLabel>
                                <Select value={form.level_id || ''} label="ตำแหน่ง *" onChange={e => setForm(f => ({ ...f, level_id: e.target.value }))}>
                                    {levels.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField sx={{ flex: 1 }} size="small" label="วันเริ่มงาน *" type="date" slotProps={{ inputLabel: { shrink: true } }} value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>สถานะ</InputLabel>
                                <Select value={form.status || 'PROBATION'} label="สถานะ" onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>ประเภทเงินเดือน</InputLabel>
                                <Select value={form.salary_type || 'MONTHLY'} label="ประเภทเงินเดือน" onChange={e => setForm(f => ({ ...f, salary_type: e.target.value }))}>
                                    <MenuItem value="MONTHLY">รายเดือน</MenuItem>
                                    <MenuItem value="DAILY">รายวัน</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField sx={{ flex: 1 }} size="small" label="เงินเดือนฐาน" type="number" value={form.base_salary || ''} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                        {saving ? <CircularProgress size={20} /> : (editMode ? 'บันทึก' : 'สร้างพนักงาน')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={dialogOpen && viewMode} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    👤 ข้อมูลพนักงาน
                    <IconButton onClick={() => setDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Avatar src={form.avatar_url} sx={{ width: 80, height: 80, mx: 'auto', mb: 1, fontSize: 32 }}>
                            {(form.first_name_th || '?')[0]}
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>{form.first_name_th} {form.last_name_th}</Typography>
                        <Typography variant="body2" color="text.secondary">{form.nickname && `(${form.nickname})`}</Typography>
                        <Chip label={form.employee_code} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        {[
                            ['บริษัท', `${form.company_code || ''} - ${form.company_name || ''}`],
                            ['สาขา', form.branch_name],
                            ['ตำแหน่ง', form.level_name],
                            ['สถานะ', statusLabels[form.status] || form.status],
                            ['วันเริ่มงาน', form.start_date],
                            ['เบอร์โทร', form.phone],
                            ['Email', form.email],
                            ['เงินเดือน', form.base_salary ? `${Number(form.base_salary).toLocaleString()} ฿` : '-'],
                        ].map(([label, value]) => (
                            <Box key={label}>
                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                                <Typography variant="body2" fontWeight={600}>{value || '-'}</Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setViewMode(false); openEditDialog(form); }}
                        variant="outlined" sx={{ textTransform: 'none' }}>
                        <EditIcon fontSize="small" sx={{ mr: 0.5 }} /> แก้ไข
                    </Button>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>ปิด</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
