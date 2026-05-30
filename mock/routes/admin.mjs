function stripPassword(user) {
  const { password, ...rest } = user
  return rest
}

export default function (app, db) {
  app.get('/admin/stats', (_req, res) => {
    const cases = db.data.cases || []
    const active = cases.filter(c => !c.is_deleted)
    res.json({
      total: active.length,
      pending: active.filter(c => c.status === 'pending').length,
      processing: active.filter(c => c.status === 'processing').length,
      resolved: active.filter(c => c.status === 'resolved').length
    })
  })

  app.get('/users', (req, res) => {
    let users = (db.data.users || []).map(stripPassword)
    const { _page, _per_page, _search, _role, _suspended } = req.query

    if (_search) {
      const kw = _search.toLowerCase()
      users = users.filter(u =>
        u.name.toLowerCase().includes(kw) ||
        u.username.toLowerCase().includes(kw)
      )
    }

    if (_role) {
      users = users.filter(u => u.role === _role)
    }

    if (_suspended === 'true') {
      users = users.filter(u => u.isSuspended)
    } else if (_suspended === 'false') {
      users = users.filter(u => !u.isSuspended)
    }

    const total = users.length
    const page = _page ? Math.max(1, Number(_page)) : 1
    const perPage = _per_page ? Math.max(1, Number(_per_page)) : total || 20
    const start = (page - 1) * perPage
    const paged = users.slice(start, start + perPage)

    res.json({ users: paged, total, page, perPage })
  })

  app.get('/users/:username', (req, res) => {
    const user = (db.data.users || []).find(u => u.username === req.params.username)
    if (!user) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(stripPassword(user))
  })

  app.patch('/users/:username', async (req, res) => {
    const users = db.data.users || []
    const idx = users.findIndex(u => u.username === req.params.username)
    if (idx === -1) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    users[idx] = { ...users[idx], ...req.body, username: req.params.username }
    await db.write()
    res.json(stripPassword(users[idx]))
  })
}