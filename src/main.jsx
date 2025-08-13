import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ProtectedApp from './components/ProtectedApp.jsx' // Changed from App to ProtectedApp

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7aa2f7' },
    secondary: { main: '#80cbc4' },
    background: {
      default: '#0b0e14',
      paper: '#101522'
    },
    divider: 'rgba(255,255,255,0.08)',
    success: { main: '#4caf50' },
    warning: { main: '#ffb74d' },
    error: { main: '#ef5350' },
    info: { main: '#64b5f6' }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Ubuntu',
      'Cantarell',
      '"Helvetica Neue"',
      'Arial'
    ].join(','),
    h4: { fontWeight: 800, letterSpacing: 0.2 },
    h6: { fontWeight: 800, letterSpacing: 0.2 },
    subtitle1: { fontWeight: 600 }
  },
  shadows: [
    'none',
    '0px 4px 14px rgba(0,0,0,0.25)',
    ...Array(23).fill('0px 6px 22px rgba(0,0,0,0.35)')
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px) saturate(1.1)'
        })
      }
    },
    MuiContainer: {
      defaultProps: { maxWidth: 'xl' }
    },
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backdropFilter: 'saturate(1.1) blur(6px)',
          border: `1px solid ${theme.palette.divider}`
        })
      }
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 12
        }),
        contained: ({ theme }) => ({
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        })
      }
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10
        })
      }
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          background: `linear-gradient(180deg, ${alpha('#101522',0.98)} 0%, ${alpha('#0f1420',0.98)} 100%)`,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        })
      }
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        '*::selection': {
          background: alpha(theme.palette.primary.main, 0.3)
        },
        body: {
          background:
            'radial-gradient(1000px 600px at 120% -10%, rgba(122,162,247,0.06), transparent 60%),' +
            'radial-gradient(800px 500px at -10% 0%, rgba(128,203,196,0.06), transparent 60%),' +
            theme.palette.background.default
        },
        code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' }
      })
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProtectedApp /> {/* Changed from <App /> */}
    </ThemeProvider>
  </StrictMode>
)