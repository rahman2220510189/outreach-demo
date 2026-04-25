const express = require('express');
const router = express.Router();
const { sendSingleWhatsapp, sendBulkWhatsapp, getWhatsappLogs } = require('./whatsapp.controller');

// Send single WhatsApp message
router.post('/send', sendSingleWhatsapp);

// Send bulk WhatsApp messages
router.post('/send-bulk', sendBulkWhatsapp);

// Get WhatsApp logs
router.get('/logs', getWhatsappLogs);

module.exports = router;