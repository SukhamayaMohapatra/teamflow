import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  previousStatus: String, newStatus: String, progress: { type: Number, min: 0, max: 100 }
}, { timestamps: true });
export default mongoose.model('TaskUpdate', schema);
