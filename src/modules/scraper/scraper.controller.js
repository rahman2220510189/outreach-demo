const { getDB } = require('../../config/db');
const { fetchBusinessesFromOSM, extractEmailFromWebsite, isValidPhone } = require('./scraper.service');
const categoryMap = require('./categoryMap');

// Get list of available categories
const getCategories = async (req, res) => {
    try {
        const categories = Object.keys(categoryMap).map(key => ({
            key,
            label: categoryMap[key].label
        }));
        res.json({ message: 'Categories fetched', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Run scraper for a specific category
const runScraper = async (req, res) => {
    try {
        const { categoryKey } = req.body || {};

        if (!categoryKey || !categoryMap[categoryKey]) {
            return res.status(400).json({ message: 'Invalid or missing categoryKey' });
        }

        // Respond immediately, process in background
        res.json({ message: `Scraper started for category: ${categoryMap[categoryKey].label}. This may take a few minutes.` });

        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');

        const businesses = await fetchBusinessesFromOSM(categoryKey);

        let added = 0;            // saved with email (channel: email)
        let whatsappAdded = 0;    // saved with phone only (channel: whatsapp)
        let noName = 0;
        let noWebsiteCount = 0;   // informational only, doesn't skip anymore
        let blockedCount = 0;
        let duplicate = 0;
        let noContactInfo = 0;    // no email AND no valid phone

        for (const business of businesses) {
            const tags = business.tags || {};
            const name = tags.name;
            const website = tags.website || tags['contact:website'];
            const rawPhone = tags.phone || tags['contact:phone'];
            const phone = isValidPhone(rawPhone) ? rawPhone : null;

            if (!name) { noName++; continue; }

            if (!website) { noWebsiteCount++; }

            // Try OSM email tag first (even without a website), then crawl website if needed
            let email = tags.email || tags['contact:email'];
            if (!email && website) {
                email = await extractEmailFromWebsite(website);
            }

            if (email) {
                const blocked = await donotcontactCollection.findOne({ email });
                if (blocked) { blockedCount++; continue; }

                const existing = await contactsCollection.findOne({ email });
                if (existing) { duplicate++; continue; }

                await contactsCollection.insertOne({
                    name,
                    email,
                    phone,
                    businessName: name,
                    website: website || null,
                    category: categoryMap[categoryKey].label,
                    source: 'osm_scraper',
                    channel: 'email',
                    status: 'pending',
                    createdAt: new Date()
                });

                added++;
            } else if (phone) {
                const existingWa = await contactsCollection.findOne({ phone, channel: 'whatsapp' });
                if (existingWa) { duplicate++; continue; }

                await contactsCollection.insertOne({
                    name,
                    phone,
                    businessName: name,
                    website: website || null,
                    category: categoryMap[categoryKey].label,
                    source: 'osm_scraper',
                    channel: 'whatsapp',
                    status: 'pending',
                    createdAt: new Date()
                });

                whatsappAdded++;
            } else {
                noContactInfo++;
            }
        }

        // Log scraper run result
        await db.collection('logs').insertOne({
            type: 'scraper',
            category: categoryKey,
            totalFound: businesses.length,
            added,
            whatsappAdded,
            noName,
            noWebsiteCount,
            blockedCount,
            duplicate,
            noContactInfo,
            completedAt: new Date()
        });

    } catch (error) {
        console.error('Scraper error:', error.message);
        if (error.response) {
            console.error('Overpass response status:', error.response.status);
            console.error('Overpass response data:', error.response.data);
        }
        if (!res.headersSent) {
            res.status(500).json({ message: 'Scraper failed', error: error.message });
        }
    }
};

// Get scraper run history
const getScraperLogs = async (req, res) => {
    try {
        const db = getDB();
        const logs = await db.collection('logs').find({ type: 'scraper' }).sort({ completedAt: -1 }).toArray();
        res.json({ message: 'Scraper logs fetched', data: logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getCategories, runScraper, getScraperLogs };