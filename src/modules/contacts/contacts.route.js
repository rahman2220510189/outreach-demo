const express = require('express');
const router = express.Router();
const { addContact, getContacts, unsubscribe, unsubscribeGet, deleteContact, importCSV } = require('./contacts.controller');

// Add single contact
router.post('/add', addContact);

// Get all contacts
router.get('/', getContacts);

router.post('/import-csv', importCSV);

// Unsubscribe POST (API call)
router.post('/unsubscribe', unsubscribe);

// Unsubscribe GET (email link click)
router.get('/unsubscribe', unsubscribeGet);

// Delete contact
router.delete('/:id', deleteContact);

module.exports = router;