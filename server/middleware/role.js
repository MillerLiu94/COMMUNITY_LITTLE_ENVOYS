function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未認證' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足' })
    }
    next()
  }
}

module.exports = { requireRole }
