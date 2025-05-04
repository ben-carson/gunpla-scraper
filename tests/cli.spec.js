const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockScrapeAllWebsites = jest.fn();
jest.mock('../server/scraper', () => ({
  scrapeAllWebsites: mockScrapeAllWebsites,
}));

const utils = require('../server/utils');
jest.mock('../server/utils', () => ({
  ensureDataDir: jest.fn(() => '/mock/data/dir'),
}));

describe('CLI Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display error and exit if no search term is provided', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    process.argv = ['node', 'cli.js'];
    require('../server/cli');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Please provide a search term.');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test('should call scrapeAllWebsites with correct arguments', async () => {
    process.argv = ['node', 'cli.js', 'RG Gundam', '--fast', '--verbose'];
    mockScrapeAllWebsites.mockResolvedValue({});

    await require('../server/cli');

    expect(mockScrapeAllWebsites).toHaveBeenCalledWith('RG Gundam', {
      delay: 500,
      timeout: 10000,
      verbose: true,
    });
  });

  test('should create an HTML report if results are found', async () => {
    process.argv = ['node', 'cli.js', 'RG Gundam'];
    mockScrapeAllWebsites.mockResolvedValue({
      'Site A': [{ title: 'Gundam A', price: '$20', image: '', link: '' }],
    });

    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

    await require('../server/cli');

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.stringContaining('/mock/data/dir/report_RG_Gundam_'),
      expect.stringContaining('<title>Gunpla Scraper Results: RG Gundam</title>')
    );

    writeFileSyncSpy.mockRestore();
  });

  test('should handle errors during scraping', async () => {
    process.argv = ['node', 'cli.js', 'RG Gundam'];
    mockScrapeAllWebsites.mockRejectedValue(new Error('Scraping failed'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await require('../server/cli');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error during scraping:', 'Scraping failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});