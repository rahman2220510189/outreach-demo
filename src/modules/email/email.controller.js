// const { getDB } = require('../../config/db');
// const { sendEmail } = require('../utils/sendEmail');

// // Send single email
// const sendSingleEmail = async (req, res) => {
//     try {
//         const db = getDB();
//         const contactsCollection = db.collection('contacts');
//         const donotcontactCollection = db.collection('donotcontact');
//         const logsCollection = db.collection('logs');

//         const { email, subject, body } = req.body;

//         // Check donotcontact list
//         const blocked = await donotcontactCollection.findOne({ email });
//         if (blocked) {
//             return res.status(400).json({ message: 'This email is in Do Not Contact list' });
//         }

//         // Find contact
//         const contact = await contactsCollection.findOne({ email });

//         // Send email
//         await sendEmail({
//             toEmail: email,
//             subject,
//             body,
//             contactName: contact?.name || '',
//             source: contact?.source || 'manual'
//         });

//         // Log it
//         await logsCollection.insertOne({
//             type: 'email',
//             email,
//             subject,
//             status: 'sent',
//             sentAt: new Date()
//         });

//         // Update contact status
//         await contactsCollection.updateOne(
//             { email },
//             { $set: { status: 'contacted', lastContactedAt: new Date() } }
//         );

//         res.json({ message: 'Email sent successfully' });
//     } catch (error) {
//         // Log failed
//         const db = getDB();
//         await db.collection('logs').insertOne({
//             type: 'email',
//             email: req.body.email,
//             status: 'failed',
//             error: error.message,
//             sentAt: new Date()
//         });

//         res.status(500).json({ message: 'Failed to send email', error: error.message });
//     }
// };

// // Send bulk email with rate limiting (50/hour)
// const sendBulkEmail = async (req, res) => {
//     try {
//         const db = getDB();
//         const contactsCollection = db.collection('contacts');
//         const donotcontactCollection = db.collection('donotcontact');
//         const logsCollection = db.collection('logs');

//         const { subject, body, campaignName } = req.body;

//         // Get all pending contacts
//         // const contacts = await contactsCollection.find({ status: 'pending' }).toArray();
// const contacts = await contactsCollection.find({ status: 'pending' }).toArray();
//         if (contacts.length === 0) {
//             return res.status(400).json({ message: 'No pending contacts found' });
//         }

//         // Save campaign
//         const campaign = await db.collection('campaigns').insertOne({
//             name: campaignName || 'Untitled Campaign',
//             subject,
//             totalContacts: contacts.length,
//             sent: 0,
//             failed: 0,
//             status: 'running',
//             startedAt: new Date()
//         });

//         res.json({ 
//             message: `Campaign started! Sending to ${contacts.length} contacts. Max 50/hour.`,
//             campaignId: campaign.insertedId
//         });

//         // Send emails in background with rate limiting
//         let sentCount = 0;
//         let failedCount = 0;

//         for (const contact of contacts) {
//             try {
//                 // Check donotcontact
//                 const blocked = await donotcontactCollection.findOne({ email: contact.email });
//                 if (blocked) continue;

//                 await sendEmail({
//                     toEmail: contact.email,
//                     subject,
//                     body,
//                     contactName: contact.name || '',
//                     source: contact?.source || 'manual'
//                 });

//                 await logsCollection.insertOne({
//                     type: 'email',
//                     email: contact.email,
//                     subject,
//                     campaignId: campaign.insertedId,
//                     status: 'sent',
//                     sentAt: new Date()
//                 });

//                 await contactsCollection.updateOne(
//                     { _id: contact._id },
//                     { $set: { status: 'contacted', lastContactedAt: new Date() } }
//                 );

//                 sentCount++;

//                 // Rate limit: 50 per hour = 1 email per 72 seconds
//                 await new Promise(resolve => setTimeout(resolve, 72000));

//             } catch (error) {
//                 failedCount++;
//                 await logsCollection.insertOne({
//                     type: 'email',
//                     email: contact.email,
//                     campaignId: campaign.insertedId,
//                     status: 'failed',
//                     error: error.message,
//                     sentAt: new Date()
//                 });
//             }
//         }

//         // Update campaign status
//         await db.collection('campaigns').updateOne(
//             { _id: campaign.insertedId },
//             { $set: { sent: sentCount, failed: failedCount, status: 'completed', completedAt: new Date() } }
//         );

//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// // Get all logs
// const getLogs = async (req, res) => {
//     try {
//         const db = getDB();
//         const logsCollection = db.collection('logs');
//         const logs = await logsCollection.find({}).sort({ sentAt: -1 }).toArray();
//         res.json({ message: 'Logs fetched successfully', data: logs });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// // Send email directly from CSV — no DB save
// const sendCSVEmail = async (req, res) => {
//     try {
//         const db = getDB();
//         const donotcontactCollection = db.collection('donotcontact');
//         const logsCollection = db.collection('logs');

//         const { contacts, subject, body, campaignName } = req.body;
//         // contacts = [{ name, email }, ...]

//         if (!contacts || contacts.length === 0) {
//             return res.status(400).json({ message: 'No contacts provided' });
//         }

//         const campaign = await db.collection('campaigns').insertOne({
//             name: campaignName || 'CSV Campaign',
//             subject,
//             totalContacts: contacts.length,
//             sent: 0,
//             failed: 0,
//             status: 'running',
//             startedAt: new Date()
//         });

//         res.json({
//             message: `Campaign started! Sending to ${contacts.length} contacts.`,
//             campaignId: campaign.insertedId
//         });

//         let sentCount = 0;
//         let failedCount = 0;

//         for (const contact of contacts) {
//             try {
//                 if (!contact.email) continue;

//                 // donotcontact check
//                 const blocked = await donotcontactCollection.findOne({ email: contact.email });
//                 if (blocked) continue;

//                 await sendEmail({
//                     toEmail: contact.email,
//                     subject,
//                     body,
//                     contactName: contact.name || '',
//                     source: 'csv'
//                 });

//                 await logsCollection.insertOne({
//                     type: 'email',
//                     email: contact.email,
//                     subject,
//                     campaignId: campaign.insertedId,
//                     status: 'sent',
//                     sentAt: new Date()
//                 });

//                 sentCount++;

//                 // Rate limit: 50/hour
//                 await new Promise(resolve => setTimeout(resolve, 72000));

//             } catch (error) {
//                 failedCount++;
//                 await logsCollection.insertOne({
//                     type: 'email',
//                     email: contact.email,
//                     campaignId: campaign.insertedId,
//                     status: 'failed',
//                     error: error.message,
//                     sentAt: new Date()
//                 });
//             }
//         }

//         await db.collection('campaigns').updateOne(
//             { _id: campaign.insertedId },
//             { $set: { sent: sentCount, failed: failedCount, status: 'completed', completedAt: new Date() } }
//         );

//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// module.exports = { sendSingleEmail, sendBulkEmail, sendCSVEmail, getLogs };

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

        const blocked = await donotcontactCollection.findOne({ email });
        if (blocked) {
            return res.status(400).json({ message: 'This email is in Do Not Contact list' });
        }

        const contact = await contactsCollection.findOne({ email });

        await sendEmail({
            toEmail: email,
            subject,
            body,
            contactName: contact?.name || '',
            source: contact?.source || 'manual'
        });

        await logsCollection.insertOne({
            type: 'email',
            email,
            subject,
            status: 'sent',
            sentAt: new Date()
        });

        await contactsCollection.updateOne(
            { email },
            { $set: { status: 'contacted', lastContactedAt: new Date() } }
        );

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
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

// Send bulk email — sends to ALL pending DB contacts, no count limit
const sendBulkEmail = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');

        const { subject, body, campaignName } = req.body;

        const contacts = await contactsCollection.find({ status: 'pending' }).toArray();
        if (contacts.length === 0) {
            return res.status(400).json({ message: 'No pending contacts found' });
        }

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
            message: `Campaign started! Sending to ${contacts.length} contacts.`,
            campaignId: campaign.insertedId
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contacts) {
            try {
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

                // Safe pacing — well under SES's 14/sec limit, avoids burst-spam pattern
                await new Promise(resolve => setTimeout(resolve, 4000));

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

// Send email directly from CSV — no DB save as contact, but tracks sent history to avoid re-sending later
const sendCSVEmail = async (req, res) => {
    try {
        const db = getDB();
        const donotcontactCollection = db.collection('donotcontact');
        const logsCollection = db.collection('logs');
        const sentHistoryCollection = db.collection('csv_sent_history');

        const { contacts, subject, body, campaignName } = req.body;

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ message: 'No contacts provided' });
        }

        // Dedupe by email within this CSV — keep first occurrence only
        const seen = new Set();
        const uniqueContacts = [];
        let duplicateInFile = 0;

        for (const contact of contacts) {
            const email = contact.email?.trim().toLowerCase();
            if (!email) continue;
            if (seen.has(email)) {
                duplicateInFile++;
                continue;
            }
            seen.add(email);
            uniqueContacts.push({ ...contact, email });
        }

        if (uniqueContacts.length === 0) {
            return res.status(400).json({ message: 'No valid unique emails found in file' });
        }

        // Filter out emails already sent via CSV before (any previous CSV campaign)
        const alreadySentEmails = await sentHistoryCollection
            .find({ email: { $in: uniqueContacts.map(c => c.email) } })
            .project({ email: 1 })
            .toArray();
        const alreadySentSet = new Set(alreadySentEmails.map(e => e.email));

        const skippedAlreadySent = uniqueContacts.filter(c => alreadySentSet.has(c.email)).length;
        const freshContacts = uniqueContacts.filter(c => !alreadySentSet.has(c.email));

        if (freshContacts.length === 0) {
            return res.status(400).json({
                message: `All ${uniqueContacts.length} contacts were already emailed in a previous CSV campaign. Nothing to send.`
            });
        }

        const campaign = await db.collection('campaigns').insertOne({
            name: campaignName || 'CSV Campaign',
            subject,
            totalContacts: freshContacts.length,
            duplicateInFile,
            skippedAlreadySent,
            sent: 0,
            failed: 0,
            status: 'running',
            startedAt: new Date()
        });

        let summary = `Campaign started! Sending to ${freshContacts.length} contacts.`;
        if (duplicateInFile > 0) summary += ` (${duplicateInFile} duplicates in file skipped)`;
        if (skippedAlreadySent > 0) summary += ` (${skippedAlreadySent} already emailed before, skipped)`;

        res.json({ message: summary, campaignId: campaign.insertedId });

        let sentCount = 0;
        let failedCount = 0;

        for (const contact of freshContacts) {
            try {
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

                // Record this email as sent so future CSV uploads skip it
                await sentHistoryCollection.insertOne({
                    email: contact.email,
                    subject,
                    campaignId: campaign.insertedId,
                    sentAt: new Date()
                });

                sentCount++;

                await new Promise(resolve => setTimeout(resolve, 4000));

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