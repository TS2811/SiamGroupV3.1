import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, TextField, MenuItem,
    Snackbar, Alert, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import {
    AccountBalance as LoanIcon,
    Add as AddIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { payService, settingsService } from '../../services/api';

const fmtMoney = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

const STATUS_MAP = {
    ACTIVE: { label: 'กำลังผ่อน', color: 'warning' },
    COMPLETED: { label: 'ชำระครบ', color: 'success' },
    CANCELLED: { label: 'ยกเลิก', color: 'error' },
};

export default function PayLoansPage() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // Load loans
    const loadLoans = useCallback(async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const res = await payService.getLoans({ company_id: selectedCompany });
            const data = res.data?.data || res.data || [];
            setLoans(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [selectedCompany]);

    useEffect(() => { loadLoans(); }, [loadLoans]);

    // Summary
    const activeCount = loans.filter(l => l.status === 'ACTIVE').length;
    const completedCount = loans.filter(l => l.status === 'COMPLETED').length;
    const totalLoan = loans.reduce((sum, l) => sum + Number(l.loan_amount || 0), 0);
    const totalRemaining = loans.reduce((sum, l) => sum + Number(l.remaining_amount || 0), 0);

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <LoanIcon sx={{ fontSize: 32, color: '#3B82F6' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                    เงินกู้ / สวัสดิการ (Loans)
                </Typography>
                <TextField select size="small" label="บริษัท" value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)} sx={{ minWidth: 200 }}>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name_th}</MenuItem>)}
                </TextField>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'จำนวนเงินกู้', value: loans.length, color: '#3B82F6' },
                    { label: 'กำลังผ่อน', value: activeCount, color: '#F59E0B' },
                    { label: 'วงเงินรวม', value: `฿${fmtMoney(totalLoan)}`, color: '#8B5CF6' },
                    { label: 'คงเหลือ', value: `฿${fmtMoney(totalRemaining)}`, color: '#EF4444' },
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
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                        รายการเงินกู้
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
                ) : loans.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        ยังไม่มีรายการเงินกู้
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                                    <TableCell>รหัส</TableCell>
                                    <TableCell>ชื่อ-นามสกุล</TableCell>
                                    <TableCell>ประเภท</TableCell>
                                    <TableCell align="right">วงเงินกู้</TableCell>
                                    <TableCell align="right">ผ่อน/เดือน</TableCell>
                                    <TableCell align="right">ชำระแล้ว</TableCell>
                                    <TableCell align="right">คงเหลือ</TableCell>
                                    <TableCell align="center">สถานะ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loans.map(l => (
                                    <TableRow key={l.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{l.employee_code}</TableCell>
                                        <TableCell>{l.first_name_th} {l.last_name_th}</TableCell>
                                        <TableCell>{l.loan_type || '-'}</TableCell>
                                        <TableCell align="right">฿{fmtMoney(l.loan_amount)}</TableCell>
                                        <TableCell align="right">฿{fmtMoney(l.monthly_installment)}</TableCell>
                                        <TableCell align="right">฿{fmtMoney(l.paid_amount)}</TableCell>
                                        <TableCell align="right">฿{fmtMoney(l.remaining_amount)}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={STATUS_MAP[l.status]?.label || l.status}
                                                color={STATUS_MAP[l.status]?.color || 'default'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
