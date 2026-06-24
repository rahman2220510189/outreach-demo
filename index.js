const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { connectDB, getDB } = require('./src/config/db');
const routes = require('./src/modules/routes/index');

const allowedOrigin = process.env.CLIENT_URL || '';

app.use(cors({
    origin: ['http://localhost:5173', 'https://outreach.ainoviro.com', allowedOrigin],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('email fly in the sky');
});

// Connect DB then start server
const startServer = async () => {
    await connectDB();

    cron.schedule('0 0 * * *', async () => {
        try {
            const db = getDB();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await db.collection('contacts').deleteMany({
                status: 'pending',
                createdAt: { $lt: thirtyDaysAgo }
            });

            await db.collection('logs').insertOne({
                type: 'cleanup',
                deletedCount: result.deletedCount,
                completedAt: new Date()
            });

            console.log(`✅ Cleanup: ${result.deletedCount} old contacts deleted`);
        } catch (error) {
            console.error('Cleanup error:', error.message);
        }
    });

    app.listen(port, () => {
        console.log(`email server running on port ${port}`);
    });
};

startServer().catch(console.dir);