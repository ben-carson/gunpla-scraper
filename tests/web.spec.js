const request = require('supertest');
const app = require('../server/web');
const assert = require('assert');

describe('Web Server', () => {
  it('should respond to GET / with a welcome message', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.text, 'Welcome to Gunpla Scraper!');
  });

  it('should respond to POST /search with search results', async () => {
    const searchTerm = 'Gundam';
    const response = await request(app).post('/search').send({ searchTerm });
    assert.strictEqual(response.status, 200);
    assert.ok(response.body.results);
  });

  it('should handle errors gracefully', async () => {
    const response = await request(app).post('/search').send({});
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.error, 'Search term is required.');
  });
});