const mongoose = require('mongoose');

/**
 * Users collection – stores user preferences and scheduling settings.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    // One or more company names to track  e.g. ["Google", "Microsoft"]
    companies: {
      type: [String],
      required: [true, 'At least one company is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one company must be specified',
      },
    },

    // Job role the user is looking for  e.g. "Backend Engineer"
    desiredRole: {
      type: String,
      required: [true, 'Desired role is required'],
      trim: true,
    },

    // Optional per-company configuration (role, alert time)
    companyConfigs: [
      {
        company: { type: String, required: true, trim: true },
        role: { type: String, required: true, trim: true },
        notifyTime: { type: String, default: '09:00', trim: true },
        active: { type: Boolean, default: true },
      },
    ],

    // Optional filters
    filters: {
      location: { type: String, trim: true, default: null },
      experienceLevel: { type: String, trim: true, default: null },
    },

    // Preferred notification time in 24-hr "HH:MM" format  e.g. "09:30"
    notifyTime: {
      type: String,
      required: [true, 'Notification time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'notifyTime must be in HH:MM format (24-hr)'],
    },

    // Whether this user's schedule is active
    active: {
      type: Boolean,
      default: true,
    },

    // Role controls UI access: 'admin' sees full dashboard, 'user' sees only My Jobs
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },

  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

// Index for fast scheduler lookup
userSchema.index({ notifyTime: 1, active: 1 });

module.exports = mongoose.model('User', userSchema);
