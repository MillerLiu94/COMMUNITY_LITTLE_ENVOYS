require('dotenv').config()

if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return Number(this)
  }
}

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const caseRoutes = require('./routes/cases')
const adminRoutes = require('./routes/admin')
const uploadRoutes = require('./routes/upload')
const ipLocationRoutes = require('./routes/ipLocation')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use(authRoutes)
app.use(caseRoutes)
app.use(adminRoutes)
app.use(uploadRoutes)
app.use(ipLocationRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: '伺服器內部錯誤' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
