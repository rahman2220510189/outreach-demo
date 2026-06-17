const axios = require('axios');
const cheerio = require('cheerio');
const categoryMap = require('./categoryMap');

// Convert OSM tag string like 'shop=hairdresser' into Overpass query line
const buildOverpassFilter = (osmTags) => {
    return osmTags.map(tag => {
        const [key, value] = tag.split('=');
        if (value === '*') {
            return `node["${key}"](area.cy);`;
        }
        return `node["${key}"="${value}"](area.cy);`;
    }).join('\n');
};


const OVERPASS_SERVERS = [
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter'
];

const OSM_USER_AGENT = 'AinoviroVendorBot/1.0 (+https://ainoviro.com/bot; collab@ainoviro.com)';

// Known placeholder/template/third-party emails that aren't real business contacts
const PLACEHOLDER_PATTERNS = [
    'example.com',
    'domain.com',
    'paradeigma',      // Greek for "example"
    'yourdomain',
    'yourcompany',
    'sentry',
    'wixpress',
    'test@',
    'noreply@',
    'no-reply@',
    'wolt.com',
    'locus.cards'
];

const isLikelyPlaceholder = (email) => {
    const lower = email.toLowerCase();
    return PLACEHOLDER_PATTERNS.some(pattern => lower.includes(pattern));
};

const isValidPhone = (phone) => {
    if (!phone) return false;
    const digitCount = (phone.match(/\d/g) || []).length;
    return digitCount >= 6 && digitCount <= 15;
};

const fetchBusinessesFromOSM = async (categoryKey) => {
    const category = categoryMap[categoryKey];
    if (!category) {
        throw new Error(`Unknown category: ${categoryKey}`);
    }
    const filter = buildOverpassFilter(category.osmTags);
    const query = `[out:json][timeout:60];area["ISO3166-1"="CY"]["admin_level"="2"]->.cy;(${filter});out body;`;

    let lastError = null;

    for (const server of OVERPASS_SERVERS) {
        try {
            console.log(`Trying Overpass server: ${server}`);
            const response = await axios({
                method: 'post',
                url: server,
                data: 'data=' + encodeURIComponent(query),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': OSM_USER_AGENT,
                    'Referer': 'https://ainoviro.com'
                },
                timeout: 70000
            });
            console.log(`Success from: ${server}`);
            return response.data.elements || [];
        } catch (error) {
            lastError = error;
            const status = error.response ? error.response.status : 'no response';
            console.error(`Server ${server} failed (status: ${status}). Trying next...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }

    throw lastError;
};

// Extract email from a website by crawling it
const extractEmailFromWebsite = async (url) => {
    try {
        if (!url) return null;

        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const response = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AinoviroBot/1.0)' }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let foundEmail = null;
        $('a[href^="mailto:"]').each((i, el) => {
            const href = $(el).attr('href');
            const email = href.replace('mailto:', '').split('?')[0].trim();
            if (email && !foundEmail) {
                foundEmail = email;
            }
        });

        if (foundEmail) return foundEmail;

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = html.match(emailRegex);
if (matches && matches.length > 0) {
            const validEmails = matches.filter(email => 
                !email.includes('.png') && 
                !email.includes('.jpg') && 
                !email.includes('.svg') &&
                !isLikelyPlaceholder(email)
            );
            if (validEmails.length > 0) return validEmails[0];
        }

        return null;
    } catch (error) {
        return null;
    }
};

module.exports = { fetchBusinessesFromOSM, extractEmailFromWebsite, isValidPhone };