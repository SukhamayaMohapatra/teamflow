
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
} from '@mui/material';

import {
  Dashboard,
  FolderOpen,
  Checklist,
  Groups,
  Logout,
} from '@mui/icons-material';

import api from '../../lib/api';

const nav = [
  ['Dashboard', '/dashboard', Dashboard],
  ['Projects', '/projects', FolderOpen],
  ['Tasks', '/tasks', Checklist],
  ['Team', '/team', Groups],
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const path = usePathname();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      router.replace('/login');
    }
  };

  if (!ready || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        Loading workspace…
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
          zIndex: 1201,
        }}
      >
        <Toolbar sx={{ pl: { sm: '264px !important' } }}>
          <Typography
            fontWeight={850}
            color="primary"
            sx={{ flexGrow: 1 }}
          >
            TEAMFLOW
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
              {user.name?.[0]}
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
              startIcon={<Logout />}
              color="inherit"
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            borderRight: '1px solid #E9ECF3',
            pt: 9,
            px: 1.5,
          },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 2, py: 1 }}
        >
          WORKSPACE
        </Typography>

        <List>
          {nav
            .filter(
              ([label]) => label !== 'Team' || user.role === 'ADMIN'
            )
            .map(([label, url, Icon]) => (
              <ListItemButton
                key={url}
                selected={path.startsWith(url)}
                onClick={() => router.push(url)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>
                  <Icon
                    color={path.startsWith(url) ? 'primary' : 'action'}
                  />
                </ListItemIcon>

                <ListItemText primary={label} />
              </ListItemButton>
            ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { sm: '240px' },
          pt: 10,
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1600,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
