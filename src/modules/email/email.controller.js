const { getDB } = require('../../config/db');
const { sendEmail } = require('../utils/sendEmail');

// Send single email
const sendSingleEmail = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { email, subject, body } = req.body;

        // Check donotcontact list
        const blocked = await donotcontactCollection.findOne({ email });
        if (blocked) {
            return res.status(400).json({ message: 'This email is in Do Not Contact list' });
        }

        // Find contact
        const contact = await contactsCollection.findOne({ email });

        // Send email
        await sendEmail({
            toEmail: email,
            subject,
            body,
            contactName: contact?.name || '',
            source: contact?.source || 'manual'
        });

        // Log it
        await logsCollection.insertOne({
            type: 'email',
            email,
            subject,
            status: 'sent',
            sentAt: new Date()
        });

        // Update contact status
        await contactsCollection.updateOne(
            { email },
            { $set: { status: 'contacted', lastContactedAt: new Date() } }
        );

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        // Log failed
        const db = getDB();
        await db.collection('logs').insertOne({
            type: 'email',
            email: req.body.email,
            status: 'failed',
            error: error.message,
            sentAt: new Date()
        });

        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
};

// Send bulk email with rate limiting (50/hour)
const sendBulkEmail = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { subject, body, campaignName } = req.body;

        // Get all pending contacts
        // const contacts = await contactsCollection.find({ status: 'pending' }).toArray();
const contacts = await contactsCollection.find({ status: 'pending' }).toArray();
        if (contacts.length === 0) {
            return res.status(400).json({ message: 'No pending contacts found' });
        }

        // Save campaign
        const campaign = await db.collection('campaigns').insertOne({
            name: campaignName || 'Untitled Campaign',
            subject,
            totalContacts: contacts.length,
            sent: 0,
            failed: 0,
            status: 'running',
            startedAt: new Date()
        });

        res.json({ 
            message: `Campaign started! Sending to ${contacts.length} contacts. Max 50/hour.`,
            campaignId: campaign.insertedId
        });

        // Send emails in background with rate limiting
        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contacts) {
            try {
                // Check donotcontact
                const blocked = await donotcontactCollection.findOne({ email: contact.email });
                if (blocked) continue;

                await sendEmail({
                    toEmail: contact.email,
                    subject,
                    body,
                    contactName: contact.name || '',
                    source: contact?.source || 'manual'
                });

                await logsCollection.insertOne({
                    type: 'email',
                    email: contact.email,
                    subject,
                    campaignId: campaign.insertedId,
                    status: 'sent',
                    sentAt: new Date()
                });

                await contactsCollection.updateOne(
                    { _id: contact._id },
                    { $set: { status: 'contacted', lastContactedAt: new Date() } }
                );

                sentCount++;

                // Rate limit: 50 per hour = 1 email per 72 seconds
                await new Promise(resolve => setTimeout(resolve, 72000));

            } catch (error) {
                failedCount++;
                await logsCollection.insertOne({
                    type: 'email',
                    email: contact.email,
                    campaignId: campaign.insertedId,
                    status: 'failed',
                    error: error.message,
                    sentAt: new Date()
                });
            }
        }

        // Update campaign status
        await db.collection('campaigns').updateOne(
            { _id: campaign.insertedId },
            { $set: { sent: sentCount, failed: failedCount, status: 'completed', completedAt: new Date() } }
        );

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all logs
const getLogs = async (req, res) => {
    try {
        const db = getDB();
        const logsCollection = db.collection('logs');
        const logs = await logsCollection.find({}).sort({ sentAt: -1 }).toArray();
        res.json({ message: 'Logs fetched successfully', data: logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Send email directly from CSV — no DB save
const sendCSVEmail = async (req, res) => {
    try {
        const db = getDB();
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { contacts, subject, body, campaignName } = req.body;
        // contacts = [{ name, email }, ...]

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ message: 'No contacts provided' });
        }

        const campaign = await db.collection('campaigns').insertOne({
            name: campaignName || 'CSV Campaign',
            subject,
            totalContacts: contacts.length,
            sent: 0,
            failed: 0,
            status: 'running',
            startedAt: new Date()
        });

        res.json({
            message: `Campaign started! Sending to ${contacts.length} contacts.`,
            campaignId: campaign.insertedId
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contacts) {
            try {
                if (!contact.email) continue;

                // donotcontact check
                const blocked = await donotcontactCollection.findOne({ email: contact.email });
                if (blocked) continue;

                await sendEmail({
                    toEmail: contact.email,
                    subject,
                    body,
                    contactName: contact.name || '',
                    source: 'csv'
                });

                await logsCollection.insertOne({
                    type: 'email',
                    email: contact.email,
                    subject,
                    campaignId: campaign.insertedId,
                    status: 'sent',
                    sentAt: new Date()
                });

                sentCount++;

                // Rate limit: 50/hour
                await new Promise(resolve => setTimeout(resolve, 72000));

            } catch (error) {
                failedCount++;
                await logsCollection.insertOne({
                    type: 'email',
                    email: contact.email,
                    campaignId: campaign.insertedId,
                    status: 'failed',
                    error: error.message,
                    sentAt: new Date()
                });
            }
        }

        await db.collection('campaigns').updateOne(
            { _id: campaign.insertedId },
            { $set: { sent: sentCount, failed: failedCount, status: 'completed', completedAt: new Date() } }
        );

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { sendSingleEmail, sendBulkEmail, sendCSVEmail, getLogs };

