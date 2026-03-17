import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, TextField, FormControl,
    InputLabel, Select, MenuItem, CircularProgress, Tabs, Tab, Divider
} from '@mui/material';
import {
    BarChart as ReportIcon, Download as DownloadIcon,
    People as PeopleIcon, AccessTime as TimeIcon,
    EventBusy as LeaveReportIcon, WorkOutline as OtIcon,
} from '@mui/icons-material';
import { hrmService, settingsService } from '../../services/api';

export default function HrmReportsPage() {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [companies, setCompanies] = useState([]);
    const now = new Date();
    const [filters, setFilters] = useState({
        company_id: '',
        start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        end_date: now.toISOString().split('T')[0],
    });

    useEffect(() => {
        settingsService.getCompanies().then(res => setCompanies(res.data?.data?.companies || [])).catch(console.error);
    }, []);

    useEffect(() => { loadReport(); }, [tab]);

    const loadReport = async () => {
        setLoading(true);
        try {
            let res;
            const params = { ...filters };
            Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

            switch (tab) {
                case 0: res = await hrmService.getEmployeeReport(); break;
                case 1: res = await hrmService.getAttendanceReport(params); break;
                case 2: res = await hrmService.getOtReport(params); break;
                case 3: res = await hrmService.getLeaveReport(params); break;
                default: return;
            }
            setData(res.data?.data);
        } catch (err) { console.error(err); setData(null); }
        setLoading(false);
    };

    const tabs = [
        { label: 'สถานะพนักงาน', icon: <PeopleIcon /> },
        { label: 'รายงาน Attendance', icon: <TimeIcon /> },
        { label: 'รายงาน OT', icon: <OtIcon /> },
        { label: 'รายงานการลา', icon: <LeaveReportIcon /> },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReportIcon color="primary" /> รายงานสรุป
                    </Typography>
                    <Typography variant="body2" color="text.secondary">รายงานสรุปข้อมูล HR ทั้งหมด</Typography>
                </Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
                sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
                {tabs.map((t, i) => <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />)}
            </Tabs>

            {/* Date Filters (for tabs 1-3) */}
            {tab > 0 && (
                <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }} elevation={0}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>บริษัท</InputLabel>
                            <Select value={filters.company_id} label="บริษัท" onChange={e => setFilters(f => ({ ...f, company_id: e.target.value }))}>
                                <MenuItem value="">ทั้งหมด</MenuItem>
                                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField size="small" label="วันเริ่ม" type="date" slotProps={{ inputLabel: { shrink: true } }}
                            value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))}
                            sx={{ minWidth: 160 }} />
                        <TextField size="small" label="วันสิ้นสุด" type="date" slotProps={{ inputLabel: { shrink: true } }}
                            value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))}
                            sx={{ minWidth: 160 }} />
                        <Button variant="contained" onClick={loadReport}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                            ดูรายงาน
                        </Button>
                    </Box>
                </Paper>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <>
                    {/* TAB 0: Employee Status */}
                    {tab === 0 && data && (
                        <>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                {[
                                    { label: 'พนักงานทั้งหมด', value: data.total || 0, color: '#3B82F6', icon: '👥' },
                                    { label: 'ทดลองงาน', value: data.probation || 0, color: '#F59E0B', icon: '🔶' },
                                    { label: 'ประจำ', value: data.full_time || 0, color: '#22C55E', icon: '✅' },
                                    { label: 'ลาออก/เลิกจ้าง', value: (data.resigned || 0) + (data.terminated || 0), color: '#EF4444', icon: '❌' },
                                ].map(item => (
                                    <Paper key={item.label} sx={{ p: 3, textAlign: 'center', borderRadius: 3, border: `2px solid ${item.color}20`, flex: 1 }} elevation={0}>
                                        <Typography variant="h3" fontWeight={700} sx={{ color: item.color }}>{item.icon} {item.value}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                    </Paper>
                                ))}
                            </Box>
                            {data.by_company?.length > 0 && (
                                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="subtitle2" fontWeight={700}>จำนวนพนักงานแยกตามบริษัท</Typography>
                                    </Box>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>บริษัท</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>จำนวน</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>ทดลอง</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>ประจำ</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.by_company.map((c, i) => (
                                                    <TableRow key={i} hover>
                                                        <TableCell sx={{ fontWeight: 600 }}>{c.company_code} - {c.company_name}</TableCell>
                                                        <TableCell><Chip label={c.total} size="small" /></TableCell>
                                                        <TableCell><Chip label={c.probation} size="small" color="warning" /></TableCell>
                                                        <TableCell><Chip label={c.full_time} size="small" color="success" /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}
                        </>
                    )}

                    {/* TAB 1: Attendance */}
                    {tab === 1 && data && (
                        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    📊 รายงาน Attendance ({filters.start_date} ถึง {filters.end_date})
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชื่อ</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>วันทำงาน</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>สาย</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>สายรวม (นาที)</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ขาด</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(data.records || []).length === 0 ? (
                                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
                                        ) : (data.records || []).map((r, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell><Chip label={r.employee_code} size="small" variant="outlined" /></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{r.first_name_th} {r.last_name_th}</TableCell>
                                                <TableCell>{r.work_days}</TableCell>
                                                <TableCell><Chip label={r.late_count} size="small" color={r.late_count > 3 ? 'error' : r.late_count > 0 ? 'warning' : 'default'} /></TableCell>
                                                <TableCell>{r.late_minutes}</TableCell>
                                                <TableCell><Chip label={r.absent_days || 0} size="small" color={r.absent_days > 0 ? 'error' : 'default'} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* TAB 2: OT */}
                    {tab === 2 && data && (
                        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" fontWeight={700}>🌙 รายงาน OT ({filters.start_date} ถึง {filters.end_date})</Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชื่อ</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>จำนวนครั้ง</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชั่วโมงรวม</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(data.records || []).length === 0 ? (
                                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
                                        ) : (data.records || []).map((r, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell><Chip label={r.employee_code} size="small" variant="outlined" /></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{r.first_name_th} {r.last_name_th}</TableCell>
                                                <TableCell>{r.ot_count}</TableCell>
                                                <TableCell><Chip label={`${r.total_hours} ชม.`} size="small" color="warning" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* TAB 3: Leave */}
                    {tab === 3 && data && (
                        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={0}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" fontWeight={700}>📋 รายงานการลา ({filters.start_date} ถึง {filters.end_date})</Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>รหัส</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ชื่อ</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>ประเภทลา</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>จำนวนวัน</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(data.records || []).length === 0 ? (
                                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
                                        ) : (data.records || []).map((r, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell><Chip label={r.employee_code} size="small" variant="outlined" /></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{r.first_name_th} {r.last_name_th}</TableCell>
                                                <TableCell><Chip label={r.leave_type} size="small" /></TableCell>
                                                <TableCell>{r.total_days}</TableCell>
                                                <TableCell>
                                                    <Chip label={r.status === 'APPROVED' ? 'อนุมัติ' : r.status === 'PENDING' ? 'รอ' : r.status}
                                                        size="small" color={r.status === 'APPROVED' ? 'success' : 'warning'} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* No data state for empty response */}
                    {!data && !loading && (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0}>
                            <Typography variant="h6" color="text.secondary">{tab === 0 ? 'กดดูรายงาน' : 'เลือกช่วงเวลาแล้วกด "ดูรายงาน"'}</Typography>
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
}
