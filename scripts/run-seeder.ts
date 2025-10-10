#!/usr/bin/env tsx

import 'reflect-metadata';

import { config } from 'dotenv';

import AppDataSource from '../src/configs/typeorm.config';
import AuthorizationSeeder from './seed-authorization';

// Load environment variables
config();

async function runSeeder() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const seeder = new AuthorizationSeeder(AppDataSource);

    const command = process.argv[2];

    switch (command) {
      case 'up':
      case 'seed':
        console.log('🌱 Running RBAC seeder...');
        await seeder.seedRolesAndPermissions();
        break;

      case 'down':
      case 'clean':
        console.log('🧹 Cleaning RBAC data...');
        await seeder.down();
        break;

      default:
        console.log('📖 Usage:');
        console.log('  pnpm run seed:auth up     # Seed roles and permissions');
        console.log('  pnpm run seed:auth down   # Clean up seeded data');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running seeder:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the seeder
runSeeder();
