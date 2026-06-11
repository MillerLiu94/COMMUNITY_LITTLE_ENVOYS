const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'community-vanguard-secret-key-2026'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供認證令牌' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = {
      account: decoded.account,
      name: decoded.name,
      role: decoded.role
    }
    next()
  } catch (err) {
    return res.status(401).json({ error: '認證令牌無效或已過期' })
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = {
        account: decoded.account,
        name: decoded.name,
        role: decoded.role
      }
    } catch (err) {
      // ignore invalid token
    }
  }
  next()
}

module.exports = { authMiddleware, optionalAuth, JWT_SECRET }
