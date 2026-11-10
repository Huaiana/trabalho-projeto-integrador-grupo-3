// ============================================================
// TechOcean — Autenticação (JWT + BCrypt + Sessões)
// ============================================================
import bcrypt from 'bcryptjs';

// ---------- Base64URL ----------
function b64urlEncode(input) {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------- JWT HS256 ----------
export async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64urlEncode(JSON.stringify(header));
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncode(sig)}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify('HMAC', key, b64urlDecode(sigB64), new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Password hashing (BCrypt) ----------
export async function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

// ---------- SHA-256 (para tokenHash) ----------
export async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Token generation ----------
export function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateUUID() {
  return crypto.randomUUID();
}

// ---------- Session helpers (auth_session com id UUID) ----------
export async function createSession(db, actorId, actorName, role) {
  const sessionId = generateUUID();
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO auth_session (id, actor_id, actor_name, role, started_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(sessionId, actorId, actorName, role, now, now).run();
  return { id: sessionId, actor_id: actorId, actor_name: actorName, role };
}

export async function touchSession(db, sessionId) {
  await db.prepare("UPDATE auth_session SET last_activity_at = datetime('now') WHERE id = ? AND logged_out_at IS NULL")
    .bind(sessionId).run();
}

export async function endSession(db, sessionId) {
  await db.prepare("UPDATE auth_session SET logged_out_at = datetime('now') WHERE id = ?")
    .bind(sessionId).run();
}

export async function endAllUserSessions(db, actorId) {
  await db.prepare("UPDATE auth_session SET logged_out_at = datetime('now') WHERE actor_id = ? AND logged_out_at IS NULL")
    .bind(actorId).run();
}

export async function getActiveSession(db, sessionId) {
  return db.prepare('SELECT * FROM auth_session WHERE id = ? AND logged_out_at IS NULL').bind(sessionId).first();
}

// ---------- Audit logging ----------
export async function logAudit(db, { actorId, sessionId, actorName, actorRole, eventCode, actionCode, actionDescription, action, method, resource, resourceId, responseStatus, ipAddress }) {
  await db.prepare(
    `INSERT INTO audit_event (actor_id, session_id, actor_name, actor_role, event_code, action_code, action_description, action, method, resource, resource_id, occurred_at, response_status, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
  ).bind(
    actorId || null, sessionId || null, actorName || null, actorRole || null,
    eventCode || null, actionCode || null, actionDescription || null,
    action || '', method || '', resource || '', resourceId || null,
    responseStatus || null, ipAddress || null
  ).run();
}

// ---------- Login profissional (usuario_admin + usuario) ----------
// Retorna { id, nome, email, role } ou null
export async function findProfessionalByEmail(db, email) {
  // 1. Tenta usuario_admin (ADMIN / SUPERVISOR)
  const admin = await db.prepare('SELECT * FROM usuario_admin WHERE email = ?').bind(email).first();
  if (admin) {
    return { id: admin.id, nome: admin.nome, email: admin.email, senha: admin.senha, role: admin.cargo };
  }
  // 2. Tenta usuario (FUNCIONARIO)
  const user = await db.prepare('SELECT * FROM usuario WHERE email = ?').bind(email).first();
  if (user) {
    return { id: user.id, nome: user.nome, email: user.email, senha: user.senha, role: 'FUNCIONARIO' };
  }
  return null;
}

// ---------- Auth response builder ----------
export async function createAuthResponse(db, user, userType, secret) {
  const session = await createSession(db, user.id, user.nome, user.role);
  const jwtPayload = {
    sub: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    type: userType,
    sid: session.id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 43200, // 12h
  };
  const jwt = await signJWT(jwtPayload, secret);
  return {
    token: jwt,
    session,
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
  };
}
