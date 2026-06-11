const express = require('express')
const axios = require('axios')

const router = express.Router()

router.get('/ip-location', async (req, res) => {
  try {
    const response = await axios.get('http://ip-api.com/json/', {
      params: { fields: 'status,lat,lon' },
      timeout: 5000
    })

    const data = response.data
    if (data.status !== 'success') {
      return res.status(502).json({ error: 'IP 定位服務無法解析' })
    }

    res.json({ lat: data.lat, lng: data.lon })
  } catch (err) {
    console.error('IP 定位失敗:', err.message)
    res.status(502).json({ error: 'IP 定位服務請求失敗' })
  }
})

module.exports = router
