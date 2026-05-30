function readShort(view, offset, littleEndian) {
  return view.getUint16(offset, littleEndian)
}

function readLong(view, offset, littleEndian) {
  return view.getUint32(offset, littleEndian)
}

function readRational(view, offset, littleEndian) {
  const num = view.getUint32(offset, littleEndian)
  const den = view.getUint32(offset + 4, littleEndian)
  return den === 0 ? 0 : num / den
}

function parseExifData(arrayBuffer) {
  const view = new DataView(arrayBuffer)

  if (view.getUint16(0, false) !== 0xFFD8) {
    return null
  }

  let offset = 2
  while (offset < view.byteLength - 1) {
    if (view.getUint16(offset, false) === 0xFFE1) {
      const segLength = view.getUint16(offset + 2, false)
      const exifId = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5),
        view.getUint8(offset + 6), view.getUint8(offset + 7),
        view.getUint8(offset + 8), view.getUint8(offset + 9)
      )
      if (exifId === 'Exif\0\0') {
        return parseTIFF(view, offset + 10)
      }
      offset += segLength + 2
    } else {
      const markerLen = view.getUint16(offset + 2, false)
      if (markerLen < 2) break
      offset += markerLen + 2
    }
  }
  return null
}

function parseTIFF(view, start) {
  const byteOrder = String.fromCharCode(view.getUint8(start), view.getUint8(start + 1))
  const littleEndian = byteOrder === 'II'

  const magic = view.getUint16(start + 2, littleEndian)
  if (magic !== 0x002A) return null

  const ifd0Offset = view.getUint32(start + 4, littleEndian)
  const ifd0Entries = readShort(view, start + ifd0Offset, littleEndian)

  let gpsIfdOffset = null

  for (let i = 0; i < ifd0Entries; i++) {
    const entryOffset = start + ifd0Offset + 2 + i * 12
    const tag = readShort(view, entryOffset, littleEndian)

    if (tag === 0x8825) {
      gpsIfdOffset = readLong(view, entryOffset + 8, littleEndian)
    }
  }

  if (gpsIfdOffset === null) return null

  return parseGPSIFD(view, start + gpsIfdOffset, littleEndian)
}

function parseGPSIFD(view, start, littleEndian) {
  const entries = readShort(view, start, littleEndian)
  let latRef = 'N', lonRef = 'E'
  let lat = null, lon = null

  for (let i = 0; i < entries; i++) {
    const entryOffset = start + 2 + i * 12
    const tag = readShort(view, entryOffset, littleEndian)
    const type = readShort(view, entryOffset + 2, littleEndian)
    const count = readLong(view, entryOffset + 4, littleEndian)
    const valueOffset = readLong(view, entryOffset + 8, littleEndian)

    switch (tag) {
      case 0x0001:
        latRef = String.fromCharCode(view.getUint8(entryOffset + 8))
        break
      case 0x0002:
        if (type === 5 && count === 3) {
          lat = [
            readRational(view, valueOffset + (littleEndian ? start : 0) - start + valueOffset, littleEndian),
            null,
            null
          ]
          const vals = []
          const base = valueOffset
          for (let j = 0; j < 3; j++) {
            vals.push(readRational(view, base + j * 8, littleEndian))
          }
          lat = vals[0] + vals[1] / 60 + vals[2] / 3600
        }
        break
      case 0x0003:
        lonRef = String.fromCharCode(view.getUint8(entryOffset + 8))
        break
      case 0x0004:
        if (type === 5 && count === 3) {
          const vals = []
          const base = valueOffset
          for (let j = 0; j < 3; j++) {
            vals.push(readRational(view, base + j * 8, littleEndian))
          }
          lon = vals[0] + vals[1] / 60 + vals[2] / 3600
        }
        break
    }
  }

  if (lat === null || lon === null) return null

  if (latRef === 'S') lat = -lat
  if (lonRef === 'W') lon = -lon

  return { lat, lng: lon }
}

export function readGPSFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = function (e) {
      try {
        const gps = parseExifData(e.target.result)
        resolve(gps)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
