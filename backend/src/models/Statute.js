const mongoose = require('mongoose')

const StatuteSchema = new mongoose.Schema({
  fileName: String,
  title: String,
  type: String,       // 'Act' | 'Ordinance' | 'Rules' | 'Other'
  year: Number,
  text: String,
}, { timestamps: true })

StatuteSchema.index({ title: 'text', text: 'text' })

module.exports = mongoose.model('Statute', StatuteSchema)