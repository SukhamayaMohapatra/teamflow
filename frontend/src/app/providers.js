
'use client';

import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

import { store } from '../store';

import {
  ThemeProvider,
  CssBaseline,
} from '@mui/material';

import theme from '../theme/theme';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export default function Providers({ children }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {children}
          </SnackbarProvider>
        </ThemeProvider>
      </Provider>
    </AppRouterCacheProvider>
  );
}
