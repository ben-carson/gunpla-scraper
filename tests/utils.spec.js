const utils = require('../server/utils');
const assert = require('assert');

describe('Utils Module', () => {
  it('should format search URLs correctly', () => {
    const siteName = 'TestSite';
    const baseUrl = 'https://testsite.com';
    const searchTerm = 'Gundam';

    const formattedUrl = utils.formatSearchUrl(siteName, baseUrl, searchTerm);
    assert.strictEqual(formattedUrl, 'https://testsite.com/search?q=Gundam');
  });

  it('should return browser headers', () => {
    const headers = utils.getBrowserHeaders();
    assert.ok(headers['User-Agent']);
    assert.ok(headers['Accept']);
  });

  it('should ensure data directory exists', () => {
    const mockDir = '/mock/data/dir';
    const fs = require('fs');
    const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

    utils.ensureDataDir(mockDir);
    expect(mkdirSyncSpy).toHaveBeenCalledWith(mockDir, { recursive: true });

    mkdirSyncSpy.mockRestore();
  });
});