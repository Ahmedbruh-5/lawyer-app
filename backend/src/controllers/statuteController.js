const Statute = require('../models/Statute')

// GET /api/statutes — paginated list with search + filters
const getStatutes = async (req, res) => {
  try {
    const { search, type, year, page = 1, limit = 20, includeText } = req.query
    const includeTextBool =
      includeText === 'true' || includeText === '1' || includeText === true
    const filter = {}

    if (search) filter.$text = { $search: search }
    if (type) filter.type = type
    if (year) filter.year = parseInt(year)

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const projection = includeTextBool ? {} : { text: 0 } // allow hero preview

    const [statutes, total] = await Promise.all([
      Statute.find(filter, projection)
        .sort(search ? { score: { $meta: 'textScore' } } : { title: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Statute.countDocuments(filter),
    ])

    res.status(200).json({
      statutes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/statutes/:id — single statute with full text
const getStatuteById = async (req, res) => {
  try {
    const statute = await Statute.findById(req.params.id)
    if (!statute) return res.status(404).json({ message: 'Statute not found' })
    res.status(200).json(statute)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/statutes/filters/meta — get available types & year range for filters
const getFiltersMeta = async (req, res) => {
  try {
    const [types, years] = await Promise.all([
      Statute.distinct('type'),
      Statute.distinct('year'),
    ])
    res.status(200).json({
      types: types.filter(Boolean).sort(),
      years: years.filter(Boolean).sort((a, b) => b - a),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getStatutes, getStatuteById, getFiltersMeta }