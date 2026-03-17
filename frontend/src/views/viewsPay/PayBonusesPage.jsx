import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, TextField, MenuItem,
    Snackbar, Alert, CircularProgress, LinearProgress, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import {
    CardGiftcard as BonusIcon,
    Calculate as CalcIcon,
    CheckCircle as ApproveIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { payService, settingsService } from '../../services/api';

const fmtMoney = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

const STATUS_MAP = {
    DRAFT: { label: 'ร่าง', color: 'default' },
    APPROVED: { label: 'อนุมัติแล้ว', color: 'success' },
};

export default function PayBonusesPage() {
    // State
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [bonuses, setBonuses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Edit dialog
    const [editDialog, setEditDialog] = useState(false);
    const [editBonus, setEditBonus] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Snackbar
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

    // Load companies
    useEffect(() => {
        (async () => {
            try {
                const res = await settingsService.getCompanies();
                const raw = res.data?.data;
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.companies) ? raw.companies : (Array.isArray(res.data) ? res.data : []));
                setCompanies(list);
                if (list.length > 0) setSelectedCompany(list[0].id);
            } catch (err) { console.error(err); }
        })();
    }, []);

    // Load bonuses
    const loadBonuses = useCallback(async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const res = await payService.getBonuses({ year: selectedYear, company_id: selectedCompany });
            const data = res.data?.data || res.data || [];
            setBonuses(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [selectedCompany, selectedYear]);

    useEffect(() => { loadBonuses(); }, [loadBonuses]);

    // Calculate bonus scores
    const handleCalculate = async () => {
        if (!window.confirm(`คำนวณคะแนนโบนัสปี ${selectedYear} สำหรับบริษัทนี้?`)) return;
        setLoading(true);
        try {
            const res = await payService.calculateBonuses({ year: selectedYear, company_id: selectedCompany });
            const count = res.data?.count || res.data?.data?.count || 0;
            showSnack(`คำนวณคะแนนโบนัสสำเร็จ ${count} คน`);
            loadBonuses();
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
        setLoading(false);
    };

    // Approve all
    const handleApproveAll = async () => {
        if (!window.confirm('อนุมัติโบนัสทั้งหมดที่เป็นร่าง?')) return;
        try {
            await payService.approveBonuses({ year: selectedYear, company_id: selectedCompany });
            showSnack('อนุมัติโบนัสสำเร็จ');
            loadBonuses();
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editBonus) return;
        try {
            await payService.updateBonus(editBonus.id, {
                bonus_amount: parseFloat(editAmount) || 0,
                notes: editNotes,
            });
            showSnack('อัปเดตโบนัสสำเร็จ');
            setEditDialog(false);
            loadBonuses();
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    // Summary
    const draftCount = bonuses.filter(b => b.status === 'DRAFT').length;
    const approvedCount = bonuses.filter(b => b.status === 'APPROVED').length;
    const totalAmount = bonuses.reduce((sum, b) => sum + Number(b.bonus_amount || 0), 0);
    const avgScore = bonuses.length > 0 ? bonuses.reduce((sum, b) => sum + Number(b.total_score || 0), 0) / bonuses.length : 0;

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <BonusIcon sx={{ fontSize: 32, color: '#F59E0B' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                    โบนัสประจำปี (Bonuses)
                </Typography>
                <TextField select size="small" label="บริษัท" value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)} sx={{ minWidth: 200 }}>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name_th}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="ปี" value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)} sx={{ minWidth: 100 }}>
                    {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </TextField>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'จำนวนพนักงาน', value: bonuses.length, color: '#3B82F6' },
                    { label: 'คะแนนเฉลี่ย', value: avgScore.toFixed(1) + '/100', color: '#8B5CF6' },
                    { label: 'โบนัสรวม', value: `฿${fmtMoney(totalAmount)}`, color: '#10B981' },
                    { label: 'ร่าง / อนุมัติ', value: `${draftCount} / ${approvedCount}`, color: '#F59E0B' },
                ].map((card, i) => (
                    <Paper key={i} sx={{
                        flex: '1 1 200px', p: 2, borderRadius: 3,
                        borderLeft: `4px solid ${card.color}`,
                    }}>
                        <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: card.color }}>{card.value}</Typography>
                    </Paper>
                ))}
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Actions */}
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                        รายการโบนัส {selectedYear}
                    </Typography>
                    <Button variant="contained" startIcon={<CalcIcon />} size="small"
                        onClick={handleCalculate}>
                        คำนวณคะแนน
                    </Button>
                    {draftCount > 0 && (
                        <Button variant="outlined" startIcon={<ApproveIcon />} size="small"
                            color="success" onClick={handleApproveAll}>
                            อนุมัติทั้งหมด ({draftCount})
                        </Button>
                    )}
                </Box>

                {/* Table */}
                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
                ) : bonuses.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        ยังไม่มีข้อมูลโบนัส — กดปุ่ม "คำนวณคะแนน" เพื่อเริ่ม
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                                    <TableCell>รหัส</TableCell>
                                    <TableCell>ชื่อ-นามสกุล</TableCell>
                                    <TableCell align="right">เงินเดือนฐาน</TableCell>
                                    <TableCell align="center">ประเมิน (70)</TableCell>
                                    <TableCell align="center">ขยัน (30)</TableCell>
                                    <TableCell align="center">รวม (100)</TableCell>
                                    <TableCell align="right">จำนวนโบนัส</TableCell>
                                    <TableCell align="center">สถานะ</TableCell>
                                    <TableCell align="right">แก้ไข</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bonuses.map(b => {
                                    const totalScore = Number(b.total_score || 0);
                                    const scoreColor = totalScore >= 80 ? 'success.main' : totalScore >= 50 ? 'warning.main' : 'error.main';
                                    return (
                                        <TableRow key={b.id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{b.employee_code}</TableCell>
                                            <TableCell>{b.first_name_th} {b.last_name_th}</TableCell>
                                            <TableCell align="right">฿{fmtMoney(b.base_salary)}</TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress variant="determinate" value={Math.min(Number(b.evaluation_score || 0) / 70 * 100, 100)}
                                                        sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                                                    <Typography variant="caption" sx={{ minWidth: 35 }}>
                                                        {Number(b.evaluation_score || 0).toFixed(1)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress variant="determinate" value={Math.min(Number(b.attendance_score || 0) / 30 * 100, 100)}
                                                        color="secondary" sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                                                    <Typography variant="caption" sx={{ minWidth: 35 }}>
                                                        {Number(b.attendance_score || 0).toFixed(1)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography sx={{ fontWeight: 700, color: scoreColor }}>
                                                    {totalScore.toFixed(1)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                {b.bonus_amount ? `฿${fmtMoney(b.bonus_amount)}` : '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={STATUS_MAP[b.status]?.label || b.status}
                                                    color={STATUS_MAP[b.status]?.color || 'default'} size="small" />
                                            </TableCell>
                                            <TableCell align="right">
                                                {b.status === 'DRAFT' && (
                                                    <Tooltip title="กำหนดจำนวนโบนัส">
                                                        <IconButton size="small" onClick={() => {
                                                            setEditBonus(b);
                                                            setEditAmount(b.bonus_amount || '');
                                                            setEditNotes(b.notes || '');
                                                            setEditDialog(true);
                                                        }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>กำหนดจำนวนโบนัส</DialogTitle>
                <DialogContent>
                    {editBonus && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {editBonus.employee_code} — {editBonus.first_name_th} {editBonus.last_name_th}
                            </Typography>
                            <Typography variant="body2">
                                คะแนนรวม: <strong>{Number(editBonus.total_score || 0).toFixed(1)}/100</strong>
                            </Typography>
                            <TextField label="จำนวนโบนัส (บาท)" type="number" value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)} fullWidth
                                slotProps={{ htmlInput: { min: 0, step: 100 } }} />
                            <TextField label="หมายเหตุ" value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                multiline rows={2} fullWidth />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSaveEdit}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
