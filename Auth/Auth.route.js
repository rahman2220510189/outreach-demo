const express = require('express');
const router = express.Router();
const { login, me, listUsers, addUser, removeUser } = require('./Auth.controller')
const { requireAuth } = require('./Authmiddleware');

// Public — this is the only auth route that doesn't require a token already
router.post('/login', login);

// Everything below requires you to already be logged in
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, listUsers);
router.post('/users', requireAuth, addUser);
router.delete('/users/:email', requireAuth, removeUser);

module.exports = router;