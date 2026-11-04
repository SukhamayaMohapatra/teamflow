'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  IconButton,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import {
  Dashboard,
  FolderOpen,
  Checklist,
  Groups,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material';

import api from '../../lib/api';

const DRAWER_WIDTH = 240;

const nav = [
  ['Dashboard', '/dashboard', Dashboard],
  ['Projects', '/projects', FolderOpen],
  ['Tasks', '/tasks', Checklist],
  ['Team', '/team', Groups],
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const path = usePathname();
  const theme = useTheme();

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get('/auth/me')
      .then((response) => {
        if (active) {
          setUser(response.data.data.user);
        }
      })
      .catch(() => {
        if (active) {
          router.replace('/login');
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      router.replace('/login');
    }
  };

  const handleNavigation = (url) => {
    router.push(url);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ pt: { xs: 2, md: 9 }, px: 1.5 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, py: 1 }}
      >
        WORKSPACE
      </Typography>

      <List>
        {nav
          .filter(([label]) => label !== 'Team' || user?.role === 'ADMIN')
          .map(([label, url, Icon]) => (
            <ListItemButton
              key={url}
              selected={path.startsWith(url)}
              onClick={() => handleNavigation(url)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 48,
                '&.Mui-selected': {
                  bgcolor: 'rgba(79,70,229,0.09)',
                  '&:hover': {
                    bgcolor: 'rgba(79,70,229,0.14)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42 }}>
                <Icon
                  color={path.startsWith(url) ? 'primary' : 'action'}
                />
              </ListItemIcon>

              <ListItemText primary={label} />
            </ListItemButton>
          ))}
      </List>
    </Box>
  );

  if (!ready || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid #E9ECF3',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 72 },
            px: { xs: 1.5, sm: 3 },
            pl: {
              xs: 1.5,
              md: `${DRAWER_WIDTH + 32}px`,
            },
          }}
        >
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            fontWeight={850}
            color="primary"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
              letterSpacing: '-0.03em',
            }}
          >
            TEAMFLOW
          </Typography>

          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
            <Avatar
              sx={{
                width: { xs: 32, sm: 38 },
                height: { xs: 32, sm: 38 },
                bgcolor: 'primary.main',
              }}
            >
              {user.name?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={700}>
                {user.name}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {user.role}
              </Typography>
            </Box>

            <Button
              onClick={logout}
              color="inherit"
              startIcon={<Logout />}
              sx={{
                minWidth: { xs: 40, sm: 'auto' },
                px: { xs: 1, sm: 2 },
                '& .MuiButton-startIcon': {
                  mr: { xs: 0, sm: 1 },
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Logout
              </Box>
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Desktop sidebar */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid #E9ECF3',
              pt: 0,
              top: { md: 72 },
              height: { md: 'calc(100% - 72px)' },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile and tablet sidebar */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid #E9ECF3',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          width: {
            xs: '100%',
            md: `calc(100% - ${DRAWER_WIDTH}px)`,
          },
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          pt: {
            xs: '88px',
            sm: '104px',
            md: '112px',
          },
          maxWidth: 1840,
          boxSizing: 'border-box',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}