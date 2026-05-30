import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { App } from '@tinyhttp/app'
import { cors } from '@tinyhttp/cors'
import { json } from 'milliparsec'

import authRoutes from './routes/auth.mjs'
import casesRoutes from './routes/cases.mjs'
import adminRoutes from './routes/admin.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const DB_FILE = join(__dirname, 'db.json')

const adapter = new JSONFile(DB_FILE)
const db = new Low(adapter, {})
await db.read()

const { Service } = await import('json-server/lib/service.js')
const service = new Service(db)

const app = new App()

app.use(cors({}))
app.use(json())

authRoutes(app, db)
casesRoutes(app, db, service)
adminRoutes(app, db)

app.listen(PORT, () => {
  console.log('json-server running on http://localhost:' + PORT)
  console.log('Endpoints:')
  console.log('  POST /login')
  console.log('  POST /register')
  console.log('  POST /logout')
  console.log('  GET/POST  /cases')
  console.log('  GET/PATCH/DELETE /cases/:id')
  console.log('  GET /admin/stats')
  console.log('  GET /users')
  console.log('  GET/PATCH /users/:username')
})