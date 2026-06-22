const express = require('express');
const router = express.Router();
const { getCategories, runScraper, getScraperLogs, getDirectoryCategories, runDirectoryScraper } = require('./scraper.controller');
// Get available categories
router.get('/categories', getCategories);

// Run scraper for a category
router.post('/run', runScraper);

// Get scraper run logs
router.get('/logs', getScraperLogs);

// Directory based scraper (Cyprus Atlas - service businesses)
router.get('/directory-categories', getDirectoryCategories);
router.post('/run-directory', runDirectoryScraper);

module.exports = router;