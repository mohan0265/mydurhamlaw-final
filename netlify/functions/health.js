exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      version: process.env.COMMIT_REF || process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      timestamp: new Date().toISOString()
    })
  }
}
