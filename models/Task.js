import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: { // This links tasks to the parent project
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  projectName: { // New field for task's project name
    type: String,
    required: true,
  },
  givenDate: { // New field
    type: Date,
  },
  submissionDate: { // New field
    type: Date,
  },
  approvedDate: { // New field
    type: Date,
  },
  payment: { // New field
    type: Number,
    required: true,
    default: 0,
  },
  paymentMethod: { // New payment method field
    type: String,
    enum: ['Bank Transfer', 'Cash', 'UPI', 'PayPal', 'Other'], // Enforce a predefined list of values
    default: 'Bank Transfer',
  },
  paymentReceivedDate: { // New payment received date field
    type: Date,
  },
  received: { // New field
    type: Boolean,
    default: false,
  },
  // Removed: title, description, status, deadline
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);

