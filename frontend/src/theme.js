import { createTheme } from '@mui/material/styles';

// ========================================
// SiamGroup V3.1 Theme
// ========================================

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1565C0',      // Deep Blue
            light: '#42A5F5',
            dark: '#0D47A1',
            contrastText: '#fff',
        },
        secondary: {
            main: '#FF8F00',      // Amber
            light: '#FFB300',
            dark: '#E65100',
            contrastText: '#fff',
        },
        success: {
            main: '#2E7D32',
        },
        warning: {
            main: '#F57C00',
        },
        error: {
            main: '#C62828',
        },
        background: {
            default: '#F0F2F5',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1A2E',
            secondary: '#6B7280',
        },
    },
    typography: {
        fontFamily: '"Inter", "Noto Sans Thai", "Roboto", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: '8px 20px',
                },
                containedPrimary: {
                    boxShadow: '0 4px 14px 0 rgba(21, 101, 192, 0.35)',
                    '&:hover': {
                        boxShadow: '0 6px 20px 0 rgba(21, 101, 192, 0.45)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    border: 'none',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
                },
            },
        },
    },
});

export default theme;
