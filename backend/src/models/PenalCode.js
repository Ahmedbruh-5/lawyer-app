const mongoose = require('mongoose');

const penalCodeSchema = new mongoose.Schema(
  {
    chapter: {
      type: String,
      required: true,
      trim: true,
    },
    chapterTitle: {
      type: String,
      default: '',
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

penalCodeSchema.index({ section: 1 }, { unique: true });
penalCodeSchema.index({ title: 'text', content: 'text', chapter: 'text', chapterTitle: 'text' });

module.exports = mongoose.model('PenalCode', penalCodeSchema);
