const express = require('express');
const router = express.Router();
const { getCategories, runScraper, getScraperLogs } = require('./scraper.controller');

// Get available categories
router.get('/categories', getCategories);

// Run scraper for a category
router.post('/run', runScraper);

// Get scraper run logs
router.get('/logs', getScraperLogs);

module.exports = router;