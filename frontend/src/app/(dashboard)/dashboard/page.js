
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
    <Box>
      <Typography variant="h4">Dashboard</Typography>

      <Typography
        color="text.secondary"
        sx={{ mt: 1, mb: 3 }}
      >
        Here's an overview of your team's delivery.
      </Typography>

      <Grid container spacing={2}>
        {metrics.map(([label, key, Icon]) => (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: key === 'overdueTasks' ? 12 : 3,
            }}
            key={key}
          >
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary" variant="body2">
                    {label}
                  </Typography>

                  <Icon color="primary" />
                </Stack>

                <Typography variant="h4" sx={{ mt: 2 }}>
                  {data[key] ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Project progress
          </Typography>

          <Stack spacing={2.5}>
            {projectProgress.map((project) => {
              const progress = Math.min(
                100,
                Math.max(0, Number(project.progress) || 0)
              );

              return (
                <Box key={project.id}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {project.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {project.completed ?? 0} of {project.total ?? 0} tasks completed
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={`${progress}%`}
                    />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 8 }}
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
