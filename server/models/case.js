const pool = require('../db/connection')

function parseRow(row) {
  if (!row) return null
  const result = { ...row }
  if (typeof result.images === 'string') {
    try { result.images = JSON.parse(result.images) } catch (e) { result.images = [] }
  }
  if (typeof result.comments === 'string') {
    try { result.comments = JSON.parse(result.comments) } catch (e) { result.comments = [] }
  }
  if (result.author_name) {
    result.author = { name: result.author_name, role: result.author_role }
    delete result.author_name
    delete result.author_role
  }
  if (result.latitude != null && result.longitude != null) {
    result.location = { lat: result.latitude, lng: result.longitude }
  } else {
    result.location = null
  }
  delete result.latitude
  delete result.longitude
  return result
}

const caseModel = {
  async findAll({ page = 1, perPage = 20, search, status: statusFilter, category, sort, order, sortBy, isDeleted } = {}) {
    const conn = await pool.getConnection()
    try {
      let where = []
      let params = []

      where.push('c.is_deleted = ?')
      params.push(isDeleted === 'true' ? 1 : 0)

      if (search) {
        where.push('(c.cases_id LIKE ? OR c.category LIKE ? OR c.description LIKE ? OR u.name LIKE ?)')
        const kw = `%${search}%`
        params.push(kw, kw, kw, kw)
      }
      if (statusFilter) {
        where.push('c.status = ?')
        params.push(statusFilter)
      }
      if (category) {
        where.push('c.category = ?')
        params.push(category)
      }

      const whereClause = 'WHERE ' + where.join(' AND ')

      const countResult = await conn.query(
        `SELECT COUNT(*) AS total FROM cases c JOIN users u ON c.author_account = u.account ${whereClause}`,
        params
      )
      const total = countResult[0].total

      let orderClause
      if (sortBy === 'hot') {
        orderClause = 'ORDER BY (SELECT COUNT(*) FROM comments WHERE case_id = c.cases_id) ASC'
      } else {
        const sortField = sort === 'status' ? 'c.status' : sort === 'category' ? 'c.category' : 'c.created_at'
        const dir = order === 'asc' ? 'ASC' : 'DESC'
        orderClause = `ORDER BY ${sortField} ${dir}`
      }

      const offset = (page - 1) * perPage

      const rows = await conn.query(
        `SELECT c.cases_id AS id,
                c.category,
                c.description,
                c.images,
                c.status,
                c.created_at AS createdAt,
                c.address AS addressText,
                c.reject_reason AS rejectReason,
                c.rejected_by AS rejectedBy,
                c.is_deleted AS isDeleted,
                c.deleted_at AS deletedAt,
                c.deleted_by AS deletedBy,
                c.latitude,
                c.longitude,
                u.name AS author_name,
                u.role AS author_role,
                COALESCE(
                  (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', cm.comments_id,
                      'text', cm.text,
                      'author', JSON_OBJECT('name', cu.name, 'role', cu.role),
                      'createdAt', cm.created_at
                    )
                  ) FROM comments cm
                   JOIN users cu ON cm.author_account = cu.account
                   WHERE cm.case_id = c.cases_id),
                  JSON_ARRAY()
                ) AS comments
         FROM cases c
         JOIN users u ON c.author_account = u.account
         ${whereClause}
         ${orderClause}
         LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
      )

      return {
        cases: rows.map(parseRow),
        total,
        page,
        perPage
      }
    } finally {
      conn.release()
    }
  },

  async findById(id) {
    const conn = await pool.getConnection()
    try {
      const rows = await conn.query(
        `SELECT c.cases_id AS id,
                c.category,
                c.description,
                c.images,
                c.status,
                c.created_at AS createdAt,
                c.address AS addressText,
                c.reject_reason AS rejectReason,
                c.rejected_by AS rejectedBy,
                c.is_deleted AS isDeleted,
                c.deleted_at AS deletedAt,
                c.deleted_by AS deletedBy,
                c.latitude,
                c.longitude,
                u.name AS author_name,
                u.role AS author_role,
                COALESCE(
                  (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', cm.comments_id,
                      'text', cm.text,
                      'author', JSON_OBJECT('name', cu.name, 'role', cu.role),
                      'createdAt', cm.created_at
                    )
                  ) FROM comments cm
                   JOIN users cu ON cm.author_account = cu.account
                   WHERE cm.case_id = c.cases_id),
                  JSON_ARRAY()
                ) AS comments
         FROM cases c
         JOIN users u ON c.author_account = u.account
         WHERE c.cases_id = ?`,
        [id]
      )
      return parseRow(rows[0] || null)
    } finally {
      conn.release()
    }
  },

  async create(data) {
    const conn = await pool.getConnection()
    try {
      const now = Date.now()
      const result = await conn.query(
        `INSERT INTO cases (cases_id, category, description, images, status, created_at, author_account, address, reject_reason, latitude, longitude, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id || now,
          data.category,
          data.description,
          data.images ? JSON.stringify(data.images) : '[]',
          data.status || 'pending',
          data.createdAt || now,
          data.author_account,
          data.address || data.addressText || null,
          data.reject_reason || null,
          data.latitude || null,
          data.longitude || null,
          data.is_deleted ? 1 : 0
        ]
      )

      const newId = data.id || now
      const rows = await conn.query(
        'SELECT account AS username, name, role FROM users WHERE account = ?',
        [data.author_account]
      )
      const author = rows[0] || { name: '', role: '' }

      return {
        id: newId,
        category: data.category,
        description: data.description,
        images: data.images || [],
        status: 'pending',
        createdAt: now,
        addressText: data.address || data.addressText || null,
        location: data.latitude != null ? { lat: data.latitude, lng: data.longitude } : null,
        author: { name: author.name, role: author.role },
        comments: [],
        is_deleted: false,
        rejectReason: null
      }
    } finally {
      conn.release()
    }
  },

  async update(id, data) {
    const conn = await pool.getConnection()
    try {
      const fieldMap = {
        category: 'category',
        description: 'description',
        status: 'status',
        reject_reason: 'reject_reason',
        rejected_by: 'rejected_by',
        is_deleted: 'is_deleted',
        deleted_at: 'deleted_at',
        deleted_by: 'deleted_by',
        address: 'address'
      }

      const fields = []
      const params = []

      for (const [key, col] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
          fields.push(`${col} = ?`)
          params.push(data[key])
        }
      }

      if (data.images !== undefined) {
        fields.push('images = ?')
        params.push(JSON.stringify(data.images))
      }

      if (data.addressText !== undefined) {
        fields.push('address = ?')
        params.push(data.addressText)
      }

      if (data.location) {
        fields.push('latitude = ?')
        params.push(data.location.lat)
        fields.push('longitude = ?')
        params.push(data.location.lng)
      }

      if (data.rejectReason !== undefined) {
        fields.push('reject_reason = ?')
        params.push(data.rejectReason)
      }

      if (data.rejectedBy !== undefined) {
        fields.push('rejected_by = ?')
        params.push(data.rejectedBy)
      }

      if (fields.length > 0) {
        params.push(id)
        await conn.query(
          `UPDATE cases SET ${fields.join(', ')} WHERE cases_id = ?`,
          params
        )
      }

      return await this.findById(id)
    } finally {
      conn.release()
    }
  },

  async delete(id) {
    const conn = await pool.getConnection()
    try {
      const rows = await conn.query(
        'SELECT cases_id AS id FROM cases WHERE cases_id = ?',
        [id]
      )
      if (rows.length === 0) return null
      await conn.query('DELETE FROM cases WHERE cases_id = ?', [id])
      return { id: rows[0].id }
    } finally {
      conn.release()
    }
  },

  async getStats() {
    const conn = await pool.getConnection()
    try {
      const rows = await conn.query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'pending' AND is_deleted = FALSE THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status = 'processing' AND is_deleted = FALSE THEN 1 ELSE 0 END) AS processing,
           SUM(CASE WHEN status = 'resolved' AND is_deleted = FALSE THEN 1 ELSE 0 END) AS resolved
         FROM cases`
      )
      const r = rows[0]
      return {
        total: Number(r.total) || 0,
        pending: Number(r.pending) || 0,
        processing: Number(r.processing) || 0,
        resolved: Number(r.resolved) || 0
      }
    } finally {
      conn.release()
    }
  }
}

module.exports = caseModel
