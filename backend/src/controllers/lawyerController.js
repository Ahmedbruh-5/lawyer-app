const Lawyer = require('../models/Lawyer')

const addLawyer = async (req, res) => {
  try {
    const { name, specialty, location, rate, phone, email, bio = '', verified = true } = req.body

    if (!name || !specialty || !location || !rate || !phone || !email) {
      return res
        .status(400)
        .json({ message: 'name, specialty, location, rate, phone and email are required' })
    }

    const lawyer = await Lawyer.create({ name, specialty, location, rate, phone, email, bio, verified })
    return res.status(201).json(lawyer)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getLawyers = async (req, res) => {
  try {
    const { q = '' } = req.query
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { specialty: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {}

    const lawyers = await Lawyer.find(filter).sort({ createdAt: -1 })
    return res.status(200).json({ data: lawyers, count: lawyers.length })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  addLawyer,
  getLawyers,
}

