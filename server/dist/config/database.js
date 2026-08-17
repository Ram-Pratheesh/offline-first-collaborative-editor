import mongoose from 'mongoose';
import { env } from './env.js';
export const connectDatabase = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
        });
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });
        await mongoose.connect(env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    }
    catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
//# sourceMappingURL=database.js.map