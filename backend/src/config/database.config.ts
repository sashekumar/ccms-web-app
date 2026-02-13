import { config as dotenvConfig } from 'dotenv';
import mssql from 'mssql';

dotenvConfig();

export const databaseConfig: mssql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'db_ccms',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000
  }
};
