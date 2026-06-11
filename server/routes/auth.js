const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '請填寫帳號與密碼' })
    }

    const user = await userModel.findByAccount(username)
    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: '帳號或密碼錯誤' })
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: '此帳號已被停權，請聯繫管理員' })
    }

    const token = jwt.sign(
      { account: user.account, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      role: user.role,
      name: user.name,
      username: user.account,
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body

    if (!username || !password || !name) {
      return res.status(400).json({ error: '請填寫所有必填欄位' })
    }

    if (!/^[A-Za-z0-9]+$/.test(username)) {
      return res.status(400).json({ error: '帳號只能包含英文和數字' })
    }

    const existing = await userModel.findByAccount(username)
    if (existing) {
      return res.status(409).json({ error: '帳號已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userRole = role || 'resident'

    const newUser = await userModel.create({
      account: username,
      password: hashedPassword,
      name,
      role: userRole
    })

    res.status(201).json(newUser)
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: '伺服器內部錯誤' })
  }
})

router.post('/logout', (req, res) => {
  res.json({ success: true })
})

module.exports = router
