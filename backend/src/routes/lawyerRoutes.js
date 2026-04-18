const express = require('express')
const { addLawyer, getLawyers } = require('../controllers/lawyerController')

const router = express.Router()

router.get('/', getLawyers)
router.post('/', addLawyer)

module.exports = router

