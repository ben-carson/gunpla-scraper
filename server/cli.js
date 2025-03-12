#!/usr/bin/env node

const { scrapeAllWebsites } = require('./scraper');
const path = require('path');
const fs = require('fs');
const utils = require('./utils');

// Get the search term and options from command line arguments
const searchTerm = process.argv[2];
const options = {
  delay: process.argv.includes('--fast') ? 500 : 2000,
  timeout: process.argv.includes('--long-timeout') ? 30000 : 10000,
  verbose: process.argv.includes('--verbose')
};

if (!searchTerm) {
  console.error('Please provide a search term.');
  console.error('\nUsage: node cli.js "SEARCH_TERM" [OPTIONS]');
  console.error('\nOptions:');
  console.error('  --fast           Reduce delay between requests (may trigger rate limiting)');
  console.error('  --long-timeout   Use longer timeout for slow sites');
  console.error('  --verbose        Show more detailed output');
  console.error('\nExample: node cli.js "RG Gundam" --fast');
  process.exit(1);
}

console.log(`Starting scraper for search term: "${searchTerm}"`);
console.log('This may take some time depending on the number of websites...\n');

// Run the scraper
scrapeAllWebsites(searchTerm, options)
  .then(results => {
    console.log('\n===== SCRAPING COMPLETED =====');
    console.log('Results saved to the database.');
    
    // Print a summary of results
    let totalResults = 0;
    let sitesWithResults = 0;
    
    console.log('\nResults summary:');
    console.log('----------------');
    
    for (const [site, siteResults] of Object.entries(results)) {
      console.log(`${site}: ${siteResults.length} results`);
      totalResults += siteResults.length;
      if (siteResults.length > 0) {
        sitesWithResults++;
      }
    }
    
    console.log('----------------');
    console.log(`Total results: ${totalResults} from ${sitesWithResults} sites`);
    
    // Create a simple HTML report
    if (totalResults > 0) {
      const dataDir = utils.ensureDataDir(__dirname);
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const reportPath = path.join(dataDir, `report_${searchTerm.replace(/\s+/g, '_')}_${timestamp}.html`);
      createHtmlReport(reportPath, searchTerm, results);
      console.log(`\nHTML report created: ${reportPath}`);
    }
  })
  .catch(error => {
    console.error('Error during scraping:', error.message);
    process.exit(1);
  });

/**
 * Create a simple HTML report of the results
 * @param {string} reportPath - Path to save the HTML report
 * @param {string} searchTerm - The search term used
 * @param {Object} results - The scraping results
 */
function createHtmlReport(reportPath, searchTerm, results) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gunpla Scraper Results: ${searchTerm}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2 {
      color: #2c3e50;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .site-section {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .result-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      transition: transform 0.3s ease;
    }
    .result-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .result-image {
      width: 100%;
      height: 180px;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .result-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .result-price {
      color: #e74c3c;
      font-weight: bold;
    }
    .result-source {
      color: #7f8c8d;
      font-size: 0.8em;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Gunpla Scraper Results</h1>
    <div class="summary">
      <p><strong>Search Term:</strong> ${searchTerm}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Results:</strong> ${Object.values(results).flat().length}</p>
    </div>
`;

  // Add results for each site
  for (const [siteName, siteResults] of Object.entries(results)) {
    if (siteResults.length === 0) continue;
    
    html += `
    <div class="site-section">
      <h2>${siteName} (${siteResults.length} results)</h2>
      <div class="results-grid">
    `;
    
    for (const result of siteResults) {
      html += `
        <div class="result-card">
          ${result.image ? `<img class="result-image" src="${result.image}" alt="${result.title}">` : ''}
          <div class="result-title">${result.title}</div>
          <div class="result-price">${result.price}</div>
          ${result.link ? `<a href="${result.link}" target="_blank">View Product</a>` : ''}
          <div class="result-source">Source: ${siteName}</div>
        </div>
      `;
    }
    
    html += `
      </div>
    </div>
    `;
  }
  
  html += `
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
}