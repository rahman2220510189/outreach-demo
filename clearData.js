require('dotenv').config();
const { connectDB, getDB } = require('./src/config/db');

const clearData = async () => {
    await connectDB();
    const db = getDB();

    const contactsResult = await db.collection('contacts').deleteMany({ source: 'osm_scraper' });
    const logsResult = await db.collection('logs').deleteMany({ type: 'scraper' });

    console.log(`Deleted ${contactsResult.deletedCount} osm_scraper contacts`);
    console.log(`Deleted ${logsResult.deletedCount} scraper logs`);

    process.exit(0);
};

clearData();