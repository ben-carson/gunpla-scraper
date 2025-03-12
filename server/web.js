/**
 * Web server for the Gunpla Scraper
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { scrapeAllWebsites, getRecentSearches, getSearchResults } = require('./scraper');
const utils = require('./utils');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API endpoint to get recent searches
app.get('/api/searches', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const searches = await getRecentSearches(limit);
    res.json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get search results
app.get('/api/searches/:id', async (req, res) => {
  try {
    const searchId = parseInt(req.params.id);
    const searchData = await getSearchResults(searchId);
    res.json(searchData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to start a new search
app.post('/api/searches', async (req, res) => {
  try {
    const { searchTerm, options = {} } = req.body;
    
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    // Start the search in the background and return immediately
    res.json({ 
      message: `Search for "${searchTerm}" started. Check recent searches for results.`,
      searchTerm
    });
    
    // Execute the search asynchronously
    scrapeAllWebsites(searchTerm, {
      delay: options.fast ? 500 : 2000,
      timeout: options.longTimeout ? 30000 : 10000
    }).catch(error => {
      console.error('Error during scraping:', error.message);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve images from data directory
app.use('/data', express.static(path.join(__dirname, '../data')));

// Start the server
app.listen(port, '0.0.0.0', () => {
  const interfaces = require('os').networkInterfaces();
  const addresses = [];
  
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        addresses.push(alias.address);
      }
    }
  }
  
  console.log(`Gunpla Scraper web server running at:`);
  console.log(`- Local: http://localhost:${port}`);
  
  if (addresses.length > 0) {
    console.log('- Network:');
    addresses.forEach(addr => {
      console.log(`  http://${addr}:${port}`);
    });
  }
});