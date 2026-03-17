import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton, Chip, Alert,
    Snackbar, Switch, FormControlLabel, Checkbox, Autocomplete, Card,
    CardContent, Divider, CircularProgress, InputAdornment, Grid,
    Tooltip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
    AccountTree, Badge, Layers,
    AdminPanelSettings, Edit, Delete, Add, Save, Search,
} from '@mui/icons-material';
import { settingsService } from '../services/api';



// ————————————————————
// COMPANY TAB
// ————————————————————
function CompanyTab() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await settingsService.getCompanies();
            setCompanies(res.data.data.companies || []);
        } catch { setCompanies([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const startEdit = (c) => { setEditId(c.id); setEditData({ ...c }); };
    const cancelEdit = () => { setEditId(null); setEditData({}); };
    const saveEdit = async () => {
        try {
            await settingsService.updateCompany(editId, editData);
            setSnack({ open: true, message: 'อัปเดตบริษัทสำเร็จ', severity: 'success' });
            cancelEdit();
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>🏢 ข้อมูลบริษัท</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>แก้ไขข้อมูลบริษัทได้ แต่ไม่สามารถเพิ่ม/ลบ</Typography>
            {companies.map(c => (
                <Card key={c.id} sx={{ mb: 2, border: editId === c.id ? '2px solid #1565C0' : '1px solid #E0E0E0' }}>
                    <CardContent>
                        {editId === c.id ? (
                            <Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth size="small" label="ชื่อ (TH)" value={editData.name_th || ''} onChange={e => setEditData(p => ({ ...p, name_th: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth size="small" label="ชื่อ (EN)" value={editData.name_en || ''} onChange={e => setEditData(p => ({ ...p, name_en: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth size="small" label="เลขประจำตัวผู้เสียภาษี" value={editData.tax_id || ''} onChange={e => setEditData(p => ({ ...p, tax_id: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth size="small" label="เบอร์โทร" value={editData.phone || ''} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth size="small" label="อีเมล" value={editData.email || ''} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth size="small" label="ที่อยู่" multiline rows={2} value={editData.address || ''} onChange={e => setEditData(p => ({ ...p, address: e.target.value }))} />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button variant="contained" size="small" startIcon={<Save />} onClick={saveEdit}>บันทึก</Button>
                                    <Button variant="outlined" size="small" onClick={cancelEdit}>ยกเลิก</Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Chip label={c.code} size="small" color="primary" variant="outlined" />
                                        <Typography fontWeight={600}>{c.name_th}</Typography>
                                        {c.name_en && <Typography variant="body2" color="text.secondary">({c.name_en})</Typography>}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        📞 {c.phone || '-'} &nbsp; ✉️ {c.email || '-'} &nbsp; 🏬 {c.branch_count || 0} สาขา &nbsp; 👤 {c.employee_count || 0} พนักงาน
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => startEdit(c)}><Edit fontSize="small" /></IconButton>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ))}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// BRANCH TAB
// ————————————————————
function BranchTab() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await settingsService.getBranches();
            setBranches(res.data.data.branches || []);
        } catch { setBranches([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const startEdit = (b) => { setEditId(b.id); setEditData({ ...b }); };
    const cancelEdit = () => { setEditId(null); setEditData({}); };
    const saveEdit = async () => {
        try {
            await settingsService.updateBranch(editId, editData);
            setSnack({ open: true, message: 'อัปเดตสาขาสำเร็จ', severity: 'success' });
            cancelEdit();
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

    const grouped = branches.reduce((acc, b) => {
        const key = b.company_code || 'OTHER';
        if (!acc[key]) acc[key] = { name: b.company_name, items: [] };
        acc[key].items.push(b);
        return acc;
    }, {});

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>🏬 ข้อมูลสาขา</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>แก้ไขข้อมูลสาขาได้ (รัศมี Check-in, พิกัด GPS)</Typography>
            {Object.entries(grouped).map(([code, group]) => (
                <Box key={code} mb={3}>
                    <Chip label={`${code} — ${group.name}`} color="primary" size="small" sx={{ mb: 1 }} />
                    {group.items.map(b => (
                        <Card key={b.id} sx={{ mb: 1.5, border: editId === b.id ? '2px solid #1565C0' : '1px solid #E0E0E0' }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                {editId === b.id ? (
                                    <Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="ชื่อสาขา (TH)" value={editData.name_th || ''} onChange={e => setEditData(p => ({ ...p, name_th: e.target.value }))} /></Grid>
                                            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="ชื่อสาขา (EN)" value={editData.name_en || ''} onChange={e => setEditData(p => ({ ...p, name_en: e.target.value }))} /></Grid>
                                            <Grid item xs={4}><TextField fullWidth size="small" label="Latitude" type="number" value={editData.latitude || ''} onChange={e => setEditData(p => ({ ...p, latitude: e.target.value }))} /></Grid>
                                            <Grid item xs={4}><TextField fullWidth size="small" label="Longitude" type="number" value={editData.longitude || ''} onChange={e => setEditData(p => ({ ...p, longitude: e.target.value }))} /></Grid>
                                            <Grid item xs={4}><TextField fullWidth size="small" label="รัศมี (เมตร)" type="number" value={editData.check_radius || 200} onChange={e => setEditData(p => ({ ...p, check_radius: e.target.value }))} /></Grid>
                                            <Grid item xs={12}><TextField fullWidth size="small" label="ที่อยู่" multiline rows={2} value={editData.address || ''} onChange={e => setEditData(p => ({ ...p, address: e.target.value }))} /></Grid>
                                        </Grid>
                                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                                            <Button variant="contained" size="small" startIcon={<Save />} onClick={saveEdit}>บันทึก</Button>
                                            <Button variant="outlined" size="small" onClick={cancelEdit}>ยกเลิก</Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography fontWeight={600}>{b.code} — {b.name_th}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                📍 {b.latitude || '-'}, {b.longitude || '-'} &nbsp; 🎯 รัศมี {b.check_radius || 200}m &nbsp; 👤 {b.employee_count || 0} คน
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => startEdit(b)}><Edit fontSize="small" /></IconButton>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ))}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// ORG STRUCTURE TAB (Departments + Roles + Levels)
// ————————————————————
function OrgTab() {
    const [subTab, setSubTab] = useState(0);
    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>🏗️ โครงสร้างองค์กร</Typography>
            <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="แผนก" icon={<AccountTree sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ minHeight: 42 }} />
                <Tab label="ตำแหน่ง" icon={<Badge sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ minHeight: 42 }} />
                <Tab label="ระดับ" icon={<Layers sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ minHeight: 42 }} />
            </Tabs>
            {subTab === 0 && <DepartmentSection />}
            {subTab === 1 && <RoleSection />}
            {subTab === 2 && <LevelSection />}
        </Box>
    );
}

function DepartmentSection() {
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: {} });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await settingsService.getDepartments();
            setDepts(res.data.data.departments || []);
        } catch { setDepts([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        const d = dialog.data;
        try {
            if (dialog.mode === 'create') {
                await settingsService.createDepartment(d);
                setSnack({ open: true, message: 'สร้างแผนกสำเร็จ', severity: 'success' });
            } else {
                await settingsService.updateDepartment(d.id, d);
                setSnack({ open: true, message: 'อัปเดตแผนกสำเร็จ', severity: 'success' });
            }
            setDialog({ open: false, mode: 'create', data: {} });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบแผนกนี้?')) return;
        try {
            await settingsService.deleteDepartment(id);
            setSnack({ open: true, message: 'ลบแผนกสำเร็จ', severity: 'success' });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'ไม่สามารถลบได้', severity: 'error' });
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" size="small" startIcon={<Add />}
                    onClick={() => setDialog({ open: true, mode: 'create', data: { name: '', name_en: '' } })}>
                    เพิ่มแผนก
                </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#F5F7FB' }}>
                            <TableCell>ชื่อแผนก</TableCell>
                            <TableCell>ชื่อ (EN)</TableCell>
                            <TableCell>บริษัท</TableCell>
                            <TableCell align="center">จำนวน Role</TableCell>
                            <TableCell align="center">จัดการ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {depts.map(d => (
                            <TableRow key={d.id} hover>
                                <TableCell><Typography fontWeight={600}>{d.name}</Typography></TableCell>
                                <TableCell>{d.name_en || '-'}</TableCell>
                                <TableCell>{d.companies || '-'}</TableCell>
                                <TableCell align="center"><Chip label={d.role_count} size="small" /></TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: { ...d } })}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(d.id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {depts.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>ไม่พบข้อมูล</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialog.open} onClose={() => setDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle>{dialog.mode === 'create' ? 'เพิ่มแผนก' : 'แก้ไขแผนก'}</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="ชื่อแผนก (TH)" sx={{ mt: 1, mb: 2 }} value={dialog.data.name || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name: e.target.value } }))} />
                    <TextField fullWidth label="ชื่อแผนก (EN)" sx={{ mb: 2 }} value={dialog.data.name_en || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name_en: e.target.value } }))} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog(d => ({ ...d, open: false }))}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

function RoleSection() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: {} });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try { const res = await settingsService.getRoles(); setRoles(res.data.data.roles || []); } catch { setRoles([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        const d = dialog.data;
        try {
            if (dialog.mode === 'create') { await settingsService.createRole(d); }
            else { await settingsService.updateRole(d.id, d); }
            setSnack({ open: true, message: 'บันทึกสำเร็จ', severity: 'success' });
            setDialog({ open: false, mode: 'create', data: {} });
            load();
        } catch (e) { setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' }); }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบตำแหน่งนี้?')) return;
        try { await settingsService.deleteRole(id); load(); setSnack({ open: true, message: 'ลบสำเร็จ', severity: 'success' }); }
        catch (e) { setSnack({ open: true, message: e.response?.data?.message || 'ไม่สามารถลบได้', severity: 'error' }); }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" size="small" startIcon={<Add />}
                    onClick={() => setDialog({ open: true, mode: 'create', data: { name_th: '', name_en: '' } })}>
                    เพิ่มตำแหน่ง
                </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#F5F7FB' }}>
                        <TableCell>ชื่อตำแหน่ง (TH)</TableCell>
                        <TableCell>ชื่อ (EN)</TableCell>
                        <TableCell>แผนก</TableCell>
                        <TableCell align="center">จำนวน Level</TableCell>
                        <TableCell align="center">จัดการ</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {roles.map(r => (
                            <TableRow key={r.id} hover>
                                <TableCell><Typography fontWeight={600}>{r.name_th}</Typography></TableCell>
                                <TableCell>{r.name_en || '-'}</TableCell>
                                <TableCell>{r.departments || '-'}</TableCell>
                                <TableCell align="center"><Chip label={r.level_count} size="small" /></TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: { ...r } })}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={dialog.open} onClose={() => setDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle>{dialog.mode === 'create' ? 'เพิ่มตำแหน่ง' : 'แก้ไขตำแหน่ง'}</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="ชื่อ (TH)" sx={{ mt: 1, mb: 2 }} value={dialog.data.name_th || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name_th: e.target.value } }))} />
                    <TextField fullWidth label="ชื่อ (EN)" sx={{ mb: 2 }} value={dialog.data.name_en || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name_en: e.target.value } }))} />
                </DialogContent>
                <DialogActions><Button onClick={() => setDialog(d => ({ ...d, open: false }))}>ยกเลิก</Button><Button variant="contained" onClick={handleSave}>บันทึก</Button></DialogActions>
            </Dialog>
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
        </Box>
    );
}

function LevelSection() {
    const [levels, setLevels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: {} });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [lvlRes, roleRes] = await Promise.all([settingsService.getLevels(), settingsService.getRoles()]);
            setLevels(lvlRes.data.data.levels || []);
            setRoles(roleRes.data.data.roles || []);
        } catch { setLevels([]); setRoles([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        const d = dialog.data;
        try {
            if (dialog.mode === 'create') { await settingsService.createLevel(d); }
            else { await settingsService.updateLevel(d.id, d); }
            setSnack({ open: true, message: 'บันทึกสำเร็จ', severity: 'success' });
            setDialog({ open: false, mode: 'create', data: {} });
            load();
        } catch (e) { setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' }); }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบ Level นี้?')) return;
        try { await settingsService.deleteLevel(id); load(); setSnack({ open: true, message: 'ลบสำเร็จ', severity: 'success' }); }
        catch (e) { setSnack({ open: true, message: e.response?.data?.message || 'ไม่สามารถลบได้', severity: 'error' }); }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" size="small" startIcon={<Add />}
                    onClick={() => setDialog({ open: true, mode: 'create', data: { role_id: '', level_score: 10, name: '' } })}>
                    เพิ่ม Level
                </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#F5F7FB' }}>
                        <TableCell>Level Score</TableCell>
                        <TableCell>ชื่อ</TableCell>
                        <TableCell>กลุ่มตำแหน่ง (Role)</TableCell>
                        <TableCell align="center">พนักงาน</TableCell>
                        <TableCell align="center">จัดการ</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {levels.map(l => (
                            <TableRow key={l.id} hover>
                                <TableCell><Chip label={l.level_score} size="small" color={l.level_score <= 3 ? 'error' : l.level_score <= 5 ? 'warning' : 'default'} /></TableCell>
                                <TableCell><Typography fontWeight={600}>{l.name || '-'}</Typography></TableCell>
                                <TableCell>{l.role_name}</TableCell>
                                <TableCell align="center">{l.employee_count || 0}</TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: { ...l } })}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(l.id)} disabled={l.employee_count > 0}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={dialog.open} onClose={() => setDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle>{dialog.mode === 'create' ? 'เพิ่ม Level' : 'แก้ไข Level'}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                        <InputLabel>กลุ่มตำแหน่ง (Role)</InputLabel>
                        <Select label="กลุ่มตำแหน่ง (Role)" value={dialog.data.role_id || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, role_id: e.target.value } }))}>
                            {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField fullWidth label="Level Score (1=สูงสุด)" type="number" sx={{ mb: 2 }} value={dialog.data.level_score || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, level_score: e.target.value } }))} />
                    <TextField fullWidth label="ชื่อตำแหน่ง (เช่น Programmer, MD)" sx={{ mb: 2 }} value={dialog.data.name || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name: e.target.value } }))} />
                    <TextField fullWidth label="คำอธิบาย" value={dialog.data.description || ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, description: e.target.value } }))} />
                </DialogContent>
                <DialogActions><Button onClick={() => setDialog(d => ({ ...d, open: false }))}>ยกเลิก</Button><Button variant="contained" onClick={handleSave}>บันทึก</Button></DialogActions>
            </Dialog>
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
        </Box>
    );
}

// ————————————————————
// SYSTEM CONFIG TAB
// ————————————————————
function ConfigTab() {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await settingsService.getSystemConfig();
            const cfg = res.data.data.config || {};
            setConfig(cfg);
            const vals = {};
            Object.values(cfg).flat().forEach(item => { vals[item.config_key] = item.config_value; });
            setEditValues(vals);
        } catch { setConfig({}); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsService.updateSystemConfig(editValues);
            setSnack({ open: true, message: 'บันทึกค่าคงที่สำเร็จ', severity: 'success' });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
        setSaving(false);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

    const catIcons = { ATTENDANCE: '📍', PAYROLL: '💰', SECURITY: '🔒' };

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>⚡ ค่าคงที่ระบบ</Typography>
            {Object.entries(config).map(([category, items]) => (
                <Paper key={category} variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Typography fontWeight={700} color="primary" gutterBottom>
                        {catIcons[category] || '⚙️'} {category}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        {items.map(item => (
                            <Grid item xs={12} sm={6} md={4} key={item.config_key}>
                                {item.value_type === 'BOOLEAN' ? (
                                    <FormControlLabel
                                        control={<Switch checked={editValues[item.config_key] === '1' || editValues[item.config_key] === 'true'} onChange={e => setEditValues(v => ({ ...v, [item.config_key]: e.target.checked ? '1' : '0' }))} />}
                                        label={item.description || item.config_key}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth size="small"
                                        label={item.description || item.config_key}
                                        type={item.value_type === 'NUMBER' ? 'number' : 'text'}
                                        value={editValues[item.config_key] || ''}
                                        onChange={e => setEditValues(v => ({ ...v, [item.config_key]: e.target.value }))}
                                        helperText={item.config_key}
                                    />
                                )}
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="large" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                    {saving ? 'กำลังบันทึก...' : '💾 บันทึกทั้งหมด'}
                </Button>
            </Box>
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// ADMIN USERS TAB
// ————————————————————
function AdminTab() {
    const [admins, setAdmins] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try { const res = await settingsService.getAdminUsers(); setAdmins(res.data.data.admins || []); } catch { setAdmins([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSearch = async (q) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try { const res = await settingsService.searchUsers(q); setSearchResults(res.data.data.users || []); }
        catch { setSearchResults([]); }
    };

    const handleToggle = async (id, isAdmin) => {
        const action = isAdmin ? 'เพิ่มเป็น Admin' : 'ถอดสิทธิ์ Admin';
        if (!confirm(`ต้องการ${action}?`)) return;
        try {
            await settingsService.toggleAdmin(id, isAdmin);
            setSnack({ open: true, message: `${action}สำเร็จ`, severity: 'success' });
            load();
            setSearchQuery('');
            setSearchResults([]);
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>👑 ผู้ดูแลระบบ</Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography fontWeight={600} gutterBottom>Admin ปัจจุบัน ({admins.length} คน)</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead><TableRow sx={{ bgcolor: '#F5F7FB' }}>
                            <TableCell>Username</TableCell>
                            <TableCell>ชื่อ</TableCell>
                            <TableCell>ตำแหน่ง</TableCell>
                            <TableCell>Login ล่าสุด</TableCell>
                            <TableCell align="center">จัดการ</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                            {admins.map(a => (
                                <TableRow key={a.id} hover>
                                    <TableCell><Chip label={a.username} size="small" color="primary" /></TableCell>
                                    <TableCell>{a.first_name_th} {a.last_name_th}</TableCell>
                                    <TableCell>{a.position_name || '-'}</TableCell>
                                    <TableCell>{a.last_login_at ? new Date(a.last_login_at).toLocaleString('th-TH') : '-'}</TableCell>
                                    <TableCell align="center">
                                        <Button size="small" color="error" variant="outlined" onClick={() => handleToggle(a.id, false)}>ถอดสิทธิ์</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography fontWeight={600} gutterBottom>เพิ่ม Admin ใหม่</Typography>
                <TextField
                    fullWidth size="small" placeholder="ค้นหาพนักงาน (ชื่อ, username, รหัส)..."
                    value={searchQuery} onChange={e => handleSearch(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
                    sx={{ mb: 2 }}
                />
                {searchResults.length > 0 && (
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                {searchResults.filter(u => !u.is_admin).map(u => (
                                    <TableRow key={u.id} hover>
                                        <TableCell>{u.employee_code || '-'}</TableCell>
                                        <TableCell>{u.first_name_th} {u.last_name_th} ({u.username})</TableCell>
                                        <TableCell>{u.position_name || '-'}</TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="contained" onClick={() => handleToggle(u.id, true)}>+ เพิ่มเป็น Admin</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// PERMISSIONS TAB (Level × Page Matrix)
// ————————————————————
function PermissionTab() {
    const [matrix, setMatrix] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('');
    const [checkedPages, setCheckedPages] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try { const res = await settingsService.getPermissionMatrix(); setMatrix(res.data.data); } catch { setMatrix(null); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!matrix || !selectedLevel) return;
        const checked = {};
        matrix.pages.forEach(p => {
            checked[p.id] = !!matrix.permissions[`${selectedLevel}_${p.id}`];
        });
        setCheckedPages(checked);
    }, [selectedLevel, matrix]);

    const handleSave = async () => {
        setSaving(true);
        const pageIds = Object.entries(checkedPages).filter(([, v]) => v).map(([k]) => parseInt(k));
        try {
            await settingsService.savePermissionMatrix(parseInt(selectedLevel), pageIds);
            setSnack({ open: true, message: 'บันทึกสิทธิ์สำเร็จ', severity: 'success' });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
        setSaving(false);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
    if (!matrix) return <Alert severity="error">ไม่สามารถโหลดข้อมูลสิทธิ์ได้</Alert>;

    const systems = matrix.pages.filter(p => !p.parent_id);
    const subPages = (parentId) => matrix.pages.filter(p => p.parent_id === parentId);

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>🔒 สิทธิ์การเข้าถึง (Level × Page)</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>เลือก Level</InputLabel>
                <Select label="เลือก Level" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                    {matrix.levels.map(l => (
                        <MenuItem key={l.id} value={l.id}>Score {l.level_score} — {l.name || l.role_name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedLevel && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    {systems.map(sys => (
                        <Box key={sys.id} mb={2}>
                            <FormControlLabel
                                control={<Checkbox checked={!!checkedPages[sys.id]} onChange={e => setCheckedPages(p => ({ ...p, [sys.id]: e.target.checked }))} />}
                                label={<Typography fontWeight={700}>{sys.name_th} ({sys.code})</Typography>}
                            />
                            <Box pl={4}>
                                {subPages(sys.id).map(page => (
                                    <FormControlLabel key={page.id}
                                        control={<Checkbox checked={!!checkedPages[page.id]} onChange={e => setCheckedPages(p => ({ ...p, [page.id]: e.target.checked }))} size="small" />}
                                        label={page.name_th}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                            {saving ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์'}
                        </Button>
                    </Box>
                </Paper>
            )}

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// MENU STRUCTURE TAB
// ————————————————————
function MenuStructureTab() {
    const [structure, setStructure] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: {} });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await settingsService.getAppStructure();
            setStructure(res.data.data.structure || []);
        } catch { setStructure([]); }
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        const d = dialog.data;
        try {
            if (dialog.mode === 'create') {
                await settingsService.createAppStructure(d);
                setSnack({ open: true, message: 'สร้างเมนูสำเร็จ', severity: 'success' });
            } else {
                await settingsService.updateAppStructure(d.id, d);
                setSnack({ open: true, message: 'อัปเดตเมนูสำเร็จ', severity: 'success' });
            }
            setDialog({ open: false, mode: 'create', data: {} });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบเมนูนี้?')) return;
        try {
            await settingsService.deleteAppStructure(id);
            setSnack({ open: true, message: 'ลบเมนูสำเร็จ', severity: 'success' });
            load();
        } catch (e) {
            setSnack({ open: true, message: e.response?.data?.message || 'ไม่สามารถลบได้', severity: 'error' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

    // Group: systems (parent_id = null) and their children
    const systems = structure.filter(s => !s.parent_id);
    const getChildren = (parentId) => structure.filter(s => s.parent_id === parentId);

    const typeColor = (type) => {
        if (type === 'SYSTEM') return 'primary';
        if (type === 'TAB') return 'warning';
        return 'default';
    };

    const openCreate = (parentId = null) => {
        setDialog({
            open: true,
            mode: 'create',
            data: {
                parent_id: parentId,
                slug: '',
                name_th: '',
                name_en: '',
                icon: '',
                type: parentId ? 'PAGE' : 'SYSTEM',
                module: '',
                route: '',
                sort_order: 0,
                is_active: 1,
            }
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>📋 โครงสร้างเมนูระบบ</Typography>
                <Button variant="contained" size="small" startIcon={<Add />}
                    onClick={() => openCreate()}>เพิ่ม System</Button>
            </Box>

            {systems.map(sys => (
                <Paper key={sys.id} variant="outlined" sx={{ mb: 2 }}>
                    {/* System Header */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 1.5, bgcolor: '#F0F4FF', borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={sys.type} size="small" color={typeColor(sys.type)} />
                            <Typography fontWeight={700}>{sys.slug}</Typography>
                            <Typography variant="body2" color="text.secondary">— {sys.name_th}</Typography>
                            {sys.icon && <Chip label={sys.icon} size="small" variant="outlined" />}
                        </Box>
                        <Box>
                            <Chip label={sys.is_active ? 'Active' : 'Inactive'} size="small"
                                color={sys.is_active ? 'success' : 'default'} variant="outlined" sx={{ mr: 1 }} />
                            <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: { ...sys } })}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(sys.id)}>
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Children pages */}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                                    <TableCell sx={{ width: 60 }}>Order</TableCell>
                                    <TableCell>Slug</TableCell>
                                    <TableCell>ชื่อ (TH)</TableCell>
                                    <TableCell>Icon</TableCell>
                                    <TableCell>Route</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Module</TableCell>
                                    <TableCell align="center">สถานะ</TableCell>
                                    <TableCell align="center">จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getChildren(sys.id).map(page => (
                                    <TableRow key={page.id} hover>
                                        <TableCell>{page.sort_order}</TableCell>
                                        <TableCell><Typography fontWeight={600} fontSize={13}>{page.slug}</Typography></TableCell>
                                        <TableCell>{page.name_th}</TableCell>
                                        <TableCell><Chip label={page.icon || '-'} size="small" variant="outlined" /></TableCell>
                                        <TableCell><Typography variant="caption" fontFamily="monospace">{page.route || '-'}</Typography></TableCell>
                                        <TableCell><Chip label={page.type} size="small" color={typeColor(page.type)} /></TableCell>
                                        <TableCell>{page.module || '-'}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={page.is_active ? 'Active' : 'Off'} size="small"
                                                color={page.is_active ? 'success' : 'default'} variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: { ...page } })}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(page.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {getChildren(sys.id).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 2, color: 'text.secondary' }}>ไม่มี Sub-menu</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Add Sub-menu button */}
                    <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button size="small" startIcon={<Add />} onClick={() => openCreate(sys.id)}>
                            เพิ่ม Sub-menu
                        </Button>
                    </Box>
                </Paper>
            ))}

            {/* Create/Edit Dialog */}
            <Dialog open={dialog.open} onClose={() => setDialog(d => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle>{dialog.mode === 'create' ? 'เพิ่มเมนู' : 'แก้ไขเมนู'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Slug (unique)" value={dialog.data.slug || ''}
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, slug: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select label="Type" value={dialog.data.type || 'PAGE'}
                                    onChange={e => setDialog(d => ({ ...d, data: { ...d.data, type: e.target.value } }))}>
                                    <MenuItem value="SYSTEM">SYSTEM</MenuItem>
                                    <MenuItem value="PAGE">PAGE</MenuItem>
                                    <MenuItem value="TAB">TAB</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="ชื่อ (TH)" value={dialog.data.name_th || ''}
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name_th: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="ชื่อ (EN)" value={dialog.data.name_en || ''}
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, name_en: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="Icon (MUI)" value={dialog.data.icon || ''}
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, icon: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="Module" value={dialog.data.module || ''}
                                placeholder="CORE, HRM, PAY, ACC"
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, module: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="Sort Order" type="number" value={dialog.data.sort_order ?? 0}
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, sort_order: parseInt(e.target.value) || 0 } }))} />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField fullWidth size="small" label="Route" value={dialog.data.route || ''}
                                placeholder="/settings/company"
                                onChange={e => setDialog(d => ({ ...d, data: { ...d.data, route: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControlLabel
                                control={<Switch checked={dialog.data.is_active === 1 || dialog.data.is_active === true}
                                    onChange={e => setDialog(d => ({ ...d, data: { ...d.data, is_active: e.target.checked ? 1 : 0 } }))} />}
                                label="Active"
                            />
                        </Grid>
                        {dialog.data.parent_id && (
                            <Grid item xs={12}>
                                <Chip label={`Parent ID: ${dialog.data.parent_id}`} size="small" variant="outlined" />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog(d => ({ ...d, open: false }))}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                <Alert severity={snack.severity}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}

// ————————————————————
// MAIN SETTINGS PAGE
// ————————————————————
export default function SettingsPage() {
    const location = useLocation();

    // Determine which sub-page to render from the route path
    // Routes from sidebar: /settings/company, /settings/branch, /settings/org,
    //   /settings/permission, /settings/menu, /settings/config, /settings/admin
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/settings/branch')) return 'branches';
        if (path.includes('/settings/org')) return 'org';
        if (path.includes('/settings/permission')) return 'permissions';
        if (path.includes('/settings/menu')) return 'menu';
        if (path.includes('/settings/config')) return 'config';
        if (path.includes('/settings/admin')) return 'admin';
        // default: /settings/company or any other
        return 'companies';
    };

    const renderTab = () => {
        switch (getActiveTab()) {
            case 'companies': return <CompanyTab />;
            case 'branches': return <BranchTab />;
            case 'org': return <OrgTab />;
            case 'permissions': return <PermissionTab />;
            case 'menu': return <MenuStructureTab />;
            case 'config': return <ConfigTab />;
            case 'admin': return <AdminTab />;
            default: return <CompanyTab />;
        }
    };

    return (
        <Box>
            {renderTab()}
        </Box>
    );
}
