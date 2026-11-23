import { createTheme } from '@mui/material/styles';

/** 全局 MUI 主题：青绿色主色，移动端触摸友好 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#0f766e',
      light: '#14b8a6',
      dark: '#115e59',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#f5f7f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 40,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(15, 118, 110, 0.08)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
