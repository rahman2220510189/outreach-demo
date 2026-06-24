const express = require('express');
const router = express.Router();
const { sendSingleEmail, sendBulkEmail, sendCSVEmail, getLogs } = require('./email.controller');

// Send single email
router.post('/send-csv', sendCSVEmail);

router.post('/send', sendSingleEmail);

// Send bulk email
router.post('/send-bulk', sendBulkEmail);

// Get all logs
router.get('/logs', getLogs);

module.exports = router;