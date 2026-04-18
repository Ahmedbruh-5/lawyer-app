const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['Admin', 'User', 'Pro'],
      default: 'User',
    },
    status: {
      type: String,
      enum: ['Verified', 'Unverified'],
      default: 'Unverified',
    },
    access: {
      type: Boolean,
      default: true,
    },
    accessLevel: {
      type: String,
      enum: ['Free', 'Pro'],
      default: 'Free',
    },
    avatar: {
      type: String,
      default: '',
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
