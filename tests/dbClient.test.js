const dbClient = require('../utils/db');

describe('DB Client', () => {
  beforeAll(async () => {
    await dbClient.connect();
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('should connect to MongoDB successfully', () => {
    expect(dbClient.isAlive()).toBe(true);
  });

  it('should return correct user count', async () => {
    const userCount = await dbClient.nbUsers();
    expect(userCount).toBeGreaterThanOrEqual(0);
  });
});

