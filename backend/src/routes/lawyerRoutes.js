const express = require('express')
const { addLawyer, getLawyers, updateLawyer, deleteLawyer } = require('../controllers/lawyerController')

const router = express.Router()

router.get('/', getLawyers)
router.post('/', addLawyer)
router.put('/:id', updateLawyer)
router.delete('/:id', deleteLawyer)

module.exports = router

