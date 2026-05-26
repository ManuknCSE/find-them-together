const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`FindThem API listening on port ${PORT}`);
  });

  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection', error);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    server.close(() => process.exit(0));
  });
}

bootstrap();

