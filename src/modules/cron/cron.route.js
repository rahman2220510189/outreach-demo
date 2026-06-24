const express = require('express');
const router = express.Router();
const { cleanupOldContacts } = require('./cron.controller');

router.post('/cleanup', cleanupOldContacts);

module.exports = router;