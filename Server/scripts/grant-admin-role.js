import dotenv from 'dotenv';
import mongoose from 'mongoose';
import user from '../src/Model/UserModel.js';
import { connectDb, DB_NAME } from '../src/config/connectionDB.js';

// Load environment variables
dotenv.config();

/**
 * Script to grant platform administrator role to a user
 * Usage: node -r dotenv/config scripts/grant-admin-role.js [email]
 * Example: node -r dotenv/config scripts/grant-admin-role.js karan@gmail.com
 */
const grantAdminRole = async () => {
  try {
    // Get email from command line argument or use default
    const email = process.argv[2] || 'karan@gmail.com';
    
    console.log('🔧 Granting Platform Admin Role Script');
    console.log('==========================================');
    console.log(`📧 Target Email: ${email}`);
    console.log('');

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set!');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`✅ Connected to MongoDB: ${DB_NAME}`);
    console.log('');

    // Find user by email
    console.log(`🔍 Searching for user with email: ${email}...`);
    const targetUser = await user.findOne({ email: email });

    if (!targetUser) {
      console.error(`❌ User with email "${email}" not found!`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ User found: ${targetUser.username} (${targetUser.email})`);
    console.log(`   Current admin status: ${targetUser.isPlatformAdmin ? 'Yes' : 'No'}`);
    console.log('');

    // Check if already admin
    if (targetUser.isPlatformAdmin) {
      console.log('ℹ️  User already has platform administrator role.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Grant admin role
    console.log('🔐 Granting platform administrator role...');
    targetUser.isPlatformAdmin = true;
    await targetUser.save();

    console.log('✅ Successfully granted platform administrator role!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   Username: ${targetUser.username}`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Admin Status: ${targetUser.isPlatformAdmin ? 'Yes' : 'No'}`);
    console.log('');

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    console.log('');
    console.log('🎉 Script completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error granting admin role:', error.message);
    console.error(error);
    
    // Close database connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
};

// Run the script
grantAdminRole();

