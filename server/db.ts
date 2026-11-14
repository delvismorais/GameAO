import pg from 'pg';

const { Pool } = pg;
let pool: pg.Pool | null = null;

export function hasDatabaseUrl(): boolean { return Boolean(process.env.DATABASE_URL); }

function translateSql(source: string, params: unknown[]): { text: string; values: unknown[] } {
  const ignoreInsert = /INSERT\s+IGNORE\s+INTO/i.test(source);
  let text = source.replaceAll('`', '"');
  text = text.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  text = text.replace(/ON DUPLICATE KEY UPDATE\s+value_json\s*=\s*VALUES\(value_json\)/gi, 'ON CONFLICT (setting_key) DO UPDATE SET value_json = EXCLUDED.value_json');
  text = text.replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+\?\s+DAY\)/gi, "NOW() + (? * INTERVAL '1 day')");
  text = text.replace(/SHA2\(UUID\(\),\s*256\)/gi, "encode(digest(gen_random_uuid()::text, 'sha256'), 'hex')");
  text = text.replace(/SUM\(([\w.]+)\s*=\s*'([^']+)'\)/gi, "SUM(CASE WHEN $1 = '$2' THEN 1 ELSE 0 END)");
  text = text.replace(/SUM\(is_active\s*=\s*1\)/gi, 'SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END)');
  if (ignoreInsert) text += ' ON CONFLICT DO NOTHING';
  let index = 0;
  text = text.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

function shouldReturnId(sql: string): boolean { return /^\s*INSERT\s+INTO\s+(app_users|shop_orders)\b/i.test(sql) && !/\bRETURNING\b/i.test(sql); }
export type DbRow = Record<string, any>;
export type DbResult = { insertId?: number; affectedRows: number; rowCount: number };

export interface DbConnection {
  execute<T = any>(sql: string, params?: unknown[]): Promise<[T, DbResult]>;
  query<T = any>(sql: string, params?: unknown[]): Promise<[T, DbResult]>;
  beginTransaction(): Promise<void>; commit(): Promise<void>; rollback(): Promise<void>; release(): void;
}

class ConnectionAdapter implements DbConnection {
  constructor(private readonly client: pg.PoolClient) {}
  async run<T = any>(sql: string, params: unknown[] = []): Promise<[T, DbResult]> {
    const translated = translateSql(sql, params);
    if (shouldReturnId(translated.text)) translated.text += ' RETURNING id';
    const result = await this.client.query(translated.text, translated.values);
    const meta: DbResult = { insertId: result.rows[0]?.id == null ? undefined : Number(result.rows[0].id), affectedRows: result.rowCount ?? 0, rowCount: result.rowCount ?? 0 };
    if (/^\s*SELECT\b/i.test(translated.text) || /\bRETURNING\b/i.test(translated.text)) return [result.rows as T, meta];
    return [meta as T, meta];
  }
  execute<T = any>(sql: string, params: unknown[] = []) { return this.run<T>(sql, params); }
  query<T = any>(sql: string, params: unknown[] = []) { return this.run<T>(sql, params); }
  beginTransaction() { return this.client.query('BEGIN').then(() => undefined); }
  commit() { return this.client.query('COMMIT').then(() => undefined); }
  rollback() { return this.client.query('ROLLBACK').then(() => undefined); }
  release() { this.client.release(); }
}

class PoolAdapter {
  constructor(private readonly pool: pg.Pool) {}
  getConnection = async (): Promise<DbConnection> => new ConnectionAdapter(await this.pool.connect());
  async run<T = any>(sql: string, params: unknown[] = []): Promise<[T, DbResult]> {
    const client = await this.pool.connect();
    try { return await new ConnectionAdapter(client).run<T>(sql, params); } finally { client.release(); }
  }
  execute<T = any>(sql: string, params: unknown[] = []) { return this.run<T>(sql, params); }
  query<T = any>(sql: string, params: unknown[] = []) { return this.run<T>(sql, params); }
  end() { return this.pool.end(); }
}

export function getPool(): PoolAdapter {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não está configurada.');
  if (!pool) {
    const connectionOptions: pg.PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_SIZE ?? 8),
      ssl: { rejectUnauthorized: false },
    };
    if (process.env.DB_PASSWORD) connectionOptions.password = process.env.DB_PASSWORD;
    pool = new Pool(connectionOptions);
  }
  return new PoolAdapter(pool);
}

export async function withConnection<T>(callback: (connection: DbConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try { return await callback(connection); } finally { connection.release(); }
}
