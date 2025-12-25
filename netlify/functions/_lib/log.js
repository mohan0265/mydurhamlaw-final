function logSupport(action, payload = {}) {
  try {
    const safe = { ...payload }
    if (safe.visitor_token) delete safe.visitor_token
    if (safe.email) delete safe.email
    console.log(`[support] ${action}`, JSON.stringify(safe))
  } catch {
    // ignore logging errors
  }
}

module.exports = { logSupport }
