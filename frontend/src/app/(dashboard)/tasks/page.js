
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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material';

import { Add, Edit, Delete } from '@mui/icons-material';

import api from '../../../lib/api';

const initialForm = {
  title: '',
  description: '',
  project: '',
  assignedTo: '',
  priority: 'MEDIUM',
  status: 'TODO',
  progress: 0,
  dueDate: '',
};

const taskStatuses = [
  ['TODO', 'To Do'],
  ['IN_PROGRESS', 'In Progress'],
  ['UNDER_REVIEW', 'Under Review'],
  ['COMPLETED', 'Completed'],
];

const priorities = ['HIGH', 'MEDIUM', 'LOW'];

const toDateTimeInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
};

export default function TasksPage() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    project: '',
    priority: '',
    status: '',
    assignedTo: '',
  });

  const [role, setRole] = useState('DEVELOPER');
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/tasks');
      setItems(response.data.data || []);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load tasks'
      );
    }
  }, []);

  useEffect(() => {
    load();

    api
      .get('/auth/me')
      .then((response) => {
        const user = response.data.data.user;
        setRole(user.role);

        if (user.role === 'ADMIN') {
          api
            .get('/projects')
            .then((result) => setProjects(result.data.data || []))
            .catch(() => {});

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
    setSelectedTask(null);
    setForm(initialForm);
    setError('');
    setOpen(true);
  };

  const handleEdit = (task) => {
    setEditMode(true);
    setSelectedTask(task);

    setForm({
      title: task.title || '',
      description: task.description || '',
      project:
        typeof task.project === 'string'
          ? task.project
          : task.project?._id || '',
      assignedTo:
        typeof task.assignedTo === 'string'
          ? task.assignedTo
          : task.assignedTo?._id || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      progress: Number(task.progress) || 0,
      dueDate: toDateTimeInput(task.dueDate),
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
        dueDate: new Date(form.dueDate).toISOString(),
        progress: Number(form.progress),
      };

      if (editMode && selectedTask) {
        await api.patch(`/tasks/${selectedTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      setOpen(false);
      setForm(initialForm);
      setSelectedTask(null);

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not ${editMode ? 'update' : 'create'} task`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (task) => {
    setDeletingTask(task);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTask) return;

    setDeleting(true);
    setError('');

    try {
      await api.delete(`/tasks/${deletingTask._id}`);
      setDeleteOpen(false);
      setDeletingTask(null);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not delete task'
      );
    } finally {
      setDeleting(false);
    }
  };

  const changeStatus = async (task, status) => {
    try {
      await api.patch(`/tasks/${task._id}`, {
        status,
        progress: status === 'COMPLETED' ? 100 : task.progress,
        message: 'Status updated',
      });

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not update task'
      );
    }
  };

  const filteredItems = items.filter((task) => {
    const projectId =
      typeof task.project === 'string' ? task.project : task.project?._id;

    const assignedId =
      typeof task.assignedTo === 'string'
        ? task.assignedTo
        : task.assignedTo?._id;

    return (
      (!filters.project || projectId === filters.project) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.status || task.status === filters.status) &&
      (!filters.assignedTo || assignedId === filters.assignedTo)
    );
  });

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () =>
    setFilters({
      project: '',
      priority: '',
      status: '',
      assignedTo: '',
    });

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h4">Tasks</Typography>

        {role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            New task
          </Button>
        )}
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track assignments, priorities and deadlines.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Filter tasks
              </Typography>

              <Button
                size="small"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
              >
                Clear filters
              </Button>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel id="task-filter-project">Project</InputLabel>
                <Select
                  labelId="task-filter-project"
                  value={filters.project}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      project: event.target.value,
                    }))
                  }
                  input={<OutlinedInput label="Project" />}
                >
                  <MenuItem value="">All projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="task-filter-priority">Priority</InputLabel>
                <Select
                  labelId="task-filter-priority"
                  value={filters.priority}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  input={<OutlinedInput label="Priority" />}
                >
                  <MenuItem value="">All priorities</MenuItem>
                  {priorities.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="task-filter-status">Status</InputLabel>
                <Select
                  labelId="task-filter-status"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  input={<OutlinedInput label="Status" />}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  {taskStatuses.map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="task-filter-assignee">
                  Assigned developer
                </InputLabel>
                <Select
                  labelId="task-filter-assignee"
                  value={filters.assignedTo}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      assignedTo: event.target.value,
                    }))
                  }
                  input={<OutlinedInput label="Assigned developer" />}
                >
                  <MenuItem value="">All developers</MenuItem>
                  {users
                    .filter((user) => user.role === 'DEVELOPER')
                    .map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Filters work together. Showing {filteredItems.length} of{' '}
              {items.length} task(s).
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {filteredItems.map((task) => (
          <Card key={task._id}>
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
                    {task.title}
                  </Typography>

                  {task.description && (
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
                  >
                    {task.project?.name || 'No project'} ·{' '}
                    {task.assignedTo?.name || 'Unassigned'} · Due{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'Not set'}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                >
                  <Chip size="small" label={task.priority} />

                  {role === 'DEVELOPER' ? (
                    <TextField
                      select
                      size="small"
                      value={task.status}
                      onChange={(event) =>
                        changeStatus(task, event.target.value)
                      }
                      sx={{ minWidth: 145 }}
                    >
                      {taskStatuses.map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Chip
                      size="small"
                      label={(task.status || 'TODO').replaceAll('_', ' ')}
                    />
                  )}

                  {role === 'ADMIN' && (
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit task">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(task)}
                          aria-label="Edit task"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete task">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(task)}
                          aria-label="Delete task"
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

        {!filteredItems.length && !error && (
          <Typography color="text.secondary">
            {items.length
              ? 'No tasks match the selected filters.'
              : 'No tasks found.'}
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
            {editMode ? 'Edit task' : 'Create task'}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Task title"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                multiline
                minRows={2}
                fullWidth
              />

              <TextField
                select
                label="Project"
                value={form.project}
                onChange={(event) =>
                  setForm({ ...form, project: event.target.value })
                }
                required
                fullWidth
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Assign developer"
                value={form.assignedTo}
                onChange={(event) =>
                  setForm({ ...form, assignedTo: event.target.value })
                }
                required
                fullWidth
              >
                {users
                  .filter((user) => user.role === 'DEVELOPER')
                  .map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                select
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({ ...form, priority: event.target.value })
                }
                fullWidth
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
                fullWidth
              >
                {taskStatuses.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Progress (%)"
                type="number"
                value={form.progress}
                onChange={(event) =>
                  setForm({ ...form, progress: event.target.value })
                }
                inputProps={{ min: 0, max: 100 }}
                fullWidth
              />

              <TextField
                label="Deadline"
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({ ...form, dueDate: event.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, flexWrap: 'wrap' }}>
            <Button onClick={handleClose} disabled={saving}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                saving ||
                !projects.length ||
                !users.some((user) => user.role === 'DEVELOPER')
              }
            >
              {saving
                ? 'Saving…'
                : editMode
                  ? 'Save changes'
                  : 'Create task'}
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
        <DialogTitle>Delete task?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{' '}
            <strong>{deletingTask?.title}</strong>? This action cannot be
            undone.
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
