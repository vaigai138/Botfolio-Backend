import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  profileImage: { type: String, default: '' },
  instagram: { type: String, default: '' },
  youtube: { type: String, default: '' },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },

  // Add the 'role' field
  lastLogin: { type: Date }, 
  role: {
    type: String,
    enum: ['user', 'admin'], // Define possible roles
    default: 'user', // Default role for new users
  },
  accountStatus: { // Added for active/banned
    type: String,
    enum: ['active', 'banned', 'suspended'], // More specific statuses
    default: 'active',
  },
  portfolioVisibility: { // Added for public/private portfolio
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },

  // Portfolio Role (existing)
  portfolioType: {
    type: String,
    enum: ['video', 'graphics', 'both'],
    default: null,
  },
  tags: {
    type: [String],
    validate: [arrayLimit(10), '{PATH} exceeds maximum of 10'],
  },
  shortVideos: {
    type: [String],
    default: [],
  },
  longVideos: {
    type: [String],
    default: [],
  },
  graphicImages: {
    type: [String],
    default: [],
  },
  plan: {
    name: { type: String, default: 'FREE' },
    linksAllowed: { type: Number, default: 5 },
    designLimit: { type: Number, default: 5 },
    purchasedAt: Date,
  },
  showName: { type: Boolean, default: true },
  showEmail: { type: Boolean, default: true },
  showPhone: { type: Boolean, default: true },
  phone: { type: String, default: '' },
}, {
  timestamps: true,
});

function arrayLimit(max) {
  return (val) => !val || val.length <= max;
}

export default mongoose.model('User', userSchema);