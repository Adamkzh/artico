import { initDatabase } from '../database/database';

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    await initDatabase();
    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDatabase(); 