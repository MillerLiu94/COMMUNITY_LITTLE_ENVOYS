function parseQueryParams(query) {
  const { _sort, _page, _per_page, _order } = query || {}
  return {
    sort: _sort,
    page: _page !== undefined ? Number(_page) : undefined,
    perPage: _per_page !== undefined ? Number(_per_page) : undefined,
    order: _order,
    where: {},
  }
}

export default function (app, db, service) {
  app.get('/cases', (req, res) => {
    let cases = db.data.cases || []

    const { _search, _status, _category, _sort, _order, _sortBy, _page, _per_page, _is_deleted } = req.query

    if (_is_deleted === 'false') {
      cases = cases.filter(c => !c.is_deleted)
    }

    if (_search) {
      const kw = _search.toLowerCase()
      cases = cases.filter(c =>
        String(c.id).includes(kw) ||
        c.category.toLowerCase().includes(kw) ||
        (c.description && c.description.toLowerCase().includes(kw)) ||
        (c.author && c.author.name && c.author.name.toLowerCase().includes(kw))
      )
    }

    if (_status) {
      cases = cases.filter(c => c.status === _status)
    }

    if (_category) {
      cases = cases.filter(c => c.category === _category)
    }

    if (_sortBy === 'hot') {
      const COMMENT_WEIGHT = 3600000
      cases.sort((a, b) => {
        const wa = a.createdAt + (a.comments?.length || 0) * COMMENT_WEIGHT
        const wb = b.createdAt + (b.comments?.length || 0) * COMMENT_WEIGHT
        return wb - wa
      })
    } else {
      const sortField = _sort || 'createdAt'
      const sortOrder = _order === 'asc' ? 1 : -1
      cases.sort((a, b) => {
        const va = a[sortField] ?? ''
        const vb = b[sortField] ?? ''
        if (typeof va === 'string') {
          return va.localeCompare(vb) * sortOrder
        }
        return (va - vb) * sortOrder
      })
    }

    const total = cases.length
    const page = _page ? Math.max(1, Number(_page)) : 1
    const perPage = _per_page ? Math.max(1, Number(_per_page)) : total || 20
    const start = (page - 1) * perPage
    const paged = cases.slice(start, start + perPage)

    res.json({ cases: paged, total, page, perPage })
  })

  app.get('/cases/:id', (req, res) => {
    const item = service.findById('cases', Number(req.params.id), req.query)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  })

  app.post('/cases', async (req, res) => {
    const item = await service.create('cases', req.body)
    res.status(201).json(item)
  })

  app.patch('/cases/:id', async (req, res) => {
    const item = await service.patchById('cases', Number(req.params.id), req.body)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  })

  app.delete('/cases/:id', async (req, res) => {
    const item = await service.destroyById('cases', Number(req.params.id), req.query._dependent)
    if (!item) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(item)
  })
}