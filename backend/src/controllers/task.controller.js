import mongoose from 'mongoose';
import { z } from 'zod';

import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import TaskUpdate from '../models/TaskUpdate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const taskFieldsSchema = {
  title: z.string().trim().min(2).max(180),
  description: z.string().max(10000).optional(),
  project: objectIdSchema,
  assignedTo: objectIdSchema,
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum([
    'TODO',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'COMPLETED',
  ]).default('TODO'),
  progress: z.number().int().min(0).max(100).optional(),
  dueDate: z.coerce.date(),
};

const createTaskSchema = z.object(taskFieldsSchema).strict();

const isProjectMember = (project, userId) =>
  project.members.some((member) => String(member) === String(userId));

const getValidDeveloper = async (userId) => {
  return User.findOne({
    _id: userId,
    role: 'DEVELOPER',
    isActive: true,
  });
};

const populateTask = async (task) => {
  return task.populate([
    { path: 'project', select: 'name status' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

// GET /api/v1/tasks
export const listTasks = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'ADMIN'
      ? {}
      : { assignedTo: req.user._id };

  if (req.user.role === 'ADMIN') {
    for (const key of ['project', 'status', 'priority', 'assignedTo']) {
      if (req.query[key]) {
        filter[key] = req.query[key];
      }
    }
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(req.query.limit) || 20)
  );

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('project', 'name status')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// POST /api/v1/tasks - Admin only
export const createTask = asyncHandler(async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task data',
      errors: parsed.error.issues,
    });
  }

  const data = parsed.data;

  const [project, developer] = await Promise.all([
    Project.findById(data.project),
    getValidDeveloper(data.assignedTo),
  ]);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  if (!developer) {
    return res.status(404).json({
      success: false,
      message: 'Active developer not found',
    });
  }

  if (!isProjectMember(project, developer._id)) {
    return res.status(400).json({
      success: false,
      message: 'Assigned developer must be a member of the selected project',
    });
  }

const finalProgress =
  data.status === 'COMPLETED' || data.progress === 100
    ? 100
    : data.progress ?? 0;

const finalStatus =
  finalProgress === 100
    ? 'COMPLETED'
    : data.status;

const task = await Task.create({
  ...data,
  status: finalStatus,
  progress: finalProgress,
  createdBy: req.user._id,
});

  res.status(201).json({
    success: true,
    data: await populateTask(task),
  });
});

// GET /api/v1/tasks/:id
export const getTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID',
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  if (
    req.user.role !== 'ADMIN' &&
    !task.assignedTo.equals(req.user._id)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: await populateTask(task),
  });
});

// PATCH /api/v1/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID',
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  const isAdmin = req.user.role === 'ADMIN';

  if (
    !isAdmin &&
    !task.assignedTo.equals(req.user._id)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Admin can edit all task fields.
  // Developer can only update status, progress and update message.
  const updateSchema = isAdmin
    ? z.object({
        title: z.string().trim().min(2).max(180).optional(),
        description: z.string().max(10000).optional(),
        project: objectIdSchema.optional(),
        assignedTo: objectIdSchema.optional(),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
        status: z.enum([
          'TODO',
          'IN_PROGRESS',
          'UNDER_REVIEW',
          'COMPLETED',
        ]).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        dueDate: z.coerce.date().optional(),
        message: z.string().max(2000).optional(),
      }).strict()
    : z.object({
        status: z.enum([
          'TODO',
          'IN_PROGRESS',
          'UNDER_REVIEW',
          'COMPLETED',
        ]).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        message: z.string().max(2000).optional(),
      }).strict();

  const parsed = updateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task update',
      errors: parsed.error.issues,
    });
  }

  const updates = { ...parsed.data };
  const message = updates.message;
  delete updates.message;

  // Validate the project and developer together.
  if (isAdmin && (updates.project || updates.assignedTo)) {
    const projectId = updates.project || task.project;
    const developerId = updates.assignedTo || task.assignedTo;

    const [project, developer] = await Promise.all([
      Project.findById(projectId),
      getValidDeveloper(developerId),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Active developer not found',
      });
    }

    if (!isProjectMember(project, developer._id)) {
      return res.status(400).json({
        success: false,
        message: 'Assigned developer must be a member of the selected project',
      });
    }
  }

  const previousStatus = task.status;
  const previousProgress = task.progress;

  // Keep status and progress consistent.
  if (updates.status === 'COMPLETED') {
    updates.progress = 100;
  } else if (
    updates.status &&
    updates.status !== 'COMPLETED' &&
    updates.progress === undefined &&
    task.progress === 100
  ) {
    updates.progress = 0;
  }

  if (updates.progress === 100) {
    updates.status = 'COMPLETED';
  }

  Object.assign(task, updates);

  await task.save();

  // Preserve task status/progress history.
  if (
    previousStatus !== task.status ||
    previousProgress !== task.progress
  ) {
    await TaskUpdate.create({
      task: task._id,
      author: req.user._id,
      message: String(message || 'Task updated'),
      previousStatus,
      newStatus: task.status,
      progress: task.progress,
    });
  }

  res.json({
    success: true,
    data: await populateTask(task),
  });
});

// DELETE /api/v1/tasks/:id - Admin only
export const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID',
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Remove the task's update history as well.
  await TaskUpdate.deleteMany({ task: task._id });

  await task.deleteOne();

  res.json({
    success: true,
    message: 'Task deleted successfully',
    data: {
      id: task._id,
    },
  });
});

// POST /api/v1/tasks/:id/updates
export const addTaskUpdate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task ID',
    });
  }

  const parsed = z.object({
    message: z.string().trim().min(1).max(2000),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'A valid update message is required',
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  if (
    req.user.role !== 'ADMIN' &&
    !task.assignedTo.equals(req.user._id)
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  const update = await TaskUpdate.create({
    task: task._id,
    author: req.user._id,
    message: parsed.data.message,
    newStatus: task.status,
    progress: task.progress,
  });

  res.status(201).json({
    success: true,
    data: await update.populate('author', 'name'),
  });
});