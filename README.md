# Gunpla Scraper

A web scraper for Gunpla kits from various online stores. This tool allows you to search for Gunpla kits across multiple online retailers simultaneously and save the results in a SQLite database.

## Features

- Scrapes multiple Gunpla retailers with a single search
- Stores results in a SQLite database
- Command-line interface for easy use
- Web interface for local network access
- Configurable search parameters

## Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/gunpla-scraper.git
cd gunpla-scraper
```

2. Install dependencies:
```
npm install
```

## Usage

### Web Interface (Recommended)

Run the web server to access the application from any device on your local network:

```
npm run web
```

This will start a web server and display the URLs you can use to access the application.

### Command Line Mode

Run the scraper in interactive mode:

```
npm start
```

This will show a menu interface where you can perform searches and view past results.

Run the scraper with a search term directly:

```
npm start "RG Unicorn"
```

Or use the dedicated scrape script:

```
npm run scrape "MG Zaku"
```

Additional options:
- `--fast`: Reduce delay between requests (may trigger rate limiting)
- `--long-timeout`: Use longer timeout for slow sites
- `--verbose`: Show more detailed output
- `--open-report`: Open HTML report in browser after scraping

Example:
```
npm run scrape "RG Unicorn" --fast --open-report
```

## Database

The application uses SQLite to store all scraping results. The database file is located at `data/gunpla.db` and contains the following tables:

- `searches`: Stores search terms and timestamps
- `sites`: Stores information about scraped websites
- `products`: Stores product information for each search

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

## License

ISC