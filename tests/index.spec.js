const { runScraper, showRecentSearches, viewSearchResults, createHtmlReport, openInBrowser } = require('./index');
const { scrapeAllWebsites, getRecentSearches, getSearchResults } = require('./server/scraper');
const utils = require('./server/utils');
const fs = require('fs');
const { exec } = require('child_process');

// index.test.js

jest.mock('./server/scraper');
jest.mock('./server/utils');
jest.mock('fs');
jest.mock('child_process');

describe('Gunpla Scraper Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runScraper', () => {
    it('should scrape websites and generate a report', async () => {
      scrapeAllWebsites.mockResolvedValue({
        site1: [{ title: 'Result 1', price: '$10', link: 'http://example.com' }],
        site2: []
      });
      utils.ensureDataDir.mockReturnValue('/mock/data/dir');
      fs.writeFileSync.mockImplementation(() => {});

      const result = await runScraper('test search', { openReport: false, fast: true, longTimeout: false });

      expect(scrapeAllWebsites).toHaveBeenCalledWith('test search', { delay: 500, timeout: 10000 });
      expect(result.totalResults).toBe(1);
      expect(result.sitesWithResults).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle errors during scraping', async () => {
      scrapeAllWebsites.mockRejectedValue(new Error('Scraping failed'));

      const result = await runScraper('test search', {});

      expect(result.error).toBe('Scraping failed');
    });
  });

  describe('showRecentSearches', () => {
    it('should display recent searches', async () => {
      getRecentSearches.mockResolvedValue([
        { id: 1, search_term: 'RG Gundam', total_results: 5, timestamp: Date.now() }
      ]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const rlQuestionMock = jest.spyOn(require('readline').Interface.prototype, 'question').mockImplementation((_, cb) => cb(''));

      await showRecentSearches();

      expect(getRecentSearches).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('RG Gundam'));
      rlQuestionMock.mockRestore();
    });

    it('should handle errors when retrieving recent searches', async () => {
      getRecentSearches.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await showRecentSearches();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Database error'));
    });
  });

  describe('viewSearchResults', () => {
    it('should display search results and generate a report', async () => {
      getSearchResults.mockResolvedValue({
        search: { search_term: 'RG Gundam', timestamp: Date.now() },
        results: { site1: [{ title: 'Result 1', price: '$10', link: 'http://example.com' }] }
      });
      utils.ensureDataDir.mockReturnValue('/mock/data/dir');
      fs.writeFileSync.mockImplementation(() => {});

      const rlQuestionMock = jest.spyOn(require('readline').Interface.prototype, 'question').mockImplementation((_, cb) => cb('n'));

      await viewSearchResults(1);

      expect(getSearchResults).toHaveBeenCalledWith(1);
      expect(fs.writeFileSync).toHaveBeenCalled();
      rlQuestionMock.mockRestore();
    });

    it('should handle errors when retrieving search results', async () => {
      getSearchResults.mockRejectedValue(new Error('Search not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await viewSearchResults(1);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Search not found'));
    });
  });

  describe('createHtmlReport', () => {
    it('should generate an HTML report', () => {
      const mockResults = {
        site1: [{ title: 'Result 1', price: '$10', link: 'http://example.com' }],
        site2: []
      };
      fs.writeFileSync.mockImplementation(() => {});

      createHtmlReport('/mock/report.html', 'RG Gundam', mockResults);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/mock/report.html',
        expect.stringContaining('<title>Gunpla Scraper Results: RG Gundam</title>')
      );
    });
  });

  describe('openInBrowser', () => {
    it('should execute the correct command to open a file', () => {
      exec.mockImplementation((_, cb) => cb(null));

      openInBrowser('/mock/report.html');

      expect(exec).toHaveBeenCalledWith(expect.stringContaining('/mock/report.html'), expect.any(Function));
    });

    it('should handle errors when opening a file', () => {
      exec.mockImplementation((_, cb) => cb(new Error('Failed to open')));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      openInBrowser('/mock/report.html');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to open'));
    });
  });
});const { runScraper, showRecentSearches, viewSearchResults } = require('./index');
const { scrapeAllWebsites, getRecentSearches, getSearchResults } = require('./server/scraper');
const utils = require('./server/utils');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// index.test.js

jest.mock('./server/scraper');
jest.mock('./server/utils');
jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

describe('index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runScraper', () => {
    it('should call scrapeAllWebsites with correct arguments', async () => {
      scrapeAllWebsites.mockResolvedValue({ site1: [{ title: 'Result 1' }] });
      utils.ensureDataDir.mockReturnValue('/mock/data/dir');
      fs.writeFileSync.mockImplementation(() => {});

      const options = { fast: true, longTimeout: false, openReport: false };
      const result = await runScraper('test search', options);

      expect(scrapeAllWebsites).toHaveBeenCalledWith('test search', {
        delay: 500,
        timeout: 10000,
      });
      expect(result.totalResults).toBe(1);
      expect(result.sitesWithResults).toBe(1);
    });

    it('should handle errors during scraping', async () => {
      scrapeAllWebsites.mockRejectedValue(new Error('Scraping failed'));

      const result = await runScraper('test search', {});

      expect(result.error).toBe('Scraping failed');
    });
  });

  describe('showRecentSearches', () => {
    it('should display recent searches', async () => {
      getRecentSearches.mockResolvedValue([
        { id: 1, search_term: 'test', total_results: 5, timestamp: Date.now() },
      ]);

      const rlMock = { question: jest.fn(), close: jest.fn() };
      readline.createInterface = jest.fn(() => rlMock);

      await showRecentSearches();

      expect(getRecentSearches).toHaveBeenCalled();
      expect(rlMock.question).toHaveBeenCalled();
    });

    it('should handle no recent searches', async () => {
      getRecentSearches.mockResolvedValue([]);

      const rlMock = { question: jest.fn(), close: jest.fn() };
      readline.createInterface = jest.fn(() => rlMock);

      await showRecentSearches();

      expect(getRecentSearches).toHaveBeenCalled();
      expect(rlMock.question).not.toHaveBeenCalled();
    });
  });

  describe('viewSearchResults', () => {
    it('should display search results and create an HTML report', async () => {
      getSearchResults.mockResolvedValue({
        search: { search_term: 'test', timestamp: Date.now() },
        results: { site1: [{ title: 'Result 1', price: '$10', link: '#' }] },
      });
      utils.ensureDataDir.mockReturnValue('/mock/data/dir');
      fs.writeFileSync.mockImplementation(() => {});
      exec.mockImplementation((cmd, cb) => cb(null));

      const rlMock = { question: jest.fn(), close: jest.fn() };
      readline.createInterface = jest.fn(() => rlMock);

      await viewSearchResults(1);

      expect(getSearchResults).toHaveBeenCalledWith(1);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(exec).toHaveBeenCalled();
    });

    it('should handle errors when retrieving search results', async () => {
      getSearchResults.mockRejectedValue(new Error('Failed to retrieve results'));

      const rlMock = { question: jest.fn(), close: jest.fn() };
      readline.createInterface = jest.fn(() => rlMock);

      await viewSearchResults(1);

      expect(getSearchResults).toHaveBeenCalledWith(1);
    });
  });
});