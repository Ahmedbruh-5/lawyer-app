// scripts/seedStatutes.js
require('dotenv').config()
const mongoose = require('mongoose')
const data = require('../data/pdf_data.json')

const StatuteSchema = new mongoose.Schema({
  fileName: String,
  title: String,
  type: String,
  year: Number,
  text: String,
}, { timestamps: true })

StatuteSchema.index({ title: 'text', text: 'text' })
const Statute = mongoose.model('Statute', StatuteSchema)

function parseTitle(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 15)) {
    if (/^(THE |AN ACT|ORDINANCE|JUVENILE|QANUN)/i.test(line))
      return line.replace(/\s+/g, ' ').trim()
  }
  return lines[0] || 'Untitled'
}

function parseType(title) {
  if (/ordinance/i.test(title)) return 'Ordinance'
  if (/\bact\b/i.test(title)) return 'Act'
  if (/rules?/i.test(title)) return 'Rules'
  return 'Other'
}

function parseYear(title) {
  const match = title.match(/\b(1[89]\d{2}|20[0-2]\d)\b/)
  return match ? parseInt(match[1]) : null
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to DB')

  await Statute.deleteMany({}) // clear old data if re-running
  console.log('Cleared existing statutes')

  const docs = data.map(d => {
    const title = parseTitle(d.text)
    return {
      fileName: d.file_name,
      title,
      type: parseType(title),
      year: parseYear(title),
      text: d.text,
    }
  })

  await Statute.insertMany(docs, { ordered: false })
  console.log(`✅ Seeded ${docs.length} statutes`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})