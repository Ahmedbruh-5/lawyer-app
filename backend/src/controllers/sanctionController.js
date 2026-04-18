const Sanction = require('../models/Sanctions')

// GET /api/sanctions?query=hussain&page=1&limit=20
exports.searchSanctions = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query

    const filter = query
      ? { $text: { $search: query } }
      : {}

    const total = await Sanction.countDocuments(filter)
    const results = await Sanction.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 })

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      results,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/sanctions/:id
exports.getSanctionById = async (req, res) => {
  try {
    const sanction = await Sanction.findById(req.params.id)
    if (!sanction) return res.status(404).json({ message: 'Not found' })
    res.json(sanction)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}