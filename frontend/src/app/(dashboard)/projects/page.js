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
  CircularProgress,
} from '@mui/material';

import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';

import api from '../../../lib/api';

const initialForm = {
  name: '',
  description: '',
  status: 'PLANNING',
  members: [],
  startDate: '',
  endDate: '',
};

// Convert an API date into a value suitable for datetime-local.
const toLocalDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
};

// Convert datetime-local value into an ISO date for the API.
const toISOStringOrUndefined = (value) => {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Please enter a valid date.');
  }

  return date.toISOString();
};

const statusOptions = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

export default function ProjectsPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  const [role, setRole] = useState('DEVELOPER');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [loading, setLoading] = useState(true);

  // Load projects.
  const load = useCallback(async () => {
    setError('');

    try {
      const response = await api.get('/projects');
      setItems(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load projects'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load current user and Admin-only developer list.
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await api.get('/auth/me');
        const currentRole = response.data.data.user.role;

        setRole(currentRole);

        if (currentRole === 'ADMIN') {
          const usersResponse = await api.get('/users');

          setUsers(
            (usersResponse.data.data || []).filter(
              (user) => user.role === 'DEVELOPER'
            )
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Unable to load user information'
        );
      }
    };

    load();
    initialize();
  }, [load]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Open the create dialog.
  const handleCreate = () => {
    setEditingProject(null);
    setForm(initialForm);
    setError('');
    setSuccess('');
    setOpen(true);
  };

  // Open the edit dialog with existing project information.
  const handleEdit = (project) => {
    setEditingProject(project);

    setForm({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'PLANNING',

      members: (project.members || [])
        .filter((member) => member.role === 'DEVELOPER')
        .map((member) => member._id),

      startDate: toLocalDateTime(project.startDate),
      endDate: toLocalDateTime(project.endDate),
    });

    setError('');
    setSuccess('');
    setOpen(true);
  };

  const handleClose = () => {
    if (saving) return;

    setOpen(false);
    setEditingProject(null);
    setForm(initialForm);
  };

  // Create or update a project.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        members: form.members,
        startDate: toISOStringOrUndefined(form.startDate),
        endDate: toISOStringOrUndefined(form.endDate),
      };

      if (editingProject) {
        await api.patch(
          `/projects/${editingProject._id}`,
          payload
        );

        setSuccess('Project updated successfully.');
      } else {
        await api.post('/projects', payload);

        setSuccess('Project created successfully.');
      }

      setOpen(false);
      setEditingProject(null);
      setForm(initialForm);

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not save project'
      );
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation.
  const handleDeleteClick = (project) => {
    setDeletingProject(project);
    setDeleteOpen(true);
    setError('');
    setSuccess('');
  };

  // Delete project.
  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(
        `/projects/${deletingProject._id}`
      );

      setDeleteOpen(false);
      setDeletingProject(null);

      setSuccess(
        response.data?.message ||
          'Project deleted successfully.'
      );

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not delete project'
      );

      setDeleteOpen(false);
      setDeletingProject(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Page heading */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h4" fontWeight={700}>
          Projects
        </Typography>

        {role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            New project
          </Button>
        )}
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Your team's active work and delivery plans.
      </Typography>

      {/* Notifications */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Project list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {items.map((project) => (
            <Card key={project._id}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  {/* Project details */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {project.name}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {project.description ||
                        'No description provided'}
                    </Typography>

                    {project.members?.length > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Members:{' '}
                        {project.members
                          .map((member) => member.name)
                          .join(', ')}
                      </Typography>
                    )}

                    {(project.startDate || project.endDate) && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {project.startDate
                          ? `Start: ${new Date(
                              project.startDate
                            ).toLocaleDateString()}`
                          : ''}
                        {project.startDate && project.endDate
                          ? ' · '
                          : ''}
                        {project.endDate
                          ? `End: ${new Date(
                              project.endDate
                            ).toLocaleDateString()}`
                          : ''}
                      </Typography>
                    )}
                  </Box>

                  {/* Status and Admin actions */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Chip
                      label={project.status.replaceAll('_', ' ')}
                    />

                    {role === 'ADMIN' && (
                      <>
                        <Tooltip title="Edit project">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(project)}
                            aria-label={`Edit ${project.name}`}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete project">
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleDeleteClick(project)
                            }
                            aria-label={`Delete ${project.name}`}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!items.length && (
            <Typography color="text.secondary">
              No projects found.
            </Typography>
          )}
        </Stack>
      )}

      {/* Create / Edit project dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProject ? 'Edit project' : 'Create project'}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Project name"
                value={form.name}
                onChange={(event) =>
                  updateForm('name', event.target.value)
                }
                required
                inputProps={{ maxLength: 120 }}
                fullWidth
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                multiline
                minRows={3}
                inputProps={{ maxLength: 5000 }}
                fullWidth
              />

              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value)
                }
                fullWidth
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replaceAll('_', ' ')}
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
                    updateForm('members', event.target.value)
                  }
                  input={
                    <OutlinedInput label="Project members" />
                  }
                  renderValue={(selected) =>
                    selected
                      .map(
                        (id) =>
                          users.find((user) => user._id === id)
                            ?.name || id
                      )
                      .join(', ')
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Start date"
                type="datetime-local"
                value={form.startDate}
                onChange={(event) =>
                  updateForm('startDate', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="End date"
                type="datetime-local"
                value={form.endDate}
                onChange={(event) =>
                  updateForm('endDate', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: form.startDate || undefined,
                }}
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} disabled={saving}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving || !form.name.trim()}
            >
              {saving
                ? 'Saving...'
                : editingProject
                  ? 'Save changes'
                  : 'Create project'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setDeletingProject(null);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete project?</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deletingProject?.name}</strong>?
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 1 }}
          >
            A project can only be deleted after all its tasks
            have been deleted or moved.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDeleteOpen(false);
              setDeletingProject(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}