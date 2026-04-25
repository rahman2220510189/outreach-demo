const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { connectDB } = require('./src/config/db');
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
    app.listen(port, () => {
        console.log(`email server running on port ${port}`);
    });
};

startServer().catch(console.dir);