import mongoose from 'mongoose';
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  status: { type: String, enum: ['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'], default: 'PLANNING' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date, endDate: Date
}, { timestamps: true });
projectSchema.index({ status: 1, updatedAt: -1 });
export default mongoose.model('Project', projectSchema);
