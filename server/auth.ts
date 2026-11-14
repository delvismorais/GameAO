import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, type DbRow } from './db';

const SESSION_COOKIE = 'gameao_session';
const SESSION_DAYS = 30;

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(header = ''): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map((part) => part.trim().split('=' as const, 2)).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]),
  );
}

function publicHttps(request: Request): boolean {
  const forwardedProto = request.headers['x-forwarded-proto'];
  return forwardedProto === 'https' || request.headers.origin?.startsWith('https://') === true;
}

function setSessionCookie(response: Response, token: string, request: Request): void {
  const secure = publicHttps(request);
  const attributes = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, 'Path=/', `Max-Age=${SESSION_DAYS * 86400}`, 'HttpOnly', secure ? 'SameSite=None' : 'SameSite=Lax'];
  if (secure) attributes.push('Secure');
  response.setHeader('Set-Cookie', attributes.join('; '));
}

export function clearSessionCookie(response: Response, request: Request): void {
  const secure = publicHttps(request);
  const attributes = [`${SESSION_COOKIE}=`, 'Path=/', 'Max-Age=0', 'HttpOnly', secure ? 'SameSite=None' : 'SameSite=Lax'];
  if (secure) attributes.push('Secure');
  response.setHeader('Set-Cookie', attributes.join('; '));
}

function rowToUser(row: DbRow): AuthUser {
  return {
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    phone: row.phone ? String(row.phone) : null,
    role: String(row.role),
    isActive: Boolean(row.is_active),
  };
}

export async function getAuthenticatedUser(request: Request): Promise<AuthUser | null> {
  const token = parseCookies(request.headers.cookie).gameao_session;
  if (!token) return null;
  const [rows] = await getPool().execute<DbRow[]>(
    `SELECT u.id, u.email, u.name, u.phone, u.role, u.is_active
       FROM app_sessions s JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.is_active = 1 LIMIT 1`,
    [hashToken(token)],
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function createSession(userId: number, request: Request, response: Response): Promise<void> {
  const token = randomBytes(32).toString('hex');
  await getPool().execute(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [hashToken(token), userId, SESSION_DAYS],
  );
  setSessionCookie(response, token, request);
}

export async function registerUser(input: { email: string; password: string; name: string; phone?: string }): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const [result] = await getPool().execute<any>(
    `INSERT INTO app_users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)`,
    [email, passwordHash, input.name.trim(), input.phone?.trim() || null],
  );
  const id = Number(Array.isArray(result) ? result[0]?.id : result?.insertId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('A base de dados não devolveu o identificador da conta.');
  return { id, email, name: input.name.trim(), phone: input.phone?.trim() || null, role: 'customer', isActive: true };
}

export async function authenticateUser(emailInput: string, password: string): Promise<AuthUser | null> {
  const [rows] = await getPool().execute<DbRow[]>(`SELECT * FROM app_users WHERE email = ? AND is_active = 1 LIMIT 1`, [emailInput.trim().toLowerCase()]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, String(row.password_hash)))) return null;
  return rowToUser(row);
}

export async function destroySession(request: Request): Promise<void> {
  const token = parseCookies(request.headers.cookie).gameao_session;
  if (token) await getPool().execute(`DELETE FROM app_sessions WHERE token_hash = ?`, [hashToken(token)]);
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'admin';
}
