'use client';

import { useEffect, useState } from 'react';

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Alert,
} from '@mui/material';

import {
  FolderOpen,
  Checklist,
  CheckCircle,
  PendingActions,
  WarningAmber,
} from '@mui/icons-material';

import api from '../../../lib/api';

const metrics = [
  ['Active projects', 'activeProjects', FolderOpen],
  ['Assigned tasks', 'assignedTasks', Checklist],
  ['Completed tasks', 'completedTasks', CheckCircle],
  ['Pending tasks', 'pendingTasks', PendingActions],
  ['Overdue tasks', 'overdueTasks', WarningAmber],
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get('/dashboard/summary')
      .then((response) => {
        if (active) {
          setData(response.data?.data || {});
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || 'Could not load dashboard'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Typography>Loading metrics…</Typography>;
  }

  const projectProgress = Array.isArray(data.projectProgress)
    ? data.projectProgress
    : [];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Typography variant="h4">
        Dashboard
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 1,
          mb: { xs: 2.5, sm: 3 },
        }}
      >
        Here's an overview of your team's delivery.
      </Typography>

      {/* Dashboard metric cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {metrics.map(([label, key, Icon]) => (
          <Grid
            key={key}
            size={{
              xs: 12,
              sm: 6,
              lg: key === 'overdueTasks' ? 12 : 3,
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  '&:last-child': {
                    pb: { xs: 2, sm: 2.5 },
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ minWidth: 0 }}
                  >
                    {label}
                  </Typography>

                  <Icon color="primary" />
                </Stack>

                <Typography
                  variant="h4"
                  sx={{ mt: 2 }}
                >
                  {data[key] ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project progress */}
      <Card sx={{ mt: { xs: 2.5, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            Project progress
          </Typography>

          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            {projectProgress.map((project) => {
              const progress = Math.min(
                100,
                Math.max(0, Number(project.progress) || 0)
              );

              return (
                <Box key={project.id} sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        fontWeight={700}
                        sx={{
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {project.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {project.completed ?? 0} of {project.total ?? 0}{' '}
                        tasks completed
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={`${progress}%`}
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 8,
                    }}
                  />
                </Box>
              );
            })}

            {!projectProgress.length && (
              <Typography color="text.secondary">
                No projects available yet.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}