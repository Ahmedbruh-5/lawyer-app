const express = require('express');
const { proxyChat } = require('../controllers/legalChatController');

const router = express.Router();

router.post('/chat', proxyChat);

module.exports = router;
