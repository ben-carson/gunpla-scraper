# CLAUDE.md - Gunpla Scraper Project Guide

## Commands
- `npm start` - Run scraper in interactive mode
- `npm start "search term"` - Run scraper with search term
- `npm run scrape "search term"` - Run dedicated scrape script
- `npm run scrape "search term" --fast` - Use reduced delay between requests
- `npm run scrape "search term" --long-timeout` - Use longer timeout for slow sites
- `npm run scrape "search term" --verbose` - Show more detailed output

## Code Style
- **Formatting**: 2-space indentation, single quotes, semicolons
- **Imports**: Use CommonJS pattern with `require()`
- **Naming**: camelCase for variables/functions, snake_case for file paths/URLs
- **Functions**: Use JSDoc comments for type documentation
- **Error Handling**: Use try/catch with graceful degradation
- **File Structure**: Keep related functionality in same modules
- **Async Code**: Use async/await pattern for promises

## Project Organization
- `index.js` - Main entry point
- `server/` - Core application logic
- `data/` - JSON output files
- `url-list-full.json` - Website scraping configuration