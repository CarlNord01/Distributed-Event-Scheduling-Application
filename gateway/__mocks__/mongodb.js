const { MongoClient } = require('mongodb');

// Mock the MongoClient and connectDB method
const client = { db: jest.fn().mockReturnThis() };

const connectDB = jest.fn().mockResolvedValue(client);

module.exports = { connectDB, client };
