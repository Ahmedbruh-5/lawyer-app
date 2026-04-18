const mongoose = require('mongoose')

const sanctionSchema = new mongoose.Schema(
  {
    sourceId: { type: String, unique: true },   // pk-cnic-XXXXX
    name: { type: String, required: true },      // primary caption
    aliases: [String],                           // all alternate names
    nationality: String,                         // "pk"
    cnic: String,                                // raw CNIC number
    province: String,
    listSource: { type: String, default: 'NACTA' },
    program: { type: String, default: 'PK-ATA1997' },
    firstSeen: Date,
    lastSeen: Date,
  },
  { timestamps: true }
)

sanctionSchema.index({ name: 'text', aliases: 'text' })

module.exports = mongoose.model('Sanction', sanctionSchema)