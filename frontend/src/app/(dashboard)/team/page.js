
'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  Add,
  Close,
  Groups,
} from '@mui/icons-material';

import api from '../../../lib/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'DEVELOPER',
};

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch team members
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/users');

      setUsers(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load team members. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open creation dialog
  const handleOpenDialog = () => {
    setError('');
    setSuccess('');
    setForm(initialForm);
    setOpenDialog(true);
  };

  // Close creation dialog
  const handleCloseDialog = () => {
    if (submitting) return;

    setOpenDialog(false);
    setForm(initialForm);
  };

  // Create a new user
  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (form.name.trim().length < 2) {
      setError('Please enter a valid name.');
      return;
    }

    if (form.password.length < 12) {
      setError('Password must contain at least 12 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };

      const response = await api.post('/users', payload);

      setSuccess(
        response.data.message || 'User created successfully.'
      );

      setOpenDialog(false);
      setForm(initialForm);

      // Refresh team list
      await fetchUsers();

      // Keep success notification visible
      setSuccess(
        response.data.message || 'User created successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create user. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Page heading */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={750}>
            Team members
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            People who can be assigned to projects and tasks.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.2,
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          Add Member
        </Button>
      </Stack>

      {/* Notifications */}
      {error && !openDialog && (
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

      {/* User list */}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      ) : users.length > 0 ? (
        <Stack spacing={1.5}>
          {users.map((user) => (
            <Card
              key={user._id || user.id}
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(20, 30, 60, 0.04)',
                border: '1px solid #E9ECF3',
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={700}>
                      {user.name}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      {user.email}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={
                      user.role === 'ADMIN'
                        ? 'ADMIN'
                        : 'DEVELOPER'
                    }
                    color={
                      user.role === 'ADMIN'
                        ? 'primary'
                        : 'default'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              alignItems="center"
              spacing={1}
              sx={{ py: 4 }}
            >
              <Groups
                sx={{ fontSize: 48, color: 'text.secondary' }}
              />

              <Typography fontWeight={700}>
                No team members found
              </Typography>

              <Typography
                color="text.secondary"
                variant="body2"
              >
                Add your first team member to get started.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={handleCreateUser}
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h6" fontWeight={750}>
                  Add Team Member
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Create a new TeamFlow account.
                </Typography>
              </Box>

              <IconButton
                onClick={handleCloseDialog}
                disabled={submitting}
                aria-label="Close dialog"
              >
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent>
            {error && openDialog && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 100 }}
                placeholder="Enter full name"
              />

              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                placeholder="user@example.com"
              />

              <TextField
                label="Temporary Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{
                  minLength: 12,
                  maxLength: 128,
                }}
                helperText="Minimum 12 characters."
              />

              <TextField
                select
                label="User Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="DEVELOPER">
                  Developer
                </MenuItem>

                <MenuItem value="ADMIN">
                  Admin
                </MenuItem>
              </TextField>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseDialog}
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Add />
                )
              }
              sx={{ px: 3 }}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
