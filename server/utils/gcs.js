const { Storage } = require('@google-cloud/storage')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const KEY_FILE = path.resolve(__dirname, '../../gcs-api-496205-7584d2897819.json')
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'my-report-image'

let storage
let bucket

function init() {
  if (storage) return
  storage = new Storage({ keyFilename: KEY_FILE })
  bucket = storage.bucket(BUCKET_NAME)
}

async function uploadFile(buffer, originalName) {
  init()

  const ext = path.extname(originalName) || '.jpg'
  const filename = `cases/${Date.now()}-${uuidv4()}${ext}`
  const file = bucket.file(filename)

  await file.save(buffer, {
    metadata: { contentType: `image/${ext.replace('.', '')}` }
  })

  try {
    await file.makePublic()
  } catch {
    // Bucket may have uniform access; fallback to signed URL
  }

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`
  return publicUrl
}

async function uploadMultiple(files) {
  const urls = await Promise.all(
    files.map(f => uploadFile(f.buffer, f.originalname))
  )
  return urls
}

async function deleteFile(url) {
  init()
  const baseUrl = `https://storage.googleapis.com/${BUCKET_NAME}/`
  if (!url.startsWith(baseUrl)) return
  const filename = url.slice(baseUrl.length)
  try {
    await bucket.file(filename).delete()
  } catch {
    // File may not exist
  }
}

module.exports = { uploadFile, uploadMultiple, deleteFile }
