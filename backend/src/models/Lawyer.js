const mongoose = require('mongoose')

const lawyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    rate: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    bio: { type: String, default: '', trim: true },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Lawyer', lawyerSchema)

