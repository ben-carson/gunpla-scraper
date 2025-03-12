const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const db = require('./db');

// Read the URL list from the JSON file
const urlList = require('../url-list-full.json');

// Initialize database and sites
(async function init() {
  try {
    await db.initDatabase();
    await db.initSites(urlList);
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
})();

/**
 * Function to scrape a website with a search term
 * @param {string} siteName - The name of the site to scrape
 * @param {string} baseUrl - The base URL for the site
 * @param {string} searchTerm - The search term to look for
 * @returns {Array} - The scraped results
 */
async function scrapeWebsite(siteName, baseUrl, searchTerm) {
  try {
    console.log(`Scraping ${siteName} for "${searchTerm}"...`);
    
    // Format the URL with the search term
    const url = utils.formatSearchUrl(siteName, baseUrl, searchTerm);
    
    // Set up headers to mimic a browser
    const headers = utils.getBrowserHeaders();
    
    // Make the request with a timeout and retry logic
    let response;
    try {
      response = await axios.get(url, {
        headers,
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });
    } catch (requestError) {
      if (requestError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Error ${requestError.response.status} from ${siteName}: ${requestError.message}`);
        return [];
      } else if (requestError.request) {
        // The request was made but no response was received
        console.error(`No response from ${siteName}: ${requestError.message}`);
        return [];
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`Request setup error for ${siteName}: ${requestError.message}`);
        return [];
      }
    }
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Get the selectors for this site
    const selectors = utils.getSiteSelectors(siteName);
    
    // Extract data based on the selectors
    const results = [];
    
    $(selectors.container).each((i, el) => {
      const title = $(el).find(selectors.title).text().trim();
      const price = $(el).find(selectors.price).text().trim();
      let link = $(el).find(selectors.link).attr('href');
      const image = $(el).find(selectors.image).attr('src');
      
      // Add the base URL to relative links if needed
      if (link && !link.startsWith('http') && selectors.baseUrl) {
        link = selectors.baseUrl + (link.startsWith('/') ? '' : '/') + link;
      }
      
      if (title) {
        results.push({
          title,
          price: price || 'Price not available',
          link: link || '#',
          image: image || '',
          source: siteName
        });
      }
    });
    
    console.log(`Found ${results.length} results from ${siteName}`);
    return results;
  } catch (error) {
    console.error(`Error scraping ${siteName}:`, error.message);
    return [];
  }
}

/**
 * Main function to scrape all websites
 * @param {string} searchTerm - The search term to look for
 * @param {Object} options - Options for scraping (delay, timeout, etc.)
 * @returns {Object} - The combined results from all sites
 */
async function scrapeAllWebsites(searchTerm, options = {}) {
  const results = {};
  
  // Set default options
  const delay = options.delay || 2000;
  
  // Scrape each website
  for (const [siteName, baseUrl] of Object.entries(urlList)) {
    try {
      const siteResults = await scrapeWebsite(siteName, baseUrl, searchTerm);
      results[siteName] = siteResults;
      
      // Add a small delay to avoid overwhelming the servers
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Error processing ${siteName}:`, error.message);
      results[siteName] = [];
    }
  }
  
  // Save results to database
  try {
    const searchId = await db.saveSearch(searchTerm, results);
    console.log(`Results saved to database with search ID: ${searchId}`);
  } catch (error) {
    console.error('Error saving to database:', error.message);
  }
  
  return results;
}

/**
 * Get search results from database
 * @param {number} searchId - The search ID to retrieve
 * @returns {Object} - The search results data
 */
async function getSearchResults(searchId) {
  try {
    return await db.getSearchResults(searchId);
  } catch (error) {
    console.error('Error fetching search results:', error.message);
    throw error;
  }
}

/**
 * Get recent searches from database
 * @param {number} limit - Maximum number of searches to return
 * @returns {Array} - Array of recent searches
 */
async function getRecentSearches(limit = 10) {
  try {
    return await db.getRecentSearches(limit);
  } catch (error) {
    console.error('Error fetching recent searches:', error.message);
    throw error;
  }
}

module.exports = {
  scrapeWebsite,
  scrapeAllWebsites,
  getSearchResults,
  getRecentSearches
};