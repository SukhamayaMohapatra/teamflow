import { z } from 'zod';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const projectInput = z.object({ name: z.string().min(2).max(120), description: z.string().max(5000).optional(), status: z.enum(['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED']).optional(), members: z.array(z.string()).optional(), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional() });
export const listProjects = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { members: req.user._id };
  const projects = await Project.find(filter).populate('owner','name email').populate('members','name email').sort({ updatedAt: -1 }).limit(100);
  res.json({ success: true, data: projects });
});
export const createProject = asyncHandler(async (req, res) => {
  const parsed = projectInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ success:false, message:'Invalid project data', errors:parsed.error.issues });
  const project = await Project.create({ ...parsed.data, owner: req.user._id, members: [...new Set([...(parsed.data.members || []), String(req.user._id)])] });
  res.status(201).json({ success:true, data: await project.populate('owner members','name email') });
});
export const getProject = asyncHandler(async (req,res) => {
  const project = await Project.findById(req.params.id).populate('owner members','name email');
  if (!project) return res.status(404).json({success:false,message:'Project not found'});
  if (req.user.role !== 'ADMIN' && !project.members.some(m => m._id.equals(req.user._id))) return res.status(403).json({success:false,message:'Access denied'});
  res.json({success:true,data:project});
});
export const updateProject = asyncHandler(async (req,res) => {
  const parsed = projectInput.partial().safeParse(req.body); if (!parsed.success) return res.status(400).json({success:false,message:'Invalid project data'});
  const project = await Project.findByIdAndUpdate(req.params.id, parsed.data, {new:true,runValidators:true}).populate('owner members','name email');
  if (!project) return res.status(404).json({success:false,message:'Project not found'});
  res.json({success:true,data:project});
});
export const deleteProject = asyncHandler(async (req,res) => {
  const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({success:false,message:'Project not found'});
  const tasks = await Task.countDocuments({project:project._id}); if (tasks) return res.status(409).json({success:false,message:'Move or delete project tasks before deleting this project'});
  await project.deleteOne(); res.status(204).end();
});
