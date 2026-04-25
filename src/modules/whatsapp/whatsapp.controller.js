const { getDB } = require('../../config/db');
const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Send single WhatsApp message
const sendSingleWhatsapp = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { phone, message } = req.body;

        // Check donotcontact list
        const blocked = await donotcontactCollection.findOne({ phone });
        if (blocked) {
            return res.status(400).json({ message: 'This number is in Do Not Contact list' });
        }

        // Send WhatsApp message
        await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phone}`,
            body: message
        });

        // Log it
        await logsCollection.insertOne({
            type: 'whatsapp',
            phone,
            message,
            status: 'sent',
            sentAt: new Date()
        });

        // Update contact status
        await contactsCollection.updateOne(
            { phone },
            { $set: { status: 'contacted', lastContactedAt: new Date() } }
        );

        res.json({ message: 'WhatsApp message sent successfully' });
    } catch (error) {
        const db = getDB();
        await db.collection('logs').insertOne({
            type: 'whatsapp',
            phone: req.body.phone,
            status: 'failed',
            error: error.message,
            sentAt: new Date()
        });

        res.status(500).json({ message: 'Failed to send WhatsApp message', error: error.message });
    }
};

// Send bulk WhatsApp messages
const sendBulkWhatsapp = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { message, campaignName } = req.body;

        // Get all pending contacts with phone numbers
        const contacts = await contactsCollection.find({ 
            status: 'pending',
            phone: { $ne: null }
        }).toArray();

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'No pending contacts with phone numbers found' });
        }

        // Save campaign
        const campaign = await db.collection('campaigns').insertOne({
            name: campaignName || 'WhatsApp Campaign',
            type: 'whatsapp',
            totalContacts: contacts.length,
            sent: 0,
            failed: 0,
            status: 'running',
            startedAt: new Date()
        });

        res.json({ 
            message: `WhatsApp campaign started! Sending to ${contacts.length} contacts.`,
            campaignId: campaign.insertedId
        });

        // Send messages in background
        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contacts) {
            try {
                // Check donotcontact
                const blocked = await donotcontactCollection.findOne({ phone: contact.phone });
                if (blocked) continue;

                await client.messages.create({
                    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                    to: `whatsapp:${contact.phone}`,
                    body: message
                });

                await logsCollection.insertOne({
                    type: 'whatsapp',
                    phone: contact.phone,
                    campaignId: campaign.insertedId,
                    status: 'sent',
                    sentAt: new Date()
                });

                await contactsCollection.updateOne(
                    { _id: contact._id },
                    { $set: { status: 'contacted', lastContactedAt: new Date() } }
                );

                sentCount++;

                // Rate limit: 1 message per 5 seconds
                await new Promise(resolve => setTimeout(resolve, 5000));

            } catch (error) {
                failedCount++;
                await logsCollection.insertOne({
                    type: 'whatsapp',
                    phone: contact.phone,
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

// Get WhatsApp logs
const getWhatsappLogs = async (req, res) => {
    try {
        const db = getDB();
        const logsCollection = db.collection('logs');
        const logs = await logsCollection.find({ type: 'whatsapp' }).sort({ sentAt: -1 }).toArray();
        res.json({ message: 'WhatsApp logs fetched successfully', data: logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { sendSingleWhatsapp, sendBulkWhatsapp, getWhatsappLogs };