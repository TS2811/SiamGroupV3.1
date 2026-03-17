import { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Avatar, Drawer,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Menu, MenuItem, Chip, Tooltip, useMediaQuery,
    useTheme, Badge, Button, Stack, Paper, BottomNavigation,
    BottomNavigationAction, SwipeableDrawer,
} from '@mui/material';
import {
    Menu as MenuIcon, Logout, ChevronLeft, ChevronRight,
    Person, Dashboard, AccessTime, Assignment, People,
    Schedule, CalendarMonth, Event, EventBusy, FactCheck,
    Star, BarChart, Receipt, Settings, Business, Store,
    AccountTree, Security, Tune, AdminPanelSettings,
    SpaceDashboard, AccountBalance, Group, Notifications,
    MoreHoriz, Close,
    // ACC Icons
    Description, AddBox, Autorenew, GridView, EditNote, CheckCircle,
    Paid, PostAdd, FormatListBulleted, ContentCopy, NoteAdd,
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 68;

// ========================================
// Icon Mapping
// ========================================
const iconMap = {
    Dashboard, SpaceDashboard, AccessTime, Assignment, Person, People, Group,
    Schedule, CalendarMonth, Event, EventBusy, FactCheck, Star, BarChart,
    Receipt, Settings, Business, Store, AccountTree, Security, Tune,
    AdminPanelSettings, AccountBalance, Menu: MenuIcon, Notifications,
    // ACC Icons
    Description, AddBox, Autorenew, GridView, EditNote, CheckCircle, Paid,
    PostAdd, FormatListBulleted, ContentCopy, NoteAdd,
};

function getIcon(iconName) {
    const Icon = iconMap[iconName] || Dashboard;
    return <Icon />;
}

// ========================================
// Main Layout Component
// ========================================
export default function MainLayout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, menuTree, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [activeSystem, setActiveSystem] = useState('MAIN');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);    // hamburger drawer
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);    // bottom "more" drawer
    const [anchorEl, setAnchorEl] = useState(null);

    // ========================================
    // Build menu structure
    // ========================================
    const systems = useMemo(() => {
        return menuTree
            .filter(m => m.type === 'SYSTEM' && !m.parent_id)
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [menuTree]);

    const currentSubPages = useMemo(() => {
        const sys = systems.find(s => s.slug === activeSystem);
        if (!sys) return [];
        return menuTree
            .filter(m => m.parent_id === sys.id && m.type === 'PAGE')
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [menuTree, systems, activeSystem]);

    // Auto-detect active system from current route
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/hrm')) setActiveSystem('HRM');
        else if (path.startsWith('/pay')) setActiveSystem('PAY');
        else if (path.startsWith('/acc')) setActiveSystem('ACC_MAIN');
        else if (path.startsWith('/settings')) setActiveSystem('SETTINGS');
        else setActiveSystem('MAIN');
    }, [location.pathname]);

    // ========================================
    // Handlers
    // ========================================
    const handleSystemChange = (slug) => {
        setActiveSystem(slug);
        const sys = systems.find(s => s.slug === slug);
        if (sys?.route) {
            navigate(sys.route);
        } else {
            // Navigate to first sub-page
            const subPages = menuTree
                .filter(m => m.parent_id === systems.find(s => s.slug === slug)?.id && m.type === 'PAGE')
                .sort((a, b) => a.sort_order - b.sort_order);
            if (subPages.length > 0 && subPages[0].route) {
                navigate(subPages[0].route);
            }
        }
        setMobileMenuOpen(false);
    };

    const handleNavigate = (route) => {
        navigate(route);
        setMobileMoreOpen(false);
    };

    const handleLogout = async () => {
        setAnchorEl(null);
        await logout();
        navigate('/login', { replace: true });
    };

    const displayName = user?.nickname || user?.first_name_th || user?.username;
    const companyCode = user?.employee?.company_code || '';

    // Bottom bar items (mobile) — show max 4 + more
    const bottomItems = currentSubPages.slice(0, 4);
    const hasMore = currentSubPages.length > 4;

    // ========================================
    // RENDER: Top Navigation Bar
    // ========================================
    const renderTopBar = () => (
        <AppBar
            position="fixed"
            sx={{
                bgcolor: '#0D47A1',
                background: 'linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)',
                zIndex: theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ gap: 0.5 }}>
                {/* Mobile: Hamburger */}
                {isMobile && (
                    <IconButton color="inherit" onClick={() => setMobileMenuOpen(true)} edge="start">
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Logo */}
                <Box
                    onClick={() => { navigate('/dashboard'); setActiveSystem('MAIN'); }}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                        mr: isMobile ? 'auto' : 2,
                    }}
                >
                    <Box sx={{
                        width: 34, height: 34, borderRadius: 1.5,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>SG</Typography>
                    </Box>
                    {!isMobile && (
                        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            SiamGroup
                        </Typography>
                    )}
                </Box>

                {/* Desktop: System Tabs */}
                {!isMobile && (
                    <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
                        {systems.map((sys) => {
                            const isActive = sys.slug === activeSystem;
                            return (
                                <Button
                                    key={sys.slug}
                                    onClick={() => handleSystemChange(sys.slug)}
                                    startIcon={getIcon(sys.icon)}
                                    size="small"
                                    sx={{
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: isActive ? 700 : 400,
                                        fontSize: 13,
                                        px: 1.5,
                                        py: 0.8,
                                        borderRadius: 2,
                                        bgcolor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                                        minWidth: 'auto',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {sys.name_th}
                                </Button>
                            );
                        })}
                    </Stack>
                )}

                {/* Company Badge */}
                {companyCode && !isMobile && (
                    <Chip
                        label={companyCode}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 12,
                            mr: 1,
                        }}
                    />
                )}

                {/* Notification Bell */}
                <Tooltip title="การแจ้งเตือน">
                    <IconButton color="inherit" size="small">
                        <Badge badgeContent={0} color="error">
                            <Notifications sx={{ fontSize: 22 }} />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* User Avatar */}
                <Tooltip title={displayName}>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
                        <Avatar
                            sx={{
                                width: 34, height: 34,
                                bgcolor: 'rgba(255,255,255,0.25)',
                                color: '#fff',
                                fontSize: 14, fontWeight: 700,
                            }}
                        >
                            {displayName?.[0]?.toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Tooltip>

                {/* User Dropdown */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
                >
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.employee?.level_name || ''}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                        <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                        โปรไฟล์
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                        ออกจากระบบ
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );

    // ========================================
    // RENDER: Desktop Sidebar
    // ========================================
    const renderSidebar = () => (
        <Drawer
            variant="permanent"
            sx={{
                width: sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    top: 64,
                    height: 'calc(100% - 64px)',
                    bgcolor: '#fff',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    transition: 'width 0.2s ease',
                    overflowX: 'hidden',
                },
            }}
        >
            {/* Collapse Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                <IconButton size="small" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
                </IconButton>
            </Box>

            {/* Sub-pages */}
            <List disablePadding sx={{ px: sidebarCollapsed ? 0.5 : 1 }}>
                {currentSubPages.map((page) => {
                    const isActive = location.pathname === page.route;
                    return (
                        <ListItem key={page.slug} disablePadding sx={{ mb: 0.3 }}>
                            <Tooltip title={sidebarCollapsed ? page.name_th : ''} placement="right">
                                <ListItemButton
                                    onClick={() => handleNavigate(page.route)}
                                    selected={isActive}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        px: sidebarCollapsed ? 1.5 : 2,
                                        minHeight: 44,
                                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            '& .MuiListItemIcon-root': { color: '#fff' },
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        },
                                        '&:hover': { bgcolor: isActive ? undefined : 'action.hover' },
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: sidebarCollapsed ? 0 : 36,
                                        color: isActive ? '#fff' : 'text.secondary',
                                        justifyContent: 'center',
                                    }}>
                                        {getIcon(page.icon)}
                                    </ListItemIcon>
                                    {!sidebarCollapsed && (
                                        <ListItemText
                                            primary={page.name_th}
                                            primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );

    // ========================================
    // RENDER: Mobile Hamburger Drawer (System list)
    // ========================================
    const renderMobileDrawer = () => (
        <SwipeableDrawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            onOpen={() => setMobileMenuOpen(true)}
            PaperProps={{ sx: { width: 280, display: 'flex', flexDirection: 'column' } }}
        >
            {/* Header */}
            <Box sx={{
                px: 2, py: 2,
                background: 'linear-gradient(135deg, #0D47A1, #1565C0)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>SG</Typography>
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#fff">SiamGroup V3.1</Typography>
                </Stack>
                <IconButton size="small" onClick={() => setMobileMenuOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* Section label */}
            <Typography variant="caption" fontWeight={600} color="text.secondary"
                sx={{ px: 2, pt: 2, pb: 0.5, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                เลือกระบบ
            </Typography>

            {/* System list — vertical, clean */}
            <List sx={{ px: 1, flex: 1 }}>
                {systems.map((sys) => {
                    const isActive = sys.slug === activeSystem;
                    return (
                        <ListItem key={sys.slug} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleSystemChange(sys.slug)}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.2,
                                    bgcolor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? '#fff' : 'text.primary',
                                    '& .MuiListItemIcon-root': { color: isActive ? '#fff' : 'primary.main' },
                                    '&:hover': { bgcolor: isActive ? 'primary.dark' : 'action.hover' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>{getIcon(sys.icon)}</ListItemIcon>
                                <ListItemText
                                    primary={sys.name_th}
                                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: 14 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* User Info */}
            <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                        {displayName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">{companyCode}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={handleLogout}>
                        <Logout fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </SwipeableDrawer>
    );

    // ========================================
    // RENDER: Mobile Bottom Bar
    // ========================================
    const renderBottomBar = () => (
        <>
            <Paper
                elevation={8}
                sx={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    zIndex: theme.zIndex.drawer + 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0,
                }}
            >
                <BottomNavigation
                    value={location.pathname}
                    onChange={(_, newValue) => {
                        if (newValue === '__more__') {
                            setMobileMoreOpen(true);
                        } else {
                            navigate(newValue);
                        }
                    }}
                    showLabels
                    sx={{
                        height: 64,
                        '& .MuiBottomNavigationAction-root': {
                            minWidth: 'auto',
                            py: 1,
                            '&.Mui-selected': { color: 'primary.main' },
                        },
                        '& .MuiBottomNavigationAction-label': { fontSize: 10, mt: 0.3 },
                    }}
                >
                    {bottomItems.map((page) => (
                        <BottomNavigationAction
                            key={page.slug}
                            label={page.name_th}
                            value={page.route}
                            icon={getIcon(page.icon)}
                        />
                    ))}
                    {hasMore && (
                        <BottomNavigationAction
                            label="เพิ่มเติม"
                            value="__more__"
                            icon={<MoreHoriz />}
                        />
                    )}
                </BottomNavigation>
            </Paper>

            {/* "More" Bottom Sheet */}
            <SwipeableDrawer
                anchor="bottom"
                open={mobileMoreOpen}
                onClose={() => setMobileMoreOpen(false)}
                onOpen={() => setMobileMoreOpen(true)}
                PaperProps={{
                    sx: { borderRadius: '16px 16px 0 0', maxHeight: '60vh' },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'grey.300' }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                        {systems.find(s => s.slug === activeSystem)?.name_th || 'เมนู'}
                    </Typography>
                    <List disablePadding>
                        {currentSubPages.map((page) => {
                            const isActive = location.pathname === page.route;
                            return (
                                <ListItem key={page.slug} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => handleNavigate(page.route)}
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: isActive ? 'primary.main' : 'transparent',
                                            color: isActive ? '#fff' : 'text.primary',
                                            '& .MuiListItemIcon-root': { color: isActive ? '#fff' : 'primary.main' },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>{getIcon(page.icon)}</ListItemIcon>
                                        <ListItemText primary={page.name_th} primaryTypographyProps={{ fontSize: 14 }} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </SwipeableDrawer>
        </>
    );

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Top Bar */}
            {renderTopBar()}

            {/* Mobile Hamburger Drawer */}
            {isMobile && renderMobileDrawer()}

            {/* Desktop Sidebar */}
            {!isMobile && renderSidebar()}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flex: 1,
                    pt: { xs: '80px', md: '88px' },  // AppBar 64px + padding
                    pb: isMobile ? '80px' : 3,  // Bottom bar space (mobile)
                    px: { xs: 1.5, md: 3 },
                    minHeight: '100vh',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                    transition: 'margin 0.2s',
                    boxSizing: 'border-box',
                }}
            >
                <Outlet />
            </Box>

            {/* Mobile Bottom Bar */}
            {isMobile && renderBottomBar()}
        </Box>
    );
}
