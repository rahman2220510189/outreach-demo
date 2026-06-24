const { getDB } = require('../../config/db');

const cleanupOldContacts = async (req, res) => {
    try {
        const secret = req.headers['x-cron-secret'];
        if (secret !== process.env.CRON_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

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

        console.log(`✅ Cleanup: ${result.deletedCount} contacts deleted`);
        res.json({ message: `Cleanup done. Deleted: ${result.deletedCount} contacts` });

    } catch (error) {
        res.status(500).json({ message: 'Cleanup failed', error: error.message });
    }
};

module.exports = { cleanupOldContacts };