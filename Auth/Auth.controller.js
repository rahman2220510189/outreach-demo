const { getDB } = require('../src/config/db');
const { hashPassword, comparePassword, signToken } = require('./Auth.service');

// POST /api/auth/login — public, no auth required
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = getDB();
        const normalizedEmail = email.toLowerCase().trim();
        const user = await db.collection('users').findOne({ email: normalizedEmail });

        // Same error for "no such user" and "wrong password" — don't reveal
        // which emails exist on the system to someone probing the login form.
        if (!user || !(await comparePassword(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: { email: user.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/auth/me — protected. Lets the frontend confirm who's logged in.
const me = async (req, res) => {
    res.json({ email: req.user.email });
};

// GET /api/auth/users — protected. List everyone with access (no password hashes).
const listUsers = async (req, res) => {
    try {
        const db = getDB();
        const users = await db
            .collection('users')
            .find({}, { projection: { passwordHash: 0 } })
            .sort({ createdAt: 1 })
            .toArray();
        res.json({ message: 'Users fetched', data: users });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /api/auth/users — protected. Only someone already logged in can add
// a new person. There is deliberately no public signup route.
const addUser = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const db = getDB();
        const usersCollection = db.collection('users');
        const normalizedEmail = email.toLowerCase().trim();

        const existing = await usersCollection.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: 'A user with this email already exists' });
        }

        const passwordHash = await hashPassword(password);
        await usersCollection.insertOne({
            email: normalizedEmail,
            passwordHash,
            addedBy: req.user.email, // who invited them — comes from requireAuth
            createdAt: new Date(),
        });

        res.json({ message: `User ${normalizedEmail} added successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE /api/auth/users/:email — protected. Revoke someone's access.
// Worth having from day one — "remove access" is the other half of "add access".
const removeUser = async (req, res) => {
    try {
        const targetEmail = req.params.email.toLowerCase().trim();

        if (targetEmail === req.user.email.toLowerCase()) {
            return res.status(400).json({ message: "You can't remove your own access" });
        }

        const db = getDB();
        const result = await db.collection('users').deleteOne({ email: targetEmail });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `Access removed for ${targetEmail}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { login, me, listUsers, addUser, removeUser };