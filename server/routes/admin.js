const express = require('express')
const caseModel = require('../models/case')
const userModel = require('../models/user')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/role')

const router = express.Router()

// GET /admin/stats - dashboard statistics
router.get('/admin/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const stats = await caseModel.getStats()
    res.json(stats)
  } catch (err) {
    console.error('GET /admin/stats error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// GET /users - list users (admin only)
router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const {
      _page, _per_page, _search, _role, _suspended
    } = req.query

    const page = Math.max(parseInt(_page, 10) || 1, 1)
    const perPage = parseInt(_per_page, 10) || 20

    const result = await userModel.findAll({
      page,
      perPage,
      search: _search,
      role: _role,
      suspended: _suspended
    })

    res.json(result)
  } catch (err) {
    console.error('GET /users error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// GET /users/:username - single user (admin only)
router.get('/users/:username', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await userModel.findByAccount(req.params.username)
    if (!user) {
      return res.status(404).json({ error: 'Not found' })
    }
    const { password, ...safeUser } = user
    res.json({
      username: safeUser.account,
      name: safeUser.name,
      role: safeUser.role,
      isSuspended: !!safeUser.is_suspended,
      suspendedAt: safeUser.suspended_at
    })
  } catch (err) {
    console.error('GET /users/:username error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// PATCH /users/:username - update user (admin only)
router.patch('/users/:username', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { username } = req.params
    const existing = await userModel.findByAccount(username)
    if (!existing) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = {}
    if (req.body.role !== undefined) {
      updateData.role = req.body.role
    }
    if (req.body.isSuspended !== undefined) {
      updateData.is_suspended = req.body.isSuspended ? 1 : 0
    }
    if (req.body.suspendedAt !== undefined) {
      updateData.suspended_at = req.body.suspendedAt
    }

    const updated = await userModel.updateByAccount(username, updateData)
    if (!updated) {
      return res.status(404).json({ error: 'Not found' })
    }

    res.json(updated)
  } catch (err) {
    console.error('PATCH /users/:username error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

module.exports = router
