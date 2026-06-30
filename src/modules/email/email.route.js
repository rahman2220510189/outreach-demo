const express = require('express');
const router = express.Router();
const { sendSingleEmail, sendBulkEmail, sendCSVEmail, getLogs, clearCSVHistory } = require('./email.controller');

// Send single email
router.post('/send-csv', sendCSVEmail);

router.post('/send', sendSingleEmail);

// Send bulk email
router.post('/send-bulk', sendBulkEmail);

// Get all logs
router.get('/logs', getLogs);

router.post('/clear-csv-history', clearCSVHistory);

module.exports = router;