const express = require('express');
const router = express.Router();
const { addContact, getContacts, unsubscribe, deleteContact, importCSV } = require('./contacts.controller');

// Add single contact
router.post('/add', addContact);

// Get all contacts
router.get('/', getContacts);

router.post('/import-csv', importCSV);
// Unsubscribe
router.post('/unsubscribe', unsubscribe);

// Delete contact
router.delete('/:id', deleteContact);

module.exports = router;