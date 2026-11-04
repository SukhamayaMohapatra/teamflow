
'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material';

import { Add } from '@mui/icons-material';

import api from '../../../lib/api';

const initialForm = {
  name: '',
  description: '',
  status: 'PLANNING',
  members: [],
};

const projectStatuses = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

export default function ProjectsPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [role, setRole] = useState('DEVELOPER');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    return api
      .get('/projects')
      .then((response) => {
        setItems(response.data.data);
        setError('');
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Unable to load projects'
        );
      });
  }, []);

  useEffect(() => {
    load();

    api
      .get('/auth/me')
      .then((response) => {
        const currentRole = response.data.data.user.role;

        setRole(currentRole);

        if (currentRole === 'ADMIN') {
          api
            .get('/users')
            .then((result) => setUsers(result.data.data))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [load]);

  const handleCreate = () => {
    setForm(initialForm);
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    if (!saving) {
      setOpen(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      await api.post('/projects', form);

      setOpen(false);
      setForm(initialForm);

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not create project'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* Responsive page header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h4">
          Projects
        </Typography>

        {role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
            sx={{
              alignSelf: { xs: 'stretch', sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            New project
          </Button>
        )}
      </Stack>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Your team's active work and delivery plans.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Project cards */}
      <Stack spacing={2}>
        {items.map((project) => (
          <Card key={project._id}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {project.name}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {project.description || 'No description provided'}
                  </Typography>
                </Box>

                <Chip
                  label={project.status.replace('_', ' ')}
                  sx={{ flexShrink: 0 }}
                />
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!items.length && !error && (
          <Typography color="text.secondary">
            No projects found.
          </Typography>
        )}
      </Stack>

      {/* Create project dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        fullScreen={false}
      >
        <Box component="form" onSubmit={submit}>
          <DialogTitle>
            Create project
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                required
                fullWidth
                inputProps={{ maxLength: 120 }}
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                multiline
                minRows={3}
                fullWidth
              />

              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
                fullWidth
              >
                {projectStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>

              <FormControl fullWidth>
                <InputLabel id="project-members-label">
                  Project members
                </InputLabel>

                <Select
                  labelId="project-members-label"
                  multiple
                  value={form.members}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      members: event.target.value,
                    })
                  }
                  input={
                    <OutlinedInput label="Project members" />
                  }
                  renderValue={(selected) =>
                    selected
                      .map(
                        (id) =>
                          users.find((user) => user._id === id)?.name ||
                          id
                      )
                      .join(', ')
                  }
                >
                  {users
                    .filter((user) => user.role === 'DEVELOPER')
                    .map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Creating…' : 'Create project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
