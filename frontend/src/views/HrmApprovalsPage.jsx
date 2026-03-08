import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, FormControl, InputLabel, Select,
    MenuItem, Grid, IconButton, Tooltip, CircularProgress, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Snackbar, Alert
} from '@mui/material';
import {
    CheckCircle as ApproveIcon, Cancel as RejectIcon,
    Gavel as GavelIcon, Refresh as RefreshIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { hrmService } from '../services/api';

const typeLabels = { leave: 'ลางาน', ot: 'OT', time_correction: 'แก้เวลา', shift_swap: 'สลับกะ' };
const typeColors = { leave: 'info', ot: 'warning', time_correction: 'secondary', shift_swap: 'primary' };
const statusLabels = { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ', CANCELLED: 'ยกเลิก' };
const statusColors = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default' };

export default function HrmApprovalsPage() {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: 'all', status: 'PENDING' });
    const [rejectDialog, setRejectDialog] = useState({ open: false, item: null, reason: '' });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const loadApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await hrmService.getApprovals(filters);
            setApprovals(res.data?.data?.approvals || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [filters]);

    useEffect(() => { loadApprovals(); }, [loadApprovals]);

    const handleApprove = async (item) => {
        try {
            await hrmService.approveRequest(item.id, item.request_type);
            setSnack({ open: true, message: 'อนุมัติสำเร็จ', severity: 'success' });
            loadApprovals();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
    };

    const handleReject = async () => {
        const { item, reason } = rejectDialog;
        try {
            await hrmService.rejectRequest(item.id, item.request_type, reason);
            setSnack({ open: true, message: 'ปฏิเสธสำเร็จ', severity: 'success' });
            setRejectDialog({ open: false, item: null, reason: '' });
            loadApprovals();
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
    };

    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GavelIcon color="primary" /> อนุมัติคำร้อง
                        {pendingCount > 0 && (
                            <Chip label={`${pendingCount} รออนุมัติ`} color="warning" size="small" sx={{ ml: 1 }} />
                        )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        จัดการคำร้องลา, OT, แก้เวลา, สลับกะ
                    </Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadApprovals}
                    sx={{ textTransform: 'none', borderRadius: 2 }}>
                    รีเฟรช
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>ประเภท</InputLabel>
                        <Select value={filters.type} label="ประเภท" onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                            <MenuItem value="all">ทั้งหมด</MenuItem>
                            {Object.entries(typeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>สถานะ</InputLabel>
                        <Select value={filters.status} label="สถานะ" onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
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
                                    <TableCell sx={{ fontWeight: 700 }}>วันที่ส่ง</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ผู้ขอ</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ประเภท</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>รายละเอียด</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {approvals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            ไม่มีคำร้อง
                                        </TableCell>
                                    </TableRow>
                                ) : approvals.map((item, idx) => (
                                    <TableRow key={`${item.request_type}-${item.id}-${idx}`} hover>
                                        <TableCell>
                                            <Typography variant="body2">{item.created_at?.split(' ')[0]}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.created_at?.split(' ')[1]?.substring(0, 5)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                                    {(item.first_name_th || '?')[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{item.first_name_th} {item.last_name_th}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{item.employee_code}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={typeLabels[item.request_type] || item.request_type} size="small"
                                                color={typeColors[item.request_type] || 'default'} variant="outlined" />
                                            {item.type_name && <Typography variant="caption" display="block" color="text.secondary">{item.type_name}</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.start_date}{item.end_date !== item.start_date ? ` → ${item.end_date}` : ''}</Typography>
                                            {item.total_days && <Typography variant="caption" color="text.secondary"> ({item.total_days} วัน)</Typography>}
                                            {item.total_hours && <Typography variant="caption" color="text.secondary"> ({item.total_hours} ชม.)</Typography>}
                                            {item.reason && <Typography variant="caption" display="block" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason}</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={statusLabels[item.status] || item.status} size="small"
                                                color={statusColors[item.status] || 'default'} />
                                        </TableCell>
                                        <TableCell>
                                            {item.status === 'PENDING' && (
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <Tooltip title="อนุมัติ">
                                                        <IconButton size="small" color="success" onClick={() => handleApprove(item)}>
                                                            <ApproveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="ปฏิเสธ">
                                                        <IconButton size="small" color="error"
                                                            onClick={() => setRejectDialog({ open: true, item, reason: '' })}>
                                                            <RejectIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">ทั้งหมด {approvals.length} รายการ</Typography>
                </Box>
            </Paper>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onClose={() => setRejectDialog(r => ({ ...r, open: false }))}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>❌ ปฏิเสธคำร้อง</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        คำร้อง: {typeLabels[rejectDialog.item?.request_type]} ของ {rejectDialog.item?.first_name_th} {rejectDialog.item?.last_name_th}
                    </Typography>
                    <TextField fullWidth multiline rows={3} label="เหตุผลที่ปฏิเสธ"
                        value={rejectDialog.reason}
                        onChange={e => setRejectDialog(r => ({ ...r, reason: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRejectDialog(r => ({ ...r, open: false }))} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" color="error" onClick={handleReject} sx={{ textTransform: 'none', borderRadius: 2 }}>ปฏิเสธ</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
