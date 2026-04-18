const express = require('express');
const { getPenalCodes, importPenalCodes } = require('../controllers/penalCodeController');

const router = express.Router();

router.get('/', getPenalCodes);
router.post('/import', importPenalCodes);

module.exports = router;
