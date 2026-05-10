import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string,{
      dbName: "payments_db",
    });
    console.log('MongoDB Connected ✅');
  } catch (error) {
    console.error('MongoDB Connection Failed ❌', error);
    process.exit(1);
  }
};

export default connectDB;