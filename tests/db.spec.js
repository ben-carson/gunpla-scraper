const { initDatabase, getDb, closeDb, initSites, saveSearch, getSearchResults, getRecentSearches } = require('../server/db');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DB_PATH = path.join(__dirname, '../data/gunpla.db');

// Helper to clean up database file after tests
function cleanupDatabase() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}

describe('Database Utility Functions', () => {
  before(async () => {
    cleanupDatabase();
    await initDatabase();
  });

  after(() => {
    cleanupDatabase();
  });

  it('should initialize the database and create tables', async () => {
    const db = await getDb();

    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });

    assert.deepStrictEqual(tables.sort(), ['products', 'searches', 'sites']);
    await closeDb(db);
  });

  it('should insert and retrieve site data', async () => {
    const urlList = { 'TestSite': 'https://testsite.com' };
    await initSites(urlList);

    const db = await getDb();
    const sites = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM sites', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    assert.strictEqual(sites.length, 1);
    assert.strictEqual(sites[0].name, 'TestSite');
    assert.strictEqual(sites[0].base_url, 'https://testsite.com');
    await closeDb(db);
  });

  it('should save a search and its results', async () => {
    const searchTerm = 'Gundam';
    const results = {
      'TestSite': [
        { title: 'Gundam RX-78', price: '$20', link: 'https://testsite.com/rx78', image: 'https://testsite.com/rx78.jpg' }
      ]
    };

    const searchId = await saveSearch(searchTerm, results);
    assert.ok(searchId);

    const db = await getDb();
    const searches = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM searches', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    assert.strictEqual(searches.length, 1);
    assert.strictEqual(searches[0].search_term, searchTerm);

    const products = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    assert.strictEqual(products.length, 1);
    assert.strictEqual(products[0].title, 'Gundam RX-78');
    await closeDb(db);
  });

  it('should retrieve recent searches', async () => {
    const recentSearches = await getRecentSearches(1);
    assert.strictEqual(recentSearches.length, 1);
    assert.strictEqual(recentSearches[0].search_term, 'Gundam');
  });

  it('should retrieve search results by search ID', async () => {
    const recentSearches = await getRecentSearches(1);
    const searchId = recentSearches[0].id;

    const { search, results } = await getSearchResults(searchId);
    assert.strictEqual(search.search_term, 'Gundam');
    assert.strictEqual(Object.keys(results).length, 1);
    assert.strictEqual(results['TestSite'][0].title, 'Gundam RX-78');
  });
});