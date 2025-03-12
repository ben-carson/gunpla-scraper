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
 * Helper function to analyze HTML and find potential product containers
 * @param {string} html - The HTML content to analyze
 * @param {string} siteName - The name of the site
 */
function analyzeHtmlStructure(html, siteName) {
  console.log(`DEBUG: Analyzing HTML structure for ${siteName}...`);
  
  const $ = cheerio.load(html);
  
  // Common product container patterns to look for
  const potentialContainers = [
    'div.product',
    'div.product-grid__item',
    'div.grid__item',
    'li.product',
    'div.product-card',
    'article.product-card',
    'div.card',
    'div.item',
    '.product-item',
    '.search-item',
    '.search-result',
    '.search-results__item'
  ];
  
  // Check each potential container
  console.log(`DEBUG: Checking potential product containers:`);
  for (const selector of potentialContainers) {
    const elements = $(selector);
    console.log(`- ${selector}: ${elements.length}`);
    
    // If elements found, log more details about the first one
    if (elements.length > 0) {
      const firstEl = elements.first();
      console.log(`  First match HTML (partial): ${firstEl.html()?.substring(0, 200)}...`);
      
      // Check for potential title selectors
      const titleSelectors = [
        'h2', 'h3', 'h4', '.title', '.name', '.product-title',
        'span.title', 'a.title', 'div.title'
      ];
      
      for (const titleSel of titleSelectors) {
        const titleEl = firstEl.find(titleSel);
        if (titleEl.length > 0) {
          console.log(`  Potential title (${titleSel}): ${titleEl.first().text().trim()}`);
        }
      }
      
      // Check for potential price selectors
      const priceSelectors = [
        '.price', '.product-price', '.amount', 'span.price',
        '.current-price', '.money'
      ];
      
      for (const priceSel of priceSelectors) {
        const priceEl = firstEl.find(priceSel);
        if (priceEl.length > 0) {
          console.log(`  Potential price (${priceSel}): ${priceEl.first().text().trim()}`);
        }
      }
    }
  }
}

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
    console.log(`DEBUG: Request URL for ${siteName}: ${url}`);
    
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
    // Log HTML for debug purposes (only for specific sites to avoid clutter)
    if (siteName === 'gundam_place' || siteName === 'newtype' || siteName === 'amazon') {
      console.log(`DEBUG: Response size for ${siteName}: ${response.data.length} bytes`);
      console.log(`DEBUG: First 500 chars of response: ${response.data.substring(0, 500)}...`);
      
      // Save the HTML to a file for inspection (only for the first one to avoid clutter)
      if (siteName === 'gundam_place') {
        const fs = require('fs');
        fs.writeFileSync('debug-gundam-place.html', response.data);
        console.log('DEBUG: Saved HTML to debug-gundam-place.html for inspection');
      }
      
      // Analyze the HTML structure to find potential selectors
      analyzeHtmlStructure(response.data, siteName);
    }
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Get the selectors for this site
    const selectors = utils.getSiteSelectors(siteName);
    console.log(`DEBUG: Selectors for ${siteName}:`, selectors);
    
    // Log container count
    if (siteName === 'gundam_place') {
      console.log(`DEBUG: Found ${$(selectors.container).length} container elements`);
      
      // Log first container HTML if any exist
      if ($(selectors.container).length > 0) {
        console.log(`DEBUG: First container HTML: ${$(selectors.container).first().html().substring(0, 300)}...`);
      }
    }
    
    // Extract data based on the selectors
    const results = [];
    
    $(selectors.container).each((i, el) => {
      const title = $(el).find(selectors.title).text().trim();
      const price = $(el).find(selectors.price).text().trim();
      let link = $(el).find(selectors.link).attr('href');
      const image = $(el).find(selectors.image).attr('src');
      
      // Debug info for first item
      if (i === 0 && siteName === 'gundam_place') {
        console.log(`DEBUG: Item #${i} - Title: "${title}", Price: "${price}"`);
        console.log(`DEBUG: Item #${i} - Link: "${link}", Image: "${image}"`);
      }
      
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