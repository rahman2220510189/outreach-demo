const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjuyyb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

const connectDB = async () => {
    await client.connect();
    db = client.db('outreach');
    console.log('MongoDB connected successfully!');
};

const getDB = () => db;

module.exports = { connectDB, getDB };