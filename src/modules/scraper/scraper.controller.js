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
        const logs = await db.collection('logs')
            .find({ type: { $in: ['scraper', 'directory_scraper'] } })
            .sort({ completedAt: -1 })
            .toArray();
        res.json({ message: 'Scraper logs fetched', data: logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const directoryCategoryMap = require('./directoryCategoryMap');
const { scrapeDirectoryCategory } = require('./directoryScraper.service');

// Get directory-based categories (Cyprus Atlas)
const getDirectoryCategories = async (req, res) => {
    try {
        const categories = Object.keys(directoryCategoryMap).map(key => ({
            key,
            label: directoryCategoryMap[key].label
        }));
        res.json({ message: 'Directory categories fetched', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Run directory scraper (Cyprus Atlas) for a category
const runDirectoryScraper = async (req, res) => {
    try {
        const { categoryKey, maxPagesPerSlug } = req.body;

        if (!categoryKey || !directoryCategoryMap[categoryKey]) {
            return res.status(400).json({ message: 'Invalid or missing categoryKey' });
        }

        res.json({ message: `Directory scraper started for category: ${directoryCategoryMap[categoryKey].label}. This may take several minutes.` });

        const db = getDB();
        const contactsCollection = db.collection('contacts');
        const donotcontactCollection = db.collection('donotcontact');

        const { slugs, label } = directoryCategoryMap[categoryKey];

        const companies = await scrapeDirectoryCategory(slugs, maxPagesPerSlug || 3);

        let added = 0;
        let skipped = 0;
        let noWebsite = 0;
        let noEmail = 0;

        for (const company of companies) {
            const { name, phone, website } = company;

            if (!website) { noWebsite++; continue; }

            const email = await extractEmailFromWebsite(website);

            if (!email) { noEmail++; continue; }

            const blocked = await donotcontactCollection.findOne({ email });
            if (blocked) { skipped++; continue; }

            const existing = await contactsCollection.findOne({ email });
            if (existing) { skipped++; continue; }

            await contactsCollection.insertOne({
                name,
                email,
                phone: phone || null,
                businessName: name,
                website: website || null,
                category: label,
                source: 'cyprus_atlas',
                status: 'pending',
                createdAt: new Date()
            });

            added++;
        }

        await db.collection('logs').insertOne({
            type: 'directory_scraper',
            category: categoryKey,
            totalFound: companies.length,
            added,
            skipped,
            noWebsite,
            noEmail,
            completedAt: new Date()
        });

    } catch (error) {
        console.error('Directory scraper error:', error.message);
    }
};

// Export contacts as CSV by category and source
const exportCSV = async (req, res) => {
    try {
        const db = getDB();
        const { category, type } = req.query;

        if (!category || !type) {
            return res.status(400).json({ message: 'category and type are required' });
        }

        const source = type === 'scraper' ? 'osm_scraper' : 'cyprus_atlas';

        const categoryLabel = type === 'scraper'
            ? categoryMap[category]?.label
            : directoryCategoryMap[category]?.label;

        const contacts = await db.collection('contacts').find({
            source: source,
            $or: [
                { category: category },
                { category: categoryLabel }
            ]
        }).toArray();

        if (contacts.length === 0) {
            return res.status(404).json({ message: 'No contacts found for this category' });
        }

        // CSV শুধু এই ৪টা column — CSVUpload format এর সাথে match
        const headers = ['name', 'email', 'phone', 'businessName'];
        const csvRows = [
            headers.join(','),
            ...contacts
                .filter(c => c.email) // email নেই এমন skip
                .map(c => headers.map(h => {
                    const val = c[h] ?? '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(','))
        ];

        const filename = `${source}_${category}_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvRows.join('\n'));

    } catch (error) {
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};

module.exports = { getCategories, runScraper, getScraperLogs, getDirectoryCategories, runDirectoryScraper, exportCSV };

