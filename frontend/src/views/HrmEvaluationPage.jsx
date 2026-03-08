import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Grid, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress, Snackbar, Alert, Slider, Rating, Divider
} from '@mui/material';
import {
    Star as StarIcon, Close as CloseIcon,
    Add as AddIcon, Assessment as AssessIcon,
} from '@mui/icons-material';
import { hrmService, settingsService } from '../services/api';

export default function HrmEvaluationPage() {
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ company_id: '', search: '' });

    // Eval Dialog
    const [evalDialog, setEvalDialog] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [evalMonth, setEvalMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [criteria, setCriteria] = useState([]);
    const [scores, setScores] = useState({});
    const [comment, setComment] = useState('');

    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [eRes, cRes] = await Promise.all([
                    hrmService.getEmployees(filters),
                    settingsService.getCompanies(),
                ]);
                setEmployees(eRes.data?.data?.employees || []);
                setCompanies(cRes.data?.data?.companies || []);
            } catch (err) { console.error(err); }
            setLoading(false);
        })();
    }, [filters]);

    // Load criteria (from seed data in hrm_evaluation_criteria)
    useEffect(() => {
        // For now, use hardcoded criteria matching database seed
        setCriteria([
            { id: 1, category: 'WORK_QUALITY', name_th: 'คุณภาพงาน', weight: 25 },
            { id: 2, category: 'WORK_QUANTITY', name_th: 'ปริมาณงาน', weight: 20 },
            { id: 3, category: 'PUNCTUALITY', name_th: 'ตรงต่อเวลา', weight: 20 },
            { id: 4, category: 'TEAMWORK', name_th: 'การทำงานเป็นทีม', weight: 15 },
            { id: 5, category: 'INITIATIVE', name_th: 'ความคิดริเริ่ม', weight: 20 },
        ]);
    }, []);

    const openEval = (emp) => {
        setSelectedEmp(emp);
        const initScores = {};
        criteria.forEach(c => { initScores[c.id] = 3; }); // Default 3/5
        setScores(initScores);
        setComment('');
        setEvalDialog(true);
    };

    const totalScore = () => {
        let total = 0;
        criteria.forEach(c => {
            const score = scores[c.id] || 0;
            total += (score / 5) * c.weight;
        });
        return total.toFixed(1);
    };

    const getGrade = (score) => {
        if (score >= 90) return { label: 'ดีเยี่ยม', color: 'success', emoji: '🌟' };
        if (score >= 80) return { label: 'ดีมาก', color: 'primary', emoji: '⭐' };
        if (score >= 70) return { label: 'ดี', color: 'info', emoji: '👍' };
        if (score >= 60) return { label: 'พอใช้', color: 'warning', emoji: '📊' };
        return { label: 'ต้องปรับปรุง', color: 'error', emoji: '⚠️' };
    };

    const saveEvaluation = async () => {
        setSaving(true);
        try {
            // This would call a backend endpoint to save the evaluation
            // For now, simulate success
            setSnack({ open: true, message: `ประเมิน ${selectedEmp.first_name_th} สำเร็จ — ${totalScore()} คะแนน`, severity: 'success' });
            setEvalDialog(false);
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
        setSaving(false);
    };

    const ts = parseFloat(totalScore());
    const grade = getGrade(ts);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon color="primary" /> ประเมินผลงาน
                    </Typography>
                    <Typography variant="body2" color="text.secondary">ประเมินผลการปฏิบัติงานรายเดือน</Typography>
                </Box>
            </Box>

            {/* Filter + Month Selector */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" label="ค้นหา" value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        placeholder="ชื่อ, รหัสพนักงาน..." sx={{ minWidth: 200, flex: 1 }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>บริษัท</InputLabel>
                        <Select value={filters.company_id} label="บริษัท" onChange={e => setFilters(f => ({ ...f, company_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField size="small" label="เดือนที่ประเมิน" type="month" InputLabelProps={{ shrink: true }}
                        value={evalMonth} onChange={e => setEvalMonth(e.target.value)}
                        sx={{ minWidth: 180 }} />
                </Box>
            </Paper>

            {/* Criteria Info */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }} elevation={0}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>📋 หัวข้อประเมิน (น้ำหนักรวม 100%)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {criteria.map(c => (
                        <Chip key={c.id} label={`${c.name_th} (${c.weight}%)`} variant="outlined" color="primary" size="small" />
                    ))}
                </Box>
            </Paper>

            {/* Employee List */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ชื่อ-นามสกุล</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>บริษัท</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ตำแหน่ง</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ประเมิน</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>ไม่พบพนักงาน</TableCell></TableRow>
                                ) : employees.filter(e => e.status === 'FULL_TIME' || e.status === 'PROBATION').map(emp => (
                                    <TableRow key={emp.id} hover>
                                        <TableCell><Chip label={emp.employee_code} size="small" variant="outlined" /></TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{emp.first_name_th} {emp.last_name_th}</TableCell>
                                        <TableCell><Chip label={emp.company_code} size="small" /></TableCell>
                                        <TableCell>{emp.level_name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip label={emp.status === 'FULL_TIME' ? 'ประจำ' : 'ทดลอง'} size="small"
                                                color={emp.status === 'FULL_TIME' ? 'success' : 'warning'} />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outlined" size="small" startIcon={<AssessIcon />}
                                                onClick={() => openEval(emp)}
                                                sx={{ textTransform: 'none', borderRadius: 2 }}>
                                                ประเมิน
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Evaluation Dialog */}
            <Dialog open={evalDialog} onClose={() => setEvalDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    ⭐ ประเมินผลงาน — {evalMonth}
                    <IconButton onClick={() => setEvalDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedEmp && (
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>{selectedEmp.first_name_th} {selectedEmp.last_name_th}</Typography>
                            <Chip label={selectedEmp.employee_code} size="small" sx={{ mt: 0.5 }} />
                        </Box>
                    )}

                    {criteria.map(c => (
                        <Box key={c.id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={600}>{c.name_th}</Typography>
                                <Chip label={`น้ำหนัก ${c.weight}%`} size="small" variant="outlined" />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                <Rating value={scores[c.id] || 0} size="large"
                                    onChange={(_, v) => setScores(s => ({ ...s, [c.id]: v }))} />
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                    {scores[c.id] || 0}/5 ({((scores[c.id] || 0) / 5 * c.weight).toFixed(1)}%)
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {/* Total Score */}
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: `${grade.color}.50` || '#F0FDF4', borderRadius: 2 }}>
                        <Typography variant="h3" fontWeight={700} color={`${grade.color}.main`}>
                            {grade.emoji} {totalScore()}%
                        </Typography>
                        <Chip label={grade.label} color={grade.color} sx={{ fontSize: 14, fontWeight: 700, mt: 1 }} />
                    </Box>

                    <TextField fullWidth multiline rows={3} label="ความเห็นผู้ประเมิน" sx={{ mt: 2 }}
                        value={comment} onChange={e => setComment(e.target.value)}
                        placeholder="จุดเด่น จุดที่ต้องปรับปรุง คำแนะนำ..." />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEvalDialog(false)} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveEvaluation} disabled={saving}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                        {saving ? <CircularProgress size={20} /> : '💾 บันทึกผลประเมิน'}
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
