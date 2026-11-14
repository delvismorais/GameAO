import pg from 'pg';

const { Pool, types } = pg;

/**
 * PostgreSQL is the managed database used in production (Render Postgres).
 * The rest of the server keeps the compact `query` / `execute` call shape that
 * the original MySQL data layer exposed, so business logic stays untouched.
 */

// Return numerics and bigints as JavaScript numbers, matching the previous
// MySQL driver behaviour (`decimalNumbers: true`).
types.setTypeParser(1700, (value: string) => Number.parseFloat(value));
types.setTypeParser(20, (value: string) => Number.parseInt(value, 10));

let pool: pg.Pool | null = null;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function sslConfig(connectionString: string): false | { rejectUnauthorized: boolean } {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return { rejectUnauthorized: false };
  try {
    const parsed = new URL(connectionString);
    if (parsed.searchParams.get('sslmode') === 'require') return { rejectUnauthorized: false };
    // Render's internal hostnames have no dots; public endpoints end in .render.com.
    if (/\.render\.com$/i.test(parsed.hostname)) return { rejectUnauthorized: false };
  } catch {
    return false;
  }
  return false;
}

export function getPool(): DbPool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está configurada.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_SIZE ?? 8),
      ssl: sslConfig(process.env.DATABASE_URL),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    pool.on('error', (error) => {
      console.error('[database] erro inesperado no pool:', error instanceof Error ? error.message : error);
    });
  }
  return new DbPool(pool);
}

/**
 * Converts `?` placeholders into PostgreSQL `$1..$n` placeholders, ignoring
 * question marks inside quoted strings.
 */
export function toPgPlaceholders(sql: string): string {
  const normalized = sql.replace(/`/g, '"');
  let index = 0;
  let output = '';
  let quote: string | null = null;
  for (let position = 0; position < normalized.length; position += 1) {
    const character = normalized[position];
    if (quote) {
      output += character;
      if (character === quote) {
        if (normalized[position + 1] === quote) {
          output += normalized[position + 1];
          position += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      output += character;
      continue;
    }
    if (character === '?') {
      index += 1;
      output += `$${index}`;
      continue;
    }
    output += character;
  }
  return output;
}

export interface DbResult {
  insertId: number | null;
  affectedRows: number;
  rowCount: number;
}

export type DbRow = Record<string, unknown>;

const ROW_COMMANDS = new Set(['SELECT', 'SHOW', 'WITH', 'EXPLAIN', 'VALUES']);

function buildResponse<T>(result: pg.QueryResult): [T, unknown] {
  if (ROW_COMMANDS.has(result.command)) {
    return [result.rows as T, result.fields];
  }
  const firstRow = result.rows?.[0] as { id?: unknown } | undefined;
  const insertId = firstRow?.id === undefined || firstRow?.id === null ? null : Number(firstRow.id);
  const affected = result.rowCount ?? 0;
  return [{ insertId, affectedRows: affected, rowCount: affected } as T, result.fields];
}

class DbSession {
  constructor(protected readonly runner: pg.Pool | pg.PoolClient) {}

  async query<T = DbRow[]>(sql: string, params: unknown[] = []): Promise<[T, unknown]> {
    const result = await this.runner.query(toPgPlaceholders(sql), params);
    return buildResponse<T>(result as pg.QueryResult);
  }

  async execute<T = DbResult>(sql: string, params: unknown[] = []): Promise<[T, unknown]> {
    return this.query<T>(sql, params);
  }
}

export class DbPool extends DbSession {
  constructor(private readonly poolInstance: pg.Pool) {
    super(poolInstance);
  }

  async getConnection(): Promise<DbConnection> {
    const client = await this.poolInstance.connect();
    return new DbConnection(client);
  }

  async end(): Promise<void> {
    await this.poolInstance.end();
  }
}

export class DbConnection extends DbSession {
  constructor(private readonly client: pg.PoolClient) {
    super(client);
  }

  async beginTransaction(): Promise<void> {
    await this.client.query('BEGIN');
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.client.query('ROLLBACK');
  }

  release(): void {
    this.client.release();
  }
}

export async function withConnection<T>(callback: (connection: DbConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

export function isDuplicateObjectError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const code = (error as { code?: string }).code;
  return code === '42P07' || code === '42701' || code === '42710' || code === '42P16';
}
