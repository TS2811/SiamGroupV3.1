import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Grid, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tooltip, CircularProgress, Snackbar, Alert, Tabs, Tab
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    CalendarMonth as CalendarIcon, Close as CloseIcon,
    Festival as FestivalIcon, Business as BusinessIcon,
    Star as SpecialIcon,
} from '@mui/icons-material';
import { hrmService, settingsService } from '../services/api';

const typeColors = { NATIONAL: 'error', COMPANY: 'primary', SPECIAL: 'warning' };
const typeLabels = { NATIONAL: 'วันหยุดราชการ', COMPANY: 'วันหยุดบริษัท', SPECIAL: 'วันหยุดพิเศษ' };
const typeIcons = { NATIONAL: <FestivalIcon fontSize="small" />, COMPANY: <BusinessIcon fontSize="small" />, SPECIAL: <SpecialIcon fontSize="small" /> };

export default function HrmHolidaysPage() {
    const [holidays, setHolidays] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ company_id: '', year: new Date().getFullYear() });
    const [dialog, setDialog] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const loadHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.company_id) params.company_id = filters.company_id;
            if (filters.year) params.year = filters.year;
            const res = await hrmService.getHolidays(params);
            setHolidays(res.data?.data?.holidays || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [filters]);

    useEffect(() => { loadHolidays(); }, [loadHolidays]);

    useEffect(() => {
        settingsService.getCompanies().then(res => setCompanies(res.data?.data?.companies || [])).catch(console.error);
    }, []);

    const openAdd = () => {
        setForm({ company_id: filters.company_id || '', holiday_date: '', name_th: '', name_en: '', holiday_type: 'NATIONAL' });
        setEditing(false); setDialog(true);
    };

    const openEdit = (h) => {
        setForm({ id: h.id, company_id: h.company_id, holiday_date: h.holiday_date, name_th: h.name_th, name_en: h.name_en || '', holiday_type: h.holiday_type });
        setEditing(true); setDialog(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) { await hrmService.updateHoliday(form.id, form); }
            else { await hrmService.createHoliday(form); }
            setSnack({ open: true, message: editing ? 'อัปเดตสำเร็จ' : 'สร้างวันหยุดสำเร็จ', severity: 'success' });
            setDialog(false); loadHolidays();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('ลบวันหยุดนี้?')) return;
        try {
            await hrmService.deleteHoliday(id);
            setSnack({ open: true, message: 'ลบวันหยุดสำเร็จ', severity: 'success' });
            loadHolidays();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
    };

    // Group by month
    const grouped = {};
    holidays.forEach(h => {
        const m = h.holiday_date?.substring(0, 7);
        if (!grouped[m]) grouped[m] = [];
        grouped[m].push(h);
    });
    const monthNames = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon color="primary" /> จัดการวันหยุด
                    </Typography>
                    <Typography variant="body2" color="text.secondary">วันหยุดราชการ, บริษัท และวันหยุดพิเศษ</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>เพิ่มวันหยุด</Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>บริษัท</InputLabel>
                        <Select value={filters.company_id} label="บริษัท" onChange={e => setFilters(f => ({ ...f, company_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField size="small" label="ปี" type="number" value={filters.year}
                        onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                        sx={{ minWidth: 120 }} />
                </Box>
            </Paper>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {Object.entries(typeLabels).map(([type, label]) => {
                    const count = holidays.filter(h => h.holiday_type === type).length;
                    return (
                        <Grid item xs={4} key={type}>
                            <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', border: `2px solid`, borderColor: `${typeColors[type]}.light` }} elevation={0}>
                                <Typography variant="h4" fontWeight={700} color={`${typeColors[type]}.main`}>{count}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {typeIcons[type]} {label}
                                </Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Table grouped by month */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : Object.keys(grouped).length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0}>
                    <Typography color="text.secondary">ไม่พบวันหยุด</Typography>
                </Paper>
            ) : Object.entries(grouped).map(([monthKey, items]) => {
                const [y, m] = monthKey.split('-');
                return (
                    <Paper key={monthKey} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                        <Box sx={{ p: 1.5, px: 2, bgcolor: 'primary.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                📅 {monthNames[parseInt(m)]} {y} ({items.length} วัน)
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {items.map(h => {
                                        const date = new Date(h.holiday_date);
                                        const dayName = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][date.getDay()];
                                        return (
                                            <TableRow key={h.id} hover>
                                                <TableCell sx={{ width: 120 }}>
                                                    <Chip label={h.holiday_date} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                                </TableCell>
                                                <TableCell sx={{ width: 50 }}>
                                                    <Chip label={dayName} size="small"
                                                        sx={{ fontSize: 11, height: 20, bgcolor: date.getDay() === 0 || date.getDay() === 6 ? '#FEE2E2' : 'grey.100' }} />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{h.name_th}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{h.name_en || ''}</TableCell>
                                                <TableCell>
                                                    <Chip label={typeLabels[h.holiday_type]} size="small" color={typeColors[h.holiday_type]} variant="outlined"
                                                        icon={typeIcons[h.holiday_type]} />
                                                </TableCell>
                                                <TableCell sx={{ width: 80 }}>
                                                    <Chip label={h.company_code} size="small" />
                                                </TableCell>
                                                <TableCell sx={{ width: 80 }}>
                                                    <Tooltip title="แก้ไข"><IconButton size="small" onClick={() => openEdit(h)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                    <Tooltip title="ลบ"><IconButton size="small" color="error" onClick={() => handleDelete(h.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                );
            })}

            {/* Dialog */}
            <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editing ? '✏️ แก้ไขวันหยุด' : '➕ เพิ่มวันหยุด'}
                    <IconButton onClick={() => setDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>บริษัท *</InputLabel>
                                <Select value={form.company_id || ''} label="บริษัท *" onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="วันที่ *" type="date" InputLabelProps={{ shrink: true }} value={form.holiday_date || ''} onChange={e => setForm(f => ({ ...f, holiday_date: e.target.value }))} /></Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>ประเภท</InputLabel>
                                <Select value={form.holiday_type || 'NATIONAL'} label="ประเภท" onChange={e => setForm(f => ({ ...f, holiday_type: e.target.value }))}>
                                    {Object.entries(typeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}><TextField fullWidth size="small" label="ชื่อวันหยุด (TH) *" value={form.name_th || ''} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} /></Grid>
                        <Grid item xs={12}><TextField fullWidth size="small" label="ชื่อวันหยุด (EN)" value={form.name_en || ''} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {saving ? <CircularProgress size={20} /> : 'บันทึก'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
