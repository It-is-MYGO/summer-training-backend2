const express = require('express');
const router = express.Router();
const { logToTerminal } = require('./controller');

router.post('/', logToTerminal);

module.exports = router; 