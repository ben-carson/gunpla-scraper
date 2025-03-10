# Gunpla Scraper

A web scraper for Gunpla kits from various online stores. This tool allows you to search for Gunpla kits across multiple online retailers simultaneously.

## Features

- Scrapes multiple Gunpla retailers with a single search
- Saves results in JSON format for easy processing
- Command-line interface for easy use
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

### Interactive Mode

Run the scraper in interactive mode:

```
npm start
```

This will prompt you to enter a search term.

### Command Line Mode

Run the scraper with a search term directly:

```
npm start "RG Unicorn"
```

Or use the dedicated scrape script:

```
npm run scrape "MG Zaku"
```

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

## Output

The scraper saves results in the `data` directory:

- Individual JSON files for each website
- A combined JSON file with all results

## Customization

You can customize the scraper by modifying the URL list in `url-list-full.json` or by editing the scraper logic in `server/scraper.js`.

## License

ISC
