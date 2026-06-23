const express = require('express');
const router = express.Router();
const { getCategories, runScraper, getScraperLogs, getDirectoryCategories, runDirectoryScraper, exportCSV } = require('./scraper.controller');

router.get('/categories', getCategories);
router.post('/run', runScraper);
router.get('/logs', getScraperLogs);
router.get('/directory-categories', getDirectoryCategories);
router.post('/run-directory', runDirectoryScraper);
router.get('/export-csv', exportCSV);  // নতুন

module.exports = router;