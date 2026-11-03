import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const summary=asyncHandler(async(req,res)=>{
  const taskFilter=req.user.role==='ADMIN'?{}:{assignedTo:req.user._id};
  const projectFilter=req.user.role==='ADMIN'?{}:{members:req.user._id};
  const [activeProjects,assignedTasks,completedTasks,pendingTasks,overdueTasks,projects]=await Promise.all([
    Project.countDocuments({...projectFilter,status:'ACTIVE'}),Task.countDocuments(taskFilter),Task.countDocuments({...taskFilter,status:'COMPLETED'}),Task.countDocuments({...taskFilter,status:{$ne:'COMPLETED'}}),Task.countDocuments({...taskFilter,status:{$ne:'COMPLETED'},dueDate:{$lt:new Date()}}),Project.find(projectFilter).select('name status')
  ]);
  const projectProgress=await Promise.all(projects.map(async p=>{const [total,done]=await Promise.all([Task.countDocuments({project:p._id,...(req.user.role==='ADMIN'?{}:{assignedTo:req.user._id})}),Task.countDocuments({project:p._id,status:'COMPLETED',...(req.user.role==='ADMIN'?{}:{assignedTo:req.user._id})})]);return {id:p.id,name:p.name,status:p.status,total,completed:done,progress:total?Math.round(done/total*100):0};}));
  res.json({success:true,data:{activeProjects,assignedTasks,completedTasks,pendingTasks,overdueTasks,projectProgress}});
});
