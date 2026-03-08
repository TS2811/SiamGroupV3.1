import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Grid, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tooltip, CircularProgress, Snackbar, Alert, Tabs, Tab,
    Switch, FormControlLabel, Divider
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    EventNote as LeaveIcon, Close as CloseIcon,
    Groups as GroupsIcon,
} from '@mui/icons-material';
import { hrmService } from '../services/api';

export default function HrmLeaveMgmtPage() {
    const [tab, setTab] = useState(0); // 0=types, 1=quotas
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [quotas, setQuotas] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quotaYear, setQuotaYear] = useState(new Date().getFullYear());
    const [quotaEmpId, setQuotaEmpId] = useState('');

    // Leave Type Dialog
    const [typeDialog, setTypeDialog] = useState(false);
    const [typeForm, setTypeForm] = useState({});
    const [editingType, setEditingType] = useState(false);

    // Quota Dialog
    const [quotaDialog, setQuotaDialog] = useState(false);
    const [quotaForm, setQuotaForm] = useState({});

    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    // Edit Quota Dialog (V2 style — แก้ทุกประเภทลาของพนักงาน 1 คน)
    const [editQuotaDialog, setEditQuotaDialog] = useState(false);
    const [editQuotaEmp, setEditQuotaEmp] = useState(null);
    const [editQuotaForm, setEditQuotaForm] = useState({});

    const loadTypes = async () => {
        try {
            const res = await hrmService.getLeaveTypes();
            setLeaveTypes(res.data?.data?.leave_types || []);
        } catch (err) { console.error(err); }
    };

    const loadQuotas = useCallback(async () => {
        setLoading(true);
        try {
            const params = { year: quotaYear };
            if (quotaEmpId) params.employee_id = quotaEmpId;
            const res = await hrmService.getLeaveQuotas(params);
            setQuotas(res.data?.data?.quotas || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [quotaYear, quotaEmpId]);

    useEffect(() => {
        loadTypes();
        hrmService.getEmployees().then(res => setEmployees(res.data?.data?.employees || [])).catch(console.error);
    }, []);

    useEffect(() => { if (tab === 1) loadQuotas(); }, [tab, loadQuotas]);

    // Leave Type CRUD
    const openAddType = () => {
        setTypeForm({ code: '', name_th: '', name_en: '', max_days: '', requires_file: false, min_days_advance: 0, allow_half_day: true, is_paid: true, sort_order: 0 });
        setEditingType(false); setTypeDialog(true);
    };

    const openEditType = (t) => {
        setTypeForm({ ...t, requires_file: !!t.requires_file, allow_half_day: !!t.allow_half_day, allow_hourly: !!t.allow_hourly, is_paid: !!t.is_paid });
        setEditingType(true); setTypeDialog(true);
    };

    const saveType = async () => {
        setSaving(true);
        try {
            const data = { ...typeForm, requires_file: typeForm.requires_file ? 1 : 0, allow_half_day: typeForm.allow_half_day ? 1 : 0, is_paid: typeForm.is_paid ? 1 : 0, max_days: typeForm.max_days || null };
            if (editingType) { await hrmService.updateLeaveType(typeForm.id, data); }
            else { await hrmService.createLeaveType(data); }
            setSnack({ open: true, message: editingType ? 'อัปเดตสำเร็จ' : 'สร้างประเภทลาสำเร็จ', severity: 'success' });
            setTypeDialog(false); loadTypes();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    const deleteType = async (id) => {
        if (!window.confirm('ลบประเภทลานี้?')) return;
        try {
            await hrmService.deleteLeaveType(id);
            setSnack({ open: true, message: 'ลบสำเร็จ', severity: 'success' });
            loadTypes();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
    };

    // Quota CRUD
    const openAddQuota = () => {
        setQuotaForm({ employee_id: quotaEmpId || '', leave_type_id: '', year: quotaYear, quota_days: '', carried_days: 0 });
        setQuotaDialog(true);
    };

    const saveQuota = async () => {
        setSaving(true);
        try {
            await hrmService.saveLeaveQuota(quotaForm);
            setSnack({ open: true, message: 'บันทึกโควตาสำเร็จ', severity: 'success' });
            setQuotaDialog(false); loadQuotas();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    // บันทึกโควตาแบบ Bulk (V2 style)
    const saveEditQuota = async () => {
        if (!editQuotaEmp) return;
        setSaving(true);
        try {
            // สร้าง items สำหรับ bulk save
            const items = Object.values(editQuotaForm).map(v => ({
                employee_id: editQuotaEmp.employee_id,
                leave_type_id: v.leave_type_id,
                year: quotaYear,
                quota_days: v.quota_days || 0,
            }));
            // Save ทีละตัว (ใช้ upsert)
            for (const item of items) {
                await hrmService.saveLeaveQuota(item);
            }
            setSnack({ open: true, message: `บันทึกโควตาของ ${editQuotaEmp.name} สำเร็จ`, severity: 'success' });
            setEditQuotaDialog(false);
            loadQuotas();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LeaveIcon color="primary" /> จัดการสิทธิ์ลา
                    </Typography>
                    <Typography variant="body2" color="text.secondary">ประเภทการลาและโควตาลาพนักงาน</Typography>
                </Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
                <Tab label="ประเภทการลา" icon={<LeaveIcon />} iconPosition="start" />
                <Tab label="โควตาลาพนักงาน" icon={<GroupsIcon />} iconPosition="start" />
            </Tabs>

            {/* TAB 0: Leave Types */}
            {tab === 0 && (
                <>
                    <Box sx={{ mb: 2, textAlign: 'right' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddType}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>เพิ่มประเภทลา</Button>
                    </Box>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ชื่อ (TH)</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ชื่อ (EN)</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>สิทธิ์สูงสุด</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>แนบไฟล์</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ล่วงหน้า</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ครึ่งวัน</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>ได้เงิน</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaveTypes.map(t => (
                                        <TableRow key={t.id} hover>
                                            <TableCell><Chip label={t.code} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{t.name_th}</TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>{t.name_en || '-'}</TableCell>
                                            <TableCell>{t.max_days ? `${t.max_days} วัน` : 'ไม่จำกัด'}</TableCell>
                                            <TableCell>{t.requires_file ? <Chip label="ต้องแนบ" size="small" color="warning" /> : '-'}</TableCell>
                                            <TableCell>{t.min_days_advance ? `${t.min_days_advance} วัน` : '-'}</TableCell>
                                            <TableCell>{t.allow_half_day ? '✅' : '❌'}</TableCell>
                                            <TableCell>{t.is_paid ? <Chip label="ได้เงิน" size="small" color="success" /> : <Chip label="ไม่ได้เงิน" size="small" color="error" />}</TableCell>
                                            <TableCell>
                                                <Tooltip title="แก้ไข"><IconButton size="small" onClick={() => openEditType(t)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="ลบ"><IconButton size="small" color="error" onClick={() => deleteType(t.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}

            {/* TAB 1: Quotas — แสดงแบบ V2 (1 แถว = 1 พนักงาน) */}
            {tab === 1 && (
                <>
                    <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }} elevation={0}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <TextField size="small" label="ปี" type="number" value={quotaYear}
                                onChange={e => setQuotaYear(e.target.value)} sx={{ minWidth: 100 }} />
                            <FormControl size="small" sx={{ minWidth: 250 }}>
                                <InputLabel>พนักงาน</InputLabel>
                                <Select value={quotaEmpId} label="พนักงาน" onChange={e => setQuotaEmpId(e.target.value)}>
                                    <MenuItem value="">ทั้งหมด</MenuItem>
                                    {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={openAddQuota}
                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>กำหนดโควตา</Button>
                        </Box>
                    </Paper>

                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (() => {
                            // Pivot: จัดกลุ่ม quotas ตาม employee
                            const empMap = {};
                            quotas.forEach(q => {
                                if (!empMap[q.employee_code]) {
                                    empMap[q.employee_code] = {
                                        employee_code: q.employee_code,
                                        employee_id: q.employee_id,
                                        name: `${q.first_name_th} ${q.last_name_th}`,
                                        types: {}
                                    };
                                }
                                empMap[q.employee_code].types[q.leave_type_code] = {
                                    leave_type_id: q.leave_type_id,
                                    quota_days: parseFloat(q.quota_days || 0),
                                    used_days: parseFloat(q.used_days || 0),
                                    carried_days: parseFloat(q.carried_days || 0),
                                };
                            });
                            const empRows = Object.values(empMap);
                            // หา leave type codes ทั้งหมดที่มี
                            const typeColumns = leaveTypes.filter(t => t.is_active !== '0' && t.is_active !== 0);

                            if (empRows.length === 0) {
                                return <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>ไม่พบข้อมูลโควตา</Box>;
                            }

                            return (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>พนักงาน</TableCell>
                                                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>ชื่อ-สกุล</TableCell>
                                                {typeColumns.map(t => (
                                                    <TableCell key={t.id} align="center" sx={{ fontWeight: 700, minWidth: 90 }}>
                                                        {t.name_en || t.name_th}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 80 }}>จัดการ</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {empRows.map(emp => (
                                                <TableRow key={emp.employee_code} hover>
                                                    <TableCell>
                                                        <Chip label={emp.employee_code} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                                                    {typeColumns.map(t => {
                                                        const data = emp.types[t.code];
                                                        if (!data) {
                                                            return <TableCell key={t.id} align="center" sx={{ color: 'text.disabled' }}>-</TableCell>;
                                                        }
                                                        const usedColor = data.used_days > 0 ? (data.used_days >= data.quota_days ? 'error.main' : 'warning.main') : 'text.secondary';
                                                        return (
                                                            <TableCell key={t.id} align="center">
                                                                <Box component="span" sx={{ color: usedColor, fontWeight: 700 }}>{data.used_days}</Box>
                                                                <Box component="span" sx={{ color: 'text.disabled', mx: 0.5 }}>/</Box>
                                                                <Box component="span" sx={{ fontWeight: 700 }}>{data.quota_days}</Box>
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell align="center">
                                                        <Tooltip title="แก้ไขโควตา">
                                                            <IconButton size="small" color="primary"
                                                                onClick={() => {
                                                                    // สร้าง form สำหรับแก้ไขโควตาทุกประเภทของพนักงานนี้
                                                                    const formData = {};
                                                                    typeColumns.forEach(t => {
                                                                        const d = emp.types[t.code];
                                                                        formData[t.code] = {
                                                                            leave_type_id: t.id,
                                                                            quota_days: d ? d.quota_days : 0,
                                                                            carried_days: d ? d.carried_days : 0,
                                                                        };
                                                                    });
                                                                    setEditQuotaEmp(emp);
                                                                    setEditQuotaForm(formData);
                                                                    setEditQuotaDialog(true);
                                                                }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            );
                        })()}
                    </Paper>
                </>
            )}

            {/* Leave Type Dialog */}
            <Dialog open={typeDialog} onClose={() => setTypeDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingType ? '✏️ แก้ไขประเภทลา' : '➕ เพิ่มประเภทลา'}
                    <IconButton onClick={() => setTypeDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={4}><TextField fullWidth size="small" label="รหัส *" value={typeForm.code || ''} disabled={editingType} onChange={e => setTypeForm(f => ({ ...f, code: e.target.value }))} /></Grid>
                        <Grid item xs={8}><TextField fullWidth size="small" label="ชื่อ (TH) *" value={typeForm.name_th || ''} onChange={e => setTypeForm(f => ({ ...f, name_th: e.target.value }))} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="ชื่อ (EN)" value={typeForm.name_en || ''} onChange={e => setTypeForm(f => ({ ...f, name_en: e.target.value }))} /></Grid>
                        <Grid item xs={3}><TextField fullWidth size="small" label="สิทธิ์สูงสุด (วัน)" type="number" value={typeForm.max_days || ''} onChange={e => setTypeForm(f => ({ ...f, max_days: e.target.value }))} /></Grid>
                        <Grid item xs={3}><TextField fullWidth size="small" label="ล่วงหน้า (วัน)" type="number" value={typeForm.min_days_advance ?? ''} onChange={e => setTypeForm(f => ({ ...f, min_days_advance: e.target.value }))} /></Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <FormControlLabel control={<Switch checked={!!typeForm.requires_file} onChange={e => setTypeForm(f => ({ ...f, requires_file: e.target.checked }))} />} label="ต้องแนบไฟล์" />
                            <FormControlLabel control={<Switch checked={!!typeForm.allow_half_day} onChange={e => setTypeForm(f => ({ ...f, allow_half_day: e.target.checked }))} />} label="ลาครึ่งวันได้" />
                            <FormControlLabel control={<Switch checked={!!typeForm.is_paid} onChange={e => setTypeForm(f => ({ ...f, is_paid: e.target.checked }))} />} label="ได้ค่าจ้าง" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setTypeDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveType} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* Quota Dialog */}
            <Dialog open={quotaDialog} onClose={() => setQuotaDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>📊 กำหนดโควตาลา</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>พนักงาน *</InputLabel>
                                <Select value={quotaForm.employee_id || ''} label="พนักงาน *" onChange={e => setQuotaForm(f => ({ ...f, employee_id: e.target.value }))}>
                                    {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name_th} {e.last_name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>ประเภทลา *</InputLabel>
                                <Select value={quotaForm.leave_type_id || ''} label="ประเภทลา *" onChange={e => setQuotaForm(f => ({ ...f, leave_type_id: e.target.value }))}>
                                    {leaveTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.code} - {t.name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}><TextField fullWidth size="small" label="ปี" type="number" value={quotaForm.year || quotaYear} onChange={e => setQuotaForm(f => ({ ...f, year: e.target.value }))} /></Grid>
                        <Grid item xs={4}><TextField fullWidth size="small" label="สิทธิ์ (วัน) *" type="number" value={quotaForm.quota_days || ''} onChange={e => setQuotaForm(f => ({ ...f, quota_days: e.target.value }))} /></Grid>
                        <Grid item xs={4}><TextField fullWidth size="small" label="ยกมา (วัน)" type="number" value={quotaForm.carried_days ?? 0} onChange={e => setQuotaForm(f => ({ ...f, carried_days: e.target.value }))} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setQuotaDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveQuota} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Quota Dialog (V2 style) */}
            <Dialog open={editQuotaDialog} onClose={() => setEditQuotaDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    ✏️ แก้ไขโควตาลา — {editQuotaEmp?.name}
                    <IconButton onClick={() => setEditQuotaDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>กำหนดจำนวนวันลาสูงสุดแต่ละประเภท (ปี {quotaYear})</Typography>
                    {leaveTypes.filter(t => t.is_active !== '0' && t.is_active !== 0).map(t => (
                        <TextField
                            key={t.id}
                            fullWidth
                            size="small"
                            label={t.name_th}
                            type="number"
                            value={editQuotaForm[t.code]?.quota_days ?? 0}
                            onChange={e => setEditQuotaForm(f => ({
                                ...f,
                                [t.code]: { ...f[t.code], leave_type_id: t.id, quota_days: e.target.value }
                            }))}
                            sx={{ mb: 1.5 }}
                            InputProps={{ inputProps: { min: 0 } }}
                        />
                    ))}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditQuotaDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveEditQuota} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
