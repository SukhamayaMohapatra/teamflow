'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5',
      dark: '#3730A3',
      light: '#818CF8',
    },
    secondary: {
      main: '#0F766E',
    },
    background: {
      default: '#F7F8FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172033',
      secondary: '#64748B',
    },
    success: {
      main: '#16A34A',
    },
    warning: {
      main: '#D97706',
    },
    error: {
      main: '#DC2626',
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: 'Inter, Arial, sans-serif',

    h4: {
      fontWeight: 750,
      letterSpacing: '-0.04em',
      fontSize: 'clamp(1.7rem, 4vw, 2.3rem)',
    },

    h5: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
      fontSize: 'clamp(1.35rem, 3vw, 1.8rem)',
    },

    h6: {
      fontWeight: 700,
      fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
    },

    body1: {
      fontSize: '1rem',
    },

    button: {
      textTransform: 'none',
      fontWeight: 650,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          width: '100%',
          overflowX: 'hidden',
        },
        body: {
          width: '100%',
          overflowX: 'hidden',
          margin: 0,
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 40,
          boxShadow: 'none',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E9ECF3',
          boxShadow: '0 4px 20px rgba(15,23,42,0.035)',
          borderRadius: 14,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 14,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#64748B',
          fontWeight: 700,
          background: '#F8FAFC',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: 16,
          width: 'calc(100% - 32px)',
        },
      },
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;