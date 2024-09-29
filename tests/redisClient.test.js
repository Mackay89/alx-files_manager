const redisClient = require('../utils/redis');

describe('Redis Client', () => {
  beforeAll(() => {
    // Check if Redis is connected
    return redisClient.connect();
  });

  afterAll(() => {
    return redisClient.quit();
  });

  it('should set and get a key from Redis', async () => {
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  it('should return null for non-existing keys', async () => {
    const value = await redisClient.get('non_existent_key');
    expect(value).toBe(null);
  });
});

