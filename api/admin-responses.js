import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const COOKIE_NAME = 'huss_admin_session'
const SESSION_MS = 60 * 60 * 1000
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const failedLogins = new Map()

function json(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.status(status).json(payload)
}

function readConfig() {
  const pin = process.env.ADMIN_PIN
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!/^\d{4}$/.test(pin || '') || !rawServiceAccount) return null
  try {
    const serviceAccount = JSON.parse(rawServiceAccount)
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) return null
    return { pin, serviceAccount }
  } catch {
    return null
  }
}

function getAdminDb(serviceAccount) {
  const app = getApps().find(item => item.name === 'huss-admin')
    || initializeApp({ credential: cert(serviceAccount) }, 'huss-admin')
  return getFirestore(app)
}

function sameSecret(input, expected) {
  const a = Buffer.from(String(input ?? ''), 'utf8')
  const b = Buffer.from(String(expected ?? ''), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
  return createHash('sha256').update(forwarded.split(',')[0].trim()).digest('hex')
}

function isRateLimited(key, now = Date.now()) {
  const attempts = failedLogins.get(key)
  if (!attempts) return false
  if (now - attempts.startedAt >= WINDOW_MS) {
    failedLogins.delete(key)
    return false
  }
  return attempts.count >= MAX_ATTEMPTS
}

function recordFailure(key, now = Date.now()) {
  const current = failedLogins.get(key)
  if (!current || now - current.startedAt >= WINDOW_MS) failedLogins.set(key, { startedAt: now, count: 1 })
  else failedLogins.set(key, { ...current, count: current.count + 1 })
  if (failedLogins.size > 2000) {
    for (const [entryKey, entry] of failedLogins) if (now - entry.startedAt >= WINDOW_MS) failedLogins.delete(entryKey)
  }
}

function sessionSignature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function setSessionCookie(res, token, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin-responses; Max-Age=${maxAge}`)
}

function clearSessionCookie(res) {
  setSessionCookie(res, '', 0)
}

function hasValidSession(req, secret) {
  const cookieHeader = String(req.headers.cookie || '')
  const value = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1)
  if (!value) return false
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return false
  const expected = sessionSignature(payload, secret)
  if (!sameSecret(signature, expected)) return false
  try {
    const expiresAt = Number(Buffer.from(payload, 'base64url').toString('utf8'))
    return Number.isFinite(expiresAt) && expiresAt > Date.now()
  } catch {
    return false
  }
}

function assertSameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  try {
    const originHost = new URL(origin).host
    const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()
    return originHost === forwardedHost
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (!assertSameOrigin(req)) return json(res, 403, { code: 'ORIGIN_DENIED', error: '허용되지 않은 요청입니다.' })
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return json(res, 405, { code: 'METHOD_NOT_ALLOWED', error: '지원하지 않는 요청입니다.' })
  }

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body) } catch { return {} } })() : (req.body || {})
  if (req.method === 'POST' && body.action === 'logout') {
    clearSessionCookie(res)
    return json(res, 200, { ok: true })
  }

  const config = readConfig()
  if (!config) return json(res, 503, { code: 'ADMIN_CONFIG_MISSING', error: '관리자 서버 설정이 완료되지 않았습니다. Vercel 환경변수를 확인해 주세요.' })

  try {
    const db = getAdminDb(config.serviceAccount)
    if (req.method === 'POST') {
      if (body.action !== 'login') return json(res, 400, { code: 'BAD_ACTION', error: '요청을 확인해 주세요.' })
      const key = clientKey(req)
      if (isRateLimited(key)) return json(res, 429, { code: 'PIN_RATE_LIMITED', error: 'PIN 입력 횟수가 초과되었습니다. 15분 후 다시 시도해 주세요.' })
      if (!sameSecret(body.pin, config.pin)) {
        recordFailure(key)
        return json(res, 401, { code: 'PIN_INVALID', error: 'PIN이 올바르지 않습니다.' })
      }
      failedLogins.delete(key)
      const payload = Buffer.from(String(Date.now() + SESSION_MS), 'utf8').toString('base64url')
      const token = `${payload}.${sessionSignature(payload, config.serviceAccount.private_key)}`
      setSessionCookie(res, token, Math.floor(SESSION_MS / 1000))
      return json(res, 200, { ok: true })
    }

    if (!hasValidSession(req, config.serviceAccount.private_key)) {
      return json(res, 401, { code: 'SESSION_REQUIRED', error: '관리자 PIN 인증이 필요합니다.' })
    }

    const department = String(req.query?.department || '').trim()
    if (!department) return json(res, 200, { authenticated: true })
    if (department.length > 100) return json(res, 400, { code: 'INVALID_DEPARTMENT', error: '학과명은 100자 이내로 입력해 주세요.' })
    const departmentKey = department.replaceAll('/', '_')
    const snapshot = await db.collection('departments').doc(departmentKey).collection('responses').orderBy('submittedAt', 'desc').get()
    const responses = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        gender: data.gender,
        name: data.name,
        department: data.department,
        answers: data.answers,
        submittedAt: data.submittedAt?.toDate?.().toISOString() ?? null,
      }
    })
    return json(res, 200, { authenticated: true, department, responses })
  } catch (error) {
    console.error('HUSS admin API error:', error)
    return json(res, 500, { code: 'ADMIN_QUERY_FAILED', error: '서버가 Firestore 응답을 읽지 못했습니다. Vercel 배포 로그와 서비스 계정 권한을 확인해 주세요.' })
  }
}
