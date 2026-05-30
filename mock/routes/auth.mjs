export default function (app, db) {
  app.post('/login', (req, res) => {
    const { username, password } = req.body || {}
    const users = db.data.users || []
    const user = users.find(u => u.username === username && u.password === password)
    if (!user) {
      res.status(401).json({ error: '帳號或密碼錯誤' })
      return
    }
    if (user.isSuspended) {
      res.status(403).json({ error: '此帳號已被停權，請聯繫管理員' })
      return
    }
    res.json({ role: user.role, name: user.name, username: user.username })
  })

  app.post('/register', (req, res) => {
    const { username, password, name, role } = req.body || {}
    if (!username || !password || !name) {
      res.status(400).json({ error: '請填寫所有必填欄位' })
      return
    }
    const users = db.data.users || []
    if (users.find(u => u.username === username)) {
      res.status(409).json({ error: '帳號已存在' })
      return
    }
    users.push({ username, password, name, role: role || 'resident', isSuspended: false, suspendedAt: null })
    db.write()
    res.status(201).json({ username, name, role: role || 'resident' })
  })

  app.post('/logout', (_req, res) => {
    res.json({ success: true })
  })
}