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

## Customization

You can customize the scraper by modifying the URL list in `url-list-full.json` or by editing the scraper logic in `server/scraper.js`.

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

### No Results Found
**Problem:** Scraper runs but finds 0 results for all sites

**Possible causes:**
- The search term may be too specific or misspelled
- Some websites may have changed their HTML structure (selectors need updating)
- Network connectivity issues
- Rate limiting by websites

**Solution:** Try with `--verbose` flag to see detailed output:
```bash
npm run scrape "your search term" --verbose
```

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