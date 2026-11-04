
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

/*
|--------------------------------------------------------------------------
| Authentication routes
|--------------------------------------------------------------------------
*/

// Public login route
router.post('/auth/login', login);

// Protected authentication routes
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, me);

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

// All routes below require authentication.
router.use(authenticate);

/*
|--------------------------------------------------------------------------
| User routes
|--------------------------------------------------------------------------
*/

// Admin can create users
router.post(
  '/users',
  authorize('ADMIN'),
  createUser
);

// Admin can view active users
router.get(
  '/users',
  authorize('ADMIN'),
  listUsers
);

/*
|--------------------------------------------------------------------------
| Project routes
|--------------------------------------------------------------------------
*/

// View projects
router.get(
  '/projects',
  projects.listProjects
);

// Create project - Admin only
router.post(
  '/projects',
  authorize('ADMIN'),
  projects.createProject
);

// View individual project
router.get(
  '/projects/:id',
  projects.getProject
);

// Edit project - Admin only
router.patch(
  '/projects/:id',
  authorize('ADMIN'),
  projects.updateProject
);

// Delete project - Admin only
router.delete(
  '/projects/:id',
  authorize('ADMIN'),
  projects.deleteProject
);

/*
|--------------------------------------------------------------------------
| Task routes
|--------------------------------------------------------------------------
*/

// View tasks
router.get(
  '/tasks',
  tasks.listTasks
);

// Create task - Admin only
router.post(
  '/tasks',
  authorize('ADMIN'),
  tasks.createTask
);

// View individual task
router.get(
  '/tasks/:id',
  tasks.getTask
);

// Update task
// Admin can update all fields.
// Developers can update their own task progress/status.
// Field-level permissions are handled inside task.controller.js.
router.patch(
  '/tasks/:id',
  tasks.updateTask
);

// Add task update/history entry
router.post(
  '/tasks/:id/updates',
  tasks.addTaskUpdate
);

// Delete task - Admin only
router.delete(
  '/tasks/:id',
  authorize('ADMIN'),
  tasks.deleteTask
);

/*
|--------------------------------------------------------------------------
| Dashboard routes
|--------------------------------------------------------------------------
*/

// Dashboard summary
router.get(
  '/dashboard/summary',
  summary
);

export default router;
