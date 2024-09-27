import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.db = null;
    this.connect();
  }

  // Use async/await for MongoClient connection
  async connect() {
    try {
      const client = await MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      this.db = client.db(DB_DATABASE);
      this.users = this.db.collection('users');
      this.files = this.db.collection('files');
      console.log('MongoDB connected successfully');
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      this.db = false;
    }
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    if (!this.db) throw new Error('No database connection');
    return this.users.countDocuments();
  }

  async nbFiles() {
    if (!this.db) throw new Error('No database connection');
    return this.files.countDocuments();
  }

  async getUser(query) {
    if (!this.db) throw new Error('No database connection');
    return this.users.findOne(query);
  }
}

const dbClient = new DBClient();
module.exports = dbClient;

