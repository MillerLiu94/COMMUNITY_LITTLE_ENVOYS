const mariadb = require('mariadb')

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '192.168.50.41',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'community_envoys',
  connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  bigintAsNumber: true
})

pool.getConnection()
  .then(conn => {
    console.log('MariaDB connected successfully')
    conn.release()
  })
  .catch(err => {
    console.error('MariaDB connection failed:', err.message)
  })

module.exports = pool
