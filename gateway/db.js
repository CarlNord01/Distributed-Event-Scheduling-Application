const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
let db;

async function connectDB() {
  if (!db) {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db('mydatabase');
    console.log('Connected to MongoDB');
  }
  return db;
}

module.exports = { connectDB };