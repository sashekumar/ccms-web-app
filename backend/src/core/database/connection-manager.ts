import mssql from 'mssql';
import { databaseConfig } from '../../config/database.config';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private pool: mssql.ConnectionPool | null = null;
  private connecting: Promise<mssql.ConnectionPool> | null = null;

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public async getPool(): Promise<mssql.ConnectionPool> {
    if (this.pool && this.pool.connected) {
      return this.pool;
    }

    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = this.connect();
    return this.connecting;
  }

  private async connect(): Promise<mssql.ConnectionPool> {
    try {
      console.log('Connecting to database...');
      this.pool = await new mssql.ConnectionPool(databaseConfig).connect();
      console.log('Database connected successfully');
      this.connecting = null;
      return this.pool;
    } catch (error) {
      this.connecting = null;
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}

export const connectionManager = ConnectionManager.getInstance();
