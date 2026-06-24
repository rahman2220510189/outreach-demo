const express = require('express');
const router = express.Router();
const contactsRoute = require('../contacts/contacts.route');
const emailRoute = require('../email/email.route');
const whatsappRoute = require('../whatsapp/whatsapp.route');
const scraperRoute = require('../scraper/scraper.route');
const { requireAuth } = require('../../../Auth/Authmiddleware');
const { unsubscribeGet } = require('../contacts/contacts.controller');
const cronRoute = require('../cron/cron.route');

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
router.use('/cron', cronRoute);

router.get('/stats', requireAuth, async (req, res) => {
    try {
        const { getDB } = require('../../config/db');
        const db = getDB();
        
        const [
            totalContacts,
            sentEmails,
            failedEmails,
            unsubscribed,
            recentLogs
        ] = await Promise.all([
            db.collection('contacts').countDocuments(),
            db.collection('logs').countDocuments({ type: 'email', status: 'sent' }),
            db.collection('logs').countDocuments({ type: 'email', status: 'failed' }),
            db.collection('contacts').countDocuments({ status: 'unsubscribed' }),
            db.collection('logs')
                .find({ type: 'email' })
                .sort({ sentAt: -1 })
                .limit(5)
                .toArray()
        ]);

        res.json({
            totalContacts,
            sentEmails,
            failedEmails,
            unsubscribed,
            recentLogs
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;