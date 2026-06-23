const express = require('express');
const router = express.Router();
const contactsRoute = require('../contacts/contacts.route');
const emailRoute = require('../email/email.route');
const whatsappRoute = require('../whatsapp/whatsapp.route');
const scraperRoute = require('../scraper/scraper.route');
const { requireAuth } = require('../../../Auth/Authmiddleware');
const { unsubscribeGet } = require('../contacts/contacts.controller');
router.get('/contacts/unsubscribe', unsubscribeGet);
// /auth itself stays unprotected at this top level — auth.route.js gates
// its own sub-routes individually (login is public, everything else inside
// it already requires a valid token).
router.use('/auth', require('../../../Auth/Auth.route'));

// Every other route group now requires a valid token.
router.use('/contacts', requireAuth, contactsRoute);
router.use('/email', requireAuth, emailRoute);
router.use('/whatsapp', requireAuth, whatsappRoute);
router.use('/scraper', requireAuth, scraperRoute);

module.exports = router;