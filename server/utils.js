/**
 * Utility functions for the Gunpla scraper
 */

const fs = require('fs');
const path = require('path');

/**
 * Format a URL with a search term based on the site's pattern
 * @param {string} siteName - The name of the site
 * @param {string} baseUrl - The base URL for the site
 * @param {string} searchTerm - The search term to add to the URL
 * @returns {string} - The formatted URL
 */
function formatSearchUrl(siteName, baseUrl, searchTerm) {
  // Different sites have different URL patterns
  if (baseUrl.includes('?')) {
    // If the URL already has query parameters
    if (baseUrl.endsWith('=')) {
      return baseUrl + encodeURIComponent(searchTerm);
    } else if (siteName === 'p_bandai_usa') {
      // Special case for P-Bandai
      return baseUrl.replace('text=', `text=${encodeURIComponent(searchTerm)}`);
    } else if (siteName === 'amazon') {
      // Special case for Amazon
      return baseUrl.replace('k=', `k=${encodeURIComponent(searchTerm)}`);
    } else if (siteName === 'ebay') {
      // Special case for eBay
      return baseUrl.replace('_nkw=', `_nkw=${encodeURIComponent(searchTerm)}`);
    } else {
      // Add the search term to the existing query
      return baseUrl + `&q=${encodeURIComponent(searchTerm)}`;
    }
  } else if (baseUrl.endsWith('/')) {
    // If the URL ends with a slash
    return baseUrl + encodeURIComponent(searchTerm);
  } else {
    // Otherwise, append the search term
    return baseUrl + encodeURIComponent(searchTerm);
  }
}

/**
 * Get site-specific selectors for scraping
 * @param {string} siteName - The name of the site
 * @returns {Object} - The selectors for the site
 */
function getSiteSelectors(siteName) {
  const selectors = {
    // Default selectors that might work on some sites
    default: {
      container: 'div.product, div.item, div.product-item, div.product-card',
      title: 'h2, h3, h4, .title, .name',
      price: '.price, .product-price',
      link: 'a',
      image: 'img'
    },
    
    // Site-specific selectors
    gundam_place: {
      container: '.product-item',
      title: '.product-item-title',
      price: '.product-item-price',
      link: 'a',
      image: 'img'
    },
    
    az_toy_hobby: {
      container: '.product-card',
      title: '.product-card__title',
      price: '.product-card__price',
      link: 'a',
      image: 'img',
      baseUrl: 'https://aztoyhobby.com'
    },
    
    usags: {
      container: '.product-item',
      title: '.product-item-title',
      price: '.product-item-price',
      link: 'a',
      image: 'img'
    },
    
    newtype: {
      container: '.product-card',
      title: '.product-card__title',
      price: '.product-card__price',
      link: 'a',
      image: 'img'
    },
    
    gundam_galaxy: {
      container: '.item',
      title: '.name',
      price: '.price',
      link: 'a',
      image: 'img',
      baseUrl: 'https://www.thegundamgalaxy.com'
    }
    
    // Add more site-specific selectors as needed
  };
  
  return selectors[siteName] || selectors.default;
}

/**
 * Create a browser-like user agent and headers
 * @returns {Object} - The headers object
 */
function getBrowserHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };
}

/**
 * Ensure the data directory exists
 * @param {string} baseDir - The base directory
 * @returns {string} - The path to the data directory
 */
function ensureDataDir(baseDir = __dirname) {
  const dataDir = path.join(baseDir, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  return dataDir;
}

/**
 * Save results to a JSON file
 * @param {string} filePath - The path to save the file
 * @param {Object} data - The data to save
 */
function saveToJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  formatSearchUrl,
  getSiteSelectors,
  getBrowserHeaders,
  ensureDataDir,
  saveToJson
};