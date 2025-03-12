/**
 * Database utility functions for the Gunpla scraper
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../data/gunpla.db');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  return dataDir;
}

// Initialize the database
function initDatabase() {
  ensureDataDir();
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
        if (pragmaErr) {
          reject(pragmaErr);
          return;
        }
        
        // Create tables if they don't exist
        db.serialize(() => {
          // Searches table
          db.run(`
            CREATE TABLE IF NOT EXISTS searches (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              search_term TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              total_results INTEGER NOT NULL DEFAULT 0
            )
          `, (err) => {
            if (err) reject(err);
          });
          
          // Sites table
          db.run(`
            CREATE TABLE IF NOT EXISTS sites (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT UNIQUE NOT NULL,
              base_url TEXT NOT NULL
            )
          `, (err) => {
            if (err) reject(err);
          });
          
          // Products table
          db.run(`
            CREATE TABLE IF NOT EXISTS products (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              search_id INTEGER NOT NULL,
              site_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              price TEXT,
              link TEXT,
              image TEXT,
              FOREIGN KEY (search_id) REFERENCES searches (id) ON DELETE CASCADE,
              FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) reject(err);
            else resolve(db);
          });
        });
      });
    });
  });
}

/**
 * Get a database connection
 * @returns {Promise<sqlite3.Database>} - The database connection
 */
function getDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
          if (pragmaErr) {
            reject(pragmaErr);
          } else {
            resolve(db);
          }
        });
      }
    });
  });
}

/**
 * Close a database connection
 * @param {sqlite3.Database} db - The database connection to close
 * @returns {Promise<void>}
 */
function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Initialize sites table with site data from URL list
 * @param {Object} urlList - The URL list from url-list-full.json
 * @returns {Promise<void>}
 */
async function initSites(urlList) {
  const db = await getDb();
  
  try {
    // Insert sites from the URL list
    for (const [siteName, baseUrl] of Object.entries(urlList)) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO sites (name, base_url) VALUES (?, ?)',
          [siteName, baseUrl],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  } finally {
    await closeDb(db);
  }
}

/**
 * Save a search and its results to the database
 * @param {string} searchTerm - The search term used
 * @param {Object} results - The results object from scrapeAllWebsites
 * @returns {Promise<number>} - The search ID
 */
async function saveSearch(searchTerm, results) {
  const db = await getDb();
  const timestamp = new Date().toISOString();
  let searchId;
  
  try {
    // Count total results
    const totalResults = Object.values(results).reduce(
      (sum, siteResults) => sum + siteResults.length, 0
    );
    
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Insert search record
    searchId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO searches (search_term, timestamp, total_results) VALUES (?, ?, ?)',
        [searchTerm, timestamp, totalResults],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Insert products for each site
    for (const [siteName, siteResults] of Object.entries(results)) {
      if (siteResults.length === 0) continue;
      
      // Get site ID
      const siteId = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM sites WHERE name = ?',
          [siteName],
          (err, row) => {
            if (err) reject(err);
            else if (!row) reject(new Error(`Site not found: ${siteName}`));
            else resolve(row.id);
          }
        );
      });
      
      // Insert products
      for (const product of siteResults) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO products (search_id, site_id, title, price, link, image) VALUES (?, ?, ?, ?, ?, ?)',
            [
              searchId,
              siteId,
              product.title,
              product.price || 'Price not available',
              product.link || '#',
              product.image || ''
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }
    
    // Commit transaction
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return searchId;
  } catch (error) {
    // Rollback on error
    await new Promise((resolve) => {
      db.run('ROLLBACK', () => resolve());
    });
    throw error;
  } finally {
    await closeDb(db);
  }
}

/**
 * Get search results by search ID
 * @param {number} searchId - The search ID
 * @returns {Promise<Object>} - The search results in the same format as scrapeAllWebsites
 */
async function getSearchResults(searchId) {
  const db = await getDb();
  
  try {
    // Get search info
    const search = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM searches WHERE id = ?',
        [searchId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) reject(new Error(`Search not found: ${searchId}`));
          else resolve(row);
        }
      );
    });
    
    // Get all products for this search, grouped by site
    const products = await new Promise((resolve, reject) => {
      db.all(
        `SELECT p.*, s.name as site_name
         FROM products p
         JOIN sites s ON p.site_id = s.id
         WHERE p.search_id = ?`,
        [searchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Format results similar to scrapeAllWebsites
    const results = {};
    
    // Get all sites first (to include empty ones)
    const sites = await new Promise((resolve, reject) => {
      db.all(
        'SELECT name FROM sites',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.name));
        }
      );
    });
    
    // Initialize results with all sites
    for (const siteName of sites) {
      results[siteName] = [];
    }
    
    // Populate results with products
    for (const product of products) {
      results[product.site_name].push({
        title: product.title,
        price: product.price,
        link: product.link,
        image: product.image,
        source: product.site_name
      });
    }
    
    return {
      search,
      results
    };
  } finally {
    await closeDb(db);
  }
}

/**
 * Get recent searches
 * @param {number} limit - Maximum number of searches to return
 * @returns {Promise<Array>} - Array of recent searches
 */
async function getRecentSearches(limit = 10) {
  const db = await getDb();
  
  try {
    return await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, search_term, timestamp, total_results
         FROM searches
         ORDER BY id DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  } finally {
    await closeDb(db);
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDb,
  initSites,
  saveSearch,
  getSearchResults,
  getRecentSearches
};