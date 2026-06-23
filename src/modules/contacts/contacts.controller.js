const { getDB } = require('../../config/db');

// Add single contact
const addContact = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');

        const { name, email, phone, businessName, source } = req.body;

        // Check donotcontact list
        const blocked = await donotcontactCollection.findOne({ email });
        if (blocked) {
            return res.status(400).json({ message: 'This email is in Do Not Contact list' });
        }

        // Check duplicate
        const existing = await contactsCollection.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Contact already exists' });
        }

        const contact = {
            name,
            email,
            phone: phone || null,
            businessName: businessName || null,
            source: source || 'manual',
            status: 'pending',
            createdAt: new Date()
        };

        const result = await contactsCollection.insertOne(contact);
        res.status(201).json({ message: 'Contact added successfully', result });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all contacts
const getContacts = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');

        const contacts = await contactsCollection.find({}).toArray();
        res.json({ message: 'Contacts fetched successfully', data: contacts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Unsubscribe
const unsubscribe = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');

        const { email } = req.body;

        // Check already unsubscribed
        const existing = await donotcontactCollection.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Already unsubscribed' });
        }

        await donotcontactCollection.insertOne({
            email,
            createdAt: new Date()
        });

        await contactsCollection.updateOne(
            { email },
            { $set: { status: 'unsubscribed' } }
        );

        res.json({ message: 'Successfully unsubscribed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete contact
const deleteContact = async (req, res) => {
    try {
        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const { ObjectId } = require('mongodb');

        const { id } = req.params;
        const result = await contactsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

const importCSV = [
  upload.single('csv'),
  async (req, res) => {
    try {
      const db = getDB();
      const contactsCollection = db.collection('contacts');
      const donotcontactCollection = db.collection('donotcontact');

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const results = [];
      const stream = Readable.from(req.file.buffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          let added = 0;
          let skipped = 0;

          for (const row of results) {
            const email = row.email?.trim();
            if (!email) { skipped++; continue; }

            const blocked = await donotcontactCollection.findOne({ email });
            if (blocked) { skipped++; continue; }

            const existing = await contactsCollection.findOne({ email });
            if (existing) { skipped++; continue; }

            await contactsCollection.insertOne({
              name: row.name?.trim() || '',
              email,
              phone: row.phone?.trim() || null,
              businessName: row.businessName?.trim() || null,
              source: 'csv',
              status: 'pending',
              createdAt: new Date()
            });
            added++;
          }

          res.json({ 
            message: `✅ Import complete! Added: ${added}, Skipped: ${skipped}` 
          });
        });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

const unsubscribeGet = async (req, res) => {
    try {
        const db = getDB();
        const { email } = req.query;

        if (!email) {
            return res.status(400).send('Invalid unsubscribe link.');
        }

        const existing = await db.collection('donotcontact').findOne({ email });
        if (!existing) {
            await db.collection('donotcontact').insertOne({
                email,
                createdAt: new Date()
            });
            await db.collection('contacts').updateOne(
                { email },
                { $set: { status: 'unsubscribed' } }
            );
        }

        res.redirect(
            `${process.env.CLIENT_URL}/unsubscribe?success=true&email=${encodeURIComponent(email)}`
        );

    } catch (error) {
        res.status(500).send('Something went wrong. Please try again.');
    }
};

module.exports = { addContact, getContacts, unsubscribe, unsubscribeGet, deleteContact, importCSV };


