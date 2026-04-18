const express = require('express')
const { getStatutes, getStatuteById, getFiltersMeta } = require('../controllers/statuteController')

const router = express.Router()

router.get('/filters/meta', getFiltersMeta)
router.get('/', getStatutes)
router.get('/:id', getStatuteById)

module.exports = router