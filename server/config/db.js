const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(uri, {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log('MongoDB connected successfully');
        console.log(`Connected to database: ${mongoose.connection.name}`);

        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (e) {
        console.error('Error connecting to MongoDB:', e);
        process.exit(1);
    }
}

async function closeDB() {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (e) {
        console.error('Error closing MongoDB connection:', e);
        throw e;
    }
}

module.exports = { connectDB, closeDB };