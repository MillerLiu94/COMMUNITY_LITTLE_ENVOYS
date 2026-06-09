const pool = require('../db/connection')

const userModel = {
  async findByAccount(account) {
    const conn = await pool.getConnection()
    try {
      const rows = await conn.query(
        'SELECT * FROM users WHERE account = ?',
        [account]
      )
      return rows[0] || null
    } finally {
      conn.release()
    }
  },

  async create({ account, password, name, role }) {
    const conn = await pool.getConnection()
    try {
      await conn.query(
        'INSERT INTO users (account, password, name, role, is_suspended, suspended_at) VALUES (?, ?, ?, ?, FALSE, NULL)',
        [account, password, name, role || 'resident']
      )
      return { account, name, role: role || 'resident' }
    } finally {
      conn.release()
    }
  },

  async findAll({ page = 1, perPage = 20, search, role, suspended } = {}) {
    const conn = await pool.getConnection()
    try {
      let where = []
      let params = []

      if (search) {
        where.push('(u.name LIKE ? OR u.account LIKE ?)')
        params.push(`%${search}%`, `%${search}%`)
      }
      if (role) {
        where.push('u.role = ?')
        params.push(role)
      }
      if (suspended === 'true') {
        where.push('u.is_suspended = TRUE')
      } else if (suspended === 'false') {
        where.push('u.is_suspended = FALSE')
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

      const countResult = await conn.query(
        `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
        params
      )
      const total = countResult[0].total

      const offset = (page - 1) * perPage
      const rows = await conn.query(
        `SELECT u.account AS username, u.name, u.role, u.is_suspended AS isSuspended, u.suspended_at AS suspendedAt
         FROM users u ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
      )

      return { users: rows, total, page, perPage }
    } finally {
      conn.release()
    }
  },

  async updateByAccount(account, data) {
    const conn = await pool.getConnection()
    try {
      const fields = []
      const params = []
      for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = ?`)
        params.push(value)
      }
      if (fields.length === 0) return null

      params.push(account)
      await conn.query(
        `UPDATE users SET ${fields.join(', ')} WHERE account = ?`,
        params
      )

      const rows = await conn.query(
        'SELECT account AS username, name, role, is_suspended AS isSuspended, suspended_at AS suspendedAt FROM users WHERE account = ?',
        [account]
      )
      return rows[0] || null
    } finally {
      conn.release()
    }
  },

  async count({ search, role, suspended } = {}) {
    const conn = await pool.getConnection()
    try {
      let where = []
      let params = []
      if (search) {
        where.push('(name LIKE ? OR account LIKE ?)')
        params.push(`%${search}%`, `%${search}%`)
      }
      if (role) {
        where.push('role = ?')
        params.push(role)
      }
      if (suspended === 'true') {
        where.push('is_suspended = TRUE')
      } else if (suspended === 'false') {
        where.push('is_suspended = FALSE')
      }
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
      const result = await conn.query(
        `SELECT COUNT(*) AS total FROM users ${whereClause}`,
        params
      )
      return result[0].total
    } finally {
      conn.release()
    }
  }
}

module.exports = userModel
