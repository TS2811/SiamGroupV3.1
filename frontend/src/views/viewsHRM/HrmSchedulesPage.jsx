import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tooltip, CircularProgress, Snackbar, Alert, Divider,
    Tabs, Tab, Switch, FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Schedule as ScheduleIcon,
    AssignmentInd as AssignIcon, Group as GroupIcon,
    NightsStay as NightIcon, WbSunny as DayIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { hrmService, settingsService } from '../../services/api';

export default function HrmSchedulesPage() {
    const [tab, setTab] = useState(0); // 0=shifts, 1=assign
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [empShifts, setEmpShifts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyFilter, setCompanyFilter] = useState('');
    const [selectedEmpId, setSelectedEmpId] = useState('');

    // Shift Dialog
    const [shiftDialog, setShiftDialog] = useState(false);
    const [shiftForm, setShiftForm] = useState({});
    const [editingShift, setEditingShift] = useState(false);

    // Assign Dialog
    const [assignDialog, setAssignDialog] = useState(false);
    const [assignForm, setAssignForm] = useState({ employee_id: '', shift_id: '', effective_date: '', end_date: '' });

    // Bulk Dialog
    const [bulkDialog, setBulkDialog] = useState(false);
    const [bulkForm, setBulkForm] = useState({ employee_ids: [], shift_id: '', effective_date: '' });

    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const loadShifts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await hrmService.getShifts(companyFilter || undefined);
            setShifts(res.data?.data?.shifts || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [companyFilter]);

    useEffect(() => { loadShifts(); }, [loadShifts]);

    useEffect(() => {
        (async () => {
            try {
                const [cRes, eRes] = await Promise.all([
                    settingsService.getCompanies(),
                    hrmService.getEmployees(),
                ]);
                setCompanies(cRes.data?.data?.companies || []);
                setEmployees(eRes.data?.data?.employees || []);
            } catch (err) { console.error(err); }
        })();
    }, []);

    // Load employee shifts when selected
    useEffect(() => {
        if (selectedEmpId) {
            hrmService.getEmployeeShifts(selectedEmpId).then(res => {
                setEmpShifts(res.data?.data?.shifts || []);
            }).catch(console.error);
        }
    }, [selectedEmpId]);

    const openAddShift = () => {
        setShiftForm({ company_id: '', code: '', name_th: '', name_en: '', start_time: '08:30', end_time: '17:30', break_minutes: 60, work_hours: 8, is_overnight: false, late_grace_minutes: 5 });
        setEditingShift(false);
        setShiftDialog(true);
    };

    const openEditShift = (s) => {
        setShiftForm({ ...s, is_overnight: !!s.is_overnight });
        setEditingShift(true);
        setShiftDialog(true);
    };

    const saveShift = async () => {
        setSaving(true);
        try {
            const data = { ...shiftForm, is_overnight: shiftForm.is_overnight ? 1 : 0 };
            if (editingShift) {
                await hrmService.updateShift(shiftForm.id, data);
            } else {
                await hrmService.createShift(data);
            }
            setSnack({ open: true, message: editingShift ? 'อัปเดตกะสำเร็จ' : 'สร้างกะสำเร็จ', severity: 'success' });
            setShiftDialog(false);
            loadShifts();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    const saveAssign = async () => {
        setSaving(true);
        try {
            await hrmService.assignShift(assignForm);
            setSnack({ open: true, message: 'กำหนดกะสำเร็จ', severity: 'success' });
            setAssignDialog(false);
            if (selectedEmpId) {
                const res = await hrmService.getEmployeeShifts(selectedEmpId);
                setEmpShifts(res.data?.data?.shifts || []);
            }
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    const saveBulk = async () => {
        setSaving(true);
        try {
            await hrmService.bulkAssignShift(bulkForm);
            setSnack({ open: true, message: `กำหนดกะให้ ${bulkForm.employee_ids.length} คนสำเร็จ`, severity: 'success' });
            setBulkDialog(false);
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
                        <ScheduleIcon color="primary" /> ตารางกะ
                    </Typography>
                    <Typography variant="body2" color="text.secondary">จัดการกะการทำงานและกำหนดกะให้พนักงาน</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => setBulkDialog(true)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>กำหนดกะเป็นกลุ่ม</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAddShift}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>เพิ่มกะ</Button>
                </Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
                <Tab label="รายชื่อกะ" icon={<ScheduleIcon />} iconPosition="start" />
                <Tab label="กำหนดกะพนักงาน" icon={<AssignIcon />} iconPosition="start" />
            </Tabs>

            {/* TAB 0: Shifts List */}
            {tab === 0 && (
                <>
                    <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }} elevation={0}>
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>บริษัท</InputLabel>
                            <Select value={companyFilter} label="บริษัท" onChange={e => setCompanyFilter(e.target.value)}>
                                <MenuItem value="">ทั้งหมด</MenuItem>
                                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Paper>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชื่อกะ</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>บริษัท</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>เวลาเข้า</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>เวลาออก</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>พัก (นาที)</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชม.ทำงาน</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ข้ามคืน</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ผ่อนผัน</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>จัดการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shifts.length === 0 ? (
                                            <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>ไม่พบกะ</TableCell></TableRow>
                                        ) : shifts.map(s => (
                                            <TableRow key={s.id} hover>
                                                <TableCell><Chip label={s.code} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {s.is_overnight ? <NightIcon fontSize="small" color="primary" /> : <DayIcon fontSize="small" color="warning" />}
                                                        {s.name_th}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{s.company_code}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{s.start_time?.substring(0, 5)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>{s.end_time?.substring(0, 5)}</TableCell>
                                                <TableCell>{s.break_minutes}</TableCell>
                                                <TableCell>{s.work_hours}</TableCell>
                                                <TableCell>{s.is_overnight ? <Chip label="ข้ามคืน" size="small" color="primary" /> : '-'}</TableCell>
                                                <TableCell>{s.late_grace_minutes} นาที</TableCell>
                                                <TableCell>
                                                    <Tooltip title="แก้ไข"><IconButton size="small" onClick={() => openEditShift(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </>
            )}

            {/* TAB 1: Assign */}
            {tab === 1 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Left — Employee selector (fixed width) */}
                    <Paper sx={{ p: 2, borderRadius: 3, width: 280, minWidth: 280, flexShrink: 0 }} elevation={0}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>เลือกพนักงาน</Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>พนักงาน</InputLabel>
                            <Select value={selectedEmpId} label="พนักงาน" onChange={e => setSelectedEmpId(e.target.value)}>
                                <MenuItem value="">-- เลือก --</MenuItem>
                                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name_th} {e.last_name_th}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {selectedEmpId && (
                            <Button fullWidth variant="outlined" startIcon={<AssignIcon />} sx={{ mt: 2, textTransform: 'none' }}
                                onClick={() => { setAssignForm({ employee_id: selectedEmpId, shift_id: '', effective_date: '', end_date: '' }); setAssignDialog(true); }}>
                                กำหนดกะให้พนักงานนี้
                            </Button>
                        )}
                    </Paper>

                    {/* Right — Shift history (fills remaining width) */}
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', flex: 1, minWidth: 0 }} elevation={0}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" fontWeight={700}>ประวัติกะของพนักงาน</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small" sx={{ width: '100%' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>กะ</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>เวลา</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>วันเริ่ม</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>วันสิ้นสุด</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {empShifts.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            {selectedEmpId ? 'ยังไม่มีกะ' : 'กรุณาเลือกพนักงาน'}
                                        </TableCell></TableRow>
                                    ) : empShifts.map(es => (
                                        <TableRow key={es.id}>
                                            <TableCell><Chip label={`${es.shift_code} - ${es.shift_name}`} size="small" /></TableCell>
                                            <TableCell>{es.start_time?.substring(0, 5)} - {es.end_time?.substring(0, 5)}</TableCell>
                                            <TableCell>{es.effective_date}</TableCell>
                                            <TableCell>{es.end_date || 'ปัจจุบัน'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            {/* Shift Dialog */}
            <Dialog open={shiftDialog} onClose={() => setShiftDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingShift ? '✏️ แก้ไขกะ' : '➕ เพิ่มกะใหม่'}
                    <IconButton onClick={() => setShiftDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {!editingShift && (
                            <FormControl fullWidth size="small">
                                <InputLabel>บริษัท *</InputLabel>
                                <Select value={shiftForm.company_id || ''} label="บริษัท *" onChange={e => setShiftForm(f => ({ ...f, company_id: e.target.value }))}>
                                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="รหัสกะ *" value={shiftForm.code || ''} onChange={e => setShiftForm(f => ({ ...f, code: e.target.value }))} />
                            <TextField sx={{ flex: 2 }} size="small" label="ชื่อกะ (TH) *" value={shiftForm.name_th || ''} onChange={e => setShiftForm(f => ({ ...f, name_th: e.target.value }))} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="เวลาเข้า *" type="time" slotProps={{ inputLabel: { shrink: true } }} value={shiftForm.start_time || ''} onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="เวลาออก *" type="time" slotProps={{ inputLabel: { shrink: true } }} value={shiftForm.end_time || ''} onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="พักเที่ยง (นาที)" type="number" value={shiftForm.break_minutes ?? ''} onChange={e => setShiftForm(f => ({ ...f, break_minutes: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="ชม.ทำงาน" type="number" value={shiftForm.work_hours ?? ''} onChange={e => setShiftForm(f => ({ ...f, work_hours: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="ผ่อนผันสาย (นาที)" type="number" value={shiftForm.late_grace_minutes ?? ''} onChange={e => setShiftForm(f => ({ ...f, late_grace_minutes: e.target.value }))} />
                        </Box>
                        <FormControlLabel control={<Switch checked={!!shiftForm.is_overnight} onChange={e => setShiftForm(f => ({ ...f, is_overnight: e.target.checked }))} />} label="กะข้ามคืน" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setShiftDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveShift} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {saving ? <CircularProgress size={20} /> : 'บันทึก'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>📌 กำหนดกะให้พนักงาน</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>กะ *</InputLabel>
                            <Select value={assignForm.shift_id} label="กะ *" onChange={e => setAssignForm(f => ({ ...f, shift_id: e.target.value }))}>
                                {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.code} - {s.name_th} ({s.start_time?.substring(0, 5)}-{s.end_time?.substring(0, 5)})</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} size="small" label="วันเริ่มต้น *" type="date" slotProps={{ inputLabel: { shrink: true } }} value={assignForm.effective_date} onChange={e => setAssignForm(f => ({ ...f, effective_date: e.target.value }))} />
                            <TextField sx={{ flex: 1 }} size="small" label="วันสิ้นสุด" type="date" slotProps={{ inputLabel: { shrink: true } }} value={assignForm.end_date} onChange={e => setAssignForm(f => ({ ...f, end_date: e.target.value }))} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAssignDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveAssign} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Assign Dialog */}
            <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>👥 กำหนดกะเป็นกลุ่ม</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>กะ *</InputLabel>
                            <Select value={bulkForm.shift_id} label="กะ *" onChange={e => setBulkForm(f => ({ ...f, shift_id: e.target.value }))}>
                                {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.code} - {s.name_th}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField fullWidth size="small" label="วันเริ่มต้น *" type="date" slotProps={{ inputLabel: { shrink: true } }} value={bulkForm.effective_date} onChange={e => setBulkForm(f => ({ ...f, effective_date: e.target.value }))} />
                        <FormControl fullWidth size="small">
                            <InputLabel>เลือกพนักงาน *</InputLabel>
                            <Select multiple value={bulkForm.employee_ids} label="เลือกพนักงาน *"
                                onChange={e => setBulkForm(f => ({ ...f, employee_ids: e.target.value }))}
                                renderValue={(sel) => `${sel.length} คน`}>
                                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name_th}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setBulkDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveBulk} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        กำหนดกะ ({bulkForm.employee_ids.length} คน)
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
