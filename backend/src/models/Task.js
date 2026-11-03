import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 10000, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['HIGH','MEDIUM','LOW'], default: 'MEDIUM' },
  status: { type: String, enum: ['TODO','IN_PROGRESS','UNDER_REVIEW','COMPLETED'], default: 'TODO', index: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  dueDate: { type: Date, required: true }
}, { timestamps: true });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
export default mongoose.model('Task', taskSchema);
