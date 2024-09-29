import redisClient from './redis';
import dbClient from './db';
import { ObjectId } from 'mongodb';

/**
 * Function to get the authentication token from the request headers
 * @param {Object} request - The HTTP request object
 * @returns {string} - The formatted authentication token
 */
async function getAuthToken(request) {
  const token = request.headers['x-token'];
  return `auth_${token}`; // Use backticks for string interpolation
}

// Checks authentication against verified information
// Returns userId of user
async function findUserIdByToken(request) {
  const key = await getAuthToken(request);
  const userId = await redisClient.get(key);
  return userId || null;
}

// Gets user by userId
// Returns exactly the first user found
async function findUserById(userId) {
  const userExistsArray = await dbClient.db.collection('users').find({ _id: ObjectId(userId) }).toArray(); // Use correct syntax for ObjectId
  return userExistsArray[0] || null;
}

export {
  findUserIdByToken,
  findUserById,
};

