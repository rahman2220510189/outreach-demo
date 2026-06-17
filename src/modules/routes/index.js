const express = require('express');
const router = express.Router();
const contactsRoute = require('../contacts/contacts.route');
const emailRoute = require('../email/email.route');
const whatsappRoute = require('../whatsapp/whatsapp.route');
const scraperRoute = require('../scraper/scraper.route');
router.use('/contacts', contactsRoute);
router.use('/email', emailRoute);
router.use('/whatsapp', whatsappRoute);
router.use('/scraper', scraperRoute);

module.exports = router;