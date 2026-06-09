const express = require('express')
const caseModel = require('../models/case')
const commentModel = require('../models/comment')
const { optionalAuth, authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /cases - list cases
router.get('/cases', optionalAuth, async (req, res) => {
  try {
    const {
      _search, _status, _category,
      _sort, _order, _sortBy,
      _page, _per_page, _is_deleted
    } = req.query

    const page = Math.max(parseInt(_page, 10) || 1, 1)
    const perPage = parseInt(_per_page, 10)
    const actualPerPage = perPage > 0 ? perPage : 100000
    const isDeleted = _is_deleted === 'true' ? 'true' : 'false'

    const result = await caseModel.findAll({
      page,
      perPage: actualPerPage,
      search: _search,
      status: _status,
      category: _category,
      sort: _sort,
      order: _order,
      sortBy: _sortBy,
      isDeleted
    })

    res.json(result)
  } catch (err) {
    console.error('GET /cases error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// GET /cases/:id - single case
router.get('/cases/:id', optionalAuth, async (req, res) => {
  try {
    const caseItem = await caseModel.findById(Number(req.params.id))
    if (!caseItem) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.json(caseItem)
  } catch (err) {
    console.error('GET /cases/:id error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// POST /cases - create case
router.post('/cases', authMiddleware, async (req, res) => {
  try {
    const data = {
      ...req.body,
      author_account: req.user.account,
      createdAt: Date.now()
    }

    if (req.body.location) {
      data.latitude = req.body.location.lat
      data.longitude = req.body.location.lng
    }

    const newCase = await caseModel.create(data)
    res.status(201).json(newCase)
  } catch (err) {
    console.error('POST /cases error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// PATCH /cases/:id - update case
router.patch('/cases/:id', authMiddleware, async (req, res) => {
  try {
    const caseId = Number(req.params.id)
    const existing = await caseModel.findById(caseId)
    if (!existing) {
      return res.status(404).json({ error: 'Not found' })
    }

    const updateData = { ...req.body }

    // Handle comments addition separately
    if (req.body.comments && Array.isArray(req.body.comments)) {
      const existingComments = await commentModel.findByCaseId(caseId)
      const existingIds = new Set(existingComments.map(c => c.id))
      for (const comment of req.body.comments) {
        if (!existingIds.has(comment.id)) {
          await commentModel.create({
            case_id: caseId,
            text: comment.text,
            author_account: req.user.account
          })
        }
      }
      delete updateData.comments
    }

    // Map author fields if present
    if (req.body.rejectedBy) {
      updateData.rejected_by = req.body.rejectedBy
    }
    if (req.body.rejectReason) {
      updateData.reject_reason = req.body.rejectReason
    }

    const updated = await caseModel.update(caseId, updateData)
    res.json(updated)
  } catch (err) {
    console.error('PATCH /cases/:id error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// POST /cases/:id/comments - add comment
router.post('/cases/:id/comments', authMiddleware, async (req, res) => {
  try {
    const caseId = Number(req.params.id)
    const existing = await caseModel.findById(caseId)
    if (!existing) {
      return res.status(404).json({ error: '案件不存在' })
    }

    const { text } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ error: '留言內容不能為空' })
    }

    const comment = await commentModel.create({
      case_id: caseId,
      text: text.trim(),
      author_account: req.user.account
    })

    const updatedCase = await caseModel.findById(caseId)
    res.status(201).json(updatedCase)
  } catch (err) {
    console.error('POST /cases/:id/comments error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

// DELETE /cases/:id - hard delete
router.delete('/cases/:id', authMiddleware, async (req, res) => {
  try {
    const caseId = Number(req.params.id)
    const deleted = await caseModel.delete(caseId)
    if (!deleted) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.json(deleted)
  } catch (err) {
    console.error('DELETE /cases/:id error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

module.exports = router
