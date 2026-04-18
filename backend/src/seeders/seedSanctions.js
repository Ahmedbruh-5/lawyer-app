const mongoose = require('mongoose')
const axios = require('axios')
const Sanction = require('../models/Sanctions')
require('dotenv').config({ path: '../../.env'})

const URL = 'https://data.opensanctions.org/datasets/20260201/pk_proscribed_persons/targets.nested.json'

const seedSanctions = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to DB')    

  const { data } = await axios.get(URL)

  // the file is newline-delimited JSON (one object per line), not a JSON array
  const lines = data.split('\n').filter(Boolean)

  let inserted = 0
  let skipped = 0

  for (const line of lines) {
    const entity = JSON.parse(line)
    const props = entity.properties || {}

    const pick = (field) => (props[field]?.[0] || null)

    const existing = await Sanction.findOne({ sourceId: entity.id })
    if (existing) { skipped++; continue }

    await Sanction.create({
      sourceId: entity.id,
      name: entity.caption,
      aliases: props.alias || [],
      nationality: pick('nationality'),
      cnic: pick('idNumber'),
      province: pick('province'),
      firstSeen: entity.first_seen ? new Date(entity.first_seen) : null,
      lastSeen: entity.last_seen ? new Date(entity.last_seen) : null,
    })

    inserted++
  }

  console.log(`Done. Inserted: ${inserted} | Skipped: ${skipped}`)
  process.exit()
}

seedSanctions().catch((err) => {
  console.error(err)
  process.exit(1)
})