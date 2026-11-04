import { Router } from 'express';

import {
  login,
  logout,
  me,
  createUser,
} from '../controllers/auth.controller.js';

import * as projects from '../controllers/project.controller.js';
import * as tasks from '../controllers/task.controller.js';

import { summary } from '../controllers/dashboard.controller.js';
import { listUsers } from '../controllers/user.controller.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Authentication routes
router.post('/auth/login', login);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, me);

// Admin-only user creation
router.post(
  '/users',
  authenticate,
  authorize('ADMIN'),
  createUser
);

// All routes below require authentication.
router.use(authenticate);

// User routes
router.get(
  '/users',
  authorize('ADMIN'),
  listUsers
);

// Project routes
router.get('/projects', projects.listProjects);

router.post(
  '/projects',
  authorize('ADMIN'),
  projects.createProject
);

router.get('/projects/:id', projects.getProject);

router.patch(
  '/projects/:id',
  authorize('ADMIN'),
  projects.updateProject
);

router.delete(
  '/projects/:id',
  authorize('ADMIN'),
  projects.deleteProject
);

// Task routes
router.get('/tasks', tasks.listTasks);

router.post(
  '/tasks',
  authorize('ADMIN'),
  tasks.createTask
);

router.get('/tasks/:id', tasks.getTask);

// Developers can update their own task progress.
// The controller restricts which fields they can change.
router.patch('/tasks/:id', tasks.updateTask);

router.post(
  '/tasks/:id/updates',
  tasks.addTaskUpdate
);

// Only Admin can delete tasks.
router.delete(
  '/tasks/:id',
  authorize('ADMIN'),
  tasks.deleteTask
);

// Dashboard
router.get('/dashboard/summary', summary);

export default router;