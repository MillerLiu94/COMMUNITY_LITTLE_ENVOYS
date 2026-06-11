const pool = require('../db/connection')

const commentModel = {
  async findByCaseId(caseId) {
    const conn = await pool.getConnection()
    try {
      const rows = await conn.query(
        `SELECT cm.comments_id AS id,
                cm.text,
                cm.created_at AS createdAt,
                u.name AS author_name,
                u.role AS author_role
         FROM comments cm
         JOIN users u ON cm.author_account = u.account
         WHERE cm.case_id = ?
         ORDER BY cm.created_at ASC`,
        [caseId]
      )
      return rows.map(r => ({
        id: r.id,
        text: r.text,
        author: { name: r.author_name, role: r.author_role },
        createdAt: r.createdAt
      }))
    } finally {
      conn.release()
    }
  },

  async create({ case_id, text, author_account }) {
    const conn = await pool.getConnection()
    try {
      const now = Date.now()
      const result = await conn.query(
        'INSERT INTO comments (comments_id, case_id, text, author_account, created_at) VALUES (?, ?, ?, ?, ?)',
        [now, case_id, text, author_account, now]
      )
      const userRows = await conn.query(
        'SELECT name, role FROM users WHERE account = ?',
        [author_account]
      )
      const author = userRows[0] || { name: '', role: '' }
      return {
        id: now,
        text,
        author: { name: author.name, role: author.role },
        createdAt: now
      }
    } finally {
      conn.release()
    }
  }
}

module.exports = commentModel
