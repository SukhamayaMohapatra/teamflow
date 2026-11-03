import { z } from 'zod';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import TaskUpdate from '../models/TaskUpdate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const schema = z.object({ title:z.string().min(2).max(180), description:z.string().max(10000).optional(), project:z.string(), assignedTo:z.string(), priority:z.enum(['HIGH','MEDIUM','LOW']).default('MEDIUM'), status:z.enum(['TODO','IN_PROGRESS','UNDER_REVIEW','COMPLETED']).default('TODO'), progress:z.number().int().min(0).max(100).optional(), dueDate:z.coerce.date() });
export const listTasks = asyncHandler(async (req,res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { assignedTo:req.user._id };
  for (const key of ['project','status','priority','assignedTo']) if (req.user.role === 'ADMIN' && req.query[key]) filter[key] = req.query[key];
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [items,total] = await Promise.all([Task.find(filter).populate('project','name status').populate('assignedTo','name email').populate('createdBy','name').sort({dueDate:1}).skip((page-1)*limit).limit(limit),Task.countDocuments(filter)]);
  res.json({success:true,data:items,meta:{page,limit,total,pages:Math.ceil(total/limit)}});
});
export const createTask = asyncHandler(async (req,res) => {
  const parsed=schema.safeParse(req.body); if(!parsed.success) return res.status(400).json({success:false,message:'Invalid task data',errors:parsed.error.issues});
  const project=await Project.findById(parsed.data.project); if(!project) return res.status(404).json({success:false,message:'Project not found'});
  const memberIds=project.members.map(String); if(!memberIds.includes(parsed.data.assignedTo)) return res.status(400).json({success:false,message:'Assignee must be a project member'});
  const task=await Task.create({...parsed.data,createdBy:req.user._id});
  res.status(201).json({success:true,data:await task.populate('project assignedTo createdBy','name email')});
});
export const getTask = asyncHandler(async(req,res)=>{
  const task=await Task.findById(req.params.id).populate('project assignedTo createdBy','name email');
  if(!task) return res.status(404).json({success:false,message:'Task not found'});
  if(req.user.role!=='ADMIN'&&!task.assignedTo._id.equals(req.user._id)) return res.status(403).json({success:false,message:'Access denied'});
  res.json({success:true,data:task});
});
export const updateTask = asyncHandler(async(req,res)=>{
  const task=await Task.findById(req.params.id); if(!task) return res.status(404).json({success:false,message:'Task not found'});
  const isAdmin=req.user.role==='ADMIN'; if(!isAdmin&&!task.assignedTo.equals(req.user._id)) return res.status(403).json({success:false,message:'Access denied'});
  const updateSchema = isAdmin
    ? z.object({title:z.string().min(2).max(180).optional(),description:z.string().max(10000).optional(),priority:z.enum(['HIGH','MEDIUM','LOW']).optional(),status:z.enum(['TODO','IN_PROGRESS','UNDER_REVIEW','COMPLETED']).optional(),progress:z.number().int().min(0).max(100).optional(),dueDate:z.coerce.date().optional(),assignedTo:z.string().optional(),message:z.string().max(2000).optional()}).strict()
    : z.object({status:z.enum(['TODO','IN_PROGRESS','UNDER_REVIEW','COMPLETED']).optional(),progress:z.number().int().min(0).max(100).optional(),message:z.string().max(2000).optional()}).strict();
  const parsed=updateSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({success:false,message:'Invalid task update',errors:parsed.error.issues});
  const updates={...parsed.data}; delete updates.message;
  if(updates.assignedTo){const project=await Project.findById(task.project);if(!project?.members.some(id=>String(id)===updates.assignedTo))return res.status(400).json({success:false,message:'Assignee must be a project member'});}
  if(updates.status==='COMPLETED') updates.progress=100;
  if(updates.progress===100) updates.status='COMPLETED';
  const previousStatus=task.status; Object.assign(task,updates); await task.save();
  if(previousStatus!==task.status||updates.progress!==undefined) await TaskUpdate.create({task:task._id,author:req.user._id,message:String(parsed.data.message||'Task updated'),previousStatus,newStatus:task.status,progress:task.progress});
  res.json({success:true,data:await task.populate('project assignedTo createdBy','name email')});
});
export const addTaskUpdate=asyncHandler(async(req,res)=>{
  const parsed=z.object({message:z.string().min(1).max(2000)}).safeParse(req.body); if(!parsed.success) return res.status(400).json({success:false,message:'A valid update message is required'});
  const task=await Task.findById(req.params.id); if(!task) return res.status(404).json({success:false,message:'Task not found'});
  if(req.user.role!=='ADMIN'&&!task.assignedTo.equals(req.user._id)) return res.status(403).json({success:false,message:'Access denied'});
  const update=await TaskUpdate.create({task:task._id,author:req.user._id,message:parsed.data.message,newStatus:task.status,progress:task.progress});
  res.status(201).json({success:true,data:await update.populate('author','name')});
});
