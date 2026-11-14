import bcrypt from 'bcryptjs';
import { getPool, type DbRow } from './db';

const email = process.env.GAMEAO_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.GAMEAO_ADMIN_PASSWORD;
const name = process.env.GAMEAO_ADMIN_NAME?.trim() || 'Administrador GameAO';

if (!email || !password) {
  console.error('Defina GAMEAO_ADMIN_EMAIL e GAMEAO_ADMIN_PASSWORD apenas no ambiente seguro para criar o primeiro administrador.');
  process.exitCode = 1;
} else if (password.length < 12) {
  console.error('A palavra-passe do administrador deve ter pelo menos 12 caracteres.');
  process.exitCode = 1;
} else {
  const pool = getPool();
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await pool.execute<DbRow[]>(
    `SELECT id FROM app_users WHERE email = ? LIMIT 1`,
    [email],
  );
  if (existing.length > 0) {
    console.error('Já existe uma conta com esse email. Nenhuma conta foi alterada.');
    process.exitCode = 1;
  } else {
    await pool.execute(
      `INSERT INTO app_users (email, password_hash, name, role) VALUES (?, ?, ?, 'super_admin')`,
      [email, passwordHash, name],
    );
    console.log(`Super Administrador criado para ${email}.`);
  }
  await pool.end();
}
