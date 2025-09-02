import mongoose from "mongoose";
import { config } from "./config";

export const connectDB = async (): Promise<void> => {
  try {
    const options = {
      retryWrites: true,
    };

    await mongoose.connect(config.mongoUri, options);
    
    console.log("MongoDB connected ✅");
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error("MongoDB connection error ❌", error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log("MongoDB disconnected ⚠️");
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log("MongoDB reconnected ✅");
    });
    
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    process.exit(1);
  }
};