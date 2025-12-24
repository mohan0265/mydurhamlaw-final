const buckets = new Map()
const WINDOW_MS = 60 * 1000
const MAX_REQ = 20

function rateLimit(key) {
  const now = Date.now()
  const bucket = buckets.get(key) || { count: 0, expires: now + WINDOW_MS }
  if (now > bucket.expires) {
    bucket.count = 0
    bucket.expires = now + WINDOW_MS
  }
  bucket.count += 1
  buckets.set(key, bucket)
  return bucket.count <= MAX_REQ
}

module.exports = { rateLimit }
