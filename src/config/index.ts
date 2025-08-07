import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  
  // API
  apiPrefix: '/api/v1',
} as const;

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTesting = config.nodeEnv === 'test';