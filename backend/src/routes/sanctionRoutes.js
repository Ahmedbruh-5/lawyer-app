const express = require('express')
const router = express.Router()
const { searchSanctions, getSanctionById } = require('../controllers/sanctionController')

router.get('/', searchSanctions)
router.get('/:id', getSanctionById)

module.exports = router