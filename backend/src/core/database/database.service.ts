import mssql from 'mssql';
import { connectionManager } from './connection-manager';

export interface QueryResult<T = any> {
  recordset: T[];
  rowsAffected: number[];
}

export class DatabaseService {
  public async executeQuery<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<QueryResult<T>> {
    try {
      const pool = await connectionManager.getPool();
      const request = pool.request();

      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      return await request.query(query);
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  public async findOne<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T | null> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset[0] || null;
  }

  public async findMany<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const result = await this.executeQuery<T>(query, parameters);
    return result.recordset;
  }
}

export const database = new DatabaseService();
