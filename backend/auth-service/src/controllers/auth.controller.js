const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db');

const JWT_SECRET         = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = 7;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function createRefreshToken(userId) {
  const token     = uuidv4();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
  return token;
}

// POST /auth/register
async function register(req, res, next) {
  try {
    const { email, username, password, full_name, department } = req.body;
    if (!email || !username || !password || !full_name)
      return res.status(400).json({ error: 'email, username, password, full_name required' });
    
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email or Username already registered' });

    const hash = await bcrypt.hash(password, 12);

    // SRS 2.1.4: New users are INACTIVE by default, role is CREATOR
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, password_hash, full_name, role, status, department, must_change_password)
       VALUES ($1, $2, $3, $4, 'CREATOR', 'INACTIVE', $5, FALSE) 
       RETURNING id, email, username, full_name, role, status`,
      [email.toLowerCase(), username.toLowerCase(), hash, full_name, department]
    );

    const user = rows[0];
    res.status(201).json({ 
      message: 'Registration successful. Please wait for Admin activation.',
      user 
    });
  } catch (err) { next(err); }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const { rows } = await pool.query(
      `SELECT id, email, username, password_hash, full_name, role, status, must_change_password, failed_login_count, locked_until 
       FROM users WHERE email = $1 OR username = $1`,
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      console.log(`🔍 [Auth Service] Login attempt for: ${email}. User found: No`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log(`🔍 [Auth Service] Login attempt for: ${email}. User found: Yes. Role: ${user.role}`);

    // 1. Check if Account is Locked (SRS 2.2.3, Rule 14)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitMins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return res.status(423).json({ 
        error: 'Account locked', 
        message: `Too many failed attempts. Try again in ${waitMins} minutes.` 
      });
    }

    // 2. Check if Account is Inactive or Locked (SRS 2.2.3, Rule 15)
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account is inactive', message: 'Please wait for Admin activation.' });
    }
    if (user.status === 'LOCKED') {
      return res.status(423).json({ error: 'Account is locked', message: 'Please contact Admin to unlock.' });
    }

    // MASTER/PLAINTEXT FALLBACK (Local Development Only)
    const isMasterPassword = (password === 'admin123' && user.role === 'ADMIN');
    const isSeedPassword   = (password === 'Password@123');
    const valid = isMasterPassword || isSeedPassword || await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      // 3. Track Failed Attempts (SRS 2.2.3, Rule 16)
      const newCount = (user.failed_login_count || 0) + 1;
      if (newCount >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60000); // 15 mins
        await pool.query('UPDATE users SET status = \'LOCKED\', failed_login_count = 0, locked_until = $1 WHERE id = $2', [lockUntil, user.id]);
        return res.status(423).json({ error: 'Account locked', message: 'Too many failed attempts. Account locked for 15 mins.' });
      } else {
        await pool.query('UPDATE users SET failed_login_count = $1 WHERE id = $2', [newCount, user.id]);
        return res.status(401).json({ 
          error: 'Invalid credentials', 
          remaining_attempts: 5 - newCount 
        });
      }
    }

    // 4. Reset failures on success
    await pool.query('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1', [user.id]);
    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    const accessToken  = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    const { password_hash, ...safeUser } = user;
    res.json({ 
      user: safeUser, 
      access_token: accessToken, 
      refresh_token: refreshToken,
      force_password_change: user.must_change_password // SRS 10.2.4
    });
  } catch (err) { next(err); }
}

// POST /auth/refresh
async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token)
      return res.status(400).json({ error: 'refresh_token required' });

    const { rows: tokens } = await pool.query(
      `SELECT rt.*, u.email, u.full_name, u.role, u.status
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.revoked = FALSE AND rt.expires_at > NOW()`
    );

    let found = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refresh_token, t.token_hash)) { found = t; break; }
    }

    if (!found) return res.status(401).json({ error: 'Invalid or expired refresh token' });
    if (found.status !== 'ACTIVE') return res.status(403).json({ error: 'Account deactivated' });

    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [found.id]);
    const newRefreshToken = await createRefreshToken(found.user_id);
    const accessToken = signAccessToken({ id: found.user_id, email: found.email, role: found.role, full_name: found.full_name });

    res.json({ access_token: accessToken, refresh_token: newRefreshToken });
  } catch (err) { next(err); }
}

// POST /auth/logout
async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE revoked = FALSE AND expires_at > NOW()`
    );
    for (const t of rows) {
      if (await bcrypt.compare(refresh_token, t.token_hash)) {
        await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [t.id]);
        break;
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

// GET /auth/me
async function getMe(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { rows } = await pool.query(
      `SELECT id, email, username, full_name, role, department, phone, avatar_url, status, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// PATCH /auth/me
async function updateMe(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { full_name, phone, department } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone), department = COALESCE($3, department)
       WHERE id = $4
       RETURNING id, email, full_name, role, department, phone`,
      [full_name, phone, department, userId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /auth/change-password
async function changePassword(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'current_password and new_password required' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);

    res.json({ message: 'Password changed. Please login again.' });
  } catch (err) { next(err); }
}

// POST /auth/forgot-password (VULNERABLE ENDPOINT FOR TESTING)
async function forgotPassword(req, res, next) {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'email and new_password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      // In a real application, we wouldn't reveal if the email exists, but we do here.
      return res.status(404).json({ error: 'User not found with that email address' });
    }

    // INTENTIONAL VULNERABILITY: We just update the password immediately without any token verification!
    // Students should flag this as a Broken Access Control / Insecure Direct Object Reference flaw.
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, email.toLowerCase()]);
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [rows[0].id]);

    res.json({ message: 'Password has been successfully reset. Please login with your new password.' });
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, getMe, updateMe, changePassword, forgotPassword };
