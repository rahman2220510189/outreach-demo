

require('dotenv').config();
const { connectDB, getDB } = require('../src/config/db');
const { hashPassword } = require('./auth.service');

const INITIAL_USERS = [
    { email: 'rahman22205101894@diu.edu.bd', password: process.env.SEED_PASSWORD_1 },
    { email: 'noviroai@gmail.com', password: process.env.SEED_PASSWORD_2 },
];

const run = async () => {
    await connectDB();
    const db = getDB();
    const usersCollection = db.collection('users');

    for (const u of INITIAL_USERS) {
        const email = u.email.toLowerCase().trim();

        if (!u.password) {
            console.error(`No password set for ${email} — set SEED_PASSWORD_1 / SEED_PASSWORD_2 in .env first. Skipping.`);
            continue;
        }
        if (u.password.length < 8) {
            console.error(`Password for ${email} is too short (min 8 chars). Skipping.`);
            continue;
        }

        const existing = await usersCollection.findOne({ email });
        if (existing) {
            console.log(`${email} already exists — skipping.`);
            continue;
        }

        const passwordHash = await hashPassword(u.password);
        await usersCollection.insertOne({
            email,
            passwordHash,
            addedBy: 'seed-script',
            createdAt: new Date(),
        });
        console.log(`✅ Created user: ${email}`);
    }

    process.exit(0);
};

run().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});