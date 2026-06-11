const express = require('express')
const multer = require('multer')
const { authMiddleware } = require('../middleware/auth')
const { uploadMultiple } = require('../utils/gcs')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }
})

const router = express.Router()

router.post('/upload', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '請選擇圖片' })
    }

    const urls = await uploadMultiple(req.files)
    res.json({ images: urls })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: '圖片上傳失敗' })
  }
})

module.exports = router
