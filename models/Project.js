import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    description: String, // Kept description field
    // Removed: title, status, deadline
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
