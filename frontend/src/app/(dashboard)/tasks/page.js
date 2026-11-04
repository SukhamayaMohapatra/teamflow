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
  LinearProgress,
  Divider,
} from '@mui/material';

import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';

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

const statusOptions = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' },
];

const priorityOptions = ['HIGH', 'MEDIUM', 'LOW'];

// Convert a date into the format required by datetime-local.
const toLocalDateTime = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const getErrorMessage = (error, fallback) => {
  return (
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

export default function TasksPage() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [role, setRole] = useState('DEVELOPER');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [form, setForm] = useState(initialForm);

  // Load tasks.
  const loadTasks = useCallback(async () => {
    try {
      setError('');

      const response = await api.get('/tasks');

      setItems(response.data.data || []);
    } catch (err) {
      setError(
        getErrorMessage(err, 'Unable to load tasks')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load logged-in user and Admin dropdown data.
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await api.get('/auth/me');
        const currentUser = response.data.data.user;

        setRole(currentUser.role);

        if (currentUser.role === 'ADMIN') {
          const [projectResponse, userResponse] =
            await Promise.all([
              api.get('/projects'),
              api.get('/users'),
            ]);

          setProjects(projectResponse.data.data || []);

          setUsers(
            (userResponse.data.data || []).filter(
              (user) => user.role === 'DEVELOPER'
            )
          );
        }
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            'Unable to initialize the Tasks page'
          )
        );
      }

      await loadTasks();
    };

    initialize();
  }, [loadTasks]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Open the Create Task dialog.
  const openCreateDialog = () => {
    setEditingTask(null);
    setForm(initialForm);
    setError('');
    setOpen(true);
  };

  // Open the Edit Task dialog and populate existing values.
  const openEditDialog = (task) => {
    setEditingTask(task);

    setForm({
      title: task.title || '',
      description: task.description || '',
      project: task.project?._id || task.project || '',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      progress: task.progress ?? 0,
      dueDate: toLocalDateTime(task.dueDate),
    });

    setError('');
    setOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setOpen(false);
    setEditingTask(null);
    setForm(initialForm);
  };

  // Create or edit a task.
  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      if (!form.dueDate) {
        throw new Error('Please select a deadline.');
      }

      const dueDate = new Date(form.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        throw new Error('Please enter a valid deadline.');
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project,
        assignedTo: form.assignedTo,
        priority: form.priority,
        status: form.status,
        progress: Number(form.progress),
        dueDate: dueDate.toISOString(),
      };

      if (editingTask) {
        await api.patch(
          `/tasks/${editingTask._id}`,
          payload
        );
      } else {
        await api.post('/tasks', payload);
      }

      setOpen(false);
      setEditingTask(null);
      setForm(initialForm);

      await loadTasks();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          editingTask
            ? 'Could not update task'
            : 'Could not create task'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Developer quick status/progress update.
  const changeStatus = async (task, status) => {
    try {
      setError('');

      const progress =
        status === 'COMPLETED'
          ? 100
          : task.progress === 100
            ? 0
            : task.progress ?? 0;

      await api.patch(`/tasks/${task._id}`, {
        status,
        progress,
        message: 'Status updated',
      });

      await loadTasks();
    } catch (err) {
      setError(
        getErrorMessage(err, 'Could not update task status')
      );
    }
  };

  // Open delete confirmation.
  const openDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deletingId) return;

    setTaskToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Delete task.
  const confirmDelete = async () => {
    if (!taskToDelete) return;

    const taskId = taskToDelete._id;

    try {
      setDeletingId(taskId);
      setError('');

      await api.delete(`/tasks/${taskId}`);

      setDeleteDialogOpen(false);
      setTaskToDelete(null);

      await loadTasks();
    } catch (err) {
      setError(
        getErrorMessage(err, 'Could not delete task')
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = role === 'ADMIN';

  return (
    <Box>
      {/* Page heading */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h4">
          Tasks
        </Typography>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            New task
          </Button>
        )}
      </Stack>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Track assignments, priorities and deadlines.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Task list */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Stack spacing={2}>
          {items.map((task) => (
            <Card key={task._id}>
              <CardContent>
                <Stack
                  direction={{
                    xs: 'column',
                    md: 'row',
                  }}
                  justifyContent="space-between"
                  alignItems={{
                    xs: 'stretch',
                    md: 'center',
                  }}
                  spacing={2}
                >
                  {/* Task information */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {task.title}
                    </Typography>

                    {task.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, mb: 1 }}
                      >
                        {task.description}
                      </Typography>
                    )}

                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      {task.project?.name || 'No project'}
                      {' · '}
                      {task.assignedTo?.name || 'Unassigned'}
                      {' · '}
                      Due{' '}
                      {task.dueDate
                        ? new Date(
                            task.dueDate
                          ).toLocaleDateString()
                        : 'Not set'}
                    </Typography>

                    <Box sx={{ mt: 1.5, maxWidth: 360 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Progress
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {task.progress ?? 0}%
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={task.progress ?? 0}
                        sx={{
                          height: 7,
                          borderRadius: 5,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Task actions */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      size="small"
                      label={task.priority}
                      color={
                        task.priority === 'HIGH'
                          ? 'error'
                          : task.priority === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                      }
                    />

                    {isAdmin ? (
                      <Chip
                        size="small"
                        label={
                          statusOptions.find(
                            (option) =>
                              option.value === task.status
                          )?.label || task.status
                        }
                      />
                    ) : (
                      <TextField
                        select
                        size="small"
                        label="Status"
                        value={task.status}
                        onChange={(event) =>
                          changeStatus(
                            task,
                            event.target.value
                          )
                        }
                        sx={{ minWidth: 155 }}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {isAdmin && (
                      <>
                        <Tooltip title="Edit task">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              openEditDialog(task)
                            }
                            aria-label="Edit task"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete task">
                          <IconButton
                            color="error"
                            onClick={() =>
                              openDeleteDialog(task)
                            }
                            aria-label="Delete task"
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
              No tasks found.
            </Typography>
          )}
        </Stack>
      )}

      {/* Create/Edit task dialog */}
      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={submit}
        >
          <DialogTitle>
            {editingTask ? 'Edit task' : 'Create task'}
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Task title"
                value={form.title}
                onChange={(event) =>
                  updateForm('title', event.target.value)
                }
                required
                inputProps={{ maxLength: 180 }}
              />

              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    'description',
                    event.target.value
                  )
                }
                multiline
                minRows={3}
                inputProps={{ maxLength: 10000 }}
              />

              <TextField
                select
                label="Project"
                value={form.project}
                onChange={(event) =>
                  updateForm('project', event.target.value)
                }
                required
              >
                {projects.map((project) => (
                  <MenuItem
                    key={project._id}
                    value={project._id}
                  >
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Assigned developer"
                value={form.assignedTo}
                onChange={(event) =>
                  updateForm(
                    'assignedTo',
                    event.target.value
                  )
                }
                required
              >
                {users.map((user) => (
                  <MenuItem
                    key={user._id}
                    value={user._id}
                  >
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priority"
                value={form.priority}
                onChange={(event) =>
                  updateForm('priority', event.target.value)
                }
                required
              >
                {priorityOptions.map((priority) => (
                  <MenuItem
                    key={priority}
                    value={priority}
                  >
                    {priority}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value)
                }
                required
              >
                {statusOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Progress (%)"
                type="number"
                value={form.progress}
                onChange={(event) =>
                  updateForm(
                    'progress',
                    event.target.value
                  )
                }
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 1,
                }}
                required
              />

              <TextField
                label="Deadline"
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) =>
                  updateForm('dueDate', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                saving ||
                !projects.length ||
                !users.length
              }
            >
              {saving
                ? 'Saving…'
                : editingTask
                  ? 'Save changes'
                  : 'Create task'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Delete task?
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{' '}
            <strong>{taskToDelete?.title}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={Boolean(deletingId)}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={Boolean(deletingId)}
          >
            {deletingId ? 'Deleting…' : 'Delete task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}