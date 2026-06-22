const axios = require('axios');
const cheerio = require('cheerio');
const { extractEmailFromWebsite } = require('./scraper.service');

const BASE_URL = 'https://cyprusatlas.com';

// Delay helper - be polite to the server, don't hammer it
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch one category page and extract company detail page links
const fetchCompanyLinksFromCategoryPage = async (slug, page = 1) => {
    try {
        const url = `${BASE_URL}/category/${slug}?page=${page}`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AinoviroDirectoryBot/1.0)' }
        });

        const $ = cheerio.load(response.data);
        const links = new Set();

        $('a[href*="/company/"]').each((i, el) => {
            let href = $(el).attr('href');
            if (href) {
                if (!href.startsWith('http')) {
                    href = BASE_URL + href;
                }
                links.add(href);
            }
        });

        return Array.from(links);
    } catch (error) {
        return [];
    }
};

// Fetch a company detail page and extract name, phone, website, city
const fetchCompanyDetails = async (companyUrl) => {
    try {
        const response = await axios.get(companyUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AinoviroDirectoryBot/1.0)' }
        });

        const $ = cheerio.load(response.data);

        // Name from h1 or title
        let name = $('h1').first().text().trim();
        if (!name) {
            name = $('title').text().split('-')[0].trim();
        }

        // Phone from tel: links
        let phone = null;
        $('a[href^="tel:"]').each((i, el) => {
            if (!phone) {
                phone = $(el).attr('href').replace('tel:', '').trim();
            }
        });

        // Website - external link that's not cyprusatlas, facebook, google, or tel/mailto
        let website = null;
        $('a[href^="http"]').each((i, el) => {
            const href = $(el).attr('href');
            if (
                !website &&
                href &&
                !href.includes('cyprusatlas.com') &&
                !href.includes('facebook.com') &&
                !href.includes('google.com') &&
                !href.includes('instagram.com') &&
                !href.includes('elixirblend.com')
            ) {
                website = href;
            }
        });

        return { name, phone, website, sourceUrl: companyUrl };
    } catch (error) {
    const status = error.response ? error.response.status : 'no response';
    console.error(`Failed to fetch ${url} — status: ${status}`);
    return [];
}
};

// Main function: scrape a directory category across multiple pages
const scrapeDirectoryCategory = async (slugs, maxPagesPerSlug = 3) => {
    const allCompanies = [];

    for (const slug of slugs) {
        for (let page = 1; page <= maxPagesPerSlug; page++) {
            const links = await fetchCompanyLinksFromCategoryPage(slug, page);

            if (links.length === 0) break; // no more pages

            for (const link of links) {
                const details = await fetchCompanyDetails(link);
                if (details && details.name) {
                    allCompanies.push(details);
                }
                await sleep(400); // be polite, don't hammer the server
            }

            await sleep(800);
        }
    }

    return allCompanies;
};

module.exports = { scrapeDirectoryCategory, fetchCompanyDetails, fetchCompanyLinksFromCategoryPage };