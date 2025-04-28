import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis error:', err));

await redisClient.connect();
console.log('🟢 Redis connected!');

export default redisClient;
