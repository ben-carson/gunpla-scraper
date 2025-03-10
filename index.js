#!/usr/bin/env node

const { scrapeAllWebsites } = require('./server/scraper');
const utils = require('./server/utils');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to run the scraper with a search term
async function runScraper(searchTerm, options = {}) {
  console.log(`\nStarting scraper for search term: "${searchTerm}"`);
  console.log('This may take some time depending on the number of websites...\n');
  
  try {
    // Ensure the data directory exists
    const dataDir = utils.ensureDataDir(__dirname);
    
    // Run the scraper
    const results = await scrapeAllWebsites(searchTerm);
    
    // Print a summary of results
    console.log('\n===== SCRAPING RESULTS =====');
    let totalResults = 0;
    let sitesWithResults = 0;
    
    for (const [site, siteResults] of Object.entries(results)) {
      console.log(`${site}: ${siteResults.length} results`);
      totalResults += siteResults.length;
      if (siteResults.length > 0) {
        sitesWithResults++;
      }
    }
    
    console.log(`\nTotal results: ${totalResults} from ${sitesWithResults} sites`);
    console.log(`Results saved to the data directory.`);
    
    // Save the results to a file with a timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const resultsFile = path.join(dataDir, `results_${searchTerm.replace(/\s+/g, '_')}_${timestamp}.json`);
    utils.saveToJson(resultsFile, results);
    
    console.log(`Full results saved to: ${resultsFile}`);
    
    // Create HTML report if there are results
    if (totalResults > 0) {
      const reportFile = path.join(dataDir, `report_${searchTerm.replace(/\s+/g, '_')}_${timestamp}.html`);
      createHtmlReport(reportFile, searchTerm, results);
      console.log(`HTML report created: ${reportFile}`);
      
      // Open the report in the default browser if requested
      if (options.openReport) {
        openInBrowser(reportFile);
      }
    }
    
    return { totalResults, sitesWithResults };
  } catch (error) {
    console.error('Error during scraping:', error.message);
    return { totalResults: 0, sitesWithResults: 0, error: error.message };
  }
}

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
      background-color: #f5f5f5;
    }
    h1, h2 {
      color: #2c3e50;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
      background-color: #fff;
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
      background-color: #f9f9f9;
    }
    .result-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .result-price {
      color: #e74c3c;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .result-link {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      text-decoration: none;
      margin-bottom: 10px;
    }
    .result-link:hover {
      background-color: #2980b9;
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
    .no-results {
      text-align: center;
      padding: 20px;
      color: #7f8c8d;
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
  let hasResults = false;
  
  for (const [siteName, siteResults] of Object.entries(results)) {
    if (siteResults.length === 0) continue;
    
    hasResults = true;
    html += `
    <div class="site-section">
      <h2>${siteName} (${siteResults.length} results)</h2>
      <div class="results-grid">
    `;
    
    for (const result of siteResults) {
      html += `
        <div class="result-card">
          ${result.image ? `<img class="result-image" src="${result.image}" alt="${result.title}" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f9f9f9%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';">` : '<div class="result-image">No Image</div>'}
          <div class="result-title">${result.title}</div>
          <div class="result-price">${result.price}</div>
          ${result.link && result.link !== '#' ? `<a class="result-link" href="${result.link}" target="_blank">View Product</a>` : ''}
          <div class="result-source">Source: ${siteName}</div>
        </div>
      `;
    }
    
    html += `
      </div>
    </div>
    `;
  }
  
  if (!hasResults) {
    html += `
    <div class="no-results">
      <h2>No results found</h2>
      <p>Try a different search term or check back later.</p>
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

/**
 * Open a file in the default browser
 * @param {string} filePath - The path to the file to open
 */
function openInBrowser(filePath) {
  const platform = process.platform;
  const command = platform === 'win32' ? 'start' :
                 platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${command} "${filePath}"`, (error) => {
    if (error) {
      console.error(`Error opening file: ${error.message}`);
    }
  });
}

// Check if a search term was provided as a command line argument
const searchTermArg = process.argv[2];
const openReport = process.argv.includes('--open-report');

if (searchTermArg) {
  // If a search term was provided, run the scraper with it
  runScraper(searchTermArg, { openReport }).then(() => rl.close());
} else {
  // Otherwise, prompt the user for a search term
  console.log('=== Gunpla Scraper ===');
  console.log('This tool will search multiple online stores for Gunpla kits.');
  
  rl.question('Enter a search term (e.g., "RG Gundam", "MG Zaku"): ', (answer) => {
    if (answer.trim()) {
      runScraper(answer.trim(), { openReport }).then(() => rl.close());
    } else {
      console.log('No search term provided. Exiting...');
      rl.close();
    }
  });
}

// Handle readline close
rl.on('close', () => {
  console.log('\nThank you for using Gunpla Scraper!');
  process.exit(0);
});