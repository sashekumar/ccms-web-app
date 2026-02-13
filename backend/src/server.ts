import { config } from 'dotenv';
config();

import { createApp } from './app';
import { connectionManager } from './core/database/connection-manager';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await connectionManager.getPool();
    console.log('✓ Database connection established');

    // Start Express server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await connectionManager.close();
  process.exit(0);
});

startServer();
