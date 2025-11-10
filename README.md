# Gunpla Scraper

A web scraper for Gunpla kits from various online stores. This tool allows you to search for Gunpla kits across multiple online retailers simultaneously and save the results in a SQLite database.

## Features

- Scrapes multiple Gunpla retailers with a single search
- Stores results in a SQLite database
- Command-line interface for easy use
- Web interface for local network access
- Configurable search parameters

## Prerequisites

Before installing, make sure you have:
- **Node.js** (version 14.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

To check if you have Node.js installed, run:
```bash
node --version
npm --version
```

## Installation

1. Clone this repository:
```bash
git clone https://github.com/ben-carson/gunpla-scraper.git
cd gunpla-scraper
```

2. Install dependencies:
```bash
npm install
```

The database and data directory will be created automatically on first run.

## Usage

### Web Interface (Recommended)

The web interface provides the easiest way to use the scraper, with a graphical interface accessible from any browser:

```bash
npm run web
```

**Expected output:**
```
Gunpla Scraper web server running at:
- Local: http://localhost:3001
- Network:
  http://192.168.1.100:3001
```

Open any of these URLs in your browser to access the application. The local URL works on the same machine, while network URLs allow access from other devices on your network (phones, tablets, etc.).

### Command Line Mode

#### Interactive Mode
Run the scraper in interactive menu mode where you can browse past searches and start new ones:

```bash
npm start
```

This opens a menu interface where you can:
- Perform new searches
- View results from past searches
- Browse all saved data

#### Direct Search Mode
Run a search directly from the command line without the menu interface:

```bash
npm start "RG Unicorn"
```

#### Dedicated Scrape Script
The scrape script (`npm run scrape`) provides the same functionality as direct search mode but with support for additional command-line options:

```bash
npm run scrape "MG Zaku"
```

**Additional options:**
- `--fast`: Reduce delay between requests to 500ms (may trigger rate limiting on some sites)
- `--long-timeout`: Use 30-second timeout instead of 10 seconds for slow sites
- `--verbose`: Show detailed output including response codes and debugging information
- `--open-report`: Automatically open the HTML report in your browser after scraping

**Examples:**
```bash
# Fast scraping with automatic report opening
npm run scrape "RG Unicorn" --fast --open-report

# Slower scraping for sites with strict rate limits
npm run scrape "PG Strike" --long-timeout

# Detailed output for troubleshooting
npm run scrape "HG Zaku" --verbose
```

## Database

The application uses SQLite to store all scraping results. The database is **automatically created** on first run - no manual setup required.

**Database location:** `data/gunpla.db`

**Tables:**
- `searches`: Stores search terms and timestamps
- `sites`: Stores information about scraped websites
- `products`: Stores product information for each search

The `data/` directory and database file are created automatically when you first run the scraper. All search results are permanently stored and can be accessed later through the web interface or interactive CLI mode.

## Supported Websites

The scraper currently supports the following websites:

- Gundam Place Store
- AZ Toy Hobby
- USA Gundam Store
- Newtype
- Hub Hobby
- P-Bandai USA
- Samuel Decal
- Big Bad Toy Store
- Galactic Toys
- Gundam Planet
- JoJo Hobby n' Stuff
- Robots 4 Less
- Gundam Galaxy
- Leaping Panda Hobbies
- Barnes & Noble
- Amazon
- eBay
- Hobby Lobby

## Known Limitations

### Anti-Bot Protection (403 Errors)

**Important:** Most modern e-commerce sites now use sophisticated anti-bot protections that block automated scraping tools. When running this scraper, you will likely encounter **403 Forbidden errors** from most or all websites.

**Why this happens:**
- **Cloudflare Protection**: Many sites use Cloudflare or similar services that detect and block non-browser traffic
- **JavaScript Challenges**: Sites require JavaScript execution for browser verification
- **TLS Fingerprinting**: Advanced detection of automated HTTP clients
- **Rate Limiting**: Aggressive blocking of automated requests
- **Browser Fingerprinting**: Detection of missing browser features

**Current Status:**
This scraper uses `axios` + `cheerio` (basic HTTP requests with HTML parsing), which is easily detected by modern bot protection systems. As tested on 2025-11-10, all 18 supported websites returned 403 errors.

**Potential Solutions:**

1. **Browser Automation** (Recommended but slower):
   - Use Playwright (already in devDependencies) or Puppeteer
   - These tools control real browsers and can bypass many protections
   - Trade-off: Much slower and more resource-intensive

2. **Respect robots.txt & Terms of Service**:
   - Always check if scraping is allowed by the website
   - Consider using official APIs when available
   - Add longer delays between requests to be respectful

3. **Manual Data Collection**:
   - For personal use, consider manually browsing sites
   - Some sites offer price comparison APIs or affiliate programs

**Legal & Ethical Considerations:**
- Web scraping exists in a legal gray area
- Always respect website Terms of Service
- Excessive scraping can burden servers
- Consider contacting sites to ask about API access

This tool serves as an educational example and may require significant updates to work with modern anti-bot protections.

## Customization

You can customize the scraper by modifying the URL list in `url-list-full.json` or by editing the scraper logic in `server/scraper.js`.

**Note:** Due to anti-bot protections (see Known Limitations above), you may need to implement browser automation (Playwright/Puppeteer) instead of the current axios-based approach to successfully scrape most modern e-commerce sites.

## Troubleshooting

### Command Not Found: node or npm
**Problem:** `node: command not found` or `npm: command not found`

**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/). Node.js includes npm automatically.

### Module Not Found Errors
**Problem:** `Error: Cannot find module 'express'` or similar errors

**Solution:** Run `npm install` in the project directory to install all dependencies.

### Database Locked Errors
**Problem:** `Error: SQLITE_BUSY: database is locked`

**Solution:** Close any other instances of the scraper that might be running. Only one instance can write to the database at a time.

### No Results Found / All Sites Return 403 Errors
**Problem:** Scraper runs but finds 0 results for all sites, with 403 (Forbidden) errors

**Most Common Cause:** **Anti-bot protection** - See the [Known Limitations](#known-limitations) section above for full details.

**Other possible causes:**
- The search term may be too specific or misspelled
- Some websites may have changed their HTML structure (selectors need updating)
- Network connectivity issues
- Your IP may be temporarily blocked from excessive requests

**Solution:** Try with `--verbose` flag to see detailed output:
```bash
npm run scrape "your search term" --verbose
```

If you see "Error 403" messages, the sites are blocking automated requests. This is expected behavior with modern e-commerce sites.

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:** Another application is using port 3001. Either:
- Stop the other application, or
- Use a different port: `PORT=3002 npm run web`

### Timeout Errors
**Problem:** Sites timing out during scraping

**Solution:** Use the `--long-timeout` flag for slower sites:
```bash
npm run scrape "search term" --long-timeout
```

### Rate Limiting / 429 Errors
**Problem:** Getting blocked or rate limited by websites

**Solution:** Remove the `--fast` flag or add delays between searches. The default 2-second delay is recommended to avoid rate limiting.

## License

ISC