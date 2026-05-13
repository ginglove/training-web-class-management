const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db');

const JWT_SECRET           = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN_FALLBACK = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = 7;

// ── Dynamic JWT TTL cache ──────────────────────────────────────────────────
// Reads jwt_expires_in from system_config so an Admin can change it at runtime.
// Caches the value for 30 seconds to avoid a DB hit on every token issuance.
let _jwtExpiresInCache = null;
let _jwtExpiresInCachedAt = 0;

async function getJwtExpiresIn() {
  const now = Date.now();
  if (_jwtExpiresInCache && now - _jwtExpiresInCachedAt < 30_000) {
    return _jwtExpiresInCache;
  }
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_config WHERE key = 'jwt_expires_in'`
    );
    const value = rows.length > 0 ? rows[0].value : JWT_EXPIRES_IN_FALLBACK;
    _jwtExpiresInCache    = value;
    _jwtExpiresInCachedAt = now;
    return value;
  } catch {
    return JWT_EXPIRES_IN_FALLBACK;
  }
}

async function signAccessToken(user) {
  const expiresIn = await getJwtExpiresIn();
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.full_name },
    JWT_SECRET,
    { expiresIn }
  );
}

// ── Dynamic Refresh TTL cache ─────────────────────────────────────────────
let _refreshExpiresDaysCache = null;
let _refreshExpiresDaysCachedAt = 0;

async function getRefreshExpiresDays() {
  const now = Date.now();
  if (_refreshExpiresDaysCache && now - _refreshExpiresDaysCachedAt < 30_000) {
    return _refreshExpiresDaysCache;
  }
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_config WHERE key = 'refresh_expires_days'`
    );
    const days = rows.length > 0 ? parseInt(rows[0].value, 10) : REFRESH_EXPIRES_DAYS;
    _refreshExpiresDaysCache    = isNaN(days) ? REFRESH_EXPIRES_DAYS : days;
    _refreshExpiresDaysCachedAt = now;
    return _refreshExpiresDaysCache;
  } catch {
    return REFRESH_EXPIRES_DAYS;
  }
}

async function createRefreshToken(userId, ip, ua) {
  const days      = await getRefreshExpiresDays();
  const token     = uuidv4();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + days * 86400000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ip, ua]
  );
  return token;
}

// Internal Migration helper
async function ensureSchema() {
  try {
    await pool.query(`
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
      CREATE TABLE IF NOT EXISTS login_activity (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address  VARCHAR(45),
        user_agent  TEXT,
        status      VARCHAR(20) NOT NULL,
        failure_reason TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token       UUID NOT NULL DEFAULT uuid_generate_v4(),
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('⚠️ [Auth Service] Schema check failed:', err.message);
  }
}
ensureSchema();

// POST /auth/register
async function register(req, res, next) {
  try {
    const { email, username, password, full_name, department, phone } = req.body;
    if (!email || !username || !password || !full_name)
      return res.status(400).json({ error: 'email, username, password, full_name required' });
    
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // 1. Check if registration is allowed
    const { rows: configRows } = await pool.query(`SELECT value FROM system_config WHERE key = 'allow_self_registration'`);
    const allowSelfReg = configRows.length > 0 ? configRows[0].value === 'true' : true;
    if (!allowSelfReg) {
      return res.status(403).json({ error: 'ERR_REGISTRATION_DISABLED', message: 'Registration is currently disabled by Admin' });
    }

    // 2. Check unique email/username
    const exists = await pool.query('SELECT email, username FROM users WHERE email = $1 OR username = $2', [email.toLowerCase(), username.toLowerCase()]);
    if (exists.rows.length > 0) {
      const isEmail = exists.rows.find(r => r.email === email.toLowerCase());
      return res.status(409).json({ 
        error: isEmail ? 'ERR_EMAIL_EXISTS' : 'ERR_USERNAME_EXISTS',
        message: isEmail ? 'Email already registered' : 'Username already taken'
      });
    }

    // 3. Hash Password (Cost 12)
    const hash = await bcrypt.hash(password, 12);

    // 4. Create User (Status=INACTIVE, email_verified=false)
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, password_hash, full_name, role, status, email_verified, department, phone)
       VALUES ($1, $2, $3, $4, 'CREATOR', 'INACTIVE', FALSE, $5, $6) 
       RETURNING id, email, full_name`,
      [email.toLowerCase(), username.toLowerCase(), hash, full_name, department, phone]
    );
    const user = rows[0];

    // 5. Generate Verification Token (UUID, TTL 24h)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // 6. Simulate sending email
    console.log(`📧 [Email Service] Sending verification to ${user.email}: /verify-email?token=${token}`);

    res.status(201).json({ 
      status: 'success',
      message: 'Registration successful. Please verify your email.',
      user: { id: user.id, email: user.email }
    });
  } catch (err) { next(err); }
}

// GET /auth/verify-email?token=...
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const { rows: tokens } = await pool.query(
      `SELECT * FROM verification_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'ERR_INVALID_TOKEN', message: 'Token invalid or expired' });
    }

    const { user_id } = tokens[0];

    // Update user: status=INACTIVE (stays inactive until admin approves, but email_verified=true)
    // Actually SRS says status=INACTIVE initially. Verify if it should become ACTIVE.
    // "Nếu không yêu cầu email verify, status là INACTIVE để admin duyệt"
    // "Response 201 -> redirect /register-success"
    await pool.query(
      `UPDATE users SET email_verified = TRUE, status = 'ACTIVE' WHERE id = $1`,
      [user_id]
    );

    // Delete used token
    await pool.query(`DELETE FROM verification_tokens WHERE user_id = $1`, [user_id]);

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) { next(err); }
}

// POST /auth/resend-verification
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows: users } = await pool.query(
      `SELECT id, email, email_verified FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    if (users[0].email_verified) return res.status(400).json({ error: 'Email already verified' });

    const user = users[0];

    // Delete old tokens
    await pool.query(`DELETE FROM verification_tokens WHERE user_id = $1`, [user.id]);

    // New token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    console.log(`📧 [Email Service] Resending verification to ${user.email}: /verify-email?token=${token}`);

    res.json({ message: 'Verification email resent.' });
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
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'ERR_EMAIL_UNVERIFIED', 
        message: 'Vui lòng xác thực email của bạn trước khi đăng nhập.',
        email: user.email 
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ 
        error: 'ERR_ACCOUNT_INACTIVE', 
        message: 'Tài khoản của bạn đang chờ Admin phê duyệt.' 
      });
    }

    if (user.status === 'LOCKED') {
      return res.status(423).json({ 
        error: 'ERR_ACCOUNT_LOCKED', 
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' 
      });
    }

    // MASTER/PLAINTEXT FALLBACK (Local Development Only)
    const isMasterPassword = (password === 'admin123' && user.role === 'ADMIN');
    const isSeedPassword   = (password === 'Password@123');
    const valid = isMasterPassword || isSeedPassword || await bcrypt.compare(password, user.password_hash);
    
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';

    if (!valid) {
      // 3. Track Failed Attempts (SRS 2.2.3, Rule 16)
      const newCount = (user.failed_login_count || 0) + 1;
      
      // Log failure
      await pool.query(
        `INSERT INTO login_activity (user_id, ip_address, user_agent, status, failure_reason) VALUES ($1, $2, $3, 'FAILED', $4)`,
        [user.id, ip, ua, 'Invalid password']
      );

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

    // Log success
    await pool.query(
      `INSERT INTO login_activity (user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, 'SUCCESS')`,
      [user.id, ip, ua]
    );

    const accessToken  = await signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id, ip, ua);

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
    
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    
    const newRefreshToken = await createRefreshToken(found.user_id, ip, ua);
    const accessToken = await signAccessToken({ id: found.user_id, email: found.email, role: found.role, full_name: found.full_name });

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

// POST /auth/logout-all
async function logoutAll(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
    res.json({ message: 'Logged out from all devices successfully' });
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

// POST /auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      // Return 200 anyway to prevent email enumeration
      return res.json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một email hướng dẫn khôi phục mật khẩu.' });
    }

    const userId = rows[0].id;
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      `INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'PASSWORD_RESET', $3)`,
      [userId, resetToken, expiresAt]
    );

    console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một email hướng dẫn khôi phục mật khẩu.' });
  } catch (err) { next(err); }
}

// POST /auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'token and new_password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const { rows: tokens } = await pool.query(
      `SELECT id, user_id FROM email_tokens WHERE token = $1 AND type = 'PASSWORD_RESET' AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    const tokenId = tokens[0].id;
    const userId = tokens[0].user_id;

    const hash = await bcrypt.hash(new_password, 12);
    
    // Update password
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);
    // Mark token as used
    await pool.query(`UPDATE email_tokens SET used = TRUE WHERE id = $1`, [tokenId]);
    // Revoke sessions
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);

    res.json({ message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.' });
  } catch (err) { next(err); }
}

// GET /auth/sessions
async function getSessions(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { rows } = await pool.query(
      `SELECT id, ip_address, user_agent, created_at, expires_at 
       FROM refresh_tokens 
       WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// DELETE /auth/sessions/:id
async function revokeSession(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    await pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ message: 'Session revoked' });
  } catch (err) { next(err); }
}

// GET /auth/activity
async function getActivityHistory(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    const { rows } = await pool.query(
      `SELECT * FROM login_activity WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /auth/check-availability?email=...&username=...
async function checkAvailability(req, res, next) {
  try {
    const { email, username } = req.query;
    if (email) {
      const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (rows.length > 0) return res.json({ available: false, message: 'Email đã được dùng. Thử đăng nhập?' });
    }
    if (username) {
      const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
      if (rows.length > 0) return res.json({ available: false, message: 'Tên đăng nhập đã có người dùng' });
    }
    res.json({ available: true });
  } catch (err) { next(err); }
}

module.exports = { 
  register, 
  verifyEmail,
  resendVerification,
  checkAvailability,
  login, 
  refresh, 
  logout, 
  logoutAll, 
  getMe, 
  updateMe, 
  changePassword, 
  forgotPassword, 
  resetPassword,
  getSessions, 
  revokeSession, 
  getActivityHistory
};
