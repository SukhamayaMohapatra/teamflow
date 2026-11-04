import { z } from 'zod';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const projectStatuses = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

// Accept empty dates as undefined; otherwise convert them to Date objects.
const optionalDate = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.date().optional()
);

const projectInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(projectStatuses).optional(),
  members: z.array(z.string().min(1)).optional(),
  startDate: optionalDate,
  endDate: optionalDate,
});

const validateProjectDates = (startDate, endDate) => {
  if (startDate && endDate && endDate < startDate) {
    return false;
  }

  return true;
};

// List projects
export const listProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'ADMIN'
      ? {}
      : { members: req.user._id };

  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('members', 'name email role')
    .sort({ updatedAt: -1 })
    .limit(100);

  res.json({
    success: true,
    data: projects,
  });
});

// Create project
export const createProject = asyncHandler(async (req, res) => {
  const parsed = projectInput.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project data',
      errors: parsed.error.issues,
    });
  }

  const data = parsed.data;

  if (!validateProjectDates(data.startDate, data.endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date cannot be earlier than start date',
    });
  }

  const requestedMembers = [...new Set(data.members || [])];

  // Only active developers can be added as project members.
  const developers = await User.find({
    _id: { $in: requestedMembers },
    role: 'DEVELOPER',
    isActive: true,
  }).select('_id');

  if (developers.length !== requestedMembers.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more selected members are invalid or inactive',
    });
  }

  const members = [
    ...new Set([
      ...requestedMembers,
      String(req.user._id),
    ]),
  ];

  const project = await Project.create({
    ...data,
    owner: req.user._id,
    members,
  });

  res.status(201).json({
    success: true,
    data: await project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members', select: 'name email role' },
    ]),
  });
});

// Get one project
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email role');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  if (
    req.user.role !== 'ADMIN' &&
    !project.members.some((member) =>
      member._id.equals(req.user._id)
    )
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: project,
  });
});

// Update project - Admin only through the protected route
export const updateProject = asyncHandler(async (req, res) => {
  const parsed = projectInput.partial().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project data',
      errors: parsed.error.issues,
    });
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  const updates = parsed.data;

  // Validate the final dates, including unchanged existing dates.
  const nextStartDate =
    updates.startDate !== undefined
      ? updates.startDate
      : project.startDate;

  const nextEndDate =
    updates.endDate !== undefined
      ? updates.endDate
      : project.endDate;

  if (!validateProjectDates(nextStartDate, nextEndDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date cannot be earlier than start date',
    });
  }

  // Validate selected project members.
  if (updates.members !== undefined) {
    const requestedMembers = [...new Set(updates.members)];

    const developers = await User.find({
      _id: { $in: requestedMembers },
      role: 'DEVELOPER',
      isActive: true,
    }).select('_id');

    if (developers.length !== requestedMembers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected members are invalid or inactive',
      });
    }

    // Keep the project owner as a member.
    const nextMembers = [
      ...new Set([
        ...requestedMembers,
        String(project.owner),
      ]),
    ];

    // Do not remove a developer who still owns tasks in this project.
    const assignedUsers = await Task.distinct('assignedTo', {
      project: project._id,
    });

    const removedAssignedUsers = assignedUsers
      .map(String)
      .filter((id) => !nextMembers.includes(id));

    if (removedAssignedUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'One or more members still have tasks assigned in this project. Reassign those tasks before removing the members.',
      });
    }

    updates.members = nextMembers;
  }

  Object.assign(project, updates);

  await project.save();

  await project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members', select: 'name email role' },
  ]);

  res.json({
    success: true,
    data: project,
  });
});

// Delete project - Admin only through the protected route
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Do not delete a project while it still contains tasks.
  const taskCount = await Task.countDocuments({
    project: project._id,
  });

  if (taskCount > 0) {
    return res.status(409).json({
      success: false,
      message: `This project has ${taskCount} task(s). Delete or move its tasks before deleting the project.`,
    });
  }

  await project.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});