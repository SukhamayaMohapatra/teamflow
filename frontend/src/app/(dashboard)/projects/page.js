
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
  IconButton,
  Tooltip,
  Checkbox,
  ListItemText,
} from '@mui/material';

import { Add, Edit, Delete } from '@mui/icons-material';

import api from '../../../lib/api';

const initialForm = {
  name: '',
  description: '',
  status: 'PLANNING',
  members: [],
  startDate: '',
  endDate: '',
};

const projectStatuses = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function ProjectsPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [role, setRole] = useState('DEVELOPER');

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/projects');
      setItems(response.data.data || []);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load projects'
      );
    }
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
            .then((result) => setUsers(result.data.data || []))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [load]);

  const handleCreate = () => {
    setEditMode(false);
    setSelectedProject(null);
    setForm({ ...initialForm, members: [] });
    setError('');
    setOpen(true);
  };

  const handleEdit = (project) => {
    setEditMode(true);
    setSelectedProject(project);

    setForm({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'PLANNING',
      members: (project.members || [])
        .map((member) =>
          typeof member === 'string' ? member : member?._id
        )
        .filter(Boolean),
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
    });

    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    if (!saving) setOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        members: [...new Set(form.members)],
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };

      if (editMode && selectedProject) {
        await api.patch(`/projects/${selectedProject._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }

      setOpen(false);
      setForm(initialForm);
      setSelectedProject(null);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not ${editMode ? 'update' : 'create'} project`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (project) => {
    setDeletingProject(project);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;

    setDeleting(true);
    setError('');

    try {
      await api.delete(`/projects/${deletingProject._id}`);
      setDeleteOpen(false);
      setDeletingProject(null);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not delete project. Check whether it still has tasks.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h4">Projects</Typography>

        {role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            New project
          </Button>
        )}
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Your team's active work and delivery plans.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {items.map((project) => (
          <Card key={project._id}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
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
                    sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
                  >
                    {project.description || 'No description provided'}
                  </Typography>

                  {project.owner?.name && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Owner: {project.owner.name}
                    </Typography>
                  )}
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Chip
                    label={(project.status || 'PLANNING').replaceAll('_', ' ')}
                    size="small"
                  />

                  {role === 'ADMIN' && (
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit project">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(project)}
                          aria-label="Edit project"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete project">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(project)}
                          aria-label="Delete project"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
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

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        fullScreen={false}
      >
        <Box component="form" onSubmit={submit}>
          <DialogTitle>
            {editMode ? 'Edit project' : 'Create project'}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
                fullWidth
                inputProps={{ maxLength: 120 }}
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
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
                  setForm({ ...form, status: event.target.value })
                }
                fullWidth
              >
                {projectStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>

              <FormControl fullWidth>
                <InputLabel id="project-members-label">
                  Project members (optional)
                </InputLabel>

                <Select
                  labelId="project-members-label"
                  multiple
                  value={form.members}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({
                      ...form,
                      members: typeof value === 'string'
                        ? value.split(',')
                        : value,
                    });
                  }}
                  input={<OutlinedInput label="Project members (optional)" />}
                  renderValue={(selected) =>
                    selected
                      .map((id) =>
                        users.find((user) => user._id === id)?.name || id
                      )
                      .join(', ')
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      <Checkbox checked={form.members.includes(user._id)} />
                      <ListItemText
                        primary={user.name}
                        secondary={`${user.email} • ${user.role}`}
                      />
                    </MenuItem>
                  ))}
                </Select>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Select developers and/or admin. No member is selected automatically.
                </Typography>
              </FormControl>

              <TextField
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: form.startDate || undefined }}
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, flexWrap: 'wrap' }}>
            <Button onClick={handleClose} disabled={saving}>
              Cancel
            </Button>

            <Button type="submit" variant="contained" disabled={saving}>
              {saving
                ? 'Saving…'
                : editMode
                  ? 'Save changes'
                  : 'Create project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete project?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{' '}
            <strong>{deletingProject?.name}</strong>? This action cannot be
            undone. Projects with existing tasks may need those tasks moved
            or deleted first.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
