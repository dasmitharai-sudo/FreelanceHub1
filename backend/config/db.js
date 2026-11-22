const mongoose = require('mongoose');

let memServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelancehub';
  
  try {
    // Attempt connecting to the specified MongoDB instance
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to failover if local mongod is not running
    });
    console.log('MongoDB Connected successfully (Standard).');
  } catch (err) {
    console.warn(`Standard MongoDB connection failed (${err.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      const memUri = memServer.getUri();
      console.log(`MongoMemoryServer running at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('MongoDB Connected successfully (In-Memory Fallback). Ready for full-featured testing!');
    } catch (memErr) {
      console.error('Fatal: Could not start in-memory MongoDB fallback:', memErr.message);
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};

module.exports = { connectDB, closeDB };
