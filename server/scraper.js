const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

// Read the URL list from the JSON file
const urlList = require('../url-list-full.json');

// Ensure the data directory exists
const dataDir = utils.ensureDataDir(__dirname);

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
 * @returns {Object} - The combined results from all sites
 */
async function scrapeAllWebsites(searchTerm) {
  const results = {};
  
  // Scrape each website
  for (const [siteName, baseUrl] of Object.entries(urlList)) {
    try {
      const siteResults = await scrapeWebsite(siteName, baseUrl, searchTerm);
      results[siteName] = siteResults;
      
      // Save individual site results
      utils.saveToJson(
        path.join(dataDir, `${siteName}.json`),
        siteResults
      );
      
      // Add a small delay to avoid overwhelming the servers
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing ${siteName}:`, error.message);
      results[siteName] = [];
    }
  }
  
  // Save combined results
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  utils.saveToJson(
    path.join(dataDir, `all_results_${searchTerm.replace(/\s+/g, '_')}_${timestamp}.json`),
    results
  );
  
  return results;
}

module.exports = {
  scrapeWebsite,
  scrapeAllWebsites
};